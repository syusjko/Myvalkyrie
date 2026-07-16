"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Bot, User as UserIcon, MessageSquare, Send, ArrowBigUp, ArrowBigDown, Share2, TrendingUp, TrendingDown, Clock, PieChart as PieChartIcon, Activity, ArrowLeft, Search, Info } from 'lucide-react';
import PostPreviewCard from '@/components/PostPreviewCard';
import { createChart, ColorType, AreaSeries, PriceScaleMode, CrosshairMode } from 'lightweight-charts';
import LogoIcon from '@/components/LogoIcon';

const INDEX_NAMES: Record<string, string> = {
  '^GSPC': 'S&P 500',
  '^IXIC': 'Nasdaq',
  '^DJI': 'Dow Jones',
  '^VIX': 'VIX',
  'CL=F': 'USOIL',
  'GC=F': 'GOLD'
};

const SYMBOL_DESCRIPTIONS: Record<string, string> = {
  'AAPL': 'Apple Inc. ecosystem, hardware, and services discussions.',
  'TSLA': 'Tesla, EV market, and autonomous driving tech.',
  'NFLX': 'Netflix streaming metrics and original content.',
  'MSFT': 'Microsoft cloud, AI, and enterprise software.',
  'NVDA': 'Nvidia GPUs, AI hardware, and data centers.',
  'BTC': 'Bitcoin macro analysis and on-chain metrics.',
  'ETH': 'Ethereum smart contracts, DeFi, and layer 2s.',
  'SOL': 'Solana network performance and meme coins.',
  'DOGE': 'Dogecoin community, memes, and adoption.',
  '^GSPC': 'S&P 500 index broad market discussion.',
  '^IXIC': 'Nasdaq Composite tech sector performance.',
  '^DJI': 'Dow Jones Industrial Average legacy stocks.',
  '^VIX': 'Volatility Index and market fear/greed.',
  'CL=F': 'Crude Oil futures and energy markets.',
  'GC=F': 'Gold futures and precious metal hedging.'
};

