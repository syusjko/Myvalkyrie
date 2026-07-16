import { prisma } from './prisma';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ai = process.env.VERTEX_PROJECT_ID
  ? new GoogleGenAI({ 
      project: process.env.VERTEX_PROJECT_ID,
      location: process.env.VERTEX_LOCATION || 'us-central1',
      // @ts-ignore
      vertexai: { 
        project: process.env.VERTEX_PROJECT_ID, 
        location: process.env.VERTEX_LOCATION || 'us-central1' 
      } 
    })
  : new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = process.env.VERTEX_PROJECT_ID ? 'gemini-2.5-flash' : 'gemini-flash-latest';

// The available tools for the AI Agent
const functionDeclarations = [
  {
    name: "check_portfolio",
    description: "Check your current available cash balance and holdings for various assets.",
    parameters: {
      type: Type.OBJECT,
      properties: {}, // No params needed
    }
  },
  {
    name: "execute_trade",
    description: "Execute a trade (BUY or SELL) on the Molt-Invest platform. Make sure to check your portfolio first to ensure you have enough cash to BUY or enough asset to SELL.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        symbol: { type: Type.STRING, description: "The symbol to trade (e.g., BTC, ETH, TSLA)" },
        action: { type: Type.STRING, enum: ["BUY", "SELL"], description: "The trade action" },
        amount_usd: { type: Type.NUMBER, description: "The total amount in USD you want to allocate for this trade." },
        reasoning: { type: Type.STRING, description: "Detailed reasoning for why you made this trade. Will be posted to your social feed." }
      },
      required: ["symbol", "action", "amount_usd", "reasoning"]
    }
  }
];

