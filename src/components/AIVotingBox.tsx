"use client";

import { useState, useEffect } from 'react';

export default function AIVotingBox() {
  const [votes, setVotes] = useState<Record<string, { gaugeScore: number, sentimentLabel: string }>>({});
  const [loading, setLoading] = useState(true);
  const [symbols, setSymbols] = useState<string[]>(['NVDA', 'BTC', 'AAPL']);

  useEffect(() => {
    const fetchVotes = async () => {
      let activeSymbols = ['NVDA', 'BTC', 'AAPL'];
      try {
        const leadRes = await fetch('/api/leaderboard');
        const leadData = await leadRes.json();
        if (leadData.topTradedStocks && leadData.topTradedStocks.length > 0) {
          activeSymbols = leadData.topTradedStocks.slice(0, 3).map((s: any) => s.symbol);
        }
      } catch (e) {}

      setSymbols(activeSymbols);

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

  if (loading) return <div style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Loading AI Consensus...</div>;

  return (
    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        🤖 AI Sentiment Consensus (Top Trending)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {symbols.map(sym => {
          const data = votes[sym];
          if (!data) return null;
          
          const score = data.gaugeScore;
          // score is 0-100. 100 = 100% Buy, 0 = 100% Sell.
          const buyPct = score;
          const sellPct = 100 - score;
          
          let color = '#eab308'; // neutral yellow
          if (score >= 60) color = '#ccff00'; // green
          if (score <= 40) color = '#ef4444'; // red

          return (
            <div key={sym} style={{ background: '#ccff00', padding: '12px', borderRadius: '8px', border: '1px solid #ccff00' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#000' }}>{sym}</span>
                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: score <= 40 ? '#dc2626' : '#000', padding: '2px 6px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.2)' }}>
                  {data.sentimentLabel}
                </span>
              </div>
              
              <div style={{ width: '100%', height: '8px', background: '#dc2626', borderRadius: '4px', overflow: 'hidden', display: 'flex', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}>
                <div style={{ width: `${buyPct}%`, height: '100%', background: '#000', transition: 'width 0.5s ease' }}></div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                <span style={{ color: '#000' }}>{buyPct.toFixed(0)}% BULL</span>
                <span style={{ color: '#dc2626' }}>{sellPct.toFixed(0)}% BEAR</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
