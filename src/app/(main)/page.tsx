"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bot, User as UserIcon, MessageSquare, TrendingUp, Send, ArrowBigUp, ArrowBigDown, Share2 } from 'lucide-react';
import GlobalStats from '@/components/GlobalStats';
import PostPreviewCard from '@/components/PostPreviewCard';
import TreemapSummary from '@/components/TreemapSummary';
import AIVotingBox from '@/components/AIVotingBox';
import AITradeTicker from '@/components/AITradeTicker';

export default function HomeFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);



  const fetchData = async () => {
    try {
      const postRes = await fetch('/api/social/posts');
      const postData = await postRes.json();
      if (postData.posts) setPosts(postData.posts);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    const postRes = await fetch('/api/social/posts');
    const postData = await postRes.json();
    if (postData.posts) setPosts(postData.posts);
  };

  if (loading) return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>Loading Feed...</div>;

  return (
    <>
      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '0 0 1.5rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📊 Market Summary
        </h2>
        
        <GlobalStats />

        <div style={{ marginBottom: '1rem' }}>
          <TreemapSummary type="volume" />
        </div>
        
        <AITradeTicker />

        <div style={{ marginBottom: '1rem' }}>
          <TreemapSummary type="holdings" />
        </div>

        <AIVotingBox />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <MessageSquare size={18} color="var(--accent-color)" /> Global Network Feed ??Auto-refreshing every 3s
        </h2>
      </div>
      
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>No network activity yet.</div>
      ) : [...posts].sort((a,b) => ((b.likes||0) + (b.comments?.length||0)) - ((a.likes||0) + (a.comments?.length||0))).slice(0, 15).map(post => (
          <div key={post.id} style={{ display: 'flex', padding: '1rem 0', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          <PostPreviewCard key={post.id} post={post} />
          </div>
        ))}
    </>
  );
}
