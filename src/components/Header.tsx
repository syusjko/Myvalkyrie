"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Search, User as UserIcon, TrendingUp, X, Activity, Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'Assets' | 'Agents' | 'Humans'>('Assets');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [topAgents, setTopAgents] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('MyValkyrie_user');
    if (storedUser) setIsLoggedIn(true);

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    const fetchTopAgents = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        if (data.leaderboard) {
          setTopAgents(data.leaderboard.filter((a: any) => a.isAI).slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTopAgents();

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        
        let aggregated: any[] = [];
        if (activeTab === 'Assets' && data.assets) {
          aggregated = data.assets.map((a: any) => ({ ...a, type: 'asset' }));
        } else if (activeTab === 'Agents' && data.agents) {
          aggregated = data.agents.filter((a: any) => a.isAI).map((a: any) => ({ ...a, type: 'agent' }));
        } else if (activeTab === 'Humans' && data.agents) {
          aggregated = data.agents.filter((a: any) => !a.isAI).map((a: any) => ({ ...a, type: 'human' }));
        }
        setSearchResults(aggregated);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab]);

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, width: '100%' }}>
      {/* HEADER */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center', 
        padding: '0.4rem 1rem', 
        background: 'var(--header-bg)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'relative',
        zIndex: 50,
        gap: '1rem'
      }}>
        {/* LEFT: Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-color)', letterSpacing: '-0.5px' }}>
            MyValkyrie
          </span>
        </Link>
 
        {/* CENTER: Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '600px', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }} ref={searchRef}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '16px' }} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                style={{
                  width: '100%',
                  padding: '8px 16px 8px 38px',
                  borderRadius: '24px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--search-bg)',
                  fontSize: '0.9rem',
                  fontWeight: '300',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxShadow: searchOpen ? '0 0 0 3px var(--accent-glow)' : 'none'
                }}
              />
              {isSearching && <Loader size={16} color="var(--accent-color)" className="animate-spin" style={{ position: 'absolute', right: '16px' }} />}
            </div>

            {/* Dropdown Results */}
            {searchOpen && (searchQuery.trim().length > 0) && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 50 }}>
                {/* Search Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
                  {['Assets', 'Agents'].map(tab => (
                    <div 
                      key={tab} 
                      onClick={() => setActiveTab(tab as any)}
                      style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', color: activeTab === tab ? 'var(--accent-color)' : 'var(--text-secondary)', borderBottom: activeTab === tab ? '2px solid var(--accent-color)' : '2px solid transparent' }}
                    >
                      {tab}
                    </div>
                  ))}
                </div>
                
                {/* Results List */}
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {searchResults.length > 0 ? (
                    searchResults.map((result: any, i) => (
                      <Link href={result.type === 'asset' ? `/asset/${result.symbol}` : `/agent/${result.id}`} key={i} style={{ textDecoration: 'none' }} onClick={() => setSearchOpen(false)}>
                        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s', color: 'var(--text-primary)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          {result.type === 'asset' ? (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '500', fontSize: '0.8rem' }}>
                              {result.symbol.substring(0, 2)}
                            </div>
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: result.isAI ? '#f3e8ff' : '#dcfce7', color: result.isAI ? '#7e22ce' : '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '500', fontSize: '0.8rem' }}>
                              {result.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>{result.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {result.type === 'asset' ? result.symbol : result.isAI ? 'AI Agent' : 'Human Trader'}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : !isSearching && (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                      No {activeTab.toLowerCase()} found for "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Initial Helper Text (before typing) */}
            {searchOpen && searchQuery.trim().length === 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 50 }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
                  {['Assets', 'Agents'].map(tab => (
                    <div 
                      key={tab} 
                      onClick={() => setActiveTab(tab as any)}
                      style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', color: activeTab === tab ? 'var(--accent-color)' : 'var(--text-secondary)', borderBottom: activeTab === tab ? '2px solid var(--accent-color)' : '2px solid transparent' }}
                    >
                      {tab}
                    </div>
                  ))}
                </div>
                {!isSearching && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem', fontWeight: '300' }}>
                    Type to search for {activeTab.toLowerCase()}...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Empty for balance */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        </div>
      </header>
    </div>
  );
}
