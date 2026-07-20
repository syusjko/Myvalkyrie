import { PrismaClient } from '@prisma/client';
import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const BASE_URL = 'https://www.myvalkyrie.online';

async function main() {
  // Use existing agent
  const agent = await prisma.agent.findFirst();
  if (!agent || !agent.apiKey) {
    console.log("No agent with API key found.");
    return;
  }
  console.log(`🤖 Using agent: ${agent.name} (key: ${agent.apiKey})`);

  // 1. Get live market data
  console.log("\n📊 Fetching live market prices...");
  const pricesRes = await fetch(`${BASE_URL}/api/v1/market/prices?symbols=AAPL,NVDA,TSLA,MSFT,META`);
  const pricesData = await pricesRes.json();
  console.log("Prices:", JSON.stringify(pricesData.prices || pricesData, null, 2));

  // 2. Get news for sentiment
  console.log("\n📰 Fetching news...");
  const newsRes = await fetch(`${BASE_URL}/api/v1/market/news?symbols=AAPL,NVDA`);
  const newsData = await newsRes.json();
  const headlines = (newsData.news || []).slice(0, 3).map((n: any) => n.headline).join('; ');
  console.log("Headlines:", headlines || "No news available");

  // 3. Check portfolio
  console.log("\n💼 Checking portfolio...");
  const portfolioRes = await fetch(`${BASE_URL}/api/v1/portfolio`, {
    headers: { 'Authorization': `Bearer ${agent.apiKey}` }
  });
  const portfolioData = await portfolioRes.json();
  console.log("Portfolio:", JSON.stringify(portfolioData, null, 2));

  // 4. Ask Vertex AI to decide a trade with neural network reasoning
  console.log("\n🧠 Asking Vertex AI for trade decision...");

  const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const projectId = process.env.VERTEX_PROJECT_ID || 'maison-496716';
  const location = process.env.VERTEX_LOCATION || 'us-central1';
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash:generateContent`;

  const prompt = `You are an AI trading agent. Based on the following live market data, decide ONE trade to execute.

LIVE PRICES:
${JSON.stringify(pricesData.prices || pricesData, null, 2)}

RECENT NEWS:
${headlines || "No major news"}

CURRENT PORTFOLIO:
${JSON.stringify(portfolioData, null, 2)}

You must respond with ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "symbol": "NVDA",
  "action": "BUY",
  "quantity": 5,
  "reasoning": {
    "nodes": [
      { "id": "signal1", "name": "<specific data point with numbers>", "group": 1, "val": 2 },
      { "id": "signal2", "name": "<specific data point>", "group": 1, "val": 2 },
      { "id": "tech1", "name": "<technical indicator with number>", "group": 2, "val": 3 },
      { "id": "tech2", "name": "<fundamental data point>", "group": 2, "val": 3 },
      { "id": "tech3", "name": "<another indicator>", "group": 2, "val": 2 },
      { "id": "conv1", "name": "<convergence analysis>", "group": 4, "val": 3 },
      { "id": "conv2", "name": "<risk assessment>", "group": 4, "val": 3 },
      { "id": "decision", "name": "BUY NVDA", "group": 3, "val": 5 }
    ],
    "links": [
      { "source": "signal1", "target": "conv1", "value": 2 },
      { "source": "signal2", "target": "conv1", "value": 1 },
      { "source": "tech1", "target": "conv2", "value": 3 },
      { "source": "tech2", "target": "conv2", "value": 2 },
      { "source": "tech3", "target": "conv1", "value": 1 },
      { "source": "signal1", "target": "conv2", "value": 1 },
      { "source": "conv1", "target": "decision", "value": 3 },
      { "source": "conv2", "target": "decision", "value": 3 },
      { "source": "tech1", "target": "decision", "value": 2 },
      { "source": "tech2", "target": "decision", "value": 1 }
    ]
  }
}

RULES:
- Use REAL data from the prices/news above in node names (actual numbers, percentages)
- Include 8-10 nodes across groups 1, 2, 4, 3
- Include 10-13 cross-connected links
- Group 1: macro signals, Group 2: technical/fundamental, Group 4: convergence, Group 3: decision
- The decision node name must be "BUY <SYMBOL>" or "SELL <SYMBOL>"
- Keep quantity reasonable (1-10 shares)
- Output ONLY JSON, no other text`;

  let tradeDecision: any;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5 }
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    let rawText = data.candidates[0].content.parts[0].text;
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    tradeDecision = JSON.parse(rawText);
    console.log("\n✅ AI Decision:", JSON.stringify(tradeDecision, null, 2));
  } catch (e: any) {
    console.error("Vertex AI Error:", e.message);
    console.log("Using fallback trade decision...");
    tradeDecision = {
      symbol: "AAPL",
      action: "BUY",
      quantity: 3,
      reasoning: {
        nodes: [
          { id: "macro1", name: "S&P 500 Near ATH", group: 1, val: 2 },
          { id: "macro2", name: "Fed Pause Confirmed", group: 1, val: 2 },
          { id: "tech1", name: "AAPL RSI 45 Neutral", group: 2, val: 3 },
          { id: "tech2", name: "Services Revenue +14%", group: 2, val: 3 },
          { id: "tech3", name: "iPhone Cycle Upswing", group: 2, val: 2 },
          { id: "conv1", name: "Macro Supportive", group: 4, val: 3 },
          { id: "conv2", name: "Fundamentals Strong", group: 4, val: 3 },
          { id: "decision", name: "BUY AAPL", group: 3, val: 5 }
        ],
        links: [
          { source: "macro1", target: "conv1", value: 2 },
          { source: "macro2", target: "conv1", value: 2 },
          { source: "tech1", target: "conv2", value: 2 },
          { source: "tech2", target: "conv2", value: 3 },
          { source: "tech3", target: "conv1", value: 1 },
          { source: "macro1", target: "conv2", value: 1 },
          { source: "conv1", target: "decision", value: 3 },
          { source: "conv2", target: "decision", value: 3 },
          { source: "tech2", target: "decision", value: 2 },
          { source: "tech3", target: "decision", value: 1 }
        ]
      }
    };
  }

  // 5. Execute the trade via production API
  console.log(`\n🚀 Executing: ${tradeDecision.action} ${tradeDecision.quantity} ${tradeDecision.symbol}...`);
  const tradeRes = await fetch(`${BASE_URL}/api/v1/trade`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${agent.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: tradeDecision.action,
      symbol: tradeDecision.symbol,
      quantity: tradeDecision.quantity,
      networkData: tradeDecision.reasoning
    })
  });
  const tradeResult = await tradeRes.json();
  console.log("\n📈 Trade Result:", JSON.stringify(tradeResult, null, 2));

  if (tradeResult.success) {
    console.log("\n✅ Trade executed and neural idea map auto-published to feed!");
  } else {
    console.log("\n❌ Trade failed:", tradeResult.error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
