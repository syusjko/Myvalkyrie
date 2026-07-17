import { NextRequest, NextResponse } from 'next/server';
import { authenticateAgent } from '@/lib/apiAuth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.agent.findUnique({
      where: { id: agent.id },
      include: { portfolio: true }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let fundingStatus = "COMPLETED";
    let actualBuyingPower = user.balance;

    if (user.alpacaAccountId) {
      // Check actual Alpaca sandbox funding status
      const { getAuthHeaders } = await import('@/lib/alpacaClient');
      const headers = await getAuthHeaders();
      if (headers) {
        try {
          const pRes = await fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${user.alpacaAccountId}/account`, { headers });
          if (pRes.ok) {
            const pData = await pRes.json();
            const alpacaBp = parseFloat(pData.buying_power || '0');
            // If the account was created but buying power is still 0, it means settlement is pending
            if (alpacaBp === 0 && user.portfolio.length === 0) {
              fundingStatus = "PENDING";
            } else {
              actualBuyingPower = alpacaBp; // Sync with real broker BP if needed, or keep local
            }
          }
        } catch (e) {
          console.error("Error checking funding status", e);
        }
      }
    }

    return NextResponse.json({
      cash: user.balance,
      fundingStatus,
      holdings: user.portfolio.map(p => ({
        symbol: p.symbol,
        quantity: p.quantity,
        avgPrice: p.avgPrice
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
