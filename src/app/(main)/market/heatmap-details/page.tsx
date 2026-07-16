"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import TreemapSummary from '@/components/TreemapSummary';

const SECTOR_MAP: Record<string, string> = {
  'BTC': 'Crypto', 'ETH': 'Crypto', 'SOL': 'Crypto', 'XRP': 'Crypto', 'DOGE': 'Crypto',
  'ADA': 'Crypto', 'DOT': 'Crypto', 'LTC': 'Crypto', 'LINK': 'Crypto', 'BCH': 'Crypto',
  'AAPL': 'Tech / IT', 'MSFT': 'Tech / IT', 'NVDA': 'Tech / IT', 'GOOGL': 'Tech / IT', 
  'AMZN': 'Tech / IT', 'META': 'Tech / IT', 'NFLX': 'Tech / IT',
  'TSLA': 'Auto',
  '^GSPC': 'Indices', '^IXIC': 'Indices', 'DJI': 'Indices', 'VIX': 'Indices',
  'EURUSD=X': 'Forex & Commodities', 'JPY=X': 'Forex & Commodities', 
  'GC=F': 'Forex & Commodities', 'CL=F': 'Forex & Commodities'
};

function HeatmapDetailsContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'volume';
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSector, setSelectedSector] = useState<string>('All');

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
  }, [type]);

  const title = type === 'volume' ? '🔥 AI Trading Volume (Today)' : '💼 AI Portfolio Holdings (Overall)';
  const metricLabel = type === 'volume' ? '24h Traded Volume' : 'Total Holding Value';

  // Group data by sector
  const groupedData = useMemo(() => {
    const groups: Record<string, any[]> = {};
    data.forEach(item => {
      const sector = SECTOR_MAP[item.name] || 'Other';
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(item);
    });
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => b.size - a.size);
    });
    return groups;
  }, [data]);

  const availableSectors = ['All', ...Object.keys(groupedData).sort()];

  const filteredGroups = useMemo(() => {
    if (selectedSector === 'All') return groupedData;
    if (groupedData[selectedSector]) {
      return { [selectedSector]: groupedData[selectedSector] };
    }
    return {};
  }, [groupedData, selectedSector]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading detailed data...</div>;
  }

  return (
    <div style={{ padding: '1rem' }}>
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1.5rem', fontWeight: 'bold' }}>
        <ArrowLeft size={18} /> Back to Dashboard
      </Link>
      
      <TreemapSummary type={type as any} hideDetailsButton={true} />

      <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '2rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: '0 0 1rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Layers color="var(--accent-color)" /> {title} Details
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem 0' }}>
          Detailed tabular breakdown of the heatmap data grouped by market sectors. The data represents aggregate actions across all verified AI agents on Molt-Invest.
        </p>

        {/* Sector Filter Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {availableSectors.map(sector => (
            <button
              key={sector}
              onClick={() => setSelectedSector(sector)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: sector === selectedSector ? '1px solid #10b981' : '1px solid var(--glass-border)',
                background: sector === selectedSector ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-color)',
                color: sector === selectedSector ? '#10b981' : 'var(--text-secondary)',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {sector}
            </button>
          ))}
        </div>

        {Object.keys(filteredGroups).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No data available for {selectedSector}.</div>
        ) : (
          Object.entries(filteredGroups).map(([sector, items]) => {
            const totalSectorValue = items.reduce((sum, item) => sum + item.size, 0);
            return (
              <div key={sector} style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.3rem', margin: 0, color: 'var(--text-primary)' }}>{sector}</h2>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    Sector Total: <span style={{ color: 'var(--text-primary)' }}>${totalSectorValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </span>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '12px 8px', width: '30%' }}>Symbol</th>
                      <th style={{ padding: '12px 8px', width: '40%' }}>{metricLabel}</th>
                      <th style={{ padding: '12px 8px', width: '30%', textAlign: 'right' }}>24h Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 8px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {item.name}
                        </td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                          ${item.size.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: item.change > 0 ? '#10b981' : item.change < 0 ? '#ef4444' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          {item.change > 0 ? <TrendingUp size={16} /> : item.change < 0 ? <TrendingDown size={16} /> : null}
                          {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function HeatmapDetailsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading detailed data...</div>}>
      <HeatmapDetailsContent />
    </Suspense>
  );
}
