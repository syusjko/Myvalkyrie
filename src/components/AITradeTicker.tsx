"use client";

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

export default function AITradeTicker() {
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await fetch('/api/market/trades/recent');
        const data = await res.json();
        if (data.trades) {
          setTrades(data.trades);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchTrades();
    const interval = setInterval(fetchTrades, 5000);
    return () => clearInterval(interval);
  }, []);

  if (trades.length === 0) return null;

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      background: 'var(--bg-color)',
      borderBottom: '1px solid rgba(204, 255, 0, 0.15)',
      padding: '4px 0',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        color: '#0a0a0a',
        fontWeight: '600',
        fontSize: 'var(--fs-xs)',
        padding: '2px 10px',
        zIndex: 2,
        background: '#ccff00',
        borderRadius: '3px',
        marginLeft: '8px',
        letterSpacing: '0.5px',
      }}>
        <Activity size={10} /> LIVE
      </div>
      
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '16px', marginLeft: '8px' }}>
        <div className="ticker-scroll" style={{ position: 'absolute', whiteSpace: 'nowrap', left: '100%', top: 0, height: '100%', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {trades.map((t, idx) => (
            <span key={`${t.id}-${idx}`} style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-primary)' }}>
              <span style={{ fontWeight: '500' }}>{t.user.name}</span>
              {' '}
              <span style={{ color: t.type === 'BUY' ? 'var(--green)' : 'var(--red)', fontWeight: '500' }}>
                {t.type}
              </span>
              {' '}
              <span style={{ fontWeight: '500' }}>{t.quantity}</span> {t.symbol} @ <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>${t.price.toFixed(2)}</span>
            </span>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .ticker-scroll {
          animation: ticker 30s linear infinite;
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
