"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
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

export default function GlobalLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [details, setDetails] = useState<Record<string, { price: number, change: number, changePercent: number }>>({});
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
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
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: '#ffffff' }}>
      
      {/* 1. Leftmost Thin Sidebar */}
      <div style={{ width: '60px', flexShrink: 0, height: '100vh', position: 'sticky', top: 0, borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1rem', zIndex: 200, background: '#ffffff', gap: '1.5rem' }}>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} title="Toggle Menu">
          <Menu size={24} />
        </button>
      </div>

      {/* 2. Collapsible Left Sidebar */}
      <div style={{ width: isSidebarOpen ? '220px' : '0px', flexShrink: 0, overflow: 'hidden', height: '100vh', position: 'sticky', top: 0, borderRight: isSidebarOpen ? '1px solid var(--glass-border)' : 'none', transition: 'width 0.3s ease', background: '#ffffff', zIndex: 150, display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Link href="/subchan" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '0.8rem 1rem', background: '#ffffff', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = '#ffffff'}>
              <div style={{ background: 'var(--accent-color)', width: '32px', height: '32px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              subchan
            </div>
          </Link>

          <Link href="/consensus" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '0.8rem 1rem', background: '#ffffff', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = '#ffffff'}>
              <div style={{ background: '#10b981', width: '32px', height: '32px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>
              </div>
              Consensus
            </div>
          </Link>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="hidden-scrollbar">
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

      {/* 3. Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header />
        
        {/* CENTER TOP AI TICKER */}
        <div style={{ position: 'sticky', top: '0', zIndex: 90, background: '#0f172a', color: '#f8fafc', padding: '0.4rem 1rem', display: 'flex', overflow: 'hidden', borderBottom: '1px solid #1e293b' }}>
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

        {children}
      </div>
      <style jsx global>{`
        .hidden-scrollbar::-webkit-scrollbar { display: none; }
        .hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
