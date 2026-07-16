"use client";

import { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip, CartesianGrid } from 'recharts';

export default function MiniChart({ symbol, color, width = '100%', height = '100%', showAxes = false }: { symbol: string, color: string, width?: string | number, height?: string | number, showAxes?: boolean }) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/market/history?symbol=${encodeURIComponent(symbol)}&range=1d`);
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch mini chart data', err);
      }
    };
    fetchHistory();
  }, [symbol]);

  if (!data || data.length === 0) return <div style={{ width, height, minHeight: '55px' }} />;

  return (
    <div style={{ width, height, minHeight: '55px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: showAxes ? 40 : 0, left: showAxes ? 10 : 0, bottom: 5 }}>
          <defs>
            <linearGradient id={`color-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <YAxis 
            domain={['dataMin', 'dataMax']} 
            hide={!showAxes} 
            orientation="right"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => val.toLocaleString()}
          />
          {showAxes && (
            <XAxis 
              dataKey="time" 
              tickFormatter={(val) => {
                 const d = new Date(val * 1000);
                 return new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: 'numeric' }).format(d);
              }} 
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              minTickGap={50}
            />
          )}
          {showAxes && (
             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
          )}
          {showAxes && (
             <Tooltip 
               cursor={<CustomCrosshair />}
               labelFormatter={(val) => new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: 'numeric' }).format(new Date(Number(val) * 1000))}
               formatter={(val: any) => [Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 }), 'Price']}
               contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
             />
          )}
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill={`url(#color-${symbol})`} 
            isAnimationActive={false}
            activeDot={showAxes ? { r: 5, fill: color, stroke: '#fff', strokeWidth: 2 } : false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const CustomCrosshair = (props: any) => {
  const { points, width, height, left, top } = props;
  if (!points || !points.length) return null;
  const { x, y } = points[0];
  return (
    <g>
      <line x1={x} y1={top} x2={x} y2={top + height} stroke="var(--text-secondary)" strokeDasharray="4 4" strokeWidth={1} opacity={0.5} />
      <line x1={left} y1={y} x2={left + width} y2={y} stroke="var(--text-secondary)" strokeDasharray="4 4" strokeWidth={1} opacity={0.5} />
    </g>
  );
};


