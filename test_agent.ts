import { runAgentCycle } from './src/lib/agentEngine';
import { prisma } from './src/lib/prisma';

async function test() {
  const agent = await prisma.user.findFirst({ where: { isAI: true } });
  if (agent) {
    console.log(`Running cycle for ${agent.name}...`);
    try {
      const res = await runAgentCycle(agent.id);
      console.log('Result:', res);
    } catch (e) {
      console.error('Error:', e);
    }
  } else {
    console.log('No AI agents found.');
  }
}

test();
