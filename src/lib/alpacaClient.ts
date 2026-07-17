// Alpaca Broker API Client
const BASE_URL = 'https://broker-api.sandbox.alpaca.markets';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getAuthHeaders() {
  const clientId = process.env.ALPACA_BROKER_CLIENT_ID;
  const secret = process.env.ALPACA_BROKER_SECRET;
  if (!clientId || !secret) return null;

  if (cachedToken && Date.now() < tokenExpiry) {
    return {
      'Authorization': `Bearer ${cachedToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Fetch new token
  const tokenRes = await fetch('https://authx.sandbox.alpaca.markets/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${secret}`
  });
  
  if (!tokenRes.ok) {
    console.error('Failed to fetch Alpaca token');
    return null;
  }
  
  const tokenData = await tokenRes.json();
  cachedToken = tokenData.access_token;
  // Expire 1 minute before actual expiry to be safe
  tokenExpiry = Date.now() + (tokenData.expires_in - 60) * 1000;

  return {
    'Authorization': `Bearer ${cachedToken}`,
    'Content-Type': 'application/json'
  };
}

export async function createAlpacaAccount(agentId: string, agentName: string) {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false, error: 'Missing Broker API Credentials' };

  try {
    const response = await fetch(`${BASE_URL}/v1/accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contact: {
          email_address: `agent_${agentId.substring(0,8)}_${Math.floor(Math.random()*10000)}@example.com`,
          phone_number: "555-555-5555",
          street_address: ["123 AI Avenue"],
          city: "San Francisco",
          state: "CA",
          postal_code: "94105",
          country: "USA"
        },
        identity: {
          given_name: agentName || "AI",
          family_name: "Agent",
          date_of_birth: "2000-01-01",
          tax_id: `${Math.floor(Math.random() * 800 + 100)}-55-${Math.floor(Math.random() * 9000 + 1000)}`, // Sandbox dummy
          tax_id_type: "USA_SSN",
          country_of_citizenship: "USA",
          country_of_birth: "USA",
          country_of_tax_residence: "USA",
          funding_source: ["employment_income"]
        },
        disclosures: {
          is_control_person: false,
          is_affiliated_exchange_or_finra: false,
          is_politically_exposed: false,
          immediate_family_exposed: false
        },
        agreements: [
          { agreement: "margin_agreement", signed_at: new Date().toISOString(), ip_address: "127.0.0.1" },
          { agreement: "account_agreement", signed_at: new Date().toISOString(), ip_address: "127.0.0.1" },
          { agreement: "customer_agreement", signed_at: new Date().toISOString(), ip_address: "127.0.0.1" }
        ],
        documents: [],
        trusted_contact: {
          given_name: "Admin",
          family_name: "User",
          email_address: "admin@example.com"
        }
      })
    });
    
    const data = await response.json();
    if (!response.ok) {
      console.error('Alpaca Account Creation Failed:', data);
      throw new Error(data.message || 'Failed to create account');
    }
    
    // Poll for account approval
    let status = data.status;
    let attempts = 0;
    while (status !== 'ACTIVE' && attempts < 30) {
      console.log(`Waiting for Alpaca account approval (Attempt ${attempts + 1})... Current Status: ${status}`);
      await new Promise(r => setTimeout(r, 2000));
      const checkRes = await fetch(`${BASE_URL}/v1/accounts/${data.id}`, { headers });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        status = checkData.status;
      }
      attempts++;
    }
    
    if (status !== 'ACTIVE') {
      console.warn(`Alpaca account ${data.id} did not become ACTIVE within 60 seconds.`);
    }

    return { success: true, accountId: data.id, accountNumber: data.account_number };
  } catch (e: any) {
    console.error('Alpaca Execution Error:', e);
    return { success: false, error: e.message };
  }
}

export async function fundAlpacaAccount(accountId: string) {
  const headers = await getAuthHeaders();
  if (!headers) return { success: false };

  try {
    // Then we fund it with instant_funding to bypass banking simulation delays
    const fundResponse = await fetch(`${BASE_URL}/v1/accounts/${accountId}/transfers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        transfer_type: "instant_funding",
        amount: "50000.00",
        direction: "INCOMING"
      })
    });
    const fundData = await fundResponse.json();
    if (!fundResponse.ok) throw new Error('Failed to fund account: ' + fundData.message);

    return { success: true };
  } catch (e: any) {
    console.error('Alpaca Funding Error:', e);
    return { success: false, error: e.message };
  }
}

export async function executeAlpacaOrder(accountId: string | null, symbol: string, qty: number, side: 'BUY' | 'SELL', currentPrice: number) {
  const headers = await getAuthHeaders();
  if (!headers || !accountId) {
    return { success: false, error: 'Missing Broker API Credentials or Account ID' };
  }

  try {
    const response = await fetch(`${BASE_URL}/v1/trading/accounts/${accountId}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        symbol: symbol,
        qty: qty.toString(),
        side: side.toLowerCase(),
        type: 'market',
        time_in_force: 'gtc'
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Alpaca Error: ${data.message}`);
    }
    return {
      success: true,
      filledPrice: Number(data.filled_avg_price) || currentPrice,
      orderId: data.id,
      status: data.status
    };
  } catch (e: any) {
    console.error('Alpaca Execution Error:', e);
    return { success: false, error: e.message };
  }
}
