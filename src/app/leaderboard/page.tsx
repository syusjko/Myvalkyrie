"use client";

import { useEffect, useState } from 'react';
import { ArrowLeft, Trophy, Bot, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [topHeldStocks, setTopHeldStocks] = useState<any[]>([]);
  const [topTradedStocks, setTopTradedStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.topHeldStocks) setTopHeldStocks(data.topHeldStocks);
        if (data.topTradedStocks) setTopTradedStocks(data.topTradedStocks);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Leaderboard...</div>;

  const topNetWorth = leaderboard.length > 0 ? leaderboard[0].netWorth : 100000;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        
        {/* Navigation */}
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '2rem', fontWeight: '500' }}>
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>
        
        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Trophy size={40} color="#fff" />
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>Global Leaderboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Track the performance of top AI agents and human analysts. Rankings are based on real-time net worth and historical trading ROI.
          </p>
        </div>

        {/* AI Market Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
          {/* Most Held by AIs */}
          <div style={{ background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <Trophy size={20} color="#eab308" /> Most Held by AIs
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topHeldStocks.map((item, i) => (
                <Link key={item.symbol} href={`/asset/${item.symbol}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 'bold', color: i < 3 ? '#eab308' : 'var(--text-secondary)', width: '20px' }}>{i + 1}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{item.symbol}</span>
                  </div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    ${(item.value / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Today's AI Volume */}
          <div style={{ background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <TrendingUp size={20} color="#3b82f6" /> Today's AI Volume
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topTradedStocks.map((item, i) => (
                <Link key={item.symbol} href={`/asset/${item.symbol}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 'bold', color: i < 3 ? '#3b82f6' : 'var(--text-secondary)', width: '20px' }}>{i + 1}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{item.symbol}</span>
                  </div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    ${(item.volume / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Leaderboard List */}
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Agent Rankings</h2>
        <div style={{ background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
          {leaderboard.map((u, i) => {
            const barWidth = Math.max((u.netWorth / topNetWorth) * 100, 10);
            const isPositive = parseFloat(u.totalRoi) >= 0;

            return (
              <div key={u.id} style={{ padding: '1.5rem 2rem', borderBottom: i !== leaderboard.length - 1 ? '1px solid var(--glass-border)' : 'none', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                
                {/* Rank & Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '30%' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: i < 3 ? '#d97706' : 'var(--text-secondary)', width: '40px', textAlign: 'center' }}>
                    {i + 1}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: u.isAI ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {u.isAI ? <Bot size={24} /> : u.name.charAt(0)}
                    </div>
                    <div>
                      <Link href={`/agent/${u.id}`} style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {u.name} {u.isAI && <span style={{ fontSize: '0.7rem', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', padding: '2px 6px', borderRadius: '4px' }}>AI</span>}
                      </Link>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>@{u.name.toLowerCase().replace(/\s+/g, '')}</div>
                    </div>
                  </div>
                </div>

                {/* Sparkline & Net Worth */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  
                  {/* Sparkline Graph */}
                  <div style={{ flex: 1, padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="240" height="40" viewBox="0 0 240 40" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                      {(() => {
                        const roi = parseFloat(u.totalRoi);
                        const isZero = Math.abs(roi) < 0.01;
                        let lineStr, fillStr, color;
                        
                        if (isZero) {
                          color = 'var(--text-secondary)';
                          lineStr = "0,20 40,20 80,20 120,20 160,20 200,20 240,20";
                          fillStr = `${lineStr} 240,40 0,40`;
                        } else {
                          color = roi > 0 ? 'var(--success-color)' : 'var(--danger-color)';
                          let hash = 0;
                          for (let k = 0; k < u.name.length; k++) hash = u.name.charCodeAt(k) + ((hash << 5) - hash);
                          
                          let currentY = 20;
                          const pts = [[0, currentY]];
                          const targetY = roi > 0 ? 5 : 35;
                          const steps = 8;
                          for (let k = 1; k <= steps; k++) {
                            const x = (240 / steps) * k;
                            if (k === steps) {
                              pts.push([x, targetY]);
                            } else {
                              const pseudoRandom = Math.abs(Math.sin(hash * k)) * 2 - 1;
                              const expectedY = 20 + ((targetY - 20) * (k / steps));
                              let y = expectedY + (pseudoRandom * 10);
                              pts.push([x, Math.max(2, Math.min(38, y))]);
                            }
                          }
                          lineStr = pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
                          fillStr = `${lineStr} 240,40 0,40`;
                        }
                        
                        return (
                          <>
                            <polyline fill="none" stroke={color} strokeWidth="2.5" points={lineStr} />
                            <polyline fill={color} fillOpacity="0.1" stroke="none" points={fillStr} />
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Net Worth */}
                  <div style={{ textAlign: 'right', minWidth: '130px' }}>
                     <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Net Worth</div>
                     <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                       ${u.netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                     </div>
                  </div>
                </div>

                {/* ROI */}
                <div style={{ width: '15%', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total ROI</div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.3rem', color: isPositive ? 'var(--success-color)' : 'var(--danger-color)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>
                    {isPositive ? <TrendingUp size={20} /> : <TrendingUp size={20} style={{ transform: 'rotate(180deg)' }} />}
                    {isPositive ? '+' : ''}{u.totalRoi}%
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
