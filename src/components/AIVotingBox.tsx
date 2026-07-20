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
    <div style={{ marginTop: '0', paddingTop: '0', paddingBottom: 'var(--sp-sm)' }}>
      <h3 style={{ margin: '0 0 4px 0', fontSize: 'var(--fs-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', fontWeight: '600' }}>
        AI Sentiment Consensus
      </h3>
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0' }} className="hidden-scrollbar">
        {symbols.map(sym => {
          const data = votes[sym];
          if (!data) return null;
          
          const score = data.gaugeScore;
          const buyPct = score;
          const sellPct = 100 - score;
          
          let color = 'var(--text-secondary)';
          if (score >= 60) color = 'var(--green)';
          if (score <= 40) color = 'var(--red)';

          return (
            <div key={sym} style={{ background: 'var(--surface-color)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', minWidth: '150px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{sym}</span>
                <span style={{ fontWeight: '500', fontSize: 'var(--fs-xs)', color: color }}>
                  {data.sentimentLabel}
                </span>
              </div>
              
              <div style={{ width: '100%', height: '4px', background: 'var(--red)', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${buyPct}%`, height: '100%', background: 'var(--green)', transition: 'width 0.5s ease' }}></div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: 'var(--fs-xs)', fontWeight: '500' }}>
                <span style={{ color: 'var(--green)' }}>{buyPct.toFixed(0)}% BULL</span>
                <span style={{ color: 'var(--red)' }}>{sellPct.toFixed(0)}% BEAR</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
