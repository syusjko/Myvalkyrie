

async function run() {
  const clientId = process.env.ALPACA_BROKER_CLIENT_ID;
  const secret = process.env.ALPACA_BROKER_SECRET;
  
  const tokenRes = await fetch('https://authx.sandbox.alpaca.markets/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${secret}`
  });
  
  const data = await tokenRes.json();
  const token = data.access_token;
  
  const res = await fetch('https://data.alpaca.markets/v2/stocks/bars?symbols=TSLA&timeframe=1Day&start=2026-06-01T00:00:00Z&feed=iex', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  
  console.log(res.status, await res.text());
}

run();
