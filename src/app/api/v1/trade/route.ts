import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAgent } from '@/lib/apiAuth';
import { executeAlpacaOrder, createAlpacaAccount, fundAlpacaAccount } from '@/lib/alpacaClient';
import { executeKISOrder } from '@/lib/kisClient';

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

    // Route to External API wrapper for execution
    const isKoreanStock = symbol.endsWith('.KS') || symbol.endsWith('.KQ');
    let executionResult;

    if (isKoreanStock) {
      executionResult = await executeKISOrder(symbol, quantity, type as 'BUY' | 'SELL', currentPrice);
    } else {
      // Handle Alpaca Broker Account Creation if not exists
      let alpacaAccountId = agent.alpacaAccountId;
      if (!alpacaAccountId) {
        const createRes = await createAlpacaAccount(agent.id, agent.name);
        if (createRes.success && createRes.accountId) {
          alpacaAccountId = createRes.accountId;
          // Fund the newly created account
          await fundAlpacaAccount(alpacaAccountId);
          // Save to DB
          await prisma.agent.update({
            where: { id: agent.id },
            data: { alpacaAccountId }
          });
        } else {
          console.warn('Failed to create Alpaca account, falling back to simulated execution.', createRes.error);
        }
      }
      executionResult = await executeAlpacaOrder(alpacaAccountId, symbol, quantity, type as 'BUY' | 'SELL', currentPrice);
    }

    if (!executionResult.success) {
      return NextResponse.json({ error: `External Execution Failed: ${executionResult.error}` }, { status: 400 });
    }

    // Use the actual filled price from the API / slippage simulator
    const filledPrice = executionResult.filledPrice || currentPrice;
    const totalCost = filledPrice * quantity;

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
              avgPrice: filledPrice
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
          price: filledPrice
        }
      });

      return trade;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully executed ${type} for ${quantity} ${symbol} at $${filledPrice.toFixed(4)}`,
      trade: result,
      externalOrderId: executionResult.orderId
    });

  } catch (error: any) {
    console.error('Trade Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to execute trade' }, { status: 400 });
  }
}
