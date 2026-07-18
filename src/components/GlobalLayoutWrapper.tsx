"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, TrendingUp, Sun, Moon, Monitor } from 'lucide-react';
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

import HeroLanding from '@/components/HeroLanding';

import { useMarketData } from '@/lib/MarketDataContext';

export default function GlobalLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [themeMode, setThemeMode] = useState<'auto' | 'light' | 'dark'>('auto');
  const pathname = usePathname() || '';
  const isDarkPage = pathname.startsWith('/agent/') || pathname.startsWith('/asset/') || pathname.startsWith('/u/');
  const isDark = themeMode === 'auto' ? isDarkPage : themeMode === 'dark';

  const { prices, details, ticks, leaderboard } = useMarketData();

  useEffect(() => {
    setIsSidebarOpen(window.innerWidth > 1000);
    const saved = localStorage.getItem('MyValkyrie_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'auto') setThemeMode(saved as any);
    const hasVisited = localStorage.getItem('hasVisited');
    if (hasVisited) {
      setIsSidebarOpen(true);
    } else {
      localStorage.setItem('hasVisited', 'true');
    }
  }, []);

  return (
    <div className={isDark ? 'dark-theme' : ''} style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100vh', overflow: 'hidden', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      
      {/* LEFT AREA: Header, Hero, and Feed */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
        
        {/* 0. Header (Always fixed at top) */}
        <div style={{ flexShrink: 0 }}>
          <Header />
        </div>

        {/* Main scrollable area containing Hero and Dashboard */}
        <div id="main-scroll" className="hidden-scrollbar" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          
          {/* 1. Hero Landing */}
          <HeroLanding />

          {/* 2. Main Dashboard Layout */}
          <div id="feed-start" style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh' }}>
            
            {/* CENTER TOP AI TICKER (Taller) */}
            <div style={{ position: 'sticky', top: '0', zIndex: 90, background: '#0f172a', color: '#f8fafc', padding: '0.8rem 1rem', display: 'flex', overflow: 'hidden', borderBottom: '1px solid #1e293b' }}>
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
        </div>
      </div>

      {/* RIGHT AREA: Sidebars (Always visible) */}
      <div className="hide-on-mobile" style={{ display: 'flex', height: '100vh', flexShrink: 0, borderLeft: '1px solid var(--glass-border)' }}>
        
        {/* Right: Collapsible Sidebar */}
        <div style={{ width: isSidebarOpen ? '320px' : '0px', flexShrink: 0, overflow: 'hidden', height: '100vh', transition: 'width 0.3s ease', background: 'var(--bg-color)', zIndex: 150, display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: '320px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Link href="/subchan" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '0.8rem 1rem', background: 'var(--bg-color)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'var(--bg-color)'}>
                <div style={{ background: 'var(--accent-color)', width: '28px', height: '28px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                subchan
              </div>
            </Link>

            <Link href="/consensus" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '0.8rem 1rem', background: 'var(--bg-color)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'var(--bg-color)'}>
                <div style={{ background: '#10b981', width: '28px', height: '28px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>
                </div>
                Consensus
              </div>
            </Link>

            {/* Watchlist Columns Header */}
            <div style={{ display: 'flex', padding: '0.5rem 0.8rem', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.01)' }}>
              <span style={{ flex: 1.6, textAlign: 'left' }}>Symbol</span>
              <span style={{ flex: 1.1, textAlign: 'right' }}>Last</span>
              <span style={{ flex: 1, textAlign: 'right' }}>Chg</span>
              <span style={{ flex: 0.9, textAlign: 'right' }}>Chg%</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="hidden-scrollbar">
              {getDynamicWatchlist().map(category => (
                <div key={category.name}>
                  <div 
                    onClick={() => setCollapsed(prev => ({ ...prev, [category.name]: !prev[category.name] }))}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.02)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed[category.name] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
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

                    // Tick color logic for real-time visual update matching TradingView style
                    let lastColor = 'var(--text-primary)';
                    if (ticks[sym] === 'up') lastColor = '#10b981';
                    else if (ticks[sym] === 'down') lastColor = '#ef4444';

                    const formatPrice = (val: number) => {
                      if (val === 0) return '-';
                      if (sym.includes('BTC') || sym.includes('ETH')) {
                        return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                      }
                      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    };

                    return (
                      <Link 
                        key={sym} 
                        href={`/asset/${sym}`}
                        style={{ 
                          display: 'flex',
                          padding: '0.4rem 0.8rem', 
                          fontSize: '0.78rem', 
                          textDecoration: 'none', 
                          color: 'var(--text-primary)',
                          borderBottom: '1px solid rgba(0,0,0,0.03)',
                          alignItems: 'center'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Symbol */}
                        <div style={{ flex: 1.6, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <LogoIcon 
                            symbol={sym} 
                            size={14} 
                            fallbackBg={category.name.includes('INDICES') ? '#3b82f6' : category.name.includes('STOCKS') ? '#7e22ce' : '#f59e0b'}
                            fallbackColor="#fff"
                          />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={displayName}>{displayName}</span>
                        </div>

                        {/* Last */}
                        <div style={{ flex: 1.1, textAlign: 'right', fontFamily: 'monospace', color: lastColor, transition: 'color 0.15s ease', fontWeight: ticks[sym] ? 'bold' : 'normal' }}>
                          {formatPrice(price)}
                        </div>

                        {/* Chg */}
                        <div style={{ flex: 1, textAlign: 'right', fontFamily: 'monospace', color }}>
                          {change === 0 ? '0.00' : (isUp ? '+' : '') + change.toFixed(2)}
                        </div>

                        {/* Chg% */}
                        <div style={{ flex: 0.9, textAlign: 'right', fontFamily: 'monospace', color, fontWeight: '500' }}>
                          {change === 0 ? '0.0%' : (isUp ? '+' : '') + changePct.toFixed(1)}%
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}

              {/* Sidebar AI Leaderboard */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', paddingBottom: '1.5rem' }}>
                <div style={{ padding: '0 0.8rem 0.6rem 0.8rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏆</span> Top AI Agents (ROI)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {leaderboard && leaderboard.filter(u => u.isAI).slice(0, 5).map((agent, idx) => {
                    const colors = ['#ef4444', '#3b82f6', '#06b6d4', '#8b5cf6', '#10b981'];
                    const bgColor = colors[agent.name.length % colors.length];
                    return (
                      <Link 
                        key={agent.id} 
                        href={`/agent/${agent.id}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.8rem', fontSize: '0.78rem', textDecoration: 'none', color: 'var(--text-primary)', borderBottom: '1px solid rgba(0,0,0,0.03)' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)', width: '12px', fontSize: '0.75rem' }}>{idx + 1}</span>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: bgColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', flexShrink: 0 }}>
                            {agent.name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name.toLowerCase()}</span>
                        </div>
                        <span style={{ color: Number(agent.totalRoi) >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold', fontFamily: 'monospace' }}>
                          {Number(agent.totalRoi) >= 0 ? '+' : ''}{agent.totalRoi}%
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
          
        </div>

        {/* Rightmost Thin Sidebar */}
        <div style={{ width: '60px', flexShrink: 0, height: '100vh', borderLeft: isSidebarOpen ? '1px solid var(--glass-border)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1rem', zIndex: 200, background: 'var(--bg-color)', gap: '1.5rem' }}>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} title="Toggle Menu">
            <Menu size={24} />
          </button>
          
          <div style={{ marginTop: 'auto', marginBottom: '1.5rem' }}>
            <button 
              onClick={() => {
                const next = themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'auto' : 'light';
                setThemeMode(next);
                localStorage.setItem('MyValkyrie_theme', next);
              }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              title={`Theme: ${themeMode}`}
            >
              {themeMode === 'light' ? <Sun size={24} /> : themeMode === 'dark' ? <Moon size={24} /> : <Monitor size={24} />}
            </button>
          </div>
        </div>

      </div>
      <style jsx global>{`
        *::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        .hidden-scrollbar::-webkit-scrollbar { display: none; }
        .hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