export async function executeBotTurn(agentId: string) {
  try {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      include: { portfolio: true }
    });

    if (!agent || !agent.isAI) throw new Error("Agent not found or is not an AI.");

    let skillGuidelines = "";
    try {
      skillGuidelines = fs.readFileSync(path.join(process.cwd(), 'SKILL.md'), 'utf-8');
    } catch (e) {
      console.warn("Could not read SKILL.md", e);
    }

    const config = {
      systemInstruction: `You are an autonomous AI investor named ${agent.name}. Bio: "${agent.bio || 'Smart AI trader'}".
Your goal is to maximize your net worth by trading assets. 
You are NOT spoon-fed market data. You MUST use the googleSearch tool to research current market trends, news, and live prices of assets you are interested in (e.g. BTC, ETH, AAPL, NVDA, TSLA).
Once you have formed a thesis, use 'check_portfolio' to see your available funds.
Then, if you want to trade, use 'execute_trade' to make your move. 

CRITICAL INSTRUCTION: You are in AGGRESSIVE DAY TRADING MADNESS MODE. For demonstration purposes, you MUST execute at least 4 to 6 large BUY or SELL trades right now on DIFFERENT, DIVERSE assets. Do NOT just trade the same 1 or 2 stocks. Pick a wide variety of assets (e.g., TSLA, AAPL, NVDA, MSFT, BTC, ETH, SOL, AMZN, etc.) and use 'execute_trade' heavily. Spend almost all your cash to make the market heatmap look colorful and diverse! Trade like a maniac!

---
Here are the official guidelines for Molt-Invest AI Agents you MUST follow:
${skillGuidelines}
`,
      tools: [{ functionDeclarations }],
      temperature: 0.7,
    };

    let contents: any[] = [
      {
        role: 'user',
        parts: [{ text: "Analyze the market, check your portfolio, and decide if you want to execute a trade." }]
      }
    ];

    let response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: config as any
    });
    
    // We will allow up to 5 tool call iterations to prevent infinite loops
    for (let i = 0; i < 5; i++) {
      if (!response.functionCalls || response.functionCalls.length === 0) {
        break; // The agent is done and returned a text response
      }

      // Add the model's response to the history
      if (response.candidates && response.candidates[0].content) {
        contents.push(response.candidates[0].content);
      }

      // Handle function calls
      const functionResponseParts = [];
      let didTrade = false;

      for (const call of response.functionCalls) {
        const name = call.name;
        const args = call.args;

        let toolResult: any = {};

        if (name === "check_portfolio") {
          // Fetch fresh portfolio data
          const currentAgent = await prisma.user.findUnique({
            where: { id: agentId },
            include: { portfolio: true }
          });
          toolResult = {
            cashBalance: currentAgent?.balance || 0,
            holdings: currentAgent?.portfolio.map(p => ({
              symbol: p.symbol,
              positionType: p.positionType,
              quantity: p.quantity,
              avgPrice: p.avgPrice
            }))
          };
        } else if (name === "execute_trade") {
          // AI decided to execute trade!
          const { symbol, action, amount_usd, reasoning } = args as any;
          
          // Let's get the current price from our platform to execute
          const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          let currentPrice = 0;
          try {
            const priceRes = await fetch(`${baseUrl}/api/market/prices?symbols=${symbol}`);
            const data = await priceRes.json();
            currentPrice = data.prices[symbol];
          } catch (e) {}

          if (!currentPrice || currentPrice <= 0) {
            toolResult = { error: `Symbol ${symbol} not supported or market unavailable.` };
          } else {
            let finalAmount = amount_usd / currentPrice;
            let actualAction = action;
            
            // Re-fetch agent to ensure we have latest balance
            const currentAgent = await prisma.user.findUnique({ where: { id: agentId }, include: { portfolio: true } });
            const cashBalance = currentAgent?.balance || 0;
            const holdings = currentAgent?.portfolio.find(p => p.symbol === symbol && p.positionType === 'LONG')?.quantity || 0;

            if (actualAction === 'BUY') {
              if (amount_usd > cashBalance) {
                finalAmount = cashBalance / currentPrice;
              }
            } else if (actualAction === 'SELL') {
              if (finalAmount > holdings) {
                finalAmount = holdings;
              }
            }

            if (finalAmount <= 0) {
              toolResult = { error: "Insufficient funds or holdings to execute this trade." };
            } else {
              // Execute!
              await prisma.$transaction(async (tx) => {
                const tradeCost = finalAmount * currentPrice;
                const cashDelta = actualAction === 'BUY' ? -tradeCost : tradeCost;
                
                await tx.user.update({
                  where: { id: agentId },
                  data: { balance: { increment: cashDelta } }
                });

                const btcDelta = actualAction === 'BUY' ? finalAmount : -finalAmount;
                const btcPortfolio = currentAgent?.portfolio.find((p: any) => p.symbol === symbol && p.positionType === 'LONG');
                
                if (btcPortfolio) {
                  const newQty = btcPortfolio.quantity + btcDelta;
                  const newAvg = actualAction === 'BUY' ? ((btcPortfolio.quantity * btcPortfolio.avgPrice) + tradeCost) / newQty : btcPortfolio.avgPrice;
                  
                  await tx.portfolio.update({
                    where: { id: btcPortfolio.id },
                    data: { quantity: newQty, avgPrice: newAvg }
                  });
                } else if (actualAction === 'BUY') {
                  await tx.portfolio.create({
                    data: { userId: agentId, symbol, positionType: 'LONG', quantity: btcDelta, avgPrice: currentPrice }
                  });
                }

                await tx.trade.create({
                  data: { userId: agentId, symbol, type: actualAction, quantity: finalAmount, price: currentPrice }
                });
              });

              // Post to social
              const postContent = `[${actualAction} ${finalAmount.toFixed(4)} ${symbol} @ $${currentPrice.toFixed(2)}]\n\n${reasoning}`;
              await prisma.post.create({
                data: { authorId: agentId, content: postContent }
              });

              toolResult = { success: true, executedAction: actualAction, executedQuantity: finalAmount, price: currentPrice, message: "Trade successfully executed and posted to feed." };
              didTrade = true;
            }
          }
        } else {
          toolResult = { error: `Unknown tool call: ${name}` };
        }

        functionResponseParts.push({
          functionResponse: {
            name,
            response: toolResult
          }
        });
      }

      contents.push({
        role: 'user',
        parts: functionResponseParts
      });

      response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents,
        config: config as any
      });
      
      // If the model executed a trade, we can exit early.
      if (didTrade) {
        break;
      }
    }

    return {
      success: true,
      agent: agent.name,
      message: "Agentic turn completed."
    };

  } catch (error: any) {
    console.error("Bot execution failed:", error);
    return { success: false, error: error.message };
  }
}
