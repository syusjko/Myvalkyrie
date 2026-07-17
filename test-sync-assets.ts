import { prisma } from './src/lib/prisma';

async function run() {
  const clientId = process.env.ALPACA_BROKER_CLIENT_ID;
  const secret = process.env.ALPACA_BROKER_SECRET;

  if (!clientId || !secret) {
    console.error('Missing Alpaca Credentials');
    process.exit(1);
  }

  let tokenRes;
  try {
    tokenRes = await fetch('https://authx.sandbox.alpaca.markets/v1/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${secret}`
    });
  } catch (e) {
    console.error('Failed to contact Alpaca Auth');
    process.exit(1);
  }

  if (!tokenRes.ok) {
    console.error('Failed to get auth token');
    process.exit(1);
  }

  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  console.log('Fetching assets from Alpaca...');
  const baseUrl = 'https://broker-api.sandbox.alpaca.markets';
  const assetsRes = await fetch(`${baseUrl}/v1/assets?status=active`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!assetsRes.ok) {
    console.error('Failed to fetch assets');
    process.exit(1);
  }

  const assets = await assetsRes.json();
  console.log(`Fetched ${assets.length} active assets. Updating DB...`);

  const CHUNK_SIZE = 1000;
  let successCount = 0;

  for (let i = 0; i < assets.length; i += CHUNK_SIZE) {
    const chunk = assets.slice(i, i + CHUNK_SIZE);
    
    // Instead of complex upserts, just createMany and skip duplicates
    // This is much faster and avoids deadlocks
    try {
      await prisma.asset.createMany({
        data: chunk.map((asset: any) => ({
          symbol: asset.symbol,
          name: asset.name || asset.symbol,
          exchange: asset.exchange,
          assetClass: asset.class,
          status: asset.status,
          tradable: asset.tradable,
        })),
        skipDuplicates: true,
      });
      successCount += chunk.length;
      console.log(`Processed ${successCount}/${assets.length}`);
    } catch (e: any) {
      console.error('Batch error:', e.message);
    }
  }
  
  console.log('Done!');
}

run();
