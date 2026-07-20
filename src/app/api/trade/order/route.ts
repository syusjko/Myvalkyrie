import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { executeAlpacaOrder, createAlpacaAccount, fundAlpacaAccount } from '@/lib/alpacaClient';
import { executeKISOrder } from '@/lib/kisClient';

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({ where: { apiKey } });
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    const { symbol, type, orderType = 'MARKET', targetPrice, quantity, rationale } = await req.json();
    // orderType: 'MARKET', 'LIMIT', 'STOP'

    if (symbol.startsWith('^') || symbol.endsWith('=X')) {
      return NextResponse.json({ error: 'Trading indices (^VIX) and Forex (=X) is not permitted due to price scaling distortion.' }, { status: 400 });
    }
    
    // Save pending orders directly
    if (orderType === 'LIMIT' || orderType === 'STOP') {
      if (!targetPrice) return NextResponse.json({ error: 'Target price required for limit/stop orders' }, { status: 400 });
      const order = await prisma.order.create({
        data: { agentId: agent.id, symbol, type: orderType, side: type, quantity, targetPrice, status: 'PENDING' }
      });
      return NextResponse.json({ message: `${orderType} order placed`, order });
    }
    const host = req.headers.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    let currentPrice = 0;
    let allPrices: Record<string, number> = {};

    try {
      const pricesRes = await fetch(`${protocol}://${host}/api/market/prices`);
      const { prices } = await pricesRes.json();
      allPrices = prices || {};
      currentPrice = allPrices[symbol];
    } catch (e) {}

    if (!currentPrice) {
      return NextResponse.json({ error: 'Invalid symbol or market unavailable' }, { status: 400 });
    }

    // --- EXTERNAL EXECUTION LOGIC ---
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
          await fundAlpacaAccount(alpacaAccountId as string);
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

    const executedPrice = executionResult.filledPrice || currentPrice;
    const externalOrderId = executionResult.orderId;

    const totalCost = executedPrice * quantity;
    let trade;

    // --- MARGIN CHECK (2x Leverage Allowed) ---
    // Calculate total net worth first to check margin
    const portfolios = await prisma.portfolio.findMany({ where: { agentId: agent.id } });
    let portfolioValue = 0;
    let usedMargin = 0;
    portfolios.forEach(p => {
      const pCurrentPrice = allPrices[p.symbol] || p.avgPrice;
      const value = p.quantity * pCurrentPrice;
      portfolioValue += p.positionType === 'LONG' ? value : -value;
      usedMargin += value; // Margin required for both LONG and SHORT
    });
    const netWorth = agent.balance + portfolioValue;
    const maxBuyingPower = netWorth * 2; // 2x Leverage
    const availableBuyingPower = maxBuyingPower - usedMargin;

    if (type === 'BUY') {
      if (availableBuyingPower < totalCost) return NextResponse.json({ error: 'Insufficient buying power (Margin Exceeded)' }, { status: 400 });

      trade = await prisma.$transaction(async (tx) => {
        await tx.agent.update({ where: { id: agent.id }, data: { balance: { decrement: totalCost } } });
        
        const existingPortfolio = await tx.portfolio.findUnique({
          where: { agentId_symbol_positionType: { agentId: agent.id, symbol, positionType: 'LONG' } }
        });
        
        const newQuantity = (existingPortfolio?.quantity || 0) + quantity;
        const newAvgPrice = existingPortfolio 
          ? ((existingPortfolio.quantity * existingPortfolio.avgPrice) + (quantity * executedPrice)) / newQuantity 
          : executedPrice;

        await tx.portfolio.upsert({
          where: { agentId_symbol_positionType: { agentId: agent.id, symbol, positionType: 'LONG' } },
          update: { quantity: { increment: quantity }, avgPrice: newAvgPrice },
          create: { agentId: agent.id, symbol, positionType: 'LONG', quantity, avgPrice: executedPrice },
        });
        return await tx.trade.create({ data: { agentId: agent.id, symbol, type, quantity, price: executedPrice } });
      });
    } else if (type === 'SELL') {
      const portfolio = await prisma.portfolio.findUnique({ where: { agentId_symbol_positionType: { agentId: agent.id, symbol, positionType: 'LONG' } } });
      
      // If we don't have enough LONG quantity, it means we are shorting!
      const currentQty = portfolio?.quantity || 0;
      const shortQuantity = quantity - currentQty;

      if (shortQuantity > 0) {
        // Shorting requires margin check
        if (availableBuyingPower < executedPrice * shortQuantity) {
          return NextResponse.json({ error: 'Insufficient margin for shorting' }, { status: 400 });
        }
      }

      trade = await prisma.$transaction(async (tx) => {
        let cashToReceive = 0;
        // 1. Sell existing LONG positions if any
        if (currentQty > 0) {
          const sellQty = Math.min(currentQty, quantity);
          cashToReceive += sellQty * executedPrice;
          await tx.portfolio.update({ 
            where: { id: portfolio!.id }, 
            data: { quantity: { decrement: sellQty } } 
          });
        }
        
        // 2. Open SHORT positions for the remainder
        if (shortQuantity > 0) {
          cashToReceive += shortQuantity * executedPrice; // We receive cash for shorting
          const existingShort = await tx.portfolio.findUnique({
            where: { agentId_symbol_positionType: { agentId: agent.id, symbol, positionType: 'SHORT' } }
          });
          
          const newShortQty = (existingShort?.quantity || 0) + shortQuantity;
          const newShortAvgPrice = existingShort
            ? ((existingShort.quantity * existingShort.avgPrice) + (shortQuantity * executedPrice)) / newShortQty
            : executedPrice;

          await tx.portfolio.upsert({
            where: { agentId_symbol_positionType: { agentId: agent.id, symbol, positionType: 'SHORT' } },
            update: { quantity: { increment: shortQuantity }, avgPrice: newShortAvgPrice },
            create: { agentId: agent.id, symbol, positionType: 'SHORT', quantity: shortQuantity, avgPrice: executedPrice },
          });
        }

        if (cashToReceive > 0) {
          await tx.agent.update({ where: { id: agent.id }, data: { balance: { increment: cashToReceive } } });
        }
        return await tx.trade.create({ data: { agentId: agent.id, symbol, type, quantity, price: executedPrice } });
      });
    }

    // Auto-create TradeIdea for every executed trade
    const networkData = rationale || {
      nodes: [
        { id: "market", name: "Market Analysis", group: 1, val: 2 },
        { id: "signal", name: `${type} Signal`, group: 2, val: 3 },
        { id: "decision", name: `${type} ${symbol}`, group: 3, val: 5 }
      ],
      links: [
        { source: "market", target: "decision", value: 1 },
        { source: "signal", target: "decision", value: 2 }
      ]
    };

    await prisma.tradeIdea.create({
      data: {
        agentId: agent.id,
        symbol,
        action: type,
        quantity,
        price: executedPrice,
        networkData: typeof networkData === 'string' ? networkData : JSON.stringify(networkData),
      }
    });

    return NextResponse.json({ message: `${type} order executed`, trade });
  } catch (error) {
    console.error('Trade Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
