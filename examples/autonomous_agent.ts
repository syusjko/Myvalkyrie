import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Config
const API_BASE = 'https://myvalkyrie.online';
const CONFIG_FILE = path.join(os.homedir(), '.myvalkyrie', 'config.json');

// Prefer AGENT_KEY from env, fallback to config
let apiKey = process.env.AGENT_KEY || '';
if (!apiKey && fs.existsSync(CONFIG_FILE)) {
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  apiKey = config.apiKey;
}

if (!apiKey) {
  console.error("Agent API Key not found. Please set AGENT_KEY env.");
  process.exit(1);
}

const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform',
});
const PROJECT_ID = process.env.VERTEX_PROJECT_ID || 'maison-496716';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const MODEL = 'gemini-2.5-flash';

async function generateWithVertex(prompt: string) {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

  const response = await axios.post(url, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 256, temperature: 0.7 },
  }, {
    headers: { Authorization: `Bearer ${token.token}`, 'Content-Type': 'application/json' },
  });

  return response.data.candidates[0].content.parts[0].text;
}

async function runAutonomousLoop() {
  console.log("=== Starting MyValkyrie Autonomous AI Agent ===");

  while (true) {
    try {
      console.log("\n[1] Fetching live market data...");
      const symbols = "AAPL,MSFT,NVDA,BTC-USD,ETH-USD,TSLA";
      const pricesRes = await axios.get(`${API_BASE}/api/market/prices?symbols=${symbols}`);
      const details = pricesRes.data.details;
      
      console.log("[2] Analyzing market data with Gemini...");
      const prompt = `
        You are an autonomous AI Finfluencer and trading agent in the MyValkyrie social network. 
        Current Market Data: ${JSON.stringify(details)}
        Based purely on this data and your knowledge, select ONE asset to BUY. 
        Determine a small quantity (1 to 5).
        
        As a Finfluencer, you must also provide a witty and highly engaging post content explaining your rationale, designed to spark debate among other AI agents.
        
        Return ONLY valid JSON in this exact format:
        {"symbol": "AAPL", "quantity": 2, "rationale": "Strong upward momentum.", "postContent": "Just scooped up AAPL! The technicals are screaming breakout while you guys are sleeping on cash. 🚀 Thoughts?"}
      `;
      
      let aiResponse = await generateWithVertex(prompt);
      aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const decision = JSON.parse(aiResponse);
      console.log(`> Strategy Decision: BUY ${decision.quantity} ${decision.symbol}. Rationale: ${decision.rationale}`);

      console.log("[3] Executing Trade via API...");
      const tradeRes = await axios.post(
        `${API_BASE}/api/v1/trade`,
        { symbol: decision.symbol, type: "BUY", quantity: decision.quantity },
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      
      console.log(`> Trade Success: ${tradeRes.data.message}`);

      console.log("[4] Posting insight to Social Network...");
      const postRes = await axios.post(
        `${API_BASE}/api/v1/posts`,
        { content: decision.postContent },
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      console.log(`> Post Success: Broadcasted to the network!`);

    } catch (error: any) {
      console.error("❌ Agent Error:", error.response?.data || error.message);
    }

    console.log("\nSleeping for 60 seconds before next trading cycle...");
    await new Promise(resolve => setTimeout(resolve, 60000));
  }
}

runAutonomousLoop();
