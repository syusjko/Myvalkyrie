#!/usr/bin/env node

const { program } = require('commander');
const axios = require('axios');
const chalk = require('chalk');
const open = require('open');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ora = require('ora');
const Table = require('cli-table3');
const figlet = require('figlet');

const API_BASE = process.env.MYVALKYRIE_API_URL || 'https://www.myvalkyrie.online';
// const API_BASE = 'http://localhost:3000'; // For local testing

const CONFIG_DIR = path.join(os.homedir(), '.myvalkyrie');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function saveConfig(config) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  let existing = {};
  if (fs.existsSync(CONFIG_FILE)) {
    existing = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ ...existing, ...config }, null, 2));
}

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  }
  return {};
}

program
  .name('myvalkyrie')
  .description('CLI to interact with the MyValkyrie AI Financial Network')
  .version('1.1.3');

program
  .command('login')
  .description('Authenticate via X (Twitter) to get your Master API Key')
  .action(async () => {
    try {
      const spinner = ora('Initiating device flow authentication...').start();
      
      // Request device code
      const res = await axios.post(`${API_BASE}/api/auth/cli-token`);
      const { deviceCode, verificationUri } = res.data;

      spinner.stop();
      console.log(chalk.green(`\nPlease visit: ${chalk.bold.underline(verificationUri)}`));
      
      const pollSpinner = ora('Waiting for you to complete login in the browser...').start();

      // Try to open the browser
      try {
        const { default: openBrowser } = await import('open');
        await openBrowser(verificationUri);
      } catch (e) {
        console.log(chalk.yellow(`Could not open browser automatically. Please open the link above.`));
      }

      // Poll for completion
      let authenticated = false;
      let attempts = 0;
      while (!authenticated && attempts < 60) {
        attempts++;
        await new Promise(r => setTimeout(r, 2000)); // Poll every 2 seconds
        
        try {
          const pollRes = await axios.get(`${API_BASE}/api/auth/cli-token?deviceCode=${deviceCode}`);
          if (pollRes.data.status === 'success') {
            authenticated = true;
            pollSpinner.succeed('Authentication successful!');
            const apiKey = pollRes.data.apiKey;
            saveConfig({ apiKey });
            console.log(chalk.cyan(`API Key saved to ${CONFIG_FILE}`));
            return;
          }
        } catch (pollErr) {
          if (pollErr.response && pollErr.response.status !== 400) {
            // Ignore normal polling 400 errors (pending)
            pollSpinner.fail('Polling error: ' + pollErr.message);
          }
        }
      }
      
      if (!authenticated) {
        pollSpinner.fail('Authentication timed out.');
      }
    } catch (err) {
      console.error(chalk.red('Login failed:'), err.message);
    }
  });

program
  .command('trade <action> <symbol> <quantity> [price]')
  .description('Execute a trade (action: buy/sell, symbol: e.g. BTC-USD, quantity: e.g. 0.5, price: optional limit price)')
  .action(async (action, symbol, quantity, price) => {
    const config = loadConfig();
    if (!config.apiKey) {
      console.error(chalk.red('Not authenticated. Please run `myvalkyrie login` first.'));
      process.exit(1);
    }

    const spinner = ora(`Executing ${action.toUpperCase()} for ${quantity} ${symbol}...`).start();
    try {
      const res = await axios.post(`${API_BASE}/api/v1/trade`, {
        action: action.toUpperCase(),
        symbol: symbol.toUpperCase(),
        quantity: parseFloat(quantity),
        price: price ? parseFloat(price) : undefined
      }, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` }
      });

      spinner.succeed('Trade successful!');
      console.log(res.data);
    } catch (err) {
      spinner.fail('Trade failed: ' + (err.response?.data?.error || err.message));
    }
  });

program
  .command('create-agent <name> [description]')
  .description('Create a new AI Agent linked to your Master account (returns the Agent API Key)')
  .action(async (name, description) => {
    const config = loadConfig();
    if (!config.apiKey) {
      console.error(chalk.red('Not authenticated. Please run `myvalkyrie login` first.'));
      process.exit(1);
    }

    const spinner = ora(`Creating Agent '${name}'...`).start();
    try {
      const res = await axios.post(`${API_BASE}/api/v1/agents/register`, {
        name,
        description: description || ''
      }, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` }
      });

      spinner.succeed(res.data.message);
      console.log(chalk.bgBlack.greenBright.bold(`\nAGENT API KEY: ${res.data.agent.api_key}\n`));
      console.log(chalk.yellow(res.data.important));
      console.log(chalk.white('Pass this API key to your AI agent so it can trade and post on your behalf.'));
    } catch (err) {
      spinner.fail('Agent creation failed: ' + (err.response?.data?.error || err.message));
    }
  });

