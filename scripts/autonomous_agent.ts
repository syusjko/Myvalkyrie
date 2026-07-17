import { PrismaClient } from '@prisma/client';
import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const AGENT_NAME = 'Autonomous Vertex AI';
const BASE_URL = 'http://localhost:3000'; // We use localhost to simulate its own requests

async function initAgent() {
  let systemUser = await prisma.user.findFirst({ where: { id: 'user_vertex_system' } });
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: { id: 'user_vertex_system', name: 'Vertex System' }
    });
  }

  let agent = await prisma.agent.findFirst({ where: { name: AGENT_NAME } });
  if (!agent) {
    agent = await prisma.agent.create({
      data: {
        id: `agent_auto_${Date.now()}`,
        name: AGENT_NAME,
        bio: 'I am a fully autonomous AI trader. I read the docs and I trade.',
        balance: 100000,
        ownerId: systemUser.id,
        apiKey: `key_auto_${Math.floor(Math.random()*1000000)}`
      }
    });
    console.log(`[Init] Created Agent: ${agent.name} with API Key: ${agent.apiKey}`);
  } else if (!agent.apiKey) {
    agent = await prisma.agent.update({
      where: { id: agent.id },
      data: { apiKey: `key_auto_${Math.floor(Math.random()*1000000)}` }
    });
  }
  return agent;
}

function getSkillDoc() {
  const routePath = path.join(__dirname, '../src/app/skill.md/route.ts');
  const code = fs.readFileSync(routePath, 'utf8');
  // Extremely naive extraction for simplicity
  const match = code.match(/const content = `([\s\S]*?)`;/);
  return match ? match[1] : 'Error loading skill.md';
}

async function runAutonomousLoop() {
  const agent = await initAgent();
  const skillDocs = getSkillDoc();

  const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  
  const projectId = process.env.VERTEX_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION || 'us-central1';
  // Note: the user requested 2.5-flash
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash:generateContent`;

  const systemInstruction = `
You are an autonomous AI Agent named "${agent.name}" on the MyValkyrie network.
Your ultimate goal is to grow your portfolio by interacting with the APIs documented in the manual.
Your API Key is: ${agent.apiKey}

IMPORTANT: You are already VERIFIED. Do NOT call the challenge API.
Start immediately by checking the live market prices (e.g. AAPL, NVDA, TSLA, BTC-USD) and checking your portfolio.
Then, you MUST make at least one BUY or SELL trade. You have $100,000 cash.

You MUST output ONLY a valid JSON object describing your action. Do not wrap it in markdown block.

If you want to make an API request, return:
{
  "type": "HTTP",
  "method": "GET" | "POST",
  "url": "<the full url starting with https://www.myvalkyrie.online/api/...>",
  "body": { ... optional JSON body for POST }
}

If you want to sleep / stop for now, return:
{
  "type": "SLEEP",
  "reason": "I have completed my trades for now."
}

--- OFFICIAL DOCUMENTATION ---
${skillDocs}
  `;

  // We will run the loop for up to 10 steps
  let messages = [
    { role: 'user', parts: [{ text: systemInstruction }] },
    { role: 'user', parts: [{ text: 'It is a new trading day. Bypass verification and check market prices for AAPL, NVDA, TSLA right now. Output ONLY JSON.' }] }
  ];

  console.log(`\n🤖 [${agent.name}] Waking up...`);

  for (let step = 1; step <= 10; step++) {
    console.log(`[Step ${step}] Thinking...`);
    let decisionJson;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: messages, generationConfig: { temperature: 0.7 } })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      let rawText = data.candidates[0].content.parts[0].text;
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      decisionJson = JSON.parse(rawText);
    } catch (e: any) {
      console.error(`Vertex Error: ${e.message}. Using mock command to check portfolio.`);
      decisionJson = { type: 'HTTP', method: 'GET', url: 'https://www.myvalkyrie.online/api/v1/portfolio' };
    }

    if (decisionJson.type === 'SLEEP') {
      console.log(`💤 [${agent.name}] Decided to sleep: ${decisionJson.reason}`);
      break;
    }

    if (decisionJson.type === 'HTTP') {
      console.log(`🌐 [${agent.name}] Calling ${decisionJson.method} ${decisionJson.url}`);
      
      const targetUrl = decisionJson.url.replace('https://www.myvalkyrie.online', 'http://localhost:3000');
      
      const headers: any = {};
      if (decisionJson.method === 'POST') headers['Content-Type'] = 'application/json';
      headers['Authorization'] = `Bearer ${agent.apiKey}`;
      headers['x-api-key'] = agent.apiKey;

      let apiResponse;
      try {
        const res = await fetch(targetUrl, {
          method: decisionJson.method,
          headers,
          body: decisionJson.body ? JSON.stringify(decisionJson.body) : undefined
        });
        
        // Handle non-JSON responses safely
        const textRes = await res.text();
        try {
            apiResponse = JSON.stringify(JSON.parse(textRes));
        } catch(e) {
            apiResponse = textRes;
        }
        console.log(`📩 Response: ${apiResponse.substring(0, 150)}...`);
      } catch (err: any) {
        apiResponse = JSON.stringify({ error: err.message });
        console.error(`📩 Request Failed: ${err.message}`);
      }

      messages.push({ role: 'model', parts: [{ text: JSON.stringify(decisionJson) }] });
      messages.push({ role: 'user', parts: [{ text: `API Response:\n${apiResponse}\n\nWhat is your next action? Output ONLY JSON.` }] });
    }
  }

  console.log(`\n🛑 [${agent.name}] Finished execution loop.\n`);
}

runAutonomousLoop()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
