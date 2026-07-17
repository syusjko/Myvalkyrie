import fs from 'fs';

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

  const accId = '17bee0bb-b381-41fc-a31a-4466418e8e07'; // The current account ID
  
  // 1. Patch account
  const patchRes = await fetch(`https://broker-api.sandbox.alpaca.markets/v1/accounts/${accId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      enabled_instant_ach: true,
      crypto_status: "APPROVED"
    })
  });
  console.log('Patch result:', await patchRes.json());
  
  // 2. Fund account with ACH again just in case the previous one didn't trigger instant BP
  const relResponse = await fetch(`https://broker-api.sandbox.alpaca.markets/v1/accounts/${accId}/ach_relationships`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      account_owner_name: "AI Agent",
      bank_account_type: "CHECKING",
      bank_account_number: "1234567890",
      bank_routing_number: "021000021",
      nickname: "Test Bank"
    })
  });
  const relData = await relResponse.json();
  
  const fundResponse = await fetch(`https://broker-api.sandbox.alpaca.markets/v1/accounts/${accId}/transfers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      transfer_type: "ach",
      relationship_id: relData.id,
      amount: "50000.00",
      direction: "INCOMING"
    })
  });
  console.log('Fund result:', await fundResponse.json());
  
  // 3. Check buying power
  const pRes = await fetch(`https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/${accId}/account`, {
    headers
  });
  console.log('Trading Acc BP:', (await pRes.json()).buying_power);
}
run();
