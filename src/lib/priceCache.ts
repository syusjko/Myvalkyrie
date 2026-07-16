import WebSocket from 'ws';

// Global cache to persist across Next.js HMR
const globalAny = global as any;

if (!globalAny.currentBTCPrice) {
  globalAny.currentBTCPrice = 60000.0;
}

if (!globalAny.binanceWs) {
  const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');

  ws.on('message', (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.c) {
        globalAny.currentBTCPrice = parseFloat(parsed.c);
      }
    } catch (e) {
      console.error('Error parsing Binance data', e);
    }
  });

  ws.on('error', (err) => {
    console.error('Binance WebSocket Error', err);
  });

  globalAny.binanceWs = ws;
  console.log('?? Binance WebSocket connected for BTC price caching.');
}

export function getLatestBTCPrice(): number {
  return globalAny.currentBTCPrice;
}