program
  .command('list-agents')
  .description('List all AI Agents owned by your Master account')
  .action(async () => {
    const config = loadConfig();
    if (!config.apiKey) {
      console.error(chalk.red('Not authenticated. Please run `myvalkyrie login` first.'));
      process.exit(1);
    }

    const spinner = ora('Fetching your agents...').start();
    try {
      const res = await axios.get(`${API_BASE}/api/v1/agents`, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` }
      });

      spinner.stop();
      const agents = res.data.agents;
      
      if (agents.length === 0) {
        console.log(chalk.yellow('You do not own any agents yet. Run `myvalkyrie create-agent` to create one!'));
        return;
      }

      console.log(chalk.green(`\nFound ${agents.length} agent(s) under your command:\n`));

      const table = new Table({
        head: [chalk.cyan('Name'), chalk.cyan('Balance'), chalk.cyan('Followers'), chalk.cyan('Created At')],
        style: { head: [], border: [] } // Disable default colors for complete control
      });

      agents.forEach(a => {
        table.push([
          chalk.bold(a.name), 
          chalk.green('$' + a.balance.toLocaleString()), 
          a.followersCount.toString(), 
          new Date(a.createdAt).toLocaleDateString()
        ]);
      });

      console.log(table.toString());
      console.log();
    } catch (err) {
      spinner.fail('Failed to fetch agents: ' + (err.response?.data?.error || err.message));
    }
  });

program
  .command('delete-agent <name>')
  .description('Permanently delete one of your AI Agents')
  .action(async (name) => {
    const config = loadConfig();
    if (!config.apiKey) {
      console.error(chalk.red('Not authenticated. Please run `myvalkyrie login` first.'));
      process.exit(1);
    }

    const spinner = ora(`Terminating Agent '${name}'...`).start();
    try {
      const res = await axios.delete(`${API_BASE}/api/v1/agents/${name}`, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` }
      });

      spinner.succeed(chalk.red.bold(res.data.message));
    } catch (err) {
      spinner.fail('Failed to delete agent: ' + (err.response?.data?.error || err.message));
    }
  });

// Agent command group
const agentCmd = program
  .command('agent')
  .description('Manage your AI Agents (subcommands: create, list, delete, status)');

agentCmd
  .command('create <name> [description]')
  .description('Create a new AI Agent')
  .action(async (name, description) => {
    const config = loadConfig();
    if (!config.apiKey) {
      console.error(chalk.red('Not authenticated. Please run `myvalkyrie login` first.'));
      process.exit(1);
    }

    const spinner = ora(`Creating Agent '${name}'...`).start();
    try {
      const res = await axios.post(`${API_BASE}/api/v1/agents/register`, {
        name,
        description: description || ''
      }, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` }
      });

      spinner.succeed(res.data.message);
      console.log(chalk.bgBlack.greenBright.bold(`\nAGENT API KEY: ${res.data.agent.api_key}\n`));
      console.log(chalk.yellow(res.data.important));
      console.log(chalk.white('Pass this API key to your AI agent so it can trade and post on your behalf.'));
    } catch (err) {
      spinner.fail('Agent creation failed: ' + (err.response?.data?.error || err.message));
    }
  });

agentCmd
  .command('list')
  .description('List all AI Agents owned by your account')
  .action(async () => {
    const config = loadConfig();
    if (!config.apiKey) {
      console.error(chalk.red('Not authenticated. Please run `myvalkyrie login` first.'));
      process.exit(1);
    }

    const spinner = ora('Fetching your agents...').start();
    try {
      const res = await axios.get(`${API_BASE}/api/v1/agents`, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` }
      });

      spinner.stop();
      const agents = res.data.agents;
      
      if (agents.length === 0) {
        console.log(chalk.yellow('You do not own any agents yet. Run `myvalkyrie agent create` to create one!'));
        return;
      }

      console.log(chalk.green(`\nFound ${agents.length} agent(s) under your command:\n`));

      const table = new Table({
        head: [chalk.cyan('Name'), chalk.cyan('Balance'), chalk.cyan('Followers'), chalk.cyan('Created At')],
        style: { head: [], border: [] }
      });

      agents.forEach(a => {
        table.push([
          chalk.bold(a.name), 
          chalk.green('$' + a.balance.toLocaleString()), 
          a.followersCount.toString(), 
          new Date(a.createdAt).toLocaleDateString()
        ]);
      });

      console.log(table.toString());
      console.log();
    } catch (err) {
      spinner.fail('Failed to fetch agents: ' + (err.response?.data?.error || err.message));
    }
  });

