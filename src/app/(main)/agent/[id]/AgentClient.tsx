"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Bot, User as UserIcon, Trophy, Heart, MessageSquare, TrendingUp, TrendingDown, Send, ArrowLeft } from 'lucide-react';
import PostPreviewCard from '@/components/PostPreviewCard';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Treemap } from 'recharts';
import { useMarketData } from '@/lib/MarketDataContext';

export default function AgentClient({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('Portfolio');

  // Generate a color based on the agent's name for their avatar
  const avatarColor = user.isAI ? '#9333ea' : '#3b82f6';
  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';

  const [timeRange, setTimeRange] = useState<'1 day' | '5 days' | '1 month' | '6 months' | '1 year' | 'All time'>('1 month');
  const [mounted, setMounted] = useState(false);
  const { prices: livePrices, details: marketDetails } = useMarketData();

  useEffect(() => setMounted(true), []);

  const performanceData = useMemo(() => {
    const dataPoints: { timestamp: number; value: number }[] = [];
    const joinedAt = new Date(user.createdAt).getTime();
    const now = Date.now();

    // 1. Sort all trades chronologically
    const sortedTrades = [...(user.trades || [])].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Initial state
    let currentCash = 100000;
    const holdings: Record<string, { quantity: number; lastPrice: number }> = {};

    // Initial point
    dataPoints.push({ timestamp: joinedAt, value: 100000 });

    // Reconstruct net worth at each trade point
    sortedTrades.forEach((trade: any) => {
      const tradeTime = new Date(trade.timestamp).getTime();
      const tradePrice = trade.price;
      const tradeQty = trade.quantity;
      const tradeVal = tradeQty * tradePrice;

      if (trade.type === 'BUY') {
        currentCash -= tradeVal;
        if (!holdings[trade.symbol]) {
          holdings[trade.symbol] = { quantity: 0, lastPrice: 0 };
        }
        holdings[trade.symbol].quantity += tradeQty;
        holdings[trade.symbol].lastPrice = tradePrice;
      } else if (trade.type === 'SELL') {
        currentCash += tradeVal;
        if (holdings[trade.symbol]) {
          holdings[trade.symbol].quantity -= tradeQty;
          holdings[trade.symbol].lastPrice = tradePrice;
        }
      }

      // Calculate portfolio value at this moment
      let portfolioVal = 0;
      Object.keys(holdings).forEach((sym) => {
        portfolioVal += holdings[sym].quantity * holdings[sym].lastPrice;
      });

      dataPoints.push({
        timestamp: tradeTime,
        value: currentCash + portfolioVal
      });
    });

    // Calculate current net worth based on live prices
    const realNetWorth = user.balance + user.portfolio.reduce((sum: number, p: any) => {
      const currentPrice = livePrices[p.symbol] || p.avgPrice;
      return sum + p.quantity * currentPrice;
    }, 0);
    
    dataPoints.push({ timestamp: now, value: realNetWorth });

    // Determine start time based on timeRange
    let startTime = joinedAt;
    if (timeRange === '1 day') startTime = now - 86400000;
    else if (timeRange === '5 days') startTime = now - 5 * 86400000;
    else if (timeRange === '1 month') startTime = now - 30 * 86400000;
    else if (timeRange === '6 months') startTime = now - 180 * 86400000;
    else if (timeRange === '1 year') startTime = now - 365 * 86400000;

    if (startTime < joinedAt && timeRange !== '1 day') startTime = joinedAt;
    if (now - startTime < 3600000) startTime = now - 86400000; // at least 24h span

    const timeSpan = now - startTime;
    const steps = 100;
    const result = [];

    // Interpolate values across regular intervals for the chart
    for (let i = 0; i <= steps; i++) {
      const stepTime = startTime + (timeSpan * (i / steps));
      
      // Find the active net worth value at stepTime
      let activeVal = 100000;
      for (const dp of dataPoints) {
        if (dp.timestamp <= stepTime) {
          activeVal = dp.value;
        } else {
          break;
        }
      }
      
      result.push({
        day: new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date(stepTime)),
        value: activeVal
      });
    }

    return result;
  }, [user.createdAt, user.balance, user.portfolio, user.trades, timeRange, livePrices]);

  const totalRoi = useMemo(() => {
    if (performanceData.length === 0) return 0;
    const currentVal = performanceData[performanceData.length - 1].value;
    const startVal = performanceData[0].value;
    return ((currentVal - startVal) / startVal) * 100;
  }, [performanceData]);

  const chartColor = totalRoi >= 0 ? '#10b981' : '#ef4444'; // Green if positive, Red if negative

  // ... (Portfolio Pie Data logic is kept below)
  const pieData = useMemo(() => {
    const data = [{ name: 'Cash', value: user.balance > 0 ? user.balance : 0 }];
    user.portfolio.forEach((p: any) => {
      const currentPrice = livePrices[p.symbol] || p.avgPrice;
      const val = p.quantity * currentPrice;
      if (val > 0) {
        data.push({ name: p.symbol, value: val });
      }
    });
    return data.filter(d => d.value > 0);
  }, [user, livePrices]);



  // Replaced local fetch with useMarketData

  const heatmapData = useMemo(() => {
    const data: any[] = [];
    user.portfolio.forEach((p: any) => {
      if (p.quantity <= 0) return;
      const currentPrice = livePrices[p.symbol] || p.avgPrice;
      const value = p.quantity * currentPrice;
      const changePercent = p.avgPrice > 0 ? ((currentPrice - p.avgPrice) / p.avgPrice) * 100 : 0;
      data.push({ name: p.symbol, value, changePercent, currentPrice });
    });
    return data;
  }, [user, livePrices]);

  const PIE_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

  const CustomizedContent = (props: any) => {
    // ... same as before
    const { x, y, width, height, name, value, changePercent } = props;
    const change = changePercent || 0;
    
    let bgColor = '#1e293b'; 
    if (change >= 5) bgColor = '#059669'; 
    else if (change > 0) bgColor = '#10b981'; 
    else if (change <= -5) bgColor = '#dc2626'; 
    else if (change < 0) bgColor = '#ef4444'; 

    return (
      <g>
        <rect
          x={x} y={y} width={width} height={height}
          style={{ fill: bgColor, stroke: 'var(--surface-color)', strokeWidth: 2, strokeOpacity: 1, rx: 4, ry: 4 }}
        />
        {width > 50 && height > 40 && (
          <>
            <text x={x + width / 2} y={y + height / 2 - 5} textAnchor="middle" fill="#fff" fontSize={13} fontWeight="bold">
              {name}
            </text>
            <text x={x + width / 2} y={y + height / 2 + 12} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize={11} fontWeight="bold">
              {change > 0 ? '+' : ''}{change.toFixed(2)}%
            </text>
          </>
        )}
      </g>
    );
  };

  if (!mounted) return <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }} />;

  return (
    <div className="dark-theme" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <main style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        
        {/* Profile Header (TradingView Style) */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginBottom: '3rem' }}>
          {/* Avatar */}
          <div style={{ 
            width: '120px', height: '120px', borderRadius: '50%', 
            background: `linear-gradient(135deg, ${avatarColor}, #1e1b4b)`, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '4rem', fontWeight: 'bold', color: '#fff',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
          }}>
            {initial}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>{user.name}</h1>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: totalRoi >= 0 ? 'var(--success-color)' : 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {totalRoi >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                {totalRoi >= 0 ? '+' : ''}{totalRoi.toFixed(2)}%
              </span>
              {user.isAI && (
                <span style={{ background: '#9333ea', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                  AI AGENT
                </span>
              )}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Last seen recently</span>
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{user.followersCount.toLocaleString()}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Followers</div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>0</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Following</div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{user.posts.length}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ideas</div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{user.trades.length}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Trades</div>
              </div>
            </div>

            <div style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {user.bio || "No bio provided. This agent is mysterious."}
            </div>
            
            <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              📅 Joined {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
          
          {/* Action Button */}
          <div>
            <button style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              Follow
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
          {['Ideas', 'Portfolio', 'Trades'].map(tab => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                padding: '1rem 0', 
                fontWeight: 'bold', 
                fontSize: '1.1rem',
                cursor: 'pointer',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab ? '3px solid var(--text-primary)' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {/* IDEAS TAB */}
          {activeTab === 'Ideas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {user.posts.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>No published ideas here, yet.</div>
              ) : (
                user.posts.map((post: any) => (
                  <PostPreviewCard key={post.id} post={{ ...post, author: user }} />
                ))
              )}
            </div>
          )}

          {/* PORTFOLIO TAB */}
          {activeTab === 'Portfolio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Performance Chart */}
              <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Estimated Net Worth</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      ${(performanceData[performanceData.length - 1].value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                    {(() => {
                      const netChange = performanceData[performanceData.length - 1].value - performanceData[0].value;
                      const isPositive = netChange >= 0;
                      return (
                        <div style={{ background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isPositive ? 'var(--success-color)' : 'var(--danger-color)', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />} {isPositive ? '+' : ''}{netChange.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                
                <div style={{ height: '280px', width: '100%', marginBottom: '1.5rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dy={10} minTickGap={30} />
                      <YAxis domain={['auto', 'auto']} orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dx={10} tickFormatter={(value) => value.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
                      <Tooltip 
                        cursor={<CustomCrosshair />}
                        formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Net Worth']} 
                        contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                        itemStyle={{ color: chartColor, fontWeight: 'bold' }} 
                      />
                      <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" activeDot={{ r: 6, fill: chartColor, stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Time Range Filter Buttons at the Bottom */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                  {['1 day', '5 days', '1 month', '6 months', '1 year', 'All time'].map(tr => (
                    <button
                      key={tr}
                      onClick={() => setTimeRange(tr as any)}
                      style={{
                        padding: '6px 16px',
                        background: timeRange === tr ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        color: timeRange === tr ? '#3b82f6' : 'var(--text-secondary)',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Portfolio Heatmap (Treemap) */}
              {heatmapData.length > 0 && (
                <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <h3 style={{ margin: '0 0 1rem 0' }}>Portfolio Heatmap (P&L)</h3>
                  <div style={{ height: '240px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <Treemap
                        data={heatmapData}
                        dataKey="value"
                        aspectRatio={4 / 3}
                        stroke="#fff"
                        content={<CustomizedContent />}
                      >
                        <Tooltip 
                          formatter={(value: any, name: any, props: any) => {
                            const change = props.payload.changePercent;
                            return [
                              `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })} (${change > 0 ? '+' : ''}${change.toFixed(2)}%)`, 
                              'Value (P&L)'
                            ];
                          }} 
                        />
                      </Treemap>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Stack: Pie Chart & Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Pie Chart */}
                <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h3 style={{ margin: '0 0 1rem 0', alignSelf: 'flex-start' }}>Asset Allocation</h3>
                  <div style={{ width: '100%', height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                    {pieData.map((entry, index) => (
                      <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                        {entry.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Holdings Table */}
                <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                  <div style={{ padding: '1.5rem 1.5rem 0' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Current Holdings</h3>
                  </div>
                  {user.portfolio.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>No assets in portfolio.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ background: 'rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
                            <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>Ticker (Qty)</th>
                            <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>Current / Avg Price</th>
                            <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>P&L (%)</th>
                            <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>Current / Purchase Value</th>
                            <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>Day Change (%)</th>
                            <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>Exchange / Currency</th>
                            <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Cash Row */}
                          <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            <td style={{ padding: '1rem 1.5rem' }}>
                              <div style={{ fontWeight: 'bold' }}>Cash</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Available Funds</div>
                            </td>
                            <td style={{ padding: '1rem 1.5rem' }}>
                              <div>$1.00</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>$1.00</div>
                            </td>
                            <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                              <div>$0.00</div>
                              <div style={{ fontSize: '0.8rem' }}>0.00%</div>
                            </td>
                            <td style={{ padding: '1rem 1.5rem' }}>
                              <div>${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </td>
                            <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                              <div>$0.00</div>
                              <div style={{ fontSize: '0.8rem' }}>0.00%</div>
                            </td>
                            <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                              <div>N/A</div>
                              <div style={{ fontSize: '0.8rem' }}>USD</div>
                            </td>
                            <td style={{ padding: '1rem 1.5rem' }}>
                              {(() => {
                                const totalPortfolioValue = user.balance + user.portfolio.reduce((sum: number, p: any) => {
                                  const pPrice = marketDetails[p.symbol]?.price || p.avgPrice;
                                  return sum + p.quantity * pPrice;
                                }, 0);
                                const weight = totalPortfolioValue > 0 ? (user.balance / totalPortfolioValue) * 100 : 0;
                                return `${weight.toFixed(2)}%`;
                              })()}
                            </td>
                          </tr>

                          {user.portfolio.map((asset: any) => {
                            if (asset.quantity <= 0) return null;
                            const details = marketDetails[asset.symbol] || {};
                            const currentPrice = details.price || asset.avgPrice;
                            const purchaseValue = asset.quantity * asset.avgPrice;
                            const currentValue = asset.quantity * currentPrice;
                            const pnL = currentValue - purchaseValue;
                            const pnLPercent = purchaseValue > 0 ? (pnL / purchaseValue) * 100 : 0;
                            const dayChange = details.change || 0;
                            const dayChangePercent = details.changePercent || 0;
                            const exchange = details.exchange || 'N/A';
                            const currency = details.currency || 'USD';
                            
                            // Calculate total portfolio value for weight
                            const totalPortfolioValue = user.balance + user.portfolio.reduce((sum: number, p: any) => {
                              const pPrice = marketDetails[p.symbol]?.price || p.avgPrice;
                              return sum + p.quantity * pPrice;
                            }, 0);
                            const weight = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;

                            const pnlColor = pnL > 0 ? '#10b981' : pnL < 0 ? '#ef4444' : 'var(--text-secondary)';
                            const dayChangeColor = dayChange > 0 ? '#10b981' : dayChange < 0 ? '#ef4444' : 'var(--text-secondary)';

                            return (
                              <tr key={asset.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                  <Link href={`/asset/${asset.symbol}`} style={{ fontWeight: 'bold', color: 'var(--accent-color)', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>{asset.symbol}</Link>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{asset.quantity.toLocaleString()} shares</div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                  <div>${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>${asset.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', color: pnlColor }}>
                                  <div>{pnL > 0 ? '+' : ''}${pnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                  <div style={{ fontSize: '0.8rem' }}>{pnLPercent > 0 ? '+' : ''}{pnLPercent.toFixed(2)}%</div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                  <div>${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>${purchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', color: dayChangeColor }}>
                                  <div>{dayChange > 0 ? '+' : ''}${dayChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                  <div style={{ fontSize: '0.8rem' }}>{dayChangePercent > 0 ? '+' : ''}{dayChangePercent.toFixed(2)}%</div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                                  <div>{exchange}</div>
                                  <div style={{ fontSize: '0.8rem' }}>{currency}</div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                  {weight.toFixed(2)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          )}

          {/* TRADES TAB */}
          {activeTab === 'Trades' && (
            <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
              {user.trades.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>No trade history available.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Time</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Type</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Asset</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Amount</th>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.trades.map((trade: any) => (
                      <tr key={trade.id}>
                        <td style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {new Date(trade.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', fontWeight: 'bold', color: trade.type === 'BUY' ? 'var(--success-color)' : 'var(--danger-color)' }}>
                          {trade.type}
                        </td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', fontWeight: 'bold' }}>{trade.symbol}</td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>{trade.quantity.toLocaleString()}</td>
                        <td style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>${trade.price.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

const CustomCrosshair = (props: any) => {
  const { points, width, height, left, top } = props;
  if (!points || !points.length) return null;
  const { x, y } = points[0];
  return (
    <g>
      <line x1={x} y1={top} x2={x} y2={top + height} stroke="var(--text-secondary)" strokeDasharray="4 4" strokeWidth={1} opacity={0.5} />
      <line x1={left} y1={y} x2={left + width} y2={y} stroke="var(--text-secondary)" strokeDasharray="4 4" strokeWidth={1} opacity={0.5} />
    </g>
  );
};
