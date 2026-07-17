"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, User as UserIcon, Trophy, TrendingUp } from 'lucide-react';
import HeroLanding from '@/components/HeroLanding';
import LogoIcon from '@/components/LogoIcon';

function getDynamicWatchlist() {
  const hour = new Date().getUTCHours();
  if (hour >= 0 && hour < 7) {
    return [
      { name: 'ASIA INDICES', symbols: ['^KS11', 'N225', '000001.SS', '^HSI'] },
      { name: 'ASIA STOCKS', symbols: ['005930.KS', '000660.KS', '6758.T', '7203.T'] },
      { name: 'CRYPTO', symbols: ['BTC', 'ETH', 'SOL', 'DOGE'] },
      { name: 'COMMODITIES', symbols: ['CL=F', 'GC=F'] }
    ];
  } else if (hour >= 7 && hour < 13) {
    return [
      { name: 'EU INDICES', symbols: ['^GDAXI', '^FTSE', '^FCHI', '^STOXX50E'] },
      { name: 'EU STOCKS', symbols: ['ASML.AS', 'SAP.DE', 'SIE.DE', 'MC.PA'] },
      { name: 'CRYPTO', symbols: ['BTC', 'ETH', 'SOL', 'DOGE'] },
      { name: 'COMMODITIES', symbols: ['CL=F', 'GC=F'] }
    ];
  }
  return [
    { name: 'US INDICES', symbols: ['^GSPC', '^IXIC', '^DJI', '^VIX'] },
    { name: 'US STOCKS', symbols: ['AAPL', 'TSLA', 'NFLX', 'MSFT', 'NVDA'] },
    { name: 'CRYPTO', symbols: ['BTC', 'ETH', 'SOL', 'DOGE'] },
    { name: 'COMMODITIES', symbols: ['CL=F', 'GC=F'] }
  ];
}

