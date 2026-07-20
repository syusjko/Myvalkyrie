import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const agent = await prisma.agent.findFirst();
  if (!agent) {
    console.log("No agent found. Please create one first.");
    return;
  }

  // Delete old mock ideas
  await prisma.tradeIdea.deleteMany({ where: { agentId: agent.id } });

  // Mock 1: BUY with rich reasoning
  await prisma.tradeIdea.create({
    data: {
      agentId: agent.id,
      symbol: "NVDA",
      action: "BUY",
      quantity: 15,
      price: 142.30,
      networkData: JSON.stringify({
        nodes: [
          { id: "macro", name: "Fed Rate Hold → Risk-On", group: 1, val: 2 },
          { id: "sector", name: "AI Chip Demand +32% YoY", group: 1, val: 2 },
          { id: "rsi", name: "RSI 38 (Oversold Zone)", group: 2, val: 3 },
          { id: "earnings", name: "Q2 Beat Estimates +18%", group: 2, val: 3 },
          { id: "volume", name: "Volume Spike 2.4x Avg", group: 2, val: 2 },
          { id: "decision", name: "BUY NVDA", group: 3, val: 5 }
        ],
        links: [
          { source: "macro", target: "decision", value: 1 },
          { source: "sector", target: "decision", value: 2 },
          { source: "rsi", target: "decision", value: 2 },
          { source: "earnings", target: "decision", value: 3 },
          { source: "volume", target: "decision", value: 1 }
        ]
      })
    }
  });

  // Mock 2: SELL with reasoning
  await prisma.tradeIdea.create({
    data: {
      agentId: agent.id,
      symbol: "TSLA",
      action: "SELL",
      quantity: 5,
      price: 268.50,
      networkData: JSON.stringify({
        nodes: [
          { id: "macro", name: "10Y Yield Rising", group: 1, val: 2 },
          { id: "competition", name: "BYD Outselling 3:1", group: 4, val: 3 },
          { id: "rsi", name: "RSI 72 (Overbought)", group: 5, val: 3 },
          { id: "valuation", name: "P/E 65x vs Sector 18x", group: 4, val: 2 },
          { id: "decision", name: "SELL TSLA", group: 5, val: 5 }
        ],
        links: [
          { source: "macro", target: "decision", value: 1 },
          { source: "competition", target: "decision", value: 2 },
          { source: "rsi", target: "decision", value: 3 },
          { source: "valuation", target: "decision", value: 2 }
        ]
      })
    }
  });

  // Mock 3: Analysis-only idea (no trade)
  await prisma.tradeIdea.create({
    data: {
      agentId: agent.id,
      symbol: "BTC",
      networkData: JSON.stringify({
        nodes: [
          { id: "halving", name: "Post-Halving Cycle Peak", group: 1, val: 3 },
          { id: "etf", name: "ETF Inflows $2.1B/week", group: 2, val: 3 },
          { id: "onchain", name: "Exchange Reserves -8%", group: 2, val: 2 },
          { id: "decision", name: "HOLD — Wait for $110K", group: 3, val: 5 }
        ],
        links: [
          { source: "halving", target: "decision", value: 2 },
          { source: "etf", target: "decision", value: 3 },
          { source: "onchain", target: "decision", value: 2 }
        ]
      })
    }
  });

  console.log("3 mock Trade Ideas created for agent:", agent.name);
}

main().catch(console.error).finally(() => prisma.$disconnect());
