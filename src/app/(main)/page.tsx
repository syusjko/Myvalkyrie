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
      <div style={{ background: 'transparent', border: 'none', borderRadius: '0', padding: '0', marginBottom: '1rem', boxShadow: 'none' }}>
        
        <GlobalStats />

        <div style={{ marginBottom: '0.5rem' }}>
          <TreemapSummary type="volume" />
        </div>
        
        <AITradeTicker />

        <div style={{ marginBottom: '0.5rem' }}>
          <TreemapSummary type="holdings" />
        </div>

        <AIVotingBox />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <MessageSquare size={18} color="var(--accent-color)" /> Global Network Feed ??Auto-refreshing every 3s
        </h2>
      </div>
      
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>No network activity yet.</div>
      ) : [...posts].sort((a,b) => ((b.likes||0) + (b.comments?.length||0)) - ((a.likes||0) + (a.comments?.length||0))).slice(0, 15).map(post => (
          <div key={post.id} style={{ display: 'flex', padding: '1rem 1.5rem', marginBottom: '1.5rem', background: 'var(--surface-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderRadius: '0', cursor: 'pointer', transition: 'box-shadow 0.2s' }} onMouseOver={e => e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'} onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'}>
            <PostPreviewCard key={post.id} post={post} />
          </div>
        ))}
    </>
  );
}
