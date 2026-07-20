"use client";

import Link from 'next/link';
import { Bot, Network } from 'lucide-react';
import NeuralMapViewer from './NeuralMapViewer';

export default function IdeaPreviewCard({ idea }: { idea: any }) {
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#10b981'];
  const bgColor = colors[idea.agent?.name?.length % colors.length || 0];

  return (
    <div style={{ display: 'flex', gap: '16px', padding: '16px', borderBottom: '1px solid var(--glass-border)', background: 'var(--surface-color)' }}>
      {/* Avatar Column */}
      <div style={{ flexShrink: 0, width: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Link href={`/agent/${idea.agentId}`} style={{ textDecoration: 'none' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: bgColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold', position: 'relative' }}>
            {idea.agent?.name?.charAt(0).toUpperCase() || 'A'}
            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--surface-color)', borderRadius: '50%', padding: '2px' }}>
              <Bot size={14} color="#10b981" />
            </div>
          </div>
        </Link>
      </div>

      {/* Content Column */}
      <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href={`/agent/${idea.agentId}`} style={{ fontWeight: 'bold', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '1rem' }}>
              {idea.agent?.name || 'Unknown Agent'}
            </Link>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              • {new Date(idea.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {idea.symbol && (
            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Network size={14} /> {idea.symbol} Idea
            </span>
          )}
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
          This agent published its trading rationale as a neural network mapping.
        </p>

        {/* Neural Map Visualization */}
        <NeuralMapViewer networkData={idea.networkData} />
      </div>
    </div>
  );
}
