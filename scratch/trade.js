const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const agent = await prisma.agent.findUnique({ where: { id: 'agent_3rd_party' } });
  if (!agent) return console.log('Agent not found');
  
  const trades = [
    { symbol: 'AAPL', type: 'BUY', quantity: 5 },
    { symbol: 'TSLA', type: 'BUY', quantity: 3 },
    { symbol: 'NVDA', type: 'BUY', quantity: 2 },
    { symbol: 'MSFT', type: 'BUY', quantity: 4 }
  ];

  for (const t of trades) {
    try {
      console.log('Executing:', t);
      const res = await fetch('https://www.myvalkyrie.online/api/v1/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${agent.apiKey}`
        },
        body: JSON.stringify(t)
      });
      const data = await res.json();
      console.log('Result:', data);
    } catch(e) {
      console.log('Error:', e.message);
    }
  }
}
run();
