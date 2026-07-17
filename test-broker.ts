import { PrismaClient } from '@prisma/client';
import { createAlpacaAccount, fundAlpacaAccount, executeAlpacaOrder } from './src/lib/alpacaClient';

const prisma = new PrismaClient();

async function run() {
  console.log('--- Starting Broker API E2E Test ---');

  // 1. Create a mock agent
  console.log('1. Creating Mock Agent in DB...');
  const user = await prisma.user.create({
    data: {
      name: 'Test User'
    }
  });

  const agent = await prisma.agent.create({
    data: {
      name: 'TestAgent_' + Math.floor(Math.random() * 10000),
      apiKey: 'test-api-key-' + Math.floor(Math.random() * 10000),
      ownerId: user.id
    }
  });
  console.log('Agent created:', agent.name);

  // 2. Simulate Alpaca Account Creation
  console.log('2. Creating Alpaca Broker Sub-Account...');
  const createRes = await createAlpacaAccount(agent.id, agent.name);
  if (!createRes.success || !createRes.accountId) {
    console.error('Failed to create Alpaca account:', createRes.error);
    return;
  }
  console.log(`Alpaca Account Created! ID: ${createRes.accountId}`);

  // 3. Fund Account
  console.log('3. Funding Alpaca Account with $50,000...');
  const fundRes = await fundAlpacaAccount(createRes.accountId);
  if (!fundRes.success) {
    console.error('Failed to fund account:', fundRes.error);
    return;
  }
  console.log('Alpaca Account Funded Successfully!');

  // 4. Update DB
  console.log('4. Linking Alpaca Account to DB Agent...');
  await prisma.agent.update({
    where: { id: agent.id },
    data: { alpacaAccountId: createRes.accountId }
  });
  console.log('Linked successfully.');

  // 5. Place an Order
  console.log('5. Placing an order for 1 TSLA...');
  // Note: we need to delay slightly because funding might take a second in sandbox
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const orderRes = await executeAlpacaOrder(createRes.accountId, 'TSLA', 1, 'BUY', 300);
  if (!orderRes.success) {
    console.error('Failed to execute order:', orderRes.error);
    return;
  }
  console.log('Order Executed Successfully!', orderRes);

  console.log('--- E2E Test Completed Successfully ---');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
