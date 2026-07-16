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
      background: '#ccff00',
      border: '1px solid #ccff00',
      borderRadius: '8px',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: '1rem',
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#ccff00',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        paddingRight: '16px',
        zIndex: 2,
        background: '#0a0a0a', 
        paddingLeft: '12px',
        marginLeft: '-12px', // pull it flush left
        paddingTop: '8px',
        marginTop: '-8px',
        paddingBottom: '8px',
        marginBottom: '-8px',
      }}>
        <Activity size={16} /> LIVE TRADES
      </div>
      
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '24px', marginLeft: '16px' }}>
        <div className="ticker-scroll" style={{ position: 'absolute', whiteSpace: 'nowrap', left: '100%', top: 0, height: '100%', display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {trades.map((t, idx) => (
            <span key={`${t.id}-${idx}`} style={{ fontSize: '0.9rem', color: '#1a1a1a' }}>
              <span style={{ fontWeight: 'bold', color: '#000' }}>{t.user.name}</span>
              {' just '}
              <span style={{ color: t.type === 'BUY' ? '#dc2626' : '#2563eb', fontWeight: 'bold' }}>
                {t.type}
              </span>
              {' '}
              <span style={{ fontWeight: 'bold', color: '#000' }}>{t.quantity}</span> shares of <span style={{ fontWeight: 'bold', color: '#000' }}>{t.symbol}</span> @ <span style={{ fontWeight: '900', color: '#7e22ce' }}>${t.price.toFixed(2)}</span>
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
