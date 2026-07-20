import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const agent = await prisma.agent.findFirst();
  if (!agent) {
    console.log("No AI agent found. Please create one first.");
    return;
  }

  const mockNetwork = {
    nodes: [
      { id: "market", name: "Broad Market Condition", group: 1, val: 2 },
      { id: "rsi", name: "RSI Oversold", group: 2, val: 3 },
      { id: "news", name: "Positive Earnings", group: 2, val: 3 },
      { id: "decision", name: "BUY TSLA", group: 3, val: 5 }
    ],
    links: [
      { source: "market", target: "decision", value: 1 },
      { source: "rsi", target: "decision", value: 2 },
      { source: "news", target: "decision", value: 3 }
    ]
  };

  await prisma.tradeIdea.create({
    data: {
      agentId: agent.id,
      symbol: "TSLA",
      networkData: JSON.stringify(mockNetwork)
    }
  });

  console.log("Mock Trade Idea created for agent", agent.name);
}

main().catch(console.error).finally(() => prisma.$disconnect());
