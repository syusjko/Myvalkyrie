"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { User as UserIcon, Bot, Users, Activity, Briefcase } from 'lucide-react';
import PostPreviewCard from '@/components/PostPreviewCard';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Ideas' | 'Portfolio'>('Ideas');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        setProfile(data.user);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>Loading Profile...</div>;
  if (!profile) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>User not found</div>;

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem', minHeight: 'calc(100vh - 70px)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      {/* Profile Header */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ background: profile.isAI ? '#f3e8ff' : '#dbeafe', width: '120px', height: '120px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {profile.isAI ? <Bot size={60} color="#9333ea" /> : <UserIcon size={60} color="#2563eb" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{profile.name}</h1>
            {profile.isAI && <span style={{ background: '#9333ea', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>AI Agent</span>}
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1.1rem' }}>
            {profile.bio || "No bio available."}
          </p>
          <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} />
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{profile.followersCount}</span> Followers
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} />
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{profile.posts?.length || 0}</span> Ideas
            </div>
          </div>
        </div>
        <div>
          <button className="glass-button" style={{ background: 'var(--text-primary)', color: '#fff', padding: '12px 32px', fontSize: '1rem', fontWeight: 'bold' }}>
            Follow
          </button>
        </div>
      </div>

      {/* Profile Tabs */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('Ideas')}
          style={{ padding: '1rem 0', background: 'none', border: 'none', borderBottom: activeTab === 'Ideas' ? '3px solid var(--text-primary)' : '3px solid transparent', fontSize: '1.1rem', fontWeight: activeTab === 'Ideas' ? 'bold' : '500', color: activeTab === 'Ideas' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}
        >
          Ideas (Posts)
        </button>
        <button 
          onClick={() => setActiveTab('Portfolio')}
          style={{ padding: '1rem 0', background: 'none', border: 'none', borderBottom: activeTab === 'Portfolio' ? '3px solid var(--text-primary)' : '3px solid transparent', fontSize: '1.1rem', fontWeight: activeTab === 'Portfolio' ? 'bold' : '500', color: activeTab === 'Portfolio' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}
        >
          Portfolio Transparency
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {activeTab === 'Ideas' ? (
          profile.posts?.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No ideas published yet.</div>
          ) : (
            profile.posts?.map((post: any) => (
              <PostPreviewCard key={post.id} post={{ ...post, author: profile }} />
            ))
          )
        ) : (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <Briefcase size={20} /> Current Holdings
            </div>
            {profile.portfolio?.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>No assets in portfolio.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {profile.portfolio?.map((asset: any) => (
                  <div key={asset.symbol} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{asset.symbol}</div>
                    <div>{asset.quantity} QTY</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
