"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { createChart, ColorType, AreaSeries, CrosshairMode } from 'lightweight-charts';
import LogoIcon from '@/components/LogoIcon';

const MAJOR_INDICES_CONFIG = [
  { symbol: '^GSPC', name: 'S&P 500', ticker: 'SPX', badge: '500', bg: '#ef4444' },
  { symbol: '^NDX', name: 'Nasdaq 100', ticker: 'NDX', badge: '100', bg: '#3b82f6' },
  { symbol: 'N225', name: 'Japan 225', ticker: 'N225', badge: '225', bg: '#1e293b' },
  { symbol: '000001.SS', name: 'SSE Composite', ticker: '000001', badge: 'SSE', bg: '#1d4ed8' },
  { symbol: '^FTSE', name: 'FTSE 100', ticker: 'UKX', badge: '100', bg: '#0369a1' },
  { symbol: '^GDAXI', name: 'DAX', ticker: 'DAX', badge: 'DAX', bg: '#2563eb' },
  { symbol: '^FCHI', name: 'CAC 40', ticker: 'PX1', badge: '40', bg: '#0d9488' }
];

export default function MarketSummaryPage() {
  const [activeSymbol, setActiveSymbol] = useState('^GSPC');
  const [activeConfig, setActiveConfig] = useState(MAJOR_INDICES_CONFIG[0]);
  const [pricesData, setPricesData] = useState<Record<string, { price: number, changePercent: number, change: number }>>({});
  const [chartData, setChartData] = useState<{ time: number, value: number }[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  // Update active config when symbol changes
  useEffect(() => {
    const config = MAJOR_INDICES_CONFIG.find(c => c.symbol === activeSymbol) || MAJOR_INDICES_CONFIG[0];
    setActiveConfig(config);
  }, [activeSymbol]);

  // Fetch prices for all indices + bottom items
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const symbols = [...MAJOR_INDICES_CONFIG.map(c => c.symbol), 'BTC', 'DX-Y.NYB', '^TNX'].join(',');
        const res = await fetch(`/api/market/prices?symbols=${symbols}`);
        const data = await res.json();
        if (data.details) {
          setPricesData(data.details);
        }
      } catch (err) {
        console.error("Failed to fetch prices", err);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch chart history for active symbol
  useEffect(() => {
    const fetchChart = async () => {
      setLoadingChart(true);
      try {
        const res = await fetch(`/api/market/history?symbol=${activeSymbol}&range=1d`);
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const uniqueData = json.data.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.time === v.time) === i);
          uniqueData.sort((a: any, b: any) => a.time - b.time);
          setChartData(uniqueData);
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoadingChart(false);
      }
    };
    fetchChart();
  }, [activeSymbol]);

  // Initialize lightweight chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#f1f5f9' },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: '#e2e8f0', width: 1, style: 3 },
        horzLine: { color: '#e2e8f0', width: 1, style: 3 }
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 }
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      height: 240,
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#10b981',
      topColor: 'rgba(16, 185, 129, 0.12)',
      bottomColor: 'rgba(16, 185, 129, 0.00)',
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newRect = entries[0].contentRect;
      chart.applyOptions({ width: newRect.width, height: newRect.height });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Update chart data and line colors dynamically
  useEffect(() => {
    if (chartData.length > 0 && seriesRef.current && chartRef.current) {
      const isPositive = chartData[chartData.length - 1].value >= chartData[0].value;
      const color = isPositive ? '#10b981' : '#ef4444';
      
      seriesRef.current.applyOptions({
        lineColor: color,
        topColor: isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
        bottomColor: isPositive ? 'rgba(16, 185, 129, 0.00)' : 'rgba(239, 68, 68, 0.00)',
      });

      seriesRef.current.setData(chartData);
      chartRef.current.timeScale().fitContent();
    }
  }, [chartData]);

  const activePriceData = pricesData[activeSymbol];
  const priceVal = activePriceData?.price || 0;
  const pctChange = activePriceData?.changePercent || 0;
  const isUp = pctChange >= 0;

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh', padding: '12px' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
          Market summary
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-primary)' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
        </h2>
      </div>

      {/* Main Two Column Grid */}
      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '12px', marginBottom: '12px' }}>
        
        {/* Left Column: S&P 500 / Active Chart Card */}
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', background: 'var(--surface-color)', position: 'relative' }}>
          
          {/* Active Index Header Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: activeConfig.bg,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: activeConfig.badge.length > 2 ? '0.65rem' : '0.8rem',
                fontWeight: 'bold'
              }}>
                {activeConfig.badge}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>{activeConfig.name}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b' }}>{activeConfig.ticker}</span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>
                    {priceVal ? priceVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}
                    <span style={{ fontSize: '0.7rem', fontWeight: '500', color: '#64748b', marginLeft: '2px' }}>POINT</span>
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: isUp ? '#10b981' : '#ef4444' }}>
                    {isUp ? '+' : ''}{pctChange.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Wrapper */}
          <div style={{ position: 'relative', width: '100%', height: '240px' }}>
            {loadingChart && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
                Loading...
              </div>
            )}
            <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
          </div>

        </div>

        {/* Right Column: Major Indices List */}
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', background: 'var(--surface-color)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Major indices</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {MAJOR_INDICES_CONFIG.map(idx => {
              const data = pricesData[idx.symbol];
              const p = data?.price || 0;
              const cPercent = data?.changePercent || 0;
              const active = activeSymbol === idx.symbol;
              const isPositiveChange = cPercent >= 0;

              return (
                <div 
                  key={idx.symbol}
                  onClick={() => setActiveSymbol(idx.symbol)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: active ? '#f1f5f9' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={e => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseOut={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: idx.bg,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: idx.badge.length > 2 ? '0.55rem' : '0.7rem',
                      fontWeight: 'bold'
                    }}>
                      {idx.badge}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a' }}>{idx.name}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: '500', color: '#64748b' }}>{idx.ticker}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a' }}>
                      {p ? p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}
                      <span style={{ fontSize: '0.6rem', color: '#64748b', marginLeft: '2px' }}>POINT</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: isPositiveChange ? '#10b981' : '#ef4444' }}>
                      {isPositiveChange ? '+' : ''}{cPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.8rem', marginTop: '1rem' }}>
            <Link href="/consensus" style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
              See all major indices <span style={{ fontSize: '0.8rem' }}>&gt;</span>
            </Link>
          </div>

        </div>

      </div>

      {/* Bottom Row: Smaller Cards */}
      <div className="mobile-col" style={{ display: 'flex', gap: '8px' }}>
        
        {/* Crypto Card */}
        <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '8px', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b' }}>Crypto market cap <span style={{ fontSize: '0.65rem', background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>TOTAL</span></div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>2.15 T <span style={{ fontSize: '0.65rem', color: '#64748b' }}>USD</span></span>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#ef4444' }}>-3.62%</span>
            </div>
          </div>
        </div>

        {/* US Dollar Index Card */}
        <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '8px', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>$</span>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b' }}>US Dollar index <span style={{ fontSize: '0.65rem', background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>DXY</span></div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                {pricesData['DX-Y.NYB']?.price ? pricesData['DX-Y.NYB'].price.toFixed(3) : '100.771'} <span style={{ fontSize: '0.65rem', color: '#64748b' }}>USD</span>
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: (pricesData['DX-Y.NYB']?.changePercent || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                {(pricesData['DX-Y.NYB']?.changePercent || 0) >= 0 ? '+' : ''}{(pricesData['DX-Y.NYB']?.changePercent || 1.26).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* US 10Y Yield Card */}
        <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '8px', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b' }}>US 10Y yield <span style={{ fontSize: '0.65rem', background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>US10Y</span></div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                {pricesData['^TNX']?.price ? (pricesData['^TNX'].price).toFixed(3) : '4.120'}%
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: (pricesData['^TNX']?.changePercent || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                {(pricesData['^TNX']?.changePercent || 0) >= 0 ? '+' : ''}{(pricesData['^TNX']?.changePercent || -0.05).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
