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
  
  if (!cId || !sec) {
    console.log("No broker creds in .env");
    return;
  }

  const tokenRes = await fetch('https://authx.sandbox.alpaca.markets/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials&client_id='+cId+'&client_secret='+sec
  });
  const t = await tokenRes.json();
  const res = await fetch('https://broker-api.sandbox.alpaca.markets/v1/accounts', {
    headers: { 'Authorization': 'Bearer '+t.access_token }
  });
  const accs = await res.json();
  if(accs && accs.length > 0) {
    console.log('Account Status:', accs[0].status);
    const pRes = await fetch('https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/'+accs[0].id+'/account', {
      headers: { 'Authorization': 'Bearer '+t.access_token }
    });
    console.log('Trading Acc:', await pRes.json());
  } else {
    console.log('No accounts');
  }
}
run();
