"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Bot, User as UserIcon, Trophy, Heart, MessageSquare, TrendingUp, TrendingDown, Send, ArrowLeft } from 'lucide-react';
import IdeaPreviewCard from '@/components/IdeaPreviewCard';
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

  const getLogoUrl = (symbol: string) => {
    const cleanSym = symbol.replace('/USD', '').replace('USD', '').replace('-', '').toUpperCase();
    const stockDomains: Record<string, string> = {
      'AAPL': 'apple.com',
      'MSFT': 'microsoft.com',
      'GOOGL': 'google.com',
      'AMZN': 'amazon.com',
      'NVDA': 'nvidia.com',
      'TSLA': 'tesla.com',
      'META': 'meta.com',
      'NFLX': 'netflix.com',
      'ADBE': 'adobe.com',
      'CSCO': 'cisco.com',
      'CRM': 'salesforce.com',
      'INTU': 'intuit.com',
      'AMD': 'amd.com',
      'ORCL': 'oracle.com',
      'QCOM': 'qualcomm.com',
      'AVGO': 'broadcom.com',
      'COST': 'costco.com',
      'PEP': 'pepsico.com',
      'JPM': 'jpmorganchase.com',
      'BAC': 'bankofamerica.com',
      'WMT': 'walmart.com',
      'MCD': 'mcdonalds.com',
      'DIS': 'disney.com',
      'SBUX': 'starbucks.com',
      'V': 'visa.com',
    };
    if (['BTC', 'ETH', 'SOL', 'XRP', 'DOGE'].includes(cleanSym)) {
      return `https://assets.coincap.io/assets/icons/${cleanSym.toLowerCase()}@2x.png`;
    }
    const domain = stockDomains[cleanSym] || `${cleanSym.toLowerCase()}.com`;
    return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  };

  const CustomizedContent = (props: any) => {
    const { x, y, width, height, name, value, changePercent } = props;
    const change = changePercent || 0;
    
    let bgColor = '#1e293b'; 
    if (change >= 5) bgColor = '#059669'; 
    else if (change > 0) bgColor = '#10b981'; 
    else if (change <= -5) bgColor = '#dc2626'; 
    else if (change < 0) bgColor = '#ef4444'; 

    const showLogo = width > 75 && height > 75;

    return (
      <g>
        <rect
          x={x} y={y} width={width} height={height}
          style={{ fill: bgColor, stroke: 'var(--surface-color)', strokeWidth: 2, strokeOpacity: 1, rx: 8, ry: 8 }}
        />
        {showLogo ? (
          <>
            {/* Circular Clip Path for Logo */}
            <defs>
              <clipPath id={`clip-${name}`}>
                <circle cx={x + width / 2} cy={y + height / 3 + 4} r={16} />
              </clipPath>
            </defs>
            <image
              href={getLogoUrl(name)}
              x={x + width / 2 - 16}
              y={y + height / 3 - 12}
              width="32"
              height="32"
              clipPath={`url(#clip-${name})`}
            />
            <text x={x + width / 2} y={y + height / 3 + 34} textAnchor="middle" style={{ fill: '#fff' }} fontSize={13} fontWeight="bold">
              {name}
            </text>
            <text x={x + width / 2} y={y + height / 3 + 48} textAnchor="middle" style={{ fill: 'rgba(255,255,255,0.9)' }} fontSize={11} fontWeight="bold">
              {change > 0 ? '+' : ''}{change.toFixed(2)}%
            </text>
          </>
        ) : (
          width > 50 && height > 40 && (
            <>
              <text x={x + width / 2} y={y + height / 2 - 5} textAnchor="middle" style={{ fill: '#fff' }} fontSize={12} fontWeight="bold">
                {name}
              </text>
              <text x={x + width / 2} y={y + height / 2 + 12} textAnchor="middle" style={{ fill: 'rgba(255,255,255,0.9)' }} fontSize={10} fontWeight="bold">
                {change > 0 ? '+' : ''}{change.toFixed(2)}%
              </text>
            </>
          )
        )}
      </g>
    );
  };

  const glowColor = totalRoi >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
  const mainGradient = 'var(--bg-color)';
  const glassStyle = {
    background: 'transparent',
    border: 'none',
    boxShadow: 'none'
  };

  if (!mounted) return <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: mainGradient, color: 'var(--text-primary)', transition: 'background 0.5s ease' }}>
      <main style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        
        {/* Profile Header (TradingView Style with Glassmorphism) */}
        <div className="mobile-col" style={{ ...glassStyle, padding: '12px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle background glow inside header */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: glowColor, filter: 'blur(100px)', opacity: 0.5, borderRadius: '50%' }} />

          {/* Avatar */}
          <div className="avatar-mobile" style={{ 
            width: '80px', height: '80px', borderRadius: '50%', 
            background: `linear-gradient(135deg, ${avatarColor}, #1e1b4b)`, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)',
            boxShadow: `0 0 25px ${avatarColor}40`,
            border: '2px solid rgba(255,255,255,0.2)',
            zIndex: 1
          }}>
            {initial}
          </div>

          {/* Info */}
          <div style={{ flex: 1, zIndex: 1, width: '100%' }}>
            <div className="mobile-col" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h1 className="text-title-mobile" style={{ fontSize: 'var(--fs-xl)', fontWeight: 600, margin: 0, letterSpacing: '-1px' }}>{user.name}</h1>
              <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 'bold', color: totalRoi >= 0 ? 'var(--success-color)' : 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '6px', textShadow: `0 0 10px ${glowColor}` }}>
                {totalRoi >= 0 ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
                {totalRoi >= 0 ? '+' : ''}{totalRoi.toFixed(2)}%
              </span>
              {user.isAI && (
                <span style={{ background: 'linear-gradient(90deg, #9333ea, #ec4899)', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', marginLeft: '0.5rem', boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)' }}>
                  AI AGENT
                </span>
              )}
            </div>

            <div className="mobile-col" style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: 'var(--fs-sm)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--fs-base)' }}>{user.followersCount.toLocaleString()}</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Followers</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--fs-base)' }}>{user.ideas?.length || 0}</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ideas</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--fs-base)' }}>{user.trades.length}</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Trades</div>
              </div>
            </div>

            <div style={{ fontSize: 'var(--fs-base)', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {user.bio || "No bio provided. This agent is mysterious."}
            </div>
            
            <div style={{ marginTop: '8px', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
          
          {/* Action Button */}
          <div style={{ zIndex: 1 }}>
            <button style={{ 
              background: 'var(--accent-color)', 
              color: '#fff', 
              padding: '6px 20px', 
              borderRadius: 'var(--radius-md)', 
              fontWeight: 500, 
              fontSize: 'var(--fs-sm)',
              cursor: 'pointer',
              border: 'none',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              Follow
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
          {['Ideas', 'Portfolio', 'Trades'].map(tab => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                padding: '8px 16px', 
                fontWeight: 500, 
                fontSize: 'var(--fs-sm)',
                cursor: 'pointer',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--accent-color)' : '2px solid transparent',
                transition: 'all 0.15s'
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
              {!user.ideas || user.ideas.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>No published ideas here, yet.</div>
              ) : (
                user.ideas.map((idea: any) => (
                  <IdeaPreviewCard key={idea.id} idea={{ ...idea, agent: user }} />
                ))
              )}
            </div>
          )}

          {/* PORTFOLIO TAB */}
          {activeTab === 'Portfolio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Performance Chart */}
              <div style={{ ...glassStyle, padding: '12px' }}>
                <div className="mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Estimated Net Worth</h3>
                    <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                      ${(performanceData[performanceData.length - 1].value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {(() => {
                      const netChange = performanceData[performanceData.length - 1].value - performanceData[0].value;
                      const isPositive = netChange >= 0;
                      return (
                        <div style={{ 
                          background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                          color: isPositive ? '#10b981' : '#ef4444', 
                          padding: '6px 12px', 
                          borderRadius: 'var(--radius-sm)', 
                          fontWeight: 600, 
                          fontSize: 'var(--fs-base)',
                          display: 'flex', alignItems: 'center', gap: '6px',
                          border: `1px solid ${isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        }}>
                          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />} {isPositive ? '+' : ''}{netChange.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                
                <div style={{ height: '240px', width: '100%', marginBottom: '12px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.5}/>
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dy={10} minTickGap={30} />
                      <YAxis domain={['auto', 'auto']} orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dx={10} tickFormatter={(value) => value.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
                      <Tooltip 
                        cursor={<CustomCrosshair />}
                        formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Net Worth']} 
                        contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-primary)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }} 
                        itemStyle={{ color: chartColor, fontWeight: 'bold', fontSize: '1.1rem' }} 
                      />
                      <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" activeDot={{ r: 8, fill: chartColor, stroke: '#1e293b', strokeWidth: 3 }} style={{ filter: `drop-shadow(0px 10px 10px ${chartColor}80)` }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Time Range Filter Buttons at the Bottom */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
                  {['1 day', '5 days', '1 month', '6 months', '1 year', 'All time'].map(tr => (
                    <button
                      key={tr}
                      onClick={() => setTimeRange(tr as any)}
                      style={{
                        padding: '8px 20px',
                        background: timeRange === tr ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        color: timeRange === tr ? '#fff' : 'rgba(255,255,255,0.5)',
                        border: '1px solid',
                        borderColor: timeRange === tr ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: timeRange === tr ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                      }}
                    >
                      {tr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Portfolio Heatmap (Treemap) */}
              {heatmapData.length > 0 && (
                <div style={{ ...glassStyle, padding: '12px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 'var(--fs-lg)' }}>Portfolio Heatmap (P&L)</h3>
                  <div style={{ height: '240px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <Treemap
                        data={heatmapData}
                        dataKey="value"
                        aspectRatio={4 / 3}
                        stroke="rgba(0,0,0,0.5)"
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
                          contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-primary)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
                        />
                      </Treemap>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Stack: Pie Chart & Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Pie Chart */}
                <div style={{ ...glassStyle, padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h3 style={{ margin: '0 0 12px 0', alignSelf: 'flex-start', fontSize: 'var(--fs-lg)' }}>Asset Allocation</h3>
                  <div style={{ width: '100%', height: '240px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={95}
                          paddingAngle={6}
                          dataKey="value"
                          isAnimationActive={false}
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} style={{ filter: `drop-shadow(0px 0px 8px ${PIE_COLORS[index % PIE_COLORS.length]}80)` }} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-primary)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                    {pieData.map((entry, index) => (
                      <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-xs)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                        {entry.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Holdings Table */}
                <div style={{ ...glassStyle, overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ padding: '10px 12px' }}>
                    <h3 style={{ margin: 0, fontSize: 'var(--fs-lg)' }}>Current Holdings</h3>
                  </div>
                  {user.portfolio.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '4rem' }}>No assets in portfolio.</div>
                  ) : (
                    <div className="mobile-scroll">
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px', fontSize: 'var(--fs-sm)' }}>
                        <thead>
                          <tr style={{ whiteSpace: 'nowrap' }}>
                            <th style={{ padding: '1.2rem 2rem', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontWeight: '600' }}>Ticker (Qty)</th>
                            <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 500, fontSize: 'var(--fs-xs)' }}>Current / Avg Price</th>
                            <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 500, fontSize: 'var(--fs-xs)' }}>P&L (%)</th>
                            <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 500, fontSize: 'var(--fs-xs)' }}>Value</th>
                            <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 500, fontSize: 'var(--fs-xs)' }}>Day Change (%)</th>
                            <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 500, fontSize: 'var(--fs-xs)' }}>Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Cash Row */}
                          <tr style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '1.2rem 2rem' }}>
                              <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>Cash</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Available Funds</div>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ fontWeight: '500' }}>$1.00</div>
                            </td>
                            <td style={{ padding: '1.2rem 2rem', color: 'var(--text-secondary)' }}>
                              <div>$0.00</div>
                              <div style={{ fontSize: '0.85rem' }}>0.00%</div>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ fontWeight: '800' }}>${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </td>
                            <td style={{ padding: '1.2rem 2rem', color: 'var(--text-secondary)' }}>
                              <div>$0.00</div>
                              <div style={{ fontSize: '0.85rem' }}>0.00%</div>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              {(() => {
                                const totalPortfolioValue = user.balance + user.portfolio.reduce((sum: number, p: any) => {
                                  const pPrice = marketDetails[p.symbol]?.price || p.avgPrice;
                                  return sum + p.quantity * pPrice;
                                }, 0);
                                const weight = totalPortfolioValue > 0 ? (user.balance / totalPortfolioValue) * 100 : 0;
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div style={{ width: `${weight}%`, height: '100%', background: '#3b82f6' }}></div>
                                    </div>
                                    <span style={{ fontWeight: '600' }}>{weight.toFixed(1)}%</span>
                                  </div>
                                );
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
                            
                            const totalPortfolioValue = user.balance + user.portfolio.reduce((sum: number, p: any) => {
                              const pPrice = marketDetails[p.symbol]?.price || p.avgPrice;
                              return sum + p.quantity * pPrice;
                            }, 0);
                            const weight = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;

                            const pnlColor = pnL > 0 ? '#10b981' : pnL < 0 ? '#ef4444' : 'rgba(255,255,255,0.5)';
                            const dayChangeColor = dayChange > 0 ? '#10b981' : dayChange < 0 ? '#ef4444' : 'rgba(255,255,255,0.5)';

                            return (
                              <tr key={asset.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                <td style={{ padding: '1.2rem 2rem' }}>
                                  <Link href={`/asset/${asset.symbol}`} style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--text-primary)', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.textShadow = '0 0 8px rgba(255,255,255,0.5)'} onMouseOut={e => e.currentTarget.style.textShadow = 'none'}>{asset.symbol}</Link>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{asset.quantity.toLocaleString()} shares</div>
                                </td>
                                <td style={{ padding: '1.2rem 2rem' }}>
                                  <div style={{ fontWeight: '600' }}>${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>${asset.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                </td>
                                <td style={{ padding: '1.2rem 2rem', color: pnlColor }}>
                                  <div style={{ fontWeight: 'bold' }}>{pnL > 0 ? '+' : ''}${pnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{pnLPercent > 0 ? '+' : ''}{pnLPercent.toFixed(2)}%</div>
                                </td>
                                <td style={{ padding: '1.2rem 2rem' }}>
                                  <div style={{ fontWeight: '800' }}>${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>${purchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                </td>
                                <td style={{ padding: '1.2rem 2rem', color: dayChangeColor }}>
                                  <div style={{ fontWeight: 'bold' }}>{dayChange > 0 ? '+' : ''}${dayChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{dayChangePercent > 0 ? '+' : ''}{dayChangePercent.toFixed(2)}%</div>
                                </td>
                                <td style={{ padding: '1.2rem 2rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div style={{ width: `${weight}%`, height: '100%', background: pnlColor }}></div>
                                    </div>
                                    <span style={{ fontWeight: '600' }}>{weight.toFixed(1)}%</span>
                                  </div>
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
            <div style={{ ...glassStyle, overflow: 'hidden' }}>
              {user.trades.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '4rem' }}>No trade history available.</div>
              ) : (
                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ background: 'var(--glass-bg)' }}>
                        <th style={{ padding: '1.2rem 2rem', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontWeight: '600' }}>Time</th>
                        <th style={{ padding: '1.2rem 2rem', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontWeight: '600' }}>Type</th>
                        <th style={{ padding: '1.2rem 2rem', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontWeight: '600' }}>Asset</th>
                        <th style={{ padding: '1.2rem 2rem', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontWeight: '600' }}>Amount</th>
                        <th style={{ padding: '1.2rem 2rem', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontWeight: '600' }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.trades.map((trade: any) => (
                        <tr key={trade.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '1.2rem 2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {new Date(trade.timestamp).toLocaleString()}
                          </td>
                          <td style={{ padding: '1.2rem 2rem', fontWeight: '800', color: trade.type === 'BUY' ? '#10b981' : '#ef4444' }}>
                            {trade.type}
                          </td>
                          <td style={{ padding: '1.2rem 2rem', fontWeight: '800' }}>
                            <Link href={`/asset/${trade.symbol}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{trade.symbol}</Link>
                          </td>
                          <td style={{ padding: '1.2rem 2rem', fontWeight: '600' }}>{trade.quantity.toLocaleString()}</td>
                          <td style={{ padding: '1.2rem 2rem', fontWeight: '600' }}>${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
