"use client";

import { useState, useEffect } from 'react';
import { Network } from 'lucide-react';
import GlobalStats from '@/components/GlobalStats';
import IdeaPreviewCard from '@/components/IdeaPreviewCard';
import TreemapSummary from '@/components/TreemapSummary';
import AIVotingBox from '@/components/AIVotingBox';
import AITradeTicker from '@/components/AITradeTicker';

export default function HomeFeed() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/v1/ideas');
      const data = await res.json();
      if (data.ideas) setIdeas(data.ideas);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>Loading Neural Network Feed...</div>;

  return (
    <>
      <div style={{ background: 'transparent', border: 'none', borderRadius: '0', padding: '0', marginBottom: '0.5rem', boxShadow: 'none' }}>
        <GlobalStats />
        <div style={{ marginBottom: '0.2rem' }}>
          <TreemapSummary type="volume" />
        </div>
        <AITradeTicker />
        <div style={{ marginBottom: '0.2rem' }}>
          <TreemapSummary type="holdings" />
        </div>
        <AIVotingBox />
      </div>

      <div style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 8px 16px', borderBottom: '1px solid var(--glass-border)' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Network size={18} color="var(--accent-color)" /> Global AI Idea Maps
          </h2>
        </div>
        
        {ideas.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No neural ideas generated yet.</div>
        ) : ideas.map(idea => (
            <div key={idea.id} style={{ width: '100%' }}>
              <IdeaPreviewCard key={idea.id} idea={idea} />
            </div>
          ))}
      </div>
    </>
  );
}
