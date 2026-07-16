"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Flame, Activity, Bot } from 'lucide-react';
import LogoIcon from '@/components/LogoIcon';

export default function ConsensusPage() {
  const [filter, setFilter] = useState('Hot');
  const [search, setSearch] = useState('');
  const [votes, setVotes] = useState<Record<string, { gaugeScore: number, sentimentLabel: string }>>({});
  const [symbols, setSymbols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const leadRes = await fetch('/api/leaderboard');
        const leadData = await leadRes.json();
        
        let activeStocks = [];
        if (leadData.topTradedStocks && leadData.topTradedStocks.length > 0) {
          activeStocks = leadData.topTradedStocks.slice(0, 15); // get top 15
        } else {
          // fallback
          activeStocks = [
            { symbol: 'NVDA', value: 1000 },
            { symbol: 'BTC', value: 900 },
            { symbol: 'TSLA', value: 800 },
            { symbol: 'AAPL', value: 700 },
            { symbol: 'META', value: 600 },
            { symbol: 'MSFT', value: 500 },
          ];
        }
        setSymbols(activeStocks);
        return activeStocks;
      } catch (e) {
        const fallback = [
          { symbol: 'NVDA', value: 1000 }, { symbol: 'BTC', value: 900 }, { symbol: 'TSLA', value: 800 }
        ];
        setSymbols(fallback);
        return fallback;
      }
    };

    const fetchVotes = async () => {
      const activeStocks = await fetchLeaderboard();
      const activeSymbols = activeStocks.map((s: any) => s.symbol);

      const newVotes: any = {};
      for (const sym of activeSymbols) {
        try {
          const res = await fetch(`/api/market/sentiment?symbol=${sym}`);
          const data = await res.json();
          newVotes[sym] = {
            gaugeScore: data.gaugeScore || 50,
            sentimentLabel: data.sentimentLabel || 'NEUTRAL'
          };
        } catch (e) {}
      }
      setVotes(newVotes);
      setLoading(false);
    };

    fetchVotes();
    const interval = setInterval(fetchVotes, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const filtered = symbols.filter(c => c.symbol.toLowerCase().includes(search.toLowerCase()));

  // Sort by gauge score distance from 50 (most polarized) or just keep leaderboard sort (which is volume-based, so "Hot")
  const sorted = [...filtered].sort((a, b) => {
    if (filter === 'Hot') {
      return b.value - a.value; // Sort by traded volume/value
    } else {
      // Sort by extreme sentiment (most Bullish first, just as an example for 'Trending')
      const scoreA = votes[a.symbol]?.gaugeScore || 50;
      const scoreB = votes[b.symbol]?.gaugeScore || 50;
      return scoreB - scoreA;
    }
  });

  return (
    <div style={{ width: '100%', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'inline-flex', padding: '6px', background: '#10b981', borderRadius: '12px', color: '#fff' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>
          </span>
          Consensus
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem' }}>
          Live AI sentiment tracking across the most actively traded assets.
        </p>
        
        <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          <div><strong style={{ color: '#10b981' }}>{symbols.length}</strong> active assets</div>
          <div><strong style={{ color: '#ef4444' }}>500ms</strong> refresh rate</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
            <button onClick={() => setFilter('Hot')} style={{ background: filter === 'Hot' ? 'var(--accent-color)' : 'transparent', color: filter === 'Hot' ? '#fff' : 'var(--text-secondary)', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={16} /> Hot
            </button>
            <button onClick={() => setFilter('Bullish')} style={{ background: filter === 'Bullish' ? 'var(--accent-color)' : 'transparent', color: filter === 'Bullish' ? '#fff' : 'var(--text-secondary)', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={16} /> Most Bullish
            </button>
          </div>

          <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
            <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search ticker..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '10px 10px 10px 36px', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Calculating AI Consensus...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
          {sorted.map(asset => {
            const sym = asset.symbol;
            const data = votes[sym];
            if (!data) return null;
            
            const score = data.gaugeScore;
            const buyPct = score;
            const sellPct = 100 - score;
            
            let color = '#eab308'; // neutral yellow
            if (score >= 60) color = '#10b981'; // green
            if (score <= 40) color = '#ef4444'; // red

            return (
              <Link href={`/asset/${sym}`} key={sym} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-color)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}>
                  
                  {/* Rank / Hot badge */}
                  {filter === 'Hot' && sorted.indexOf(asset) < 3 && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 12px', borderBottomLeftRadius: '12px' }}>
                      HOT #{sorted.indexOf(asset) + 1}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                    <LogoIcon symbol={sym} size={48} fallbackBg="#3b82f6" fallbackColor="#fff" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.3rem' }}>{sym}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Network Sentiment</div>
                    </div>
                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color, padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: `1px solid ${color}40` }}>
                      {data.sentimentLabel}
                    </span>
                  </div>
                  
                  <div style={{ width: '100%', height: '12px', background: '#ef4444', borderRadius: '6px', overflow: 'hidden', display: 'flex', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)', marginBottom: '8px' }}>
                    <div style={{ width: `${buyPct}%`, height: '100%', background: '#10b981', transition: 'width 0.5s ease' }}></div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    <span style={{ color: '#10b981' }}>{buyPct.toFixed(0)}% BULL</span>
                    <span style={{ color: '#ef4444' }}>{sellPct.toFixed(0)}% BEAR</span>
                  </div>

                  <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <Bot size={14} /> AI Agents analyzing this asset
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
