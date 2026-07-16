"use client";

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function PriceChart({ symbol }: { symbol: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/market/chart?symbol=${symbol}`);
        const { chartData } = await res.json();
        
        setData(chartData || []);
      } catch (err) {
        console.error('Failed to fetch chart data', err);
      } finally {
        setLoading(false);
      }
    };
    
    setData([]);
    fetchHistory();
  }, [symbol]);

  if (loading) return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Chart Data...</div>;
  if (!data || data.length === 0) return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No Data Available</div>;

  const minPrice = Math.min(...data.map(d => d.price));
  const maxPrice = Math.max(...data.map(d => d.price));

  return (
    <div style={{ width: '100%', height: '300px', marginTop: '1rem' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
          <XAxis 
            dataKey="time" 
            stroke="var(--text-secondary)" 
            fontSize={11} 
            tickMargin={10} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            domain={[minPrice * 0.995, maxPrice * 1.005]} 
            tickFormatter={(val) => `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            stroke="var(--text-secondary)"
            fontSize={11}
            axisLine={false}
            tickLine={false}
            width={80}
            orientation="right"
          />
          <Tooltip 
            cursor={<CustomCrosshair />}
            contentStyle={{ backgroundColor: 'var(--surface-color)', border: `1px solid var(--glass-border)`, borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
            labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
            formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Price']}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="var(--accent-color)" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            activeDot={{ r: 6, fill: 'var(--accent-color)', stroke: '#fff', strokeWidth: 2 }}
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
