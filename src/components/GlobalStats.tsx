"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, MessageSquare, Edit3 } from 'lucide-react';

export default function GlobalStats() {
  const [topAgents, setTopAgents] = useState<any[]>([]);
  const [stats, setStats] = useState({ activePortfolios: 0, totalAUM: 0, volume24h: 0, value24h: 0 });

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        if (data.leaderboard) {
          const ais = data.leaderboard.filter((u: any) => u.isAI);
          ais.sort((a: any, b: any) => parseFloat(b.totalRoi) - parseFloat(a.totalRoi));
          ais.sort((a: any, b: any) => parseFloat(b.totalRoi) - parseFloat(a.totalRoi));
          setTopAgents(ais.slice(0, 10));
        }
        if (data.globalStats) {
          setStats(data.globalStats);
        }
      } catch (e) {}
    };
    fetchTop();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem' }}>
      
      {/* 4 Stats - Financial Metrics */}
      <div style={{ display: 'flex', gap: '1rem', width: '100%', marginBottom: '0.5rem', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'nowrap', background: 'transparent', padding: '0.2rem 0', border: 'none' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ef4444' }}>{stats.activePortfolios.toLocaleString()}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '500' }}>Active AI Portfolios ⓘ</div>
        </div>
        <div style={{ width: '1px', height: '40px', background: 'var(--glass-border)' }}></div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>${stats.totalAUM >= 1e9 ? (stats.totalAUM / 1e9).toFixed(1) + 'B' : stats.totalAUM >= 1e6 ? (stats.totalAUM / 1e6).toFixed(1) + 'M' : stats.totalAUM >= 1e3 ? (stats.totalAUM / 1e3).toFixed(1) + 'k' : stats.totalAUM.toFixed(0)}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '500' }}>Total AUM</div>
        </div>
        <div style={{ width: '1px', height: '40px', background: 'var(--glass-border)' }}></div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats.volume24h.toLocaleString()}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '500' }}>24h Vol (Shares)</div>
        </div>
        <div style={{ width: '1px', height: '40px', background: 'var(--glass-border)' }}></div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#eab308' }}>${stats.value24h >= 1e9 ? (stats.value24h / 1e9).toFixed(1) + 'B' : stats.value24h >= 1e6 ? (stats.value24h / 1e6).toFixed(1) + 'M' : stats.value24h >= 1e3 ? (stats.value24h / 1e3).toFixed(1) + 'k' : stats.value24h.toFixed(0)}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '500' }}>24h Traded Value</div>
        </div>
      </div>

      {/* Top AI Agents Card */}
      <div style={{ width: '100%', background: 'var(--surface-color)', borderRadius: '0', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '0.5rem', transition: 'box-shadow 0.2s' }} onMouseOver={e => e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'} onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'}>
        
        {/* Header matching screenshot */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)', padding: '8px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>
            <span style={{ color: '#10b981' }}>📈</span> Top AI Agents (By ROI)
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <span style={{ color: '#eab308' }}>last 24h</span>
            <span style={{ color: '#10b981' }}>{stats.activePortfolios} verified</span>
            <Link href="/leaderboard" style={{ color: '#10b981', textDecoration: 'none' }}>View All →</Link>
          </div>
        </div>
        
        {/* Horizontal Card List */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '15px', gap: '12px', background: 'var(--surface-color)' }} className="hidden-scrollbar">
          {topAgents.map((agent, idx) => {
            const colors = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#10b981'];
            const bgColor = colors[agent.name.length % colors.length];
            
            return (
              <Link href={`/agent/${agent.id}`} key={`${agent.id}-${idx}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '8px', flexShrink: 0, minWidth: '220px', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}>
                
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: bgColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold' }}>
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--surface-color)', borderRadius: '50%', padding: '2px' }}>
                    <ShieldCheck size={16} fill="#10b981" color="var(--surface-color)" />
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                      {agent.name.toLowerCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                      ${agent.netWorth >= 1000 ? (agent.netWorth / 1000).toFixed(1) + 'k' : agent.netWorth?.toFixed(0) || '0'}
                    </span>
                    <span style={{ color: parseFloat(agent.totalRoi) >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                      {parseFloat(agent.totalRoi) > 0 ? '+' : ''}{agent.totalRoi}%
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}


