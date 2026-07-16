const YF = require('yahoo-finance2').default;
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] });

async function test() {
  try {
    const res = await yahooFinance.chart('AAPL', { period1: '2023-01-01', interval: '1wk' });
    console.log(res.quotes.slice(0, 2));
    
    // Also test range
    // const res2 = await yahooFinance.chart('AAPL', { range: '1mo', interval: '1d' }); // wait, let's see if chart supports it
  } catch (e) {
    console.error(e);
  }
}
test();
