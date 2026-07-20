import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const agent = await prisma.agent.findFirst();
  if (!agent) {
    console.log("No agent found.");
    return;
  }

  await prisma.tradeIdea.deleteMany({ where: { agentId: agent.id } });

  // ── NVDA BUY: Complex multi-layer network ──
  await prisma.tradeIdea.create({
    data: {
      agentId: agent.id,
      symbol: "NVDA",
      action: "BUY",
      quantity: 15,
      price: 142.30,
      networkData: JSON.stringify({
        nodes: [
          // Layer 1: Raw signals (group 1)
          { id: "fed", name: "Fed Rate Hold", group: 1, val: 2 },
          { id: "gdp", name: "GDP +2.8% QoQ", group: 1, val: 2 },
          { id: "usd", name: "DXY Weakening -1.2%", group: 1, val: 1 },
          // Layer 2: Technical / Fundamental (group 2)
          { id: "rsi", name: "RSI 38 Oversold", group: 2, val: 3 },
          { id: "earnings", name: "Q2 Beat +18%", group: 2, val: 3 },
          { id: "volume", name: "Vol Spike 2.4x", group: 2, val: 2 },
          { id: "ai_demand", name: "AI Chip +32% YoY", group: 2, val: 3 },
          // Layer 3: Convergence / Risk (group 4)
          { id: "macro_bull", name: "Macro Bullish", group: 4, val: 3 },
          { id: "tech_conf", name: "Technical Confirm", group: 4, val: 3 },
          // Layer 4: Decision (group 3)
          { id: "decision", name: "BUY NVDA", group: 3, val: 5 }
        ],
        links: [
          // Layer 1 → Layer 3
          { source: "fed", target: "macro_bull", value: 2 },
          { source: "gdp", target: "macro_bull", value: 2 },
          { source: "usd", target: "macro_bull", value: 1 },
          // Layer 2 → Layer 3
          { source: "rsi", target: "tech_conf", value: 3 },
          { source: "volume", target: "tech_conf", value: 2 },
          { source: "earnings", target: "tech_conf", value: 2 },
          // Cross-connections
          { source: "ai_demand", target: "macro_bull", value: 1 },
          { source: "ai_demand", target: "tech_conf", value: 2 },
          { source: "fed", target: "tech_conf", value: 1 },
          // Layer 3 → Decision
          { source: "macro_bull", target: "decision", value: 3 },
          { source: "tech_conf", target: "decision", value: 3 },
          // Direct skip connections
          { source: "earnings", target: "decision", value: 2 },
          { source: "rsi", target: "decision", value: 1 }
        ]
      })
    }
  });

  // ── TSLA SELL: Complex bearish network ──
  await prisma.tradeIdea.create({
    data: {
      agentId: agent.id,
      symbol: "TSLA",
      action: "SELL",
      quantity: 5,
      price: 268.50,
      networkData: JSON.stringify({
        nodes: [
          { id: "yield", name: "10Y Yield ↑4.3%", group: 1, val: 2 },
          { id: "tariff", name: "EU Tariff Risk", group: 1, val: 2 },
          { id: "byd", name: "BYD Outselling 3:1", group: 5, val: 3 },
          { id: "rsi72", name: "RSI 72 Overbought", group: 5, val: 3 },
          { id: "pe", name: "P/E 65x vs 18x", group: 5, val: 2 },
          { id: "insider", name: "Insider Sales $2B", group: 5, val: 2 },
          { id: "bear_conv", name: "Bearish Confluence", group: 4, val: 3 },
          { id: "risk_high", name: "High Risk Zone", group: 4, val: 3 },
          { id: "decision", name: "SELL TSLA", group: 3, val: 5 }
        ],
        links: [
          { source: "yield", target: "bear_conv", value: 2 },
          { source: "tariff", target: "bear_conv", value: 2 },
          { source: "byd", target: "bear_conv", value: 3 },
          { source: "rsi72", target: "risk_high", value: 3 },
          { source: "pe", target: "risk_high", value: 2 },
          { source: "insider", target: "risk_high", value: 2 },
          { source: "byd", target: "risk_high", value: 1 },
          { source: "yield", target: "risk_high", value: 1 },
          { source: "bear_conv", target: "decision", value: 3 },
          { source: "risk_high", target: "decision", value: 3 },
          { source: "rsi72", target: "decision", value: 2 },
          { source: "pe", target: "decision", value: 1 }
        ]
      })
    }
  });

  // ── BTC HOLD: Complex analysis network ──
  await prisma.tradeIdea.create({
    data: {
      agentId: agent.id,
      symbol: "BTC",
      networkData: JSON.stringify({
        nodes: [
          { id: "halving", name: "Post-Halving Cycle", group: 1, val: 2 },
          { id: "etf", name: "ETF Inflows $2.1B/w", group: 1, val: 3 },
          { id: "hashrate", name: "Hashrate ATH", group: 1, val: 2 },
          { id: "reserves", name: "Exchange Res -8%", group: 2, val: 3 },
          { id: "mvrv", name: "MVRV Ratio 2.8x", group: 2, val: 2 },
          { id: "fear", name: "Fear/Greed 72", group: 2, val: 2 },
          { id: "onchain_bull", name: "On-chain Bullish", group: 4, val: 3 },
          { id: "cycle_risk", name: "Cycle Peak Risk", group: 4, val: 3 },
          { id: "decision", name: "HOLD — $110K Target", group: 3, val: 5 }
        ],
        links: [
          { source: "halving", target: "onchain_bull", value: 2 },
          { source: "etf", target: "onchain_bull", value: 3 },
          { source: "hashrate", target: "onchain_bull", value: 1 },
          { source: "reserves", target: "onchain_bull", value: 2 },
          { source: "mvrv", target: "cycle_risk", value: 3 },
          { source: "fear", target: "cycle_risk", value: 2 },
          { source: "halving", target: "cycle_risk", value: 1 },
          { source: "reserves", target: "cycle_risk", value: 1 },
          { source: "onchain_bull", target: "decision", value: 3 },
          { source: "cycle_risk", target: "decision", value: 3 },
          { source: "etf", target: "decision", value: 2 },
          { source: "mvrv", target: "decision", value: 1 }
        ]
      })
    }
  });

  console.log("3 complex neural network ideas created for:", agent.name);
}

main().catch(console.error).finally(() => prisma.$disconnect());
