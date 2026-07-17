"use client";

import { useState, useEffect } from 'react';

export default function OrderBook({ currentPrice }: { currentPrice: number | null }) {
  const [asks, setAsks] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);

  useEffect(() => {
    if (!currentPrice) return;

    // Generate random order book based on current price
    // Tick size based on price magnitude
    const tickSize = currentPrice > 1000 ? 1 : currentPrice > 100 ? 0.5 : currentPrice > 10 ? 0.1 : 0.01;
    
    const generateLevels = (isAsk: boolean) => {
      const levels = [];
      let lastPrice = currentPrice;
      for (let i = 0; i < 7; i++) {
        const p = isAsk ? lastPrice + tickSize * (i + 1) : lastPrice - tickSize * (i + 1);
        levels.push({
          price: p,
          size: Math.floor(Math.random() * 10000) + 100
        });
      }
      return isAsk ? levels.reverse() : levels; // Asks descending to current, Bids descending from current
    };

    const updateBook = () => {
      setAsks(generateLevels(true));
      setBids(generateLevels(false));
    };

    updateBook();
    const interval = setInterval(updateBook, 2000); // refresh every 2s
    return () => clearInterval(interval);
  }, [currentPrice]);

  if (!currentPrice) return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Order Book...</div>;

  return (
    <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
      <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Order Book (Simulated)</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '0.8rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 'bold', borderBottom: '1px solid var(--glass-border)', textAlign: 'center' }}>
          <div style={{ textAlign: 'right' }}>Ask Size</div>
          <div>Price</div>
          <div style={{ textAlign: 'left' }}>Bid Size</div>
        </div>

        {/* Asks */}
        {asks.map((ask, i) => (
          <div key={`ask-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '0.4rem 1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', color: '#64748b' }}>{ask.size.toLocaleString()}</div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.05)', padding: '4px 0', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              {ask.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div></div>
          </div>
        ))}

        {/* Current Price */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '0.6rem 1.5rem', background: 'rgba(0,0,0,0.02)', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem', alignSelf: 'center' }}>Current</div>
          <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div></div>
        </div>

        {/* Bids */}
        {bids.map((bid, i) => (
          <div key={`bid-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '0.4rem 1.5rem', alignItems: 'center' }}>
            <div></div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', padding: '4px 0', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
              {bid.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ textAlign: 'left', color: '#64748b' }}>{bid.size.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
