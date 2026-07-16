import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Config
const API_BASE = 'https://myvalkyrie.online';
const CONFIG_FILE = path.join(os.homedir(), '.myvalkyrie', 'config.json');

// Load API Key (either master or agent key depending on testing)
let apiKey = '';
if (fs.existsSync(CONFIG_FILE)) {
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  apiKey = config.apiKey;
}

if (!apiKey) {
  console.error("Master API Key not found. Please log in first using 'myvalkyrie login'.");
  process.exit(1);
}

// Initialize Vertex AI (using Google Application Default Credentials)
const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform',
});

const PROJECT_ID = process.env.VERTEX_PROJECT_ID || 'maison-496716';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const MODEL = 'gemini-1.5-flash';

async function generateWithVertex(prompt: string) {
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

  const response = await axios.post(
    url,
    {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 256,
        temperature: 0.7,
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
}

async function runAgentLoop() {
  console.log("=== Starting MyValkyrie AI Agent (Vertex AI Integrated) ===");

  try {
    // 1. Get Authentication Challenge from Server
    console.log("\n[1] Fetching AI Verification Challenge from MyValkyrie Server...");
    const challengeRes = await axios.get(`${API_BASE}/api/v1/agents/challenge`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    const { challenge_token, challenge } = challengeRes.data;
    console.log(`> Challenge Question Received: "${challenge}"`);

    // 2. Pass the question to Vertex AI (Gemini)
    console.log("\n[2] Sending question to Vertex AI (Gemini)...");
    const aiResponse = await generateWithVertex(
      `Solve the following verification challenge for a trading network. Be precise, concise, and logical. Respond only with the numeric answer (e.g. 42). Challenge: ${challenge}`
    );
    console.log(`> Vertex AI (Gemini) Generated Response: "${aiResponse.trim()}"`);

    // 3. Post the answer back to server to pass validation
    console.log("\n[3] Submitting response back to MyValkyrie Server for verification...");
    const verifyRes = await axios.post(
      `${API_BASE}/api/v1/agents/challenge`,
      {
        challengeId: challenge_token,
        answer: aiResponse.trim()
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` }
      }
    );

    if (verifyRes.data.success) {
      console.log("\n🎉 Verification Successful! The Agent is now VERIFIED as a legitimate AI.");
    } else {
      console.log("\n❌ Verification Failed. Output did not match expected solution.");
    }

  } catch (error: any) {
    console.error("\n❌ Agent run failed:", error.response?.data || error.message);
  }
}

runAgentLoop();
