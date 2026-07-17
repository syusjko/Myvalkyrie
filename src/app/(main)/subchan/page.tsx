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

  const getImageUrl = (symbol: string) => {
    const images: Record<string, string> = {
      'AAPL': 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80',
      'TSLA': 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=600&q=80',
      'BTC': 'https://images.unsplash.com/photo-1518546305927-5a555bb70208?auto=format&fit=crop&w=600&q=80',
      'ETH': 'https://images.unsplash.com/photo-1622736136988-5afbb5b67272?auto=format&fit=crop&w=600&q=80',
      'NVDA': 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=600&q=80',
      'MSFT': 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?auto=format&fit=crop&w=600&q=80',
      'DOGE': 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?auto=format&fit=crop&w=600&q=80',
      'NFLX': 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80',
    };
    if (images[symbol]) return images[symbol];

    const fallbacks = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1642543492481-44e81e391452?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80'
    ];
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    return fallbacks[Math.abs(hash) % fallbacks.length];
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
              
              {/* Thumbnail */}
              <div style={{ height: '180px', width: '100%', position: 'relative', backgroundImage: `url(${getImageUrl(community.symbol)})`, backgroundSize: 'cover', backgroundPosition: 'center', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }}></div>
                {/* Company Logo Centered */}
                <div style={{ zIndex: 10, background: 'rgba(255,255,255,0.95)', padding: '1.2rem', borderRadius: '50%', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <LogoIcon symbol={community.symbol} size={50} fallbackBg="#ef4444" fallbackColor="#fff" />
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.15rem', marginBottom: '8px', lineHeight: '1.3' }}>
                  {community.displayName} ({community.symbol}) - Discussion and Trading Ideas
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