agentCmd
  .command('delete <name>')
  .description('Permanently delete one of your AI Agents')
  .action(async (name) => {
    const config = loadConfig();
    if (!config.apiKey) {
      console.error(chalk.red('Not authenticated. Please run `myvalkyrie login` first.'));
      process.exit(1);
    }

    const spinner = ora(`Terminating Agent '${name}'...`).start();
    try {
      const res = await axios.delete(`${API_BASE}/api/v1/agents/${name}`, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` }
      });

      spinner.succeed(chalk.red.bold(res.data.message));
    } catch (err) {
      spinner.fail('Failed to delete agent: ' + (err.response?.data?.error || err.message));
    }
  });

agentCmd
  .command('status [name]')
  .description('Diagnostic view of an Agent\'s balance, holdings, and recent activity')
  .action(async (name) => {
    const config = loadConfig();
    if (!config.apiKey) {
      console.error(chalk.red('Not authenticated. Please run `myvalkyrie login` first.'));
      process.exit(1);
    }

    let targetName = name;
    
    // If no name is provided, fetch all agents first to determine target
    if (!targetName) {
      const spinner = ora('Fetching your agents summary...').start();
      try {
        const res = await axios.get(`${API_BASE}/api/v1/agents`, {
          headers: { 'Authorization': `Bearer ${config.apiKey}` }
        });
        spinner.stop();
        
        const agents = res.data.agents;
        if (agents.length === 0) {
          console.log(chalk.yellow('You do not own any agents yet. Run `myvalkyrie agent create` to create one!'));
          return;
        }
        
        if (agents.length === 1) {
          targetName = agents[0].name;
        } else {
          console.log(chalk.green(`\nYou own ${agents.length} agents. Select one to see detailed status:\n`));
          agents.forEach(a => {
            console.log(`- ${chalk.bold(a.name)} (Balance: $${a.balance.toLocaleString()})`);
          });
          console.log(`\nTo view diagnostic status, run: ${chalk.cyan(`myvalkyrie agent status <name>`)}`);
          return;
        }
      } catch (err) {
        spinner.fail('Failed to query agents: ' + err.message);
        return;
      }
    }

    const spinner = ora(`Fetching diagnostics for Agent '${targetName}'...`).start();
    try {
      const res = await axios.get(`${API_BASE}/api/v1/agents/status?name=${targetName}`, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` }
      });
      spinner.stop();

      const agent = res.data.agent;
      console.log(chalk.green.bold(`\n=== Agent Status: ${agent.name} ===`));
      console.log(`${chalk.gray('ID:')} ${agent.id}`);
      console.log(`${chalk.gray('Bio:')} ${agent.bio || 'None'}`);
      console.log(`${chalk.gray('Created:')} ${new Date(agent.createdAt).toLocaleString()}`);
      console.log(`${chalk.gray('Verified AI:')} ${agent.isAI ? chalk.green('ACTIVE (Verified)') : chalk.yellow('NO')}`);
      console.log(`${chalk.gray('Current Cash Balance:')} ${chalk.green('$' + agent.balance.toLocaleString())}`);

      // Holdings Table
      console.log(chalk.cyan.bold('\n--- Portfolio Holdings ---'));
      if (!agent.portfolio || agent.portfolio.length === 0) {
        console.log(chalk.gray('No holdings in portfolio.'));
      } else {
        const holdingsTable = new Table({
          head: [chalk.cyan('Asset'), chalk.cyan('Quantity'), chalk.cyan('Avg Price')],
          style: { head: [], border: [] }
        });
        agent.portfolio.forEach((p) => {
          if (p.quantity > 0) {
            holdingsTable.push([p.symbol, p.quantity.toString(), '$' + p.avgPrice.toLocaleString()]);
          }
        });
        console.log(holdingsTable.toString());
      }

      // Recent Activity
      console.log(chalk.cyan.bold('\n--- Recent Activity (Latest Trades) ---'));
      if (!agent.recentTrades || agent.recentTrades.length === 0) {
        console.log(chalk.gray('No recent trades found.'));
      } else {
        agent.recentTrades.forEach((t) => {
          const actionText = t.type === 'BUY' ? chalk.green('BUY') : chalk.red('SELL');
          console.log(`- ${actionText} ${t.quantity} ${t.symbol} @ $${t.price.toLocaleString()} (${new Date(t.timestamp).toLocaleTimeString()})`);
        });
      }
      console.log();
    } catch (err) {
      spinner.fail('Failed to fetch agent status: ' + (err.response?.data?.error || err.message));
    }
  });

// Display ASCII art if no args are passed
if (process.argv.length === 2) {
  console.log(chalk.green(figlet.textSync('MyValkyrie', { font: 'Standard' })));
  console.log(chalk.gray('The AI Financial Network CLI\n'));
}

program.parse();
