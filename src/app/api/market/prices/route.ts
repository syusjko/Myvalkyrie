import { NextResponse } from 'next/server';
const YF = require('yahoo-finance2').default;
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');
    
    // Default curated list if none provided
    const defaultSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'EURUSD=X', 'JPY=X', 'GC=F', 'CL=F', '^GSPC', '^IXIC'];
    const requestedSymbols = symbolsParam ? symbolsParam.split(',').map(s => s.trim().toUpperCase()) : defaultSymbols;

    const CRYPTO_BASE = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'LTC', 'LINK', 'BCH'];
    const cryptoToFetch = requestedSymbols.filter(s => CRYPTO_BASE.includes(s));
    const stockToFetch = requestedSymbols.filter(s => !CRYPTO_BASE.includes(s) && !s.startsWith('^') && s !== 'DX-Y.NYB');
    const indexToFetch = requestedSymbols.filter(s => s.startsWith('^') || s === 'DX-Y.NYB');

    let prices: Record<string, number> = {};
    let details: Record<string, { price: number, change: number, changePercent: number }> = {};

    // 1. Fetch Crypto from Binance
    if (cryptoToFetch.length > 0) {
      try {
        const cryptoRes = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
          next: { revalidate: 30 } // Cache for 30s at Edge
        });
        const cryptoData = await cryptoRes.json();
        
        cryptoData.forEach((item: any) => {
          cryptoToFetch.forEach(sym => {
            if (item.symbol === `${sym}USDT`) {
              const price = parseFloat(item.lastPrice);
              const change = parseFloat(item.priceChange);
              const changePercent = parseFloat(item.priceChangePercent);
              prices[sym] = price;
              details[sym] = { price, change, changePercent };
            }
          });
        });
      } catch (e) {
        console.error('Binance API Error', e);
      }
    }

    // 2. Fetch Stocks and Indices from Yahoo Finance
    const yahooFetchList = [...stockToFetch, ...indexToFetch];
    if (yahooFetchList.length > 0) {
      try {
        const stockResults = await yahooFinance.quote(yahooFetchList);
        // yahoo-finance returns a single object if 1 symbol, or array if multiple
        const resultsArray = Array.isArray(stockResults) ? stockResults : [stockResults];
        
        resultsArray.forEach((quote: any) => {
          if (quote && quote.symbol && quote.regularMarketPrice) {
            prices[quote.symbol] = quote.regularMarketPrice;
            details[quote.symbol] = {
              price: quote.regularMarketPrice,
              change: quote.regularMarketChange || 0,
              changePercent: quote.regularMarketChangePercent || 0
            };
          }
        });
      } catch (e) {
        console.error('Yahoo Finance API Error', e);
      }
    }

    return NextResponse.json({ prices, details });
  } catch (error) {
    console.error('Prices API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
