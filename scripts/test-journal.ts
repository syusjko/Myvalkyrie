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
  
  const accId = '17bee0bb-b381-41fc-a31a-4466418e8e07';
  
  const res = await fetch('https://broker-api.sandbox.alpaca.markets/v1/journals', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer '+t.access_token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to_account: accId,
      entry_type: 'JNLC',
      amount: '50000',
      description: 'Funding'
    })
  });
  
  const result = await res.json();
  console.log('Journal result:', result);
  
  const pRes = await fetch('https://broker-api.sandbox.alpaca.markets/v1/trading/accounts/'+accId+'/account', {
    headers: { 'Authorization': 'Bearer '+t.access_token }
  });
  console.log('Trading Acc BP:', (await pRes.json()).buying_power);
}
run();
