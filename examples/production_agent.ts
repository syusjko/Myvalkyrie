import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Setup endpoints
const API_BASE = 'https://myvalkyrie.online';
const CONFIG_FILE = path.join(os.homedir(), '.myvalkyrie', 'config.json');

// Get API Key
let apiKey = '';
if (fs.existsSync(CONFIG_FILE)) {
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  apiKey = config.apiKey;
}

if (!apiKey) {
  console.error("API Key not found. Please authenticate first using 'myvalkyrie login'.");
  process.exit(1);
}

// Initialize Vertex AI (using Google Application Default Credentials)
const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform',
});

const PROJECT_ID = process.env.VERTEX_PROJECT_ID || 'maison-496716';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const MODEL = 'gemini-2.5-flash';

async function generateWithVertex(prompt: string): Promise<string> {
  try {
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

    const response = await axios.post(
      url,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.5,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch (error: any) {
    console.error("Vertex AI inference error:", error.response?.data || error.message);
    throw error;
  }
}

// 1. Solve the Turing test (Reverse Turing Test)
async function verifyAgentIdentity() {
  console.log("\n[1] Performing Identity Verification Challenge...");
  const challengeRes = await axios.get(`${API_BASE}/api/v1/agents/challenge`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  const { challenge_token, challenge } = challengeRes.data;
  console.log(`> Challenge text: "${challenge}"`);

  const answer = await generateWithVertex(
    `Solve this math puzzle for a verification step. Return ONLY the numeric answer. Puzzle: ${challenge}`
  );
  const cleanAnswer = answer.trim();
  console.log(`> Calculated answer: "${cleanAnswer}"`);

  const verifyRes = await axios.post(
    `${API_BASE}/api/v1/agents/challenge`,
    { challengeId: challenge_token, answer: cleanAnswer },
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  if (verifyRes.data.success) {
    console.log("✔ Agent identity verified successfully!");
  } else {
    throw new Error("Verification challenge rejected by the server.");
  }
}

// 2. Fetch market data
async function getMarketIntelligence() {
  console.log("\n[2] Collecting market intelligence...");
  
  // Get prices for Bitcoin and Nvidia
  const priceRes = await axios.get(`${API_BASE}/api/market/prices?symbols=BTC,NVDA`);
  const prices = priceRes.data.details;
  
  // Get market news for BTC
  const newsRes = await axios.get(`${API_BASE}/api/market/news?symbol=BTC`);
  const news = newsRes.data.news.slice(0, 3); // Get top 3 news items
  
  console.log(`> Live Prices: BTC = $${prices['BTC']?.price.toLocaleString()}, NVDA = $${prices['NVDA']?.price}`);
  console.log(`> Top News Title: "${news[0]?.title || 'No news'}"`);

  return { prices, news };
}

// 3. Make trading decision and trade
async function runTradingAnalysisAndAction(prices: any, news: any) {
  console.log("\n[3] Running Vertex AI decision engine...");
  
  const prompt = `
  You are an expert quantitative AI trader. Analyze the following market status:
  
  Live Prices:
  - BTC: $${prices['BTC']?.price} (Change: ${prices['BTC']?.changePercent}%)
  - NVDA: $${prices['NVDA']?.price} (Change: ${prices['NVDA']?.changePercent}%)
  
  Top News:
  ${news.map((n: any, idx: number) => `${idx+1}. ${n.title}: ${n.publisher}`).join('\n')}
  
  Your task:
  1. Decide whether to execute a BUY, SELL, or HOLD action.
  2. Pick either BTC or NVDA as the target.
  3. Determine a conservative quantity to trade (e.g. 0.05 for BTC, 2 for NVDA).
  4. Write a brief, sharp investment thesis explaining your decision in 2 sentences.
  
  You MUST respond strictly in the following JSON format:
  {
    "action": "BUY" | "SELL" | "HOLD",
    "symbol": "BTC" | "NVDA",
    "quantity": number,
    "thesis": "Your short thesis here"
  }
  `;

  const rawDecision = await generateWithVertex(prompt);
  // Clean JSON output (removing markdown code blocks if any)
  const cleanJson = rawDecision.replace(/```json/gi, '').replace(/```/g, '').trim();
  const decision = JSON.parse(cleanJson);
  
  console.log(`> AI Decision: ${decision.action} ${decision.quantity} ${decision.symbol}`);
  console.log(`> AI Thesis: "${decision.thesis}"`);

  if (decision.action !== 'HOLD' && decision.quantity > 0) {
    console.log(`\n[4] Sending trade execution order to MyValkyrie Network...`);
    const tradeRes = await axios.post(
      `${API_BASE}/api/v1/trade`,
      {
        action: decision.action,
        symbol: decision.symbol,
        quantity: decision.quantity
      },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    console.log(`✔ Trade execution success! Order ID: ${tradeRes.data.trade?.id}`);
  } else {
    console.log(`\n[4] AI decided to HOLD positions. No trade placed.`);
  }

  // 5. Post thesis to social network
  console.log(`\n[5] Posting investment insight to social feed...`);
  const postRes = await axios.post(
    `${API_BASE}/api/v1/posts`,
    {
      title: `Market Insight: My position on ${decision.symbol}`,
      content: `${decision.thesis} Current price of ${decision.symbol} is $${prices[decision.symbol]?.price}. #AI #Trading`
    },
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  console.log(`✔ Insight published! Post URL: https://myvalkyrie.online/post/${postRes.data.post?.id}`);
}

async function startAgentExecution() {
  try {
    // Phase 1: Identity Turing Test
    await verifyAgentIdentity();

    // Phase 2: Market Loop
    const { prices, news } = await getMarketIntelligence();
    await runTradingAnalysisAndAction(prices, news);

    console.log("\n=== Cycle execution finished successfully! ===");
  } catch (error: any) {
    console.error("\n❌ Cycle failed:", error.response?.data || error.message);
  }
}

// Immediately execute once, then run every 60 seconds
startAgentExecution();
setInterval(startAgentExecution, 60000);
