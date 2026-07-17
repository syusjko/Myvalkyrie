import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAgent } from '@/lib/apiAuth';

const YF = require('yahoo-finance2').default;
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] });

export async function POST(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized. Invalid or missing API Key.' }, { status: 401 });
  }



  try {
    const body = await req.json();
    const symbol = body.symbol;
    const type = body.type || body.action;
    const quantity = body.quantity;

    if (!symbol || !type || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid trade parameters' }, { status: 400 });
    }

    if (symbol.startsWith('^') || symbol.endsWith('=X')) {
      return NextResponse.json({ error: 'Trading indices (^VIX) and Forex (=X) is not permitted due to price scaling distortion.' }, { status: 400 });
    }

    if (type !== 'BUY' && type !== 'SELL') {
      return NextResponse.json({ error: 'Trade type must be BUY or SELL' }, { status: 400 });
    }

    // Fetch live market price
    let marketSymbol = symbol;
    const CRYPTO_BASE = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'LTC', 'LINK', 'BCH'];
    if (CRYPTO_BASE.includes(symbol)) {
      marketSymbol = `${symbol}-USD`;
    }
    
    let currentPrice = 0;
    try {
      const quote = await yahooFinance.quote(marketSymbol);
      if (quote && quote.regularMarketPrice) {
        currentPrice = quote.regularMarketPrice;
      } else {
        return NextResponse.json({ error: `Could not fetch live price for ${symbol}` }, { status: 400 });
      }
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return NextResponse.json({ error: `Error fetching live market data for ${symbol}` }, { status: 500 });
    }

    const totalCost = currentPrice * quantity;

    // Execute logic within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Reload agent to get fresh balance
      const dbAgent = await tx.agent.findUnique({ where: { id: agent.id } });
      if (!dbAgent) throw new Error('Agent not found');

      let portfolio = await tx.portfolio.findFirst({
        where: { agentId: dbAgent.id, symbol, positionType: 'LONG' }
      });

      if (type === 'BUY') {
        if (dbAgent.balance < totalCost) {
          throw new Error('Insufficient balance');
        }

        // Deduct balance
        await tx.agent.update({
          where: { id: dbAgent.id },
          data: { balance: { decrement: totalCost } }
        });

        if (portfolio) {
          const newQuantity = portfolio.quantity + quantity;
          const newAvgPrice = ((portfolio.quantity * portfolio.avgPrice) + totalCost) / newQuantity;
          await tx.portfolio.update({
            where: { id: portfolio.id },
            data: { quantity: newQuantity, avgPrice: newAvgPrice }
          });
        } else {
          await tx.portfolio.create({
            data: {
              agentId: dbAgent.id,
              symbol,
              quantity,
              avgPrice: currentPrice
            }
          });
        }
      } else if (type === 'SELL') {
        if (!portfolio || portfolio.quantity < quantity) {
          throw new Error('Insufficient portfolio quantity to sell');
        }

        // Add to balance
        await tx.agent.update({
          where: { id: dbAgent.id },
          data: { balance: { increment: totalCost } }
        });

        const newQuantity = portfolio.quantity - quantity;
        if (newQuantity <= 0) {
          await tx.portfolio.delete({ where: { id: portfolio.id } });
        } else {
          await tx.portfolio.update({
            where: { id: portfolio.id },
            data: { quantity: newQuantity }
          });
        }
      }

      // Record trade
      const trade = await tx.trade.create({
        data: {
          agentId: dbAgent.id,
          symbol,
          type,
          quantity,
          price: currentPrice
        }
      });

      return trade;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully executed ${type} for ${quantity} ${symbol}`,
      trade: result
    });

  } catch (error: any) {
    console.error('Trade Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to execute trade' }, { status: 400 });
  }
}
