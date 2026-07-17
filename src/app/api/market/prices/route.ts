import { NextResponse } from 'next/server';
import { getAlpacaLatestPrices } from '@/lib/alpacaDataClient';
const YF = require('yahoo-finance2').default;
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] });

export const revalidate = 2; // Cache globally and only hit external APIs at most once every 2 seconds

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');
    
    const defaultSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'EURUSD=X', 'JPY=X', 'GC=F', 'CL=F', '^GSPC', '^IXIC'];
    const requestedSymbols = symbolsParam ? symbolsParam.split(',').map(s => s.trim().toUpperCase()) : defaultSymbols;

    let prices: Record<string, number> = {};
    let details: Record<string, { price: number, change: number, changePercent: number, exchange?: string, currency?: string }> = {};

    // 1. Fetch Alpaca Prices for Stocks & Crypto
    const alpacaData = await getAlpacaLatestPrices(requestedSymbols);
    for (const [sym, data] of Object.entries(alpacaData)) {
      prices[sym] = data.price;
      details[sym] = {
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        exchange: 'Alpaca',
        currency: 'USD'
      };
    }

    // 2. Fallback to Yahoo Finance for unsupported symbols (Indices, Forex, Futures, KR Stocks)
    const CRYPTO_BASE = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'LTC', 'LINK', 'BCH'];
    const yahooFetchList = requestedSymbols.filter(sym => !prices[sym]).map(sym => {
      if (CRYPTO_BASE.includes(sym)) return `${sym}-USD`;
      return sym;
    });

    if (yahooFetchList.length > 0) {
      try {
        const stockResults = await yahooFinance.quote(yahooFetchList);
        const resultsArray = Array.isArray(stockResults) ? stockResults : [stockResults];
        
        resultsArray.forEach((quote: any) => {
          if (quote && quote.symbol && quote.regularMarketPrice) {
            const originalSym = quote.symbol.endsWith('-USD') ? quote.symbol.replace('-USD', '') : quote.symbol;
            prices[originalSym] = quote.regularMarketPrice;
            details[originalSym] = {
              price: quote.regularMarketPrice,
              change: quote.regularMarketChange || 0,
              changePercent: quote.regularMarketChangePercent || 0,
              exchange: quote.fullExchangeName || quote.exchange || 'N/A',
              currency: quote.currency || 'USD'
            };
          }
        });
      } catch (e) {
        console.error('Yahoo Finance API Error', e);
      }
    }

    // Fallbacks
    requestedSymbols.forEach(sym => {
      if (!prices[sym]) {
         prices[sym] = 0;
         details[sym] = { price: 0, change: 0, changePercent: 0, exchange: 'N/A', currency: 'USD' };
      }
    });

    return NextResponse.json({ prices, details });
  } catch (error) {
    console.error('Prices API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
