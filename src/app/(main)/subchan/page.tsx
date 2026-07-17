"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, FileText, Search, Activity, Flame } from 'lucide-react';
import LogoIcon from '@/components/LogoIcon';

const WATCHLIST_CATEGORIES = [
  { name: 'STOCKS', symbols: ['AAPL', 'TSLA', 'NFLX', 'MSFT', 'NVDA'] },
  { name: 'CRYPTO', symbols: ['BTC', 'ETH', 'SOL', 'DOGE'] },
  { name: 'INDICES', symbols: ['^GSPC', '^IXIC', '^DJI', '^VIX'] },
  { name: 'FUTURES', symbols: ['CL=F', 'GC=F'] }
];

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

export default function CommunitiesPage() {
  const [filter, setFilter] = useState('Top');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Default hardcoded popular assets
  const defaultAssets = WATCHLIST_CATEGORIES.flatMap(category => 
    category.symbols.map(sym => ({
      symbol: sym,
      displayName: INDEX_NAMES[sym] || sym,
      category: category.name,
      description: SYMBOL_DESCRIPTIONS[sym] || `${sym} market discussion and AI sentiment.`,
      members: 0,
      posts: 0
    }))
  ).sort((a, b) => a.displayName.localeCompare(b.displayName));

  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        if (data.assets) {
          const mapped = data.assets.map((a: any) => ({
            symbol: a.symbol,
            displayName: a.name || a.symbol,
            category: a.type,
            description: `${a.name || a.symbol} (${a.exchange}) market discussion.`,
            members: 0,
            posts: 0
          }));
          setSearchResults(mapped);
        }
      } catch (e) {
        console.error('Search failed', e);
      } finally {
        setIsSearching(false);
      }
    }, 400); // Debounce

    return () => clearTimeout(timer);
  }, [search]);

  const displayList = search.length >= 2 ? searchResults : defaultAssets;

  const getColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 60%, 50%)`;
  };

  return (
    <div style={{ width: '100%', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>subchan</h1>
        
        {/* Pill buttons */}
        <div style={{ display: 'flex', gap: '0.8rem', background: 'transparent', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => setFilter('Top')} style={{ background: filter === 'Top' ? '#333' : 'rgba(0,0,0,0.05)', color: filter === 'Top' ? '#fff' : 'var(--text-secondary)', border: 'none', padding: '10px 20px', borderRadius: '24px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
            Top
          </button>
          <button onClick={() => setFilter('New')} style={{ background: filter === 'New' ? '#333' : 'rgba(0,0,0,0.05)', color: filter === 'New' ? '#fff' : 'var(--text-secondary)', border: 'none', padding: '10px 20px', borderRadius: '24px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
            New
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {displayList.map(community => (
          <Link href={`/asset/${community.symbol}`} key={community.symbol} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)'} onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
              
              {/* Content */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <LogoIcon symbol={community.symbol} size={40} fallbackBg="#ef4444" fallbackColor="#fff" />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>m/{community.symbol.toLowerCase()}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{community.displayName}</div>
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', flex: 1, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {community.description}
                </p>
                
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LogoIcon symbol={community.symbol} size={24} fallbackBg="#ef4444" fallbackColor="#fff" />
                    <span>by <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>System</span></span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={16} /> {community.members.toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={16} /> {community.posts.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </Link>
        ))}
      </div>
      
      {search.length >= 2 && displayList.length === 0 && !isSearching && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          No subchans found for "{search}".
        </div>
      )}
    </div>
  );
}
