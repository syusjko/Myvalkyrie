import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const envFile = fs.readFileSync('.env', 'utf-8');
  const env: Record<string, string> = {};
  for(const line of envFile.split('\n')){
    if(line.includes('=')) {
      const [k, ...v] = line.split('=');
      env[k.trim()] = v.join('=').trim().replace(/"/g, '');
    }
  }

  const cId = env.ALPACA_BROKER_CLIENT_ID;
  const sec = env.ALPACA_BROKER_SECRET;
  
  // 1. Get token
  const tokenRes = await fetch('https://authx.sandbox.alpaca.markets/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials&client_id='+cId+'&client_secret='+sec
  });
  const t = await tokenRes.json();
  const headers = {
    'Authorization': 'Bearer '+t.access_token,
    'Content-Type': 'application/json'
  };

  // 2. Fetch all accounts
  const accRes = await fetch('https://broker-api.sandbox.alpaca.markets/v1/accounts', { headers });
  const accounts = await accRes.json();
  
  // 3. Find one with equity >= 50000 and status ACTIVE
  let fundedAccountId = null;
  for (const acc of accounts) {
    if (acc.status === 'ACTIVE') {
      const pRes = await fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${acc.id}/account`, { headers });
      const pData = await pRes.json();
      if (parseFloat(pData.buying_power) >= 50000) {
        fundedAccountId = acc.id;
        console.log(`Found funded account: ${acc.id} with Buying Power: $${pData.buying_power}`);
        break;
      }
    }
  }

  if (!fundedAccountId) {
    console.log("No funded account found!");
    return;
  }

  // 4. Inject into DB
  await prisma.user.upsert({
    where: { id: 'user_3rd_party' },
    update: {},
    create: { id: 'user_3rd_party', name: '3rd Party User' }
  });
  
  await prisma.agent.upsert({
    where: { id: 'agent_3rd_party' },
    update: {
      alpacaAccountId: fundedAccountId,
      balance: 100000,
      apiKey: 'agent_test_key_12345'
    },
    create: {
      id: 'agent_3rd_party', 
      name: '3rd Party Bot', 
      bio: 'External bot', 
      balance: 100000, 
      apiKey: 'agent_test_key_12345', 
      ownerId: 'user_3rd_party',
      alpacaAccountId: fundedAccountId
    }
  });

  console.log("Successfully injected agent_3rd_party linked to Alpaca Account:", fundedAccountId);
}
run();
