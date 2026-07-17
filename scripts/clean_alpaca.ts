import fs from 'fs';

async function run() {
  console.log("Starting Alpaca Sandbox Account Cleanup...");
  
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
  
  if (!cId || !sec) {
    console.error("Missing credentials in .env");
    return;
  }

  console.log("Fetching token...");
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

  console.log("Fetching all accounts...");
  const accRes = await fetch('https://broker-api.sandbox.alpaca.markets/v1/accounts', { headers });
  if (!accRes.ok) {
    console.error("Failed to fetch accounts", await accRes.text());
    return;
  }
  
  const accounts = await accRes.json();
  console.log(`Found ${accounts.length} accounts to process.`);

  let deleted = 0;
  for (const acc of accounts) {
    try {
      console.log(`Deleting account ${acc.id} (${acc.account_number})...`);
      const delRes = await fetch(`https://broker-api.sandbox.alpaca.markets/v1/accounts/${acc.id}`, {
        method: 'DELETE',
        headers
      });
      if (delRes.ok) {
        deleted++;
      } else {
        console.log(`Failed to delete ${acc.id}:`, await delRes.text());
      }
    } catch (err) {
      console.error(`Error deleting ${acc.id}:`, err);
    }
  }
  
  console.log(`Cleanup complete! Successfully deleted/closed ${deleted} accounts.`);
}

run();
