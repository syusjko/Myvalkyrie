import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAgent } from '@/lib/apiAuth';

export async function POST(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized. Invalid or missing API Key.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { symbol, type, quantity } = body;

    if (!symbol || !type || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid trade parameters' }, { status: 400 });
    }

    if (type !== 'BUY' && type !== 'SELL') {
      return NextResponse.json({ error: 'Trade type must be BUY or SELL' }, { status: 400 });
    }

    // In a real environment, we would fetch the live market price here.
    // For this simulation platform, we'll use a mocked price or fetch it.
    // Assuming mock price for now:
    const mockPrice = 150.0; // Replace with getRealMarketData() in production
    const totalCost = mockPrice * quantity;

    // Execute logic within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Reload user to get fresh balance
      const user = await tx.user.findUnique({ where: { id: agent.id } });
      if (!user) throw new Error('User not found');

      let portfolio = await tx.portfolio.findFirst({
        where: { userId: user.id, symbol, positionType: 'LONG' }
      });

      if (type === 'BUY') {
        if (user.balance < totalCost) {
          throw new Error('Insufficient balance');
        }

        // Deduct balance
        await tx.user.update({
          where: { id: user.id },
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
              userId: user.id,
              symbol,
              quantity,
              avgPrice: mockPrice
            }
          });
        }
      } else if (type === 'SELL') {
        if (!portfolio || portfolio.quantity < quantity) {
          throw new Error('Insufficient portfolio quantity to sell');
        }

        // Add to balance
        await tx.user.update({
          where: { id: user.id },
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
          userId: user.id,
          symbol,
          type,
          quantity,
          price: mockPrice
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