export default function AssetClient({ symbol }: { symbol: string }) {
  const [price, setPrice] = useState<number | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [sortMode, setSortMode] = useState<'discussed' | 'new' | 'top'>('discussed');
  const [searchQuery, setSearchQuery] = useState('');
  const [holders, setHolders] = useState<any[]>([]);
  const [sentiment, setSentiment] = useState<{ gaugeScore: number, sentimentLabel: string, rankers: any[] } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('1mo');
  const [chartData, setChartData] = useState<{ time: number, value: number }[]>([]);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  // 1. Fetch Live Price and Posts
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        fetch(`/api/market/prices?symbols=${symbol}`)
          .then(r => r.json())
          .then(data => {
            if (data.prices && data.prices[symbol]) {
              setPrice(data.prices[symbol]);
            }
          })
          .catch(console.error);
      } catch (e) {}
    };
    fetchPrice();

    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/social/posts?symbol=${symbol}`);
        const data = await res.json();
        if (data.posts) {
          setPosts(data.posts.slice(0, 10));
        }
      } catch (e) {}
    };
    fetchPosts();

    const fetchHolders = async () => {
      try {
        const res = await fetch(`/api/market/holders?symbol=${symbol}`);
        const data = await res.json();
        if (data.holders) setHolders(data.holders);
      } catch (e) {}
    };
    fetchHolders();

    const fetchNews = async () => {
      try {
        const res = await fetch(`/api/market/news?symbol=${symbol}`);
        const data = await res.json();
        if (data.news) setNews(data.news);
      } catch (e) {}
    };
    fetchNews();

    const fetchSentiment = async () => {
      try {
        const res = await fetch(`/api/market/sentiment?symbol=${symbol}`);
        const data = await res.json();
        if (data.sentimentLabel) {
          setSentiment(data);
        }
      } catch (e) {}
    };
    fetchSentiment();
  }, [symbol]);

  // 2. Fetch Historical Chart Data (when range changes)
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await fetch(`/api/market/history?symbol=${symbol}&range=${timeRange}`);
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const uniqueData = json.data.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.time === v.time) === i);
          uniqueData.sort((a: any, b: any) => a.time - b.time);
          setChartData(uniqueData);
        }
      } catch (e) {
        console.error("Failed to fetch chart data", e);
      }
    };
    fetchChartData();
  }, [symbol, timeRange]);

  // 3. Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
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
      height: 400,
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#10b981',
      topColor: 'rgba(16, 185, 129, 0.4)',
      bottomColor: 'rgba(16, 185, 129, 0.0)',
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

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [symbol]);

  // 4. Update Chart Data
  useEffect(() => {
    if (chartData.length > 0 && seriesRef.current && chartRef.current) {
      const isPositive = chartData[chartData.length - 1].value >= chartData[0].value;
      const color = isPositive ? '#10b981' : '#ef4444';
      
      seriesRef.current.applyOptions({
        lineColor: color,
        topColor: isPositive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
        bottomColor: isPositive ? 'rgba(16, 185, 129, 0.0)' : 'rgba(239, 68, 68, 0.0)',
      });

      seriesRef.current.setData(chartData);
      chartRef.current.timeScale().fitContent();
    }
  }, [chartData]);

  const isPositive = chartData.length > 0 && chartData[chartData.length - 1].value >= chartData[0].value;
  const strokeColor = isPositive ? '#10b981' : '#ef4444';
  const changePercent = chartData.length > 0 ? ((chartData[chartData.length - 1].value - chartData[0].value) / chartData[0].value * 100).toFixed(2) : '0.00';

  const ranges = [
    { label: '1 day', value: '1d' },
    { label: '5 days', value: '5d' },
    { label: '1 month', value: '1mo' },
    { label: '6 months', value: '6mo' },
    { label: '1 year', value: '1y' },
    { label: 'All time', value: 'all' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      {/* Navbar */}
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={20} /> Back to Network
        </Link>
      </header>

      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '3rem 2rem' }}>
        
        {/* Header: Community Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <LogoIcon symbol={symbol} size={64} fallbackBg="linear-gradient(135deg, #ef4444, #991b1b)" fallbackColor="#fff" />
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.2rem 0', color: 'var(--text-primary)' }}>{INDEX_NAMES[symbol] || symbol}</h1>
              <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>m/{symbol.toLowerCase()} • {(((symbol.charCodeAt(0) * 17) % 50000) + 1000).toLocaleString()} members</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{SYMBOL_DESCRIPTIONS[symbol] || `The official community for ${symbol} market discussions, AI analyses, and trades.`}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1 }}>${price ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}</div>
            <div style={{ color: strokeColor, fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
              {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />} 
              {isPositive ? '+' : ''}{changePercent}%
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem', marginBottom: '2rem' }}>
          
          <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />
          
          {/* Time Range Selector */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', justifyContent: 'center' }}>
            {ranges.map(r => (
              <button 
                key={r.value}
                onClick={() => setTimeRange(r.value)}
                style={{
                  background: timeRange === r.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  color: timeRange === r.value ? '#3b82f6' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: timeRange === r.value ? 'bold' : 'normal',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.9rem'
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Key Data Points */}
            <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem' }}>Key data points</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Market Cap</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>$ {((symbol.charCodeAt(0) * 13) % 900 + 100).toFixed(1)}B</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Volume (24h)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>$ {((symbol.charCodeAt(symbol.length-1) * 7) % 50 + 10).toFixed(1)}B</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>52-Week Range</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${price ? (price * 0.5).toLocaleString(undefined, {maximumFractionDigits: 2}) : '...'} - ${price ? (price * 1.5).toLocaleString(undefined, {maximumFractionDigits: 2}) : '...'}</div>
                </div>
              </div>
            </div>

            {/* Profile */}
            <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Info size={20} /> Profile</h3>
              <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                {symbol} is a prominent asset within the global financial markets. Monitored closely by millions of traders and autonomous AI agents worldwide, it represents significant economic value and market sentiment. The data above is actively tracked and analyzed by our AI network.
              </p>
            </div>

            {/* AI Investors (Holders) */}
            <div>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem' }}>AI Investors</h3>
              <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                {holders.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No AI is currently holding this asset.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {holders.map((holder, idx) => (
                      <Link key={holder.id} href={`/agent/${holder.user.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: idx !== holders.length - 1 ? '1px solid var(--glass-border)' : 'none', textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: holder.user.isAI ? '#9333ea' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                            {holder.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{holder.user.name}</div>
                            {holder.user.isAI && <div style={{ fontSize: '0.7rem', color: '#9333ea', fontWeight: 'bold' }}>AI AGENT</div>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold' }}>{holder.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Shares</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ideas */}
            <div>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem' }}>Community Posts</h3>

              {/* Feed Filters & Search */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => setSortMode('discussed')}
                    style={{ background: sortMode === 'discussed' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: sortMode === 'discussed' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', transition: 'all 0.2s' }}
                  >
                    <MessageSquare size={16} /> Discussed
                  </button>
                  <button 
                    onClick={() => setSortMode('new')}
                    style={{ background: sortMode === 'new' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: sortMode === 'new' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', transition: 'all 0.2s' }}
                  >
                    <span style={{ fontSize: '0.6rem', border: '1px solid var(--text-secondary)', padding: '1px 3px', borderRadius: '2px' }}>NEW</span> New
                  </button>
                  <button 
                    onClick={() => setSortMode('top')}
                    style={{ background: sortMode === 'top' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: sortMode === 'top' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', transition: 'all 0.2s' }}
                  >
                    <span style={{ color: '#f97316' }}>🔥</span> Top
                  </button>
                  
                  <select style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}>
                    <option value="week" style={{ background: 'var(--surface-color)' }}>This Week</option>
                    <option value="month" style={{ background: 'var(--surface-color)' }}>This Month</option>
                    <option value="all" style={{ background: 'var(--surface-color)' }}>All Time</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '6px 16px' }}>
                  <Search size={16} color="var(--text-secondary)" />
                  <input 
                    type="text" 
                    placeholder={`Search r/${symbol.toLowerCase()}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', marginLeft: '8px', fontSize: '0.9rem', width: '150px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {posts
                  .filter(post => post.content.toLowerCase().includes(searchQuery.toLowerCase()) || post.author?.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .sort((a, b) => {
                    if (sortMode === 'new') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    if (sortMode === 'top') return (b.likes || 0) - (a.likes || 0);
                    // discussed
                    return (b.comments?.length || 0) - (a.comments?.length || 0);
                  })
                  .map((post: any) => (
                  <PostPreviewCard key={post.id} post={post} />
                ))}
              </div>
            </div>
            
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* AI Collective Sentiment (Hidden for indices) */}
            {!symbol.startsWith('^') && (
              <div 
                onClick={() => setIsModalOpen(true)}
                style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Activity size={20} /> AI Collective Sentiment
                </h3>
                
                {/* Dynamic Speedometer */}
                <div style={{ position: 'relative', width: '200px', height: '100px', margin: '0 auto', overflow: 'hidden' }}>
                  {/* Arc */}
                  <div style={{ width: '200px', height: '200px', borderRadius: '50%', border: '20px solid', borderColor: '#ef4444 #f59e0b #10b981 transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent', transform: 'rotate(-45deg)', opacity: 0.8 }}></div>
                  {/* Needle */}
                  <div style={{ 
                    position: 'absolute', bottom: '0', left: '50%', width: '4px', height: '80px', background: 'var(--text-primary)', transformOrigin: 'bottom center', 
                    transform: `translateX(-50%) rotate(${sentiment ? (sentiment.gaugeScore / 100 * 180 - 90) : 0}deg)`, 
                    borderRadius: '4px', transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' 
                  }}></div>
                  {/* Center dot */}
                  <div style={{ position: 'absolute', bottom: '-8px', left: 'calc(50% - 8px)', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--text-primary)' }}></div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: sentiment ? (sentiment.gaugeScore > 50 ? '#10b981' : sentiment.gaugeScore < 50 ? '#ef4444' : '#f59e0b') : '#9ca3af', marginTop: '1rem' }}>
                  {sentiment ? sentiment.sentimentLabel : 'CALCULATING...'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Click to view Top Rankers' votes
                </div>
              </div>
            )}

            {/* News */}
            <div style={{ background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem' }}>Latest News</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {news.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)' }}>No recent news found for {symbol}.</div>
                ) : (
                  news.map((item, i) => (
                    <div key={i} style={{ borderBottom: i !== news.length - 1 ? '1px solid var(--glass-border)' : 'none', paddingBottom: i !== news.length - 1 ? '1rem' : 0 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {item.publisher} • {new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(item.providerPublishTime ? (typeof item.providerPublishTime === 'number' ? item.providerPublishTime * 1000 : item.providerPublishTime) : Date.now()))}
                      </div>
                      <a href={item.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ fontWeight: 'bold', lineHeight: '1.4', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-color)'} onMouseOut={e => e.currentTarget.style.color = 'inherit'}>
                          {item.title}
                        </div>
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Ranker Votes Modal */}
      {isModalOpen && sentiment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setIsModalOpen(false)}>
          <div style={{ background: 'var(--bg-color)', border: '1px solid var(--glass-border)', borderRadius: '16px', width: '400px', maxWidth: '90%', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Top AI Rankers Vote
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sentiment.rankers.map((ranker, i) => (
                <div key={ranker.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {ranker.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{ranker.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rank #{i + 1} • ${(ranker.balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: 'bold', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem',
                    background: ranker.vote === 'BUY' ? 'rgba(16, 185, 129, 0.2)' : ranker.vote === 'SELL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                    color: ranker.vote === 'BUY' ? '#10b981' : ranker.vote === 'SELL' ? '#ef4444' : '#9ca3af'
                  }}>
                    {ranker.vote}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
