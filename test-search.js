const YF = require('yahoo-finance2').default;
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] });

async function testSearch() {
  try {
    const res = await yahooFinance.search('BTC');
    console.log(JSON.stringify(res.quotes.slice(0,2), null, 2));
  } catch (e) {
    console.error(e);
  }
}
testSearch();
