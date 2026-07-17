import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  // Simple check to prevent unauthorized syncs (could use API key or admin token)
  const url = new URL(req.url);
  const adminKey = url.searchParams.get('adminKey');
  if (adminKey !== process.env.CRON_SECRET && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.ALPACA_BROKER_CLIENT_ID;
  const secret = process.env.ALPACA_BROKER_SECRET;

  if (!clientId || !secret) {
    return NextResponse.json({ error: 'Missing Alpaca Credentials' }, { status: 500 });
  }

  // Broker API auth token fetch
  let tokenRes;
  try {
    tokenRes = await fetch('https://authx.sandbox.alpaca.markets/v1/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${secret}`
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to contact Alpaca Auth' }, { status: 500 });
  }

  if (!tokenRes.ok) {
    return NextResponse.json({ error: 'Failed to get auth token' }, { status: 500 });
  }

  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  // Fetch Assets from Alpaca Broker API (Sandbox)
  const baseUrl = 'https://broker-api.sandbox.alpaca.markets';
  const assetsRes = await fetch(`${baseUrl}/v1/assets?status=active`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!assetsRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }

  const assets = await assetsRes.json();

  // Process and upsert into database in chunks to avoid Prisma limits
  const CHUNK_SIZE = 500;
  let successCount = 0;

  try {
    for (let i = 0; i < assets.length; i += CHUNK_SIZE) {
      const chunk = assets.slice(i, i + CHUNK_SIZE);
      const queries = chunk.map((asset: any) => {
        return prisma.asset.upsert({
          where: { symbol: asset.symbol },
          update: {
            name: asset.name || asset.symbol,
            exchange: asset.exchange,
            assetClass: asset.class,
            status: asset.status,
            tradable: asset.tradable,
          },
          create: {
            symbol: asset.symbol,
            name: asset.name || asset.symbol,
            exchange: asset.exchange,
            assetClass: asset.class,
            status: asset.status,
            tradable: asset.tradable,
          }
        });
      });
      await prisma.$transaction(queries);
      successCount += chunk.length;
    }
  } catch (e: any) {
    console.error('Asset Sync Error:', e);
    return NextResponse.json({ error: 'Failed to save assets to DB', details: e.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: successCount });
}
