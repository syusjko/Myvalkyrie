"use client";

import { useState, useEffect, useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import Link from 'next/link';
import { useMarketData } from '@/lib/MarketDataContext';

// Custom content for Treemap cells
const CustomContent = (props: any) => {
  const { root, depth, x, y, width, height, index, payload, colors, rank, name, size, change, fill } = props;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fill || '#334155',
          stroke: '#1e293b',
          strokeWidth: 2,
          transition: 'all 0.3s ease',
        }}
        className="treemap-cell"
      />
      {
        width > 50 && height > 40 && (
          <text
            x={x + width / 2}
            y={y + height / 2 - 5}
            textAnchor="middle"
            fill="#fff"
            fontSize={width > 100 ? 18 : 12}
            fontWeight="bold"
          >
            {name}
          </text>
        )
      }
      {
        width > 50 && height > 40 && typeof change === 'number' && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 15}
            textAnchor="middle"
            fill="#fff"
            fontSize={width > 100 ? 14 : 10}
            fontWeight="bold"
            opacity={0.9}
          >
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </text>
        )
      }
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '8px', color: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', zIndex: 100 }}>
        <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '1.1rem' }}>{data.name || 'Unknown'}</p>
        <p style={{ margin: '0 0 2px 0', fontSize: '0.9rem' }}>Traded Volume: <span style={{ fontWeight: 'bold' }}>${(data.size || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
        {typeof data.change === 'number' && (
          <p style={{ margin: 0, fontSize: '0.9rem', color: data.change >= 0 ? '#10b981' : '#ef4444' }}>
            Change: <span style={{ fontWeight: 'bold' }}>{data.change > 0 ? '+' : ''}{data.change.toFixed(2)}%</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

interface TreemapSummaryProps {
  type?: 'volume' | 'holdings';
  hideDetailsButton?: boolean;
}

export default function TreemapSummary({ type = 'volume', hideDetailsButton = false }: TreemapSummaryProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { details } = useMarketData();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/market/treemap?type=${type}`);
        const json = await res.json();
        if (json.treemap) {
          setData(json.treemap);
        }
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    fetchData();
    // Refresh every 15s for real-time dynamic feel
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [type]);

  const title = type === 'volume' ? '🔥 AI Trading Volume Heatmap (Today)' : '💼 AI Portfolio Holdings Heatmap (Overall)';
  const subtitle = type === 'volume' ? 'Most actively traded assets by agents' : 'Current net value held across all agents';

  const displayData = useMemo(() => {
    return data.map(item => {
      const liveData = details[item.name];
      if (!liveData) return item;
      const change = liveData.changePercent;
      let fill = '#334155';
      if (change >= 3) fill = '#10b981';
      else if (change >= 1.5) fill = '#059669';
      else if (change > 0) fill = '#047857';
      else if (change <= -3) fill = '#ef4444';
      else if (change <= -1.5) fill = '#dc2626';
      else if (change < 0) fill = '#b91c1c';
      return { ...item, change, fill };
    });
  }, [data, details]);

  return (
    <div style={{ width: '100%', height: '450px', background: 'var(--surface-color)', borderRadius: '0', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column', marginBottom: '1.5rem', transition: 'box-shadow 0.2s' }} onMouseOver={e => e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'} onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'}>
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
             {title}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{subtitle}</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div> Positive
            </span>
            <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
               <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></div> Negative
            </span>
          </div>
          {!hideDetailsButton && (
            <Link href={`/market/heatmap-details?type=${type}`} style={{ fontSize: '0.85rem', padding: '6px 14px', background: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '8px', textDecoration: 'none', fontWeight: '500', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }} onMouseOver={e => {e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'var(--accent-color)';}} onMouseOut={e => {e.currentTarget.style.background = 'var(--surface-color)'; e.currentTarget.style.borderColor = 'var(--glass-border)';}}>
              View Details <span style={{fontSize: '1rem'}}>→</span>
            </Link>
          )}
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            Loading market data...
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={displayData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="#fff"
              content={<CustomContent />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            {type === 'volume' ? 'No AI trades today.' : 'No AI holdings available.'}
          </div>
        )}
      </div>
      <style jsx global>{`
        .treemap-cell:hover {
          filter: brightness(1.2);
          cursor: crosshair;
        }
      `}</style>
    </div>
  );
}
