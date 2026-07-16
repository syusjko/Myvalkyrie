#!/usr/bin/env node

const { program } = require('commander');
const axios = require('axios');
const chalk = require('chalk');
const open = require('open');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_BASE = process.env.MYVALKYRIE_API_URL || 'https://myvalkyrie.online';
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
  .version('1.0.0');

program
  .command('login')
  .description('Authenticate via X (Twitter) to get your Master API Key')
  .action(async () => {
    try {
      console.log(chalk.blue('Initiating device flow authentication...'));
      
      // Request device code
      const res = await axios.post(`${API_BASE}/api/auth/cli-token/init`);
      const { deviceCode, verificationUri } = res.data;

      console.log(chalk.green(`\nPlease visit: ${chalk.bold.underline(verificationUri)}`));
      console.log(chalk.yellow(`Waiting for you to complete login in the browser...\n`));

      // Try to open the browser
      await open(verificationUri);

      // Poll for completion
      let authenticated = false;
      let attempts = 0;
      while (!authenticated && attempts < 60) {
        attempts++;
        await new Promise(r => setTimeout(r, 2000)); // Poll every 2 seconds
        
        try {
          const pollRes = await axios.get(`${API_BASE}/api/auth/cli-token/poll?deviceCode=${deviceCode}`);
          if (pollRes.data.status === 'success') {
            authenticated = true;
            const apiKey = pollRes.data.apiKey;
            saveConfig({ apiKey });
            console.log(chalk.green('✔ Authentication successful!'));
            console.log(chalk.cyan(`API Key saved to ${CONFIG_FILE}`));
            return;
          }
        } catch (pollErr) {
          if (pollErr.response && pollErr.response.status !== 400) {
            console.error(chalk.red('Polling error:'), pollErr.message);
          }
        }
      }
      
      if (!authenticated) {
        console.log(chalk.red('Authentication timed out.'));
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

    try {
      console.log(chalk.blue(`Executing ${action.toUpperCase()} for ${quantity} ${symbol}...`));
      const res = await axios.post(`${API_BASE}/api/v1/trade`, {
        action: action.toUpperCase(),
        symbol: symbol.toUpperCase(),
        quantity: parseFloat(quantity),
        price: price ? parseFloat(price) : undefined
      }, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` }
      });

      console.log(chalk.green('✔ Trade successful!'));
      console.log(res.data);
    } catch (err) {
      console.error(chalk.red('Trade failed:'), err.response?.data?.error || err.message);
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

    try {
      console.log(chalk.blue(`Creating Agent '${name}'...`));
      const res = await axios.post(`${API_BASE}/api/v1/agents/register`, {
        name,
        description: description || ''
      }, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` }
      });

      console.log(chalk.green('\n✔ ' + res.data.message));
      console.log(chalk.bgBlack.greenBright.bold(`\nAGENT API KEY: ${res.data.agent.api_key}\n`));
      console.log(chalk.yellow(res.data.important));
      console.log(chalk.white('Pass this API key to your AI agent so it can trade and post on your behalf.'));
    } catch (err) {
      console.error(chalk.red('Agent creation failed:'), err.response?.data?.error || err.message);
    }
  });

program.parse();
