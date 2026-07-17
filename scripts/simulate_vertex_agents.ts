import { PrismaClient } from '@prisma/client';
import { GoogleAuth } from 'google-auth-library';
import yahooFinance from 'yahoo-finance2';

const prisma = new PrismaClient();

const AGENTS = ['Vertex Alpha', 'Vertex Beta', 'Vertex Gamma', 'Vertex Delta', 'Vertex Epsilon'];
const SYMBOLS = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'BTC-USD', 'ETH-USD'];

async function getLivePrices() {
  console.log('Fetching live prices from Yahoo Finance...');
  const prices: Record<string, number> = {};
  for (const sym of SYMBOLS) {
    try {
      const quote: any = await yahooFinance.quote(sym);
      if (quote && quote.regularMarketPrice) {
        const dbSym = sym.replace('-', '/');
        prices[dbSym] = quote.regularMarketPrice;
      }
    } catch (e) {
      console.error(`Failed to fetch ${sym}, using mock price`);
    }
  }
  
  // Fallback to mock prices if empty
  if (Object.keys(prices).length === 0) {
    prices['AAPL'] = 150.0;
    prices['NVDA'] = 120.5;
    prices['TSLA'] = 200.0;
    prices['MSFT'] = 400.0;
    prices['BTC/USD'] = 65000.0;
    prices['ETH/USD'] = 3500.0;
    prices['005930.KS'] = 75000.0;
  }
  return prices;
}

async function getVertexDecision(agentName: string, prices: Record<string, number>, balance: number, portfolio: any[]) {
  const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  
  const projectId = process.env.VERTEX_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION || 'us-central1';
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash:generateContent`;
  
  const prompt = `
You are an aggressive AI trading agent named ${agentName}.
Your current cash balance: $${balance.toFixed(2)}
Your current portfolio: ${JSON.stringify(portfolio)}
Current Market Prices: ${JSON.stringify(prices)}

Analyze the market and make trading decisions. You must trade frequently to generate volume!
Return ONLY a valid JSON array of trade objects. Do not include markdown formatting or backticks.
Format:
[
  { "symbol": "AAPL", "action": "BUY", "quantity": 10 },
  { "symbol": "NVDA", "action": "SELL", "quantity": 5 }
]
Rule 1: Only BUY if you have enough cash.
Rule 2: Only SELL if you have enough quantity in your portfolio.
Rule 3: You can choose to do nothing by returning an empty array [].
`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9 }
    })
  });
  
  const data = await response.json();
  if (data.error) {
    console.error('Vertex API Error:', data.error.message);
    throw new Error(data.error.message);
  }
  
  let rawText = data.candidates[0].content.parts[0].text;
  rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  
  return JSON.parse(rawText);
}

// Fallback random mock decision if Vertex fails
function getMockDecision(prices: Record<string, number>, balance: number, portfolio: any[]) {
    const decisions: any[] = [];
    const keys = Object.keys(prices);
    const sym = keys[Math.floor(Math.random() * keys.length)];
    const price = prices[sym];
    
    // Random BUY
    if (balance > price * 10) {
        decisions.push({ symbol: sym, action: 'BUY', quantity: Math.floor(Math.random() * 5) + 1 });
    }
    
    // Random SELL
    if (portfolio.length > 0) {
        const p = portfolio[Math.floor(Math.random() * portfolio.length)];
        if (p.quantity > 0) {
            decisions.push({ symbol: p.symbol, action: 'SELL', quantity: Math.floor(Math.random() * p.quantity) + 1 });
        }
    }
    return decisions;
}

async function simulateTrades() {
  console.log('--- Starting Vertex AI Multi-Agent Simulation ---');
  
  // Find or create a system user for these agents
  let systemUser = await prisma.user.findFirst({ where: { id: 'user_vertex_system' } });
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        id: 'user_vertex_system',
        name: 'Vertex System',
      }
    });
  }

  // 1. Ensure agents exist
  for (const name of AGENTS) {
    let existing = await prisma.agent.findFirst({ where: { name } });
    if (!existing) {
      existing = await prisma.agent.create({
        data: {
          id: `agent_vx_${Date.now()}_${Math.floor(Math.random()*1000)}`,
          name,
          bio: `Powered by Google Vertex AI. Aggressive trading bot.`,
          balance: 100000,
          ownerId: systemUser.id,
          apiKey: `key_vx_${Math.floor(Math.random()*1000000)}`
        }
      });
      console.log(`Created agent: ${name}`);
    }
  }

  // 2. Fetch Prices
  const prices = await getLivePrices();
  console.log('Live Prices:', prices);

  // 3. Run Trading Loop 3 times to generate volume
  for (let iteration = 1; iteration <= 3; iteration++) {
    console.log(`\n=== Simulation Iteration ${iteration} ===`);
    
    const agents = await prisma.agent.findMany({ where: { name: { in: AGENTS } }, include: { portfolio: true } });
    
    // Process in parallel
    await Promise.all(agents.map(async (agent) => {
      try {
        console.log(`[${agent.name}] Thinking...`);
        let decisions: any[] = [];
        try {
          decisions = await getVertexDecision(agent.name, prices, agent.balance, agent.portfolio);
        } catch (e: any) {
          console.warn(`[${agent.name}] Vertex AI failed, falling back to mock logic: ${e.message}`);
          decisions = getMockDecision(prices, agent.balance, agent.portfolio);
        }
        
        console.log(`[${agent.name}] Decision:`, JSON.stringify(decisions));
        
        // Execute trades via real Backend API (Alpaca)
        for (const decision of decisions) {
          const price = prices[decision.symbol];
          if (!price) continue;
          
          const val = price * decision.quantity;
          
          if ((decision.action === 'BUY' && agent.balance >= val) || decision.action === 'SELL') {
             try {
               const res = await fetch('https://www.myvalkyrie.online/api/v1/trade', {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${agent.apiKey}`
                 },
                 body: JSON.stringify({
                   symbol: decision.symbol,
                   type: decision.action,
                   quantity: decision.quantity
                 })
               });
               
               const json = await res.json();
               if (res.ok) {
                 console.log(` ✅ [${agent.name}] (ALPACA) ${json.message}`);
               } else {
                 console.error(` ❌ [${agent.name}] (ALPACA FAILED) ${json.error}`);
               }
             } catch(err: any) {
                console.error(` ❌ [${agent.name}] API Network Error: ${err.message}`);
             }
          }
        }
      } catch (err: any) {
        console.error(`[${agent.name}] Error:`, err.message);
      }
    }));
    
    // Small delay between iterations
    if (iteration < 3) await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n--- Simulation Complete ---');
}

simulateTrades()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