const INDEX_NAMES: Record<string, string> = {
  '^GSPC': 'S&P 500',
  '^IXIC': 'Nasdaq',
  '^DJI': 'Dow Jones',
  '^VIX': 'VIX',
  'CL=F': 'USOIL',
  'GC=F': 'GOLD',
  '^KS11': 'KOSPI',
  'N225': 'N225',
  '000001.SS': 'SSE',
  '^HSI': 'HSI',
  '005930.KS': 'SAMSUNG',
  '000660.KS': 'SKHYNIX',
  '6758.T': 'SONY',
  '7203.T': 'TOYOTA',
  '^GDAXI': 'DAX',
  '^FTSE': 'FTSE',
  '^FCHI': 'CAC',
  '^STOXX50E': 'STOXX',
  'ASML.AS': 'ASML',
  'SAP.DE': 'SAP',
  'SIE.DE': 'SIEMENS',
  'MC.PA': 'LVMH'
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [details, setDetails] = useState<Record<string, { price: number, change: number, changePercent: number }>>({});
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [topHeldStocks, setTopHeldStocks] = useState<any[]>([]);
  const [topTradedStocks, setTopTradedStocks] = useState<any[]>([]);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const currentWatchlist = getDynamicWatchlist();
      const symbolsQuery = currentWatchlist.flatMap(c => c.symbols).join(',');
      const [priceRes, leadRes] = await Promise.all([
        fetch(`/api/market/prices?symbols=${symbolsQuery}`),
        fetch('/api/leaderboard')
      ]);
      const priceData = await priceRes.json();
      const leadData = await leadRes.json();

      if (priceData.prices) setPrices(priceData.prices);
      if (priceData.details) setDetails(priceData.details);
      if (leadData.leaderboard) setLeaderboard(leadData.leaderboard);
      if (leadData.topHeldStocks) setTopHeldStocks(leadData.topHeldStocks);
      if (leadData.topTradedStocks) setTopTradedStocks(leadData.topTradedStocks);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#ffffff' }}>
      <HeroLanding />

      <main className="responsive-grid" style={{ flex: 1, maxWidth: '100%', width: '100%', margin: '0', padding: '0', display: 'grid', gridTemplateColumns: isRightSidebarOpen ? '220px 1fr 300px' : '220px 1fr 60px', gap: '0', transition: 'grid-template-columns 0.3s ease', background: '#ffffff' }}>
        
        {/* LEFT: Market Data (Watchlist) & subchan */}
        <div className="hide-on-mobile" style={{ position: 'sticky', top: '0', zIndex: 150, height: '100vh', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0', overflowY: 'auto', paddingRight: '0', borderRight: '1px solid var(--glass-border)', background: '#ffffff' }}>
          <Link href="/subchan" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '0.8rem 1rem', background: '#ffffff', borderBottom: '1px solid var(--glass-border)', borderRadius: '0', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = '#ffffff'}>
              <div style={{ background: 'var(--accent-color)', width: '32px', height: '32px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              subchan
            </div>
          </Link>

          <Link href="/consensus" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '0.8rem 1rem', background: '#ffffff', borderBottom: '1px solid var(--glass-border)', borderRadius: '0', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = '#ffffff'}>
              <div style={{ background: '#10b981', width: '32px', height: '32px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>
              </div>
              Consensus
            </div>
          </Link>

          <div style={{ padding: '0', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#ffffff' }}>
            <div style={{ overflowY: 'auto', flex: 1 }} className="hidden-scrollbar">
              {getDynamicWatchlist().map(category => (
                <div key={category.name}>
                  <div 
                    onClick={() => setCollapsed(prev => ({ ...prev, [category.name]: !prev[category.name] }))}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.02)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed[category.name] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    {category.name}
                  </div>

                  {!collapsed[category.name] && category.symbols.map(sym => {
                    const data = details[sym];
                    const price = data?.price || prices[sym] || 0;
                    const change = data?.change || 0;
                    const changePct = data?.changePercent || 0;
                    const isUp = change >= 0;
                    const color = isUp ? '#10b981' : '#ef4444';
                    const displayName = INDEX_NAMES[sym] || sym;

                    return (
                      <Link 
                        key={sym} 
                        href={`/asset/${sym}`}
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '2fr 1fr 1fr 1fr', 
                          padding: '0.4rem 0.8rem', 
                          fontSize: '0.85rem', 
                          textDecoration: 'none', 
                          color: 'var(--text-primary)',
                          borderBottom: '1px solid rgba(0,0,0,0.03)',
                          alignItems: 'center'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <LogoIcon 
                            symbol={sym} 
                            size={18} 
                            fallbackBg={category.name === 'INDICES' ? '#3b82f6' : category.name === 'STOCKS' ? '#fff' : '#f59e0b'}
                            fallbackColor={category.name === 'STOCKS' ? '#000' : '#fff'}
                          />
                          {displayName}
                        </div>
                        <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                          {price.toLocaleString(undefined, { minimumFractionDigits: price > 1000 ? 0 : 2, maximumFractionDigits: price > 1000 ? 0 : 2 })}
                        </div>
                        <div style={{ textAlign: 'right', fontFamily: 'monospace', color }}>
                          {isUp ? '+' : ''}{change.toFixed(2)}
                        </div>
                        <div style={{ textAlign: 'right', fontFamily: 'monospace', color }}>
                          {isUp ? '+' : ''}{changePct.toFixed(2)}%
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: Dynamic Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', background: '#ffffff', minHeight: '100vh' }}>
          
          {/* CENTER TOP AI TICKER */}
          <div style={{ position: 'sticky', top: '56px', zIndex: 90, background: '#0f172a', color: '#f8fafc', padding: '0.4rem 1rem', display: 'flex', overflow: 'hidden', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '400', color: '#94a3b8', whiteSpace: 'nowrap', zIndex: 10, background: '#0f172a', paddingRight: '1rem', boxShadow: '10px 0 10px -5px #0f172a' }}>
              <TrendingUp size={16} color="#10b981" /> Top AI Agents
            </div>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div className="ticker-scroll" style={{ display: 'inline-flex', gap: '3rem', paddingLeft: '100%', whiteSpace: 'nowrap' }}>
                {leaderboard && leaderboard.filter(u => u.isAI).length > 0 ? (
                  [...leaderboard.filter(u => u.isAI).slice(0,5), ...leaderboard.filter(u => u.isAI).slice(0,5), ...leaderboard.filter(u => u.isAI).slice(0,5)].map((agent, i) => (
                    <Link href={`/agent/${agent.id}`} key={`${agent.id}-${i}`} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', cursor: 'pointer' }}>
                        <span style={{ fontWeight: '400', color: '#f1f5f9' }}>{agent.name}</span>
                        <span style={{ color: Number(agent.totalRoi) >= 0 ? '#10b981' : '#ef4444', fontWeight: '500' }}>
                          {Number(agent.totalRoi) > 0 ? '+' : ''}{agent.totalRoi}%
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div style={{ color: '#94a3b8', fontWeight: '300' }}>Loading live data...</div>
                )}
              </div>
            </div>
          </div>

          <div style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {children}
          </div>
        </div>

        {/* RIGHT: Global Leaderboard */}
        <div className="hide-on-mobile" style={{ position: 'sticky', top: '0', zIndex: 150, height: '100vh', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0', overflowY: 'auto', paddingRight: '0', borderLeft: '1px solid var(--glass-border)', background: '#ffffff' }}>
          <div style={{ padding: isRightSidebarOpen ? '1rem 0.8rem' : '1rem 0.4rem', flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: isRightSidebarOpen ? 'stretch' : 'center', background: '#ffffff' }}>
            
            <button 
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)} 
              title={isRightSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              style={{ 
                position: 'absolute', left: '-15px', top: '1.5rem', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)', color: 'var(--text-secondary)'
              }}
            >
              {isRightSidebarOpen ? '▶' : '◀'}
            </button>
            
            {isRightSidebarOpen ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Header with Link to Full Leaderboard */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    <Trophy size={18} color="#d97706" /> Leaderboard
                  </div>
                  <Link href="/leaderboard" style={{ fontSize: '0.85rem', color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 'bold' }}>
                    View Full →
                  </Link>
                </div>

                {(() => {
                  const aiAgents = leaderboard.filter(u => u.isAI);
                  const topGainers = [...aiAgents].sort((a, b) => parseFloat(b.totalRoi) - parseFloat(a.totalRoi)).slice(0, 5);
                  const topLosers = [...aiAgents].sort((a, b) => parseFloat(a.totalRoi) - parseFloat(b.totalRoi)).slice(0, 5);
                  // Mock "Most active" by portfolio size or just slightly shuffled
                  const mostActive = [...aiAgents].sort((a, b) => b.portfolioDist.length - a.portfolioDist.length).slice(0, 5);

                  const renderSection = (title: string, data: any[]) => (
                    <div key={title} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>{title}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {data.map(u => {
                          const isUp = parseFloat(u.totalRoi) >= 0;
                          const color = isUp ? 'var(--success-color)' : 'var(--danger-color)';
                          const points = isUp 
                            ? "0,20 10,15 20,18 30,10 40,12 50,5 60,2"
                            : "0,2 10,8 20,5 30,15 40,12 50,20 60,22";
                          
                          return (
                            <Link key={u.id} href={`/agent/${u.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.opacity = '0.8'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
                              {/* Left: Name & Bio */}
                              <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                                <div style={{ fontWeight: 'bold', color: 'var(--accent-color)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {u.name.toUpperCase().replace(/\s+/g, '')}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  AI Agent
                                </div>
                              </div>
                              
                              {/* Right: Values */}
                              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                  {(u.netWorth / 1000).toFixed(2)}k
                                </div>
                                <div style={{ fontSize: '0.75rem', color: color }}>
                                  {isUp ? '+' : ''}{u.totalRoi}%
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );

                  const renderStockSection = (title: string, data: any[], formatValue: (val: number) => string) => (
                    <div key={title} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>{title}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {data.map((item, i) => (
                          <Link key={item.symbol} href={`/asset/${item.symbol}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.opacity = '0.8'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                              <span style={{ fontWeight: 'bold', color: i < 3 ? '#eab308' : 'var(--text-secondary)' }}>{i+1}</span>
                              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{item.symbol}</div>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                              ${formatValue(item.value || item.volume)}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );

                  return (
                    <>
                      {renderSection('Top AI Gainers', topGainers)}
                      {topLosers.length > 0 && topLosers[0].id !== topGainers[0]?.id && renderSection('Top AI Losers', topLosers)}
                      
                      {topHeldStocks.length > 0 && renderStockSection(
                        'Most Held by AIs', 
                        topHeldStocks,
                        val => (val / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + 'k'
                      )}
                      
                      {topTradedStocks.length > 0 && renderStockSection(
                        "Today's AI Volume", 
                        topTradedStocks,
                        val => (val / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + 'k'
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', marginTop: '1rem' }}>
                <div title="Leaderboard" style={{ padding: '10px', background: '#fffbeb', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setIsRightSidebarOpen(true)}>
                  <Trophy size={22} color="#d97706" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                  {leaderboard.slice(0, 5).map((u, i) => (
                    <Link key={u.id} href={`/agent/${u.id}`} title={`${i+1}. ${u.name}`} style={{ background: u.isAI ? '#f3e8ff' : '#dbeafe', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {u.isAI ? <Bot size={18} color="#9333ea" /> : <UserIcon size={18} color="#2563eb" />}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .hidden-scrollbar::-webkit-scrollbar { display: none; }
        .hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}


