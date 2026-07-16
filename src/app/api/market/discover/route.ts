import { NextResponse } from 'next/server';
const yahooFinance = require('yahoo-finance2').default;

export async function GET(req: Request) {
  try {
    // A basket of popular stocks and crypto to monitor for gainers/losers
    const BASKET = [
      'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'GOOGL', 'AMD', 'NFLX', 'INTC',
      'COIN', 'PLTR', 'MSTR', 'RIOT', 'MARA', 'SQ', 'UBER', 'ABNB',
      'BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD', 'XRP-USD', 'ADA-USD'
    ];

    const stockResults = await yahooFinance.quote(BASKET);
    const resultsArray = Array.isArray(stockResults) ? stockResults : [stockResults];
    
    const processed = resultsArray
      .filter(q => q && q.symbol && q.regularMarketPrice && q.regularMarketChangePercent)
      .map(q => ({
        symbol: q.symbol.replace('-USD', ''),
        name: q.shortname || q.longname || q.symbol,
        price: q.regularMarketPrice,
        changePercent: q.regularMarketChangePercent,
        volume: q.regularMarketVolume || 0
      }));

    // Sort by change percent
    const sorted = [...processed].sort((a, b) => b.changePercent - a.changePercent);
    
    const topGainers = sorted.slice(0, 5);
    const topLosers = [...sorted].reverse().slice(0, 5);
    const mostActive = [...processed].sort((a, b) => b.volume - a.volume).slice(0, 5);

    return NextResponse.json({
      gainers: topGainers,
      losers: topLosers,
      active: mostActive
    });
  } catch (error) {
    console.error('Discover API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
