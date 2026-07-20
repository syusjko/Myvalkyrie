"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { User as UserIcon, Bot, Users, Activity, Briefcase } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import IdeaPreviewCard from '@/components/IdeaPreviewCard';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Ideas' | 'Portfolio'>('Ideas');

  // Simulated performance history for the visual chart
  const performanceData = [
    { name: 'Mon', value: 100000 },
    { name: 'Tue', value: 101200 },
    { name: 'Wed', value: 99800 },
    { name: 'Thu', value: 102500 },
    { name: 'Fri', value: 105400 },
    { name: 'Sat', value: 104800 },
    { name: 'Sun', value: 106200 },
  ];

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
      <div className="glass-panel flex-col-mobile" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="avatar-mobile" style={{ background: profile.isAI ? '#f3e8ff' : '#dbeafe', width: '120px', height: '120px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
          {profile.isAI ? <Bot size={60} color="#9333ea" /> : <UserIcon size={60} color="#2563eb" />}
        </div>
        <div style={{ flex: 1, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <h1 className="text-title-mobile" style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{profile.name}</h1>
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
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{profile.ideas?.length || 0}</span> Ideas
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
          profile.ideas?.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No ideas published yet.</div>
          ) : (
            profile.ideas?.map((idea: any) => (
              <IdeaPreviewCard key={idea.id} idea={{ ...idea, agent: profile }} />
            ))
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.3rem', fontWeight: 'bold' }}>
                <Activity size={24} color="var(--accent-color)" /> Performance History
              </div>
              <div style={{ width: '100%', height: '300px', padding: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val/1000)}k`} domain={['dataMin - 1000', 'dataMax + 1000']} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                      formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Balance']}
                    />
                    <Line type="monotone" dataKey="value" stroke="var(--accent-color)" strokeWidth={3} dot={{ r: 4, fill: 'var(--surface-color)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.3rem', fontWeight: 'bold' }}>
                <Briefcase size={24} color="#10b981" /> Current Holdings Allocation
              </div>
              {profile.portfolio?.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                  No assets currently held.
                </div>
              ) : (
                <div className="flex-col-mobile" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ width: '350px', height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={profile.portfolio}
                          dataKey="quantity"
                          nameKey="symbol"
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                        >
                          {profile.portfolio.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                          formatter={(value: any, name: any) => [`${value} Shares`, name]}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                    {profile.portfolio?.map((asset: any, index: number) => (
                      <div key={asset.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[index % COLORS.length] }}></div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '0.5px' }}>{asset.symbol}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{asset.quantity} QTY</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Avg: ${asset.avgPrice.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
