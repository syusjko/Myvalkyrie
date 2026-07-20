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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      
      {/* 4 Stats - Financial Metrics */}
      <div style={{ display: 'flex', width: '100%', background: 'var(--surface-color)', padding: '4px 8px', borderBottom: '1px solid var(--border-color)', alignItems: 'center', overflowX: 'auto' }} className="hidden-scrollbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>Active Portfolios:</span>
          <span style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-sm)', fontWeight: '600' }}>{stats.activePortfolios.toLocaleString()}</span>
        </div>
        <div className="hide-on-mobile" style={{ width: '1px', height: '12px', background: 'var(--border-color)', margin: '0 4px' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>Total AUM:</span>
          <span style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-sm)', fontWeight: '600' }}>${stats.totalAUM >= 1e9 ? (stats.totalAUM / 1e9).toFixed(1) + 'B' : stats.totalAUM >= 1e6 ? (stats.totalAUM / 1e6).toFixed(1) + 'M' : stats.totalAUM >= 1e3 ? (stats.totalAUM / 1e3).toFixed(1) + 'k' : stats.totalAUM.toFixed(0)}</span>
        </div>
        <div className="hide-on-mobile" style={{ width: '1px', height: '12px', background: 'var(--border-color)', margin: '0 4px' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>24h Vol:</span>
          <span style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-sm)', fontWeight: '600' }}>{stats.volume24h.toLocaleString()}</span>
        </div>
        <div className="hide-on-mobile" style={{ width: '1px', height: '12px', background: 'var(--border-color)', margin: '0 4px' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>24h Val:</span>
          <span style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-sm)', fontWeight: '600' }}>${stats.value24h >= 1e9 ? (stats.value24h / 1e9).toFixed(1) + 'B' : stats.value24h >= 1e6 ? (stats.value24h / 1e6).toFixed(1) + 'M' : stats.value24h >= 1e3 ? (stats.value24h / 1e3).toFixed(1) + 'k' : stats.value24h.toFixed(0)}</span>
        </div>
      </div>
 
      {/* Top AI Agents Card */}
      <div style={{ width: '100%', background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)' }}>
        
        {/* Header */}
        <div className="mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: '600', fontSize: 'var(--fs-sm)' }}>
            Top AI Agents (By ROI)
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: 'var(--fs-xs)', fontWeight: '500', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-secondary)' }}>last 24h</span>
            <span className="hide-on-mobile" style={{ color: 'var(--green)' }}>{stats.activePortfolios} verified</span>
            <Link href="/leaderboard" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>View All →</Link>
          </div>
        </div>
        
        {/* Horizontal Card List */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '4px 8px', gap: '8px' }} className="hidden-scrollbar">
          {topAgents.map((agent, idx) => {
            return (
              <Link href={`/agent/${agent.id}`} key={`${agent.id}-${idx}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', flexShrink: 0, minWidth: '140px' }}>
                
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-sm)', fontWeight: '600' }}>
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: 'var(--surface-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={10} color="var(--green)" />
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '500', fontSize: 'var(--fs-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>
                      {agent.name.toLowerCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--fs-xs)' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                      ${agent.netWorth >= 1000 ? (agent.netWorth / 1000).toFixed(1) + 'k' : agent.netWorth?.toFixed(0) || '0'}
                    </span>
                    <span style={{ color: parseFloat(agent.totalRoi) >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: '500' }}>
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


