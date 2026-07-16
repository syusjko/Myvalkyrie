"use client";

import { useEffect, useState } from 'react';
import { Activity, Clock, Globe, Briefcase, Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import MiniChart from '@/components/MiniChart';

function getMarketStatus() {
  const options = { timeZone: 'America/New_York', hour12: false, hour: 'numeric', minute: 'numeric', weekday: 'short' } as const;
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(new Date());
  
  let hour = 0, minute = 0, weekday = '';
  for (const part of parts) {
    if (part.type === 'hour') hour = parseInt(part.value, 10);
    if (part.type === 'minute') minute = parseInt(part.value, 10);
    if (part.type === 'weekday') weekday = part.value;
  }
  
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  if (isWeekend) return { status: 'Closed', color: 'var(--danger-color)', text: 'Market Closed (Weekend)' };

  const timeNum = hour * 100 + minute;
  
  if (timeNum >= 400 && timeNum < 930) return { status: 'Pre-Market', color: '#f59e0b', text: 'Pre-Market (EST)' };
  if (timeNum >= 930 && timeNum < 1600) return { status: 'Open', color: 'var(--success-color)', text: 'Market Open (EST)' };
  if (timeNum >= 1600 && timeNum < 2000) return { status: 'After-Hours', color: '#3b82f6', text: 'After-Hours (EST)' };
  return { status: 'Closed', color: 'var(--danger-color)', text: 'Market Closed (EST)' };
}

interface AssetDetail {
  price: number;
  change: number;
  changePercent: number;
}

export default function MarketSummary() {
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());
  const [details, setDetails] = useState<Record<string, AssetDetail>>({});
  const [loading, setLoading] = useState(true);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);
  const [sentiments, setSentiments] = useState<Record<string, number>>({});
  const [topTradedStocks, setTopTradedStocks] = useState<any[]>([]);
  
  const [featured, setFeatured] = useState(() => {
    const hour = new Date().getUTCHours();
    if (hour >= 0 && hour < 7) return { symbol: '^KS11', name: 'KOSPI', displaySymbol: 'KS11', color: '#0ea5e9', label: 'KOR' };
    if (hour >= 7 && hour < 13) return { symbol: '^GDAXI', name: 'DAX', displaySymbol: 'DAX', color: '#f59e0b', label: 'GER' };
    return { symbol: '^GSPC', name: 'S&P 500', displaySymbol: 'SPX', color: '#ef4444', label: '500' };
  });

  useEffect(() => {
    // Update market status every minute
    const interval = setInterval(() => setMarketStatus(getMarketStatus()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchMacro = async () => {
      try {
        const symbols = ['^GSPC', '^IXIC', '^VIX', '^TNX', 'N225', '000001.SS', '^FTSE', 'BTC', 'DX-Y.NYB', '^KS11', '^FCHI', '^GDAXI'];
        const res = await fetch(`/api/market/prices?symbols=${symbols.join(',')}`);
        const data = await res.json();
        if (data.details) {
          setDetails(data.details);
        }
      } catch (e) {
        console.error('Failed to fetch macro data', e);
      } finally {
        setLoading(false);
      }
    };
    const fetchSentiments = async () => {
      try {
        const syms = ['^GSPC', 'BTC', '^IXIC', '^KS11', '^GDAXI', '^VIX'];
        const res = await Promise.all(syms.map(s => fetch(`/api/market/sentiment?symbol=${s}`).then(r => r.json())));
        const newS: Record<string, number> = {};
        syms.forEach((s, i) => {
          if (res[i] && res[i].gaugeScore !== undefined) newS[s] = res[i].gaugeScore;
        });
        setSentiments(newS);
      } catch (e) {
        console.error('Failed to fetch sentiments', e);
      }
    };
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        if (data.topTradedStocks) setTopTradedStocks(data.topTradedStocks);
      } catch (e) {
        console.error('Failed to fetch leaderboard data', e);
      } finally {
        setLeaderboardLoaded(true);
      }
    };
    fetchMacro();
    fetchSentiments();
    fetchLeaderboard();
  }, []);

  const renderCard = (symbol: string, name: string, icon: React.ReactNode, isMacro = false, isRate = false) => {
    const data = details[symbol];
    if (!data) return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>{icon}<div>Loading...</div></div>
      </div>
    );

    const isUp = data.change >= 0;
    const color = isUp ? 'var(--success-color)' : 'var(--danger-color)';

    return (
      <Link href={isMacro ? '#' : `/asset/${symbol}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 40px auto', gap: '0.5rem', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0 }}>{icon}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '2px 4px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>
              {symbol.replace('^', '')}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', width: '40px' }}>
          <MiniChart symbol={symbol} color={color} />
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
            {data.price.toFixed(2)} {isRate ? '%' : ''} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{isRate ? '' : isMacro ? 'PTS' : 'USD'}</span>
          </div>
          <div style={{ color, fontSize: '0.8rem', fontWeight: 'bold' }}>
            {isUp ? '+' : ''}{data.changePercent.toFixed(2)}%
          </div>
        </div>
      </Link>
    );
  };

  return (
    <section style={{ maxWidth: '100%', padding: '3rem 2rem', background: 'var(--bg-color)', borderTop: '1px solid var(--glass-border)' }}>
      <div style={{ maxWidth: '1500px', margin: '0 auto' }}>
        
        {/* GLOBAL MACRO HEADER */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
          <Link 
            href="/consensus"
            style={{ 
              background: 'transparent', border: 'none', padding: '8px 16px', marginLeft: '-16px', borderRadius: '8px',
              fontSize: '1.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', 
              color: 'var(--text-primary)', cursor: 'pointer', transition: 'background 0.2s', textDecoration: 'none'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Market summary <ChevronRight size={28} color="var(--text-secondary)" />
          </Link>
          
          <div style={{ display: 'flex', gap: '1.5rem', background: 'var(--surface-color)', padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid var(--glass-border)', paddingRight: '1.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: marketStatus.color, boxShadow: `0 0 10px ${marketStatus.color}` }} />
              <span style={{ fontWeight: 'bold', color: marketStatus.color, fontSize: '0.9rem' }}>{marketStatus.text}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '8px' }}>VIX</span>
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{details['^VIX']?.price.toFixed(2) || '...'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '8px' }}>US10Y</span>
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{details['^TNX']?.price.toFixed(3) || '...'}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM WIDGETS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {(() => {
            return (
              <>
                {/* TOP ROW: Featured Chart (Left) + Major Indices (Right) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.1fr) minmax(0, 1.1fr)', gap: '1.5rem' }}>
                
                {/* Featured Chart */}
                <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                     <div style={{ background: featured.color, color: '#fff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{featured.label}</div>
                     <div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                         <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{featured.name}</span>
                         <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px' }}>{featured.displaySymbol}</span>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '4px' }}>
                         <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{details[featured.symbol]?.price.toFixed(2) || '...'} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>PTS</span></span>
                         <span style={{ color: (details[featured.symbol]?.change || 0) >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 'bold' }}>
                           {(details[featured.symbol]?.change || 0) >= 0 ? '+' : ''}{details[featured.symbol]?.changePercent.toFixed(2) || '...'}%
                         </span>
                       </div>
                     </div>
                   </div>
                   <div style={{ flex: 1, minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                     <div style={{ width: '100%', height: '100%', minHeight: '350px' }}>
                       <MiniChart symbol={featured.symbol} color={(details[featured.symbol]?.change || 0) >= 0 ? '#10b981' : '#ef4444'} showAxes={true} />
                     </div>
                   </div>
                </div>

                {/* Major Indices List */}
                <div className="hidden-scrollbar" style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem', overflowY: 'auto', overflowX: 'hidden', maxHeight: '460px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Global Markets</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {renderCard('^GSPC', 'S&P 500', <div style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>500</div>, true)}
                    {renderCard('^IXIC', 'Nasdaq 100', <div style={{ background: '#0ea5e9', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>100</div>, true)}
                    {renderCard('^KS11', 'KOSPI', <div style={{ background: '#0284c7', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>KOR</div>, true)}
                    {renderCard('N225', 'Japan 225', <div style={{ background: '#1e3a8a', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>225</div>, true)}
                    {renderCard('000001.SS', 'SSE Composite', <div style={{ background: '#312e81', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>SSE</div>, true)}
                    {renderCard('^GDAXI', 'DAX', <div style={{ background: '#f59e0b', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>GER</div>, true)}
                    {renderCard('^FCHI', 'CAC 40', <div style={{ background: '#10b981', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>FRA</div>, true)}
                    {renderCard('^FTSE', 'FTSE 100', <div style={{ background: '#475569', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>100</div>, true)}
                  </div>
                </div>
                
                {/* AI Most Traded Stocks */}
                <div className="hidden-scrollbar" style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem', overflowY: 'auto', overflowX: 'hidden', maxHeight: '460px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Today's AI Top Traded</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {!leaderboardLoaded ? <div style={{ color: 'var(--text-secondary)' }}>Loading...</div> : topTradedStocks.length > 0 ? topTradedStocks.slice(0, 8).map(stock => {
                      const data = details[stock.symbol];
                      const change = data?.change || 0;
                      const isUp = change >= 0;
                      const color = isUp ? 'var(--success-color)' : 'var(--danger-color)';
                      return (
                        <Link key={stock.symbol} href={`/asset/${stock.symbol}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '0.5rem', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', textDecoration: 'none' }}>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{stock.symbol}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vol: {(stock.value / 1000).toFixed(1)}k</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{data ? data.price.toFixed(2) : '...'}</div>
                            <div style={{ color, fontSize: '0.8rem', fontWeight: 'bold' }}>{isUp ? '+' : ''}{data ? data.changePercent.toFixed(2) : '...'}%</div>
                          </div>
                        </Link>
                      );
                    }) : <div style={{ color: 'var(--text-secondary)' }}>No AI trades yet.</div>}
                  </div>
                </div>
                
              </div>
              </>
            );
          })()}

          {/* BOTTOM ROW: 3 Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
             {/* Crypto */}
             <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem' }}>
               <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{background: '#3b82f6', width: '16px', height: '16px', borderRadius: '50%'}}></div> Crypto market cap <span style={{fontSize: '0.7rem', background: 'var(--bg-color)', padding: '2px 4px', borderRadius: '4px'}}>TOTAL</span></h4>
               <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{details['BTC']?.price.toLocaleString() || '...'} <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>USD</span></div>
               <div style={{ color: (details['BTC']?.change || 0) >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontSize: '0.9rem', fontWeight: 'bold' }}>{(details['BTC']?.change || 0) >= 0 ? '+' : ''}{details['BTC']?.changePercent.toFixed(2) || '...'}%</div>
               <div style={{ marginTop: '1rem', height: '80px', width: '100%' }}><MiniChart symbol="BTC" color={(details['BTC']?.change || 0) >= 0 ? '#10b981' : '#ef4444'} /></div>
             </div>
             {/* USD Index */}
             <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem' }}>
               <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{background: '#10b981', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '10px'}}>$</div> US Dollar index <span style={{fontSize: '0.7rem', background: 'var(--bg-color)', padding: '2px 4px', borderRadius: '4px'}}>DXY</span></h4>
               <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{details['DX-Y.NYB']?.price.toFixed(3) || '...'} <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>USD</span></div>
               <div style={{ color: (details['DX-Y.NYB']?.change || 0) >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontSize: '0.9rem', fontWeight: 'bold' }}>{(details['DX-Y.NYB']?.change || 0) >= 0 ? '+' : ''}{details['DX-Y.NYB']?.changePercent.toFixed(2) || '...'}%</div>
               <div style={{ marginTop: '1rem', height: '80px', width: '100%' }}><MiniChart symbol="DX-Y.NYB" color={(details['DX-Y.NYB']?.change || 0) >= 0 ? '#10b981' : '#ef4444'} /></div>
             </div>
             {/* 10Y Yield */}
             <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem' }}>
               <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{background: '#ef4444', width: '16px', height: '16px', borderRadius: '50%'}}></div> US 10Y yield <span style={{fontSize: '0.7rem', background: 'var(--bg-color)', padding: '2px 4px', borderRadius: '4px'}}>US10Y</span></h4>
               <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{details['^TNX']?.price.toFixed(3) || '...'} <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>%</span></div>
               <div style={{ color: (details['^TNX']?.change || 0) >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontSize: '0.9rem', fontWeight: 'bold' }}>{(details['^TNX']?.change || 0) >= 0 ? '+' : ''}{details['^TNX']?.changePercent.toFixed(2) || '...'}%</div>
               <div style={{ marginTop: '1rem', height: '80px', width: '100%' }}><MiniChart symbol="^TNX" color={(details['^TNX']?.change || 0) >= 0 ? '#10b981' : '#ef4444'} /></div>
             </div>
          </div>
          
          {/* AI CONSENSUS WIDGETS */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Activity size={20} color="var(--accent-color)" /> 
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Live AI Consensus</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
              
              {/* Render Featured First, then others */}
              {[featured, 
                { symbol: 'BTC', name: 'Bitcoin', optionA: 'ACCUMULATE', optionB: 'DISTRIBUTE', colorA: '#10b981', colorB: '#ef4444' }, 
                { symbol: '^IXIC', name: 'NASDAQ', optionA: 'BULLISH', optionB: 'BEARISH', colorA: '#10b981', colorB: '#ef4444' },
                { symbol: '^VIX', name: 'Volatility', optionA: 'RISING (FEAR)', optionB: 'FALLING (CALM)', colorA: '#ef4444', colorB: '#10b981' }
              ].map((item, idx) => {
                
                const parsedItem: any = idx === 0 ? {
                  ...item,
                  optionA: 'BULLISH',
                  optionB: 'BEARISH',
                  colorA: '#10b981',
                  colorB: '#ef4444'
                } : item;

                const ratio = sentiments[parsedItem.symbol] ?? 50;
                
                return (
                  <Link href={`/asset/${encodeURIComponent(parsedItem.symbol)}`} key={parsedItem.symbol} style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem', textDecoration: 'none', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', gap: '1rem' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{parsedItem.name}</div>
                      {idx === 0 && <div style={{ fontSize: '0.7rem', background: 'var(--accent-color)', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>LIVE MARKET</div>}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        <span style={{ color: parsedItem.colorA }}>{ratio}% {parsedItem.optionA}</span>
                        <span style={{ color: parsedItem.colorB }}>{100 - ratio}% {parsedItem.optionB}</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-color)', borderRadius: '4px', display: 'flex', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${ratio}%`, background: parsedItem.colorA, transition: 'width 1s ease-in-out' }} />
                        <div style={{ height: '100%', width: `${100 - ratio}%`, background: parsedItem.colorB, transition: 'width 1s ease-in-out' }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
