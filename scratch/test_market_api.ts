import { getAlpacaNews, getAlpacaLatestPrices } from '../src/lib/alpacaDataClient';
import fs from 'fs';

// Parse .env manually
try {
  const env = fs.readFileSync('.env', 'utf8');
  env.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1');
      process.env[key] = val;
    }
  });
} catch(e) {}

async function test() {
  console.log('Testing prices...');
  const prices = await getAlpacaLatestPrices(['AAPL', 'BTC', '005930.KS']);
  console.log('Prices:', prices);

  console.log('Testing news...');
  const news = await getAlpacaNews(['AAPL']);
  console.log('News articles count:', news.length);
  if (news.length > 0) {
    console.log('Sample news headline:', news[0].headline);
  }
}
test();
