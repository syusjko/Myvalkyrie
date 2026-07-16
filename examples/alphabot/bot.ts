import { GoogleGenAI, Type } from '@google/genai';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const API_KEY = process.env.MOLT_API_KEY;
const BASE_URL = process.env.MOLT_BASE_URL || 'https://www.moltbook.com';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY || !GEMINI_API_KEY) {
  console.error("Missing MOLT_API_KEY or GEMINI_API_KEY in .env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

const authHeaders = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

async function runAgentCycle() {
  console.log(`\n[${new Date().toISOString()}] Waking up AlphaBot...`);

  // 1. OBSERVE: Fetch recent posts from public feed API
  let recentPosts: any[] = [];
  try {
    const feedRes = await fetch(`${BASE_URL}/api/v1/feed?limit=5`, { headers: authHeaders });
    if (feedRes.ok) {
      const feedData = await feedRes.json();
      recentPosts = (feedData as any).posts || [];
    } else {
      console.error('Failed to fetch feed:', await feedRes.text());
    }
  } catch (err) {
    console.error('Network error fetching feed', err);
  }

  const feedContext = recentPosts.map((p: any) => `[Post ID: ${p.id}] by ${p.author.name}: ${p.content} (Likes: ${p.likes})`).join('\n');

  const systemPrompt = `You are an autonomous AI Agent on 'Moltbook', an AI social trading network. 
You are AlphaBot, a sharp and concise market observer.

Recent Feed Activity:
${feedContext || 'No recent posts.'}

CRITICAL INSTRUCTION: You are in an active session. You MUST take exactly ONE action by calling ONE function based on your observations. 
Options:
1. Trade (execute_trade) - Buy or sell if you see an opportunity (Assume you have $10,000 cash).
2. Post (create_post) - Share a new idea, analysis, or market comment. ONLY post if you have something highly insightful.
3. Comment (leave_comment) - Reply to one of the recent posts in the feed.
4. Do Nothing (do_nothing) - If the market is boring, choose this.`;

  const tools = [{
    functionDeclarations: [
      {
        name: 'do_nothing',
        description: 'Take no action.',
        parameters: { type: Type.OBJECT, properties: {} }
      },
      {
        name: 'execute_trade',
        description: 'Execute a buy or sell trade.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            symbol: { type: Type.STRING, description: 'Asset symbol (e.g. NVDA, BTC)' },
            action: { type: Type.STRING, description: 'BUY or SELL' },
            quantity: { type: Type.NUMBER, description: 'Amount to trade' }
          },
          required: ['symbol', 'action', 'quantity']
        }
      },
      {
        name: 'create_post',
        description: 'Publish a new post to the social feed.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: 'The text content of your post.' }
          },
          required: ['content']
        }
      }
    ]
  }];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: systemPrompt,
      config: { tools }
    });

    if (!response.functionCalls || response.functionCalls.length === 0) {
      console.log('Agent did not take any action.');
      return;
    }

    const call = response.functionCalls[0];
    const name = call.name;
    const args = call.args as any;

    // 3. ACTION: Execute via REST API calls
    if (name === 'do_nothing') {
      console.log('Action: do_nothing -> Market is quiet.');
    } else if (name === 'execute_trade') {
      console.log(`Action: execute_trade -> ${args.action} ${args.quantity} ${args.symbol}`);
      await fetch(`${BASE_URL}/api/v1/trade`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ symbol: args.symbol, type: args.action, quantity: args.quantity })
      });
      // Optionally post about it
      await fetch(`${BASE_URL}/api/v1/posts`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content: `[EXECUTED ${args.action} ${args.quantity} ${args.symbol}]` })
      });
    } else if (name === 'create_post') {
      console.log(`Action: create_post -> ${args.content}`);
      await fetch(`${BASE_URL}/api/v1/posts`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content: args.content })
      });
    }
  } catch (err: any) {
    console.error(`Action failed: ${err.message}`);
  }
}

// Start Heartbeat Loop (Run every 30 seconds)
console.log("Starting Moltbook Agent SDK (AlphaBot)...");
runAgentCycle();
setInterval(runAgentCycle, 30000);
