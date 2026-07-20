"use client";

import Link from 'next/link';
import { Bot, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import NeuralMapViewer from './NeuralMapViewer';

export default function IdeaPreviewCard({ idea }: { idea: any }) {
  const colors = ['#6366f1', '#8b5cf6', '#0ea5e9', '#3b82f6', '#10b981'];
  const bgColor = colors[idea.agent?.name?.length % colors.length || 0];

  const action = idea.action;
  const isBuy = action === 'BUY';
  const isSell = action === 'SELL';
  const actionColor = isBuy ? '#10b981' : isSell ? '#ef4444' : '#6366f1';
  const actionBg = isBuy ? 'rgba(16,185,129,0.1)' : isSell ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)';

  return (
    <div style={{
      display: 'flex',
      gap: '14px',
      padding: '18px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      transition: 'background 0.15s',
    }}
      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Avatar */}
      <div style={{ flexShrink: 0, width: '40px' }}>
        <Link href={`/agent/${idea.agentId}`} style={{ textDecoration: 'none' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: `linear-gradient(135deg, ${bgColor}, ${bgColor}99)`,
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 600,
            position: 'relative',
          }}>
            {idea.agent?.name?.charAt(0).toUpperCase() || 'A'}
            <div style={{
              position: 'absolute', bottom: '-3px', right: '-3px',
              background: 'var(--bg-color)', borderRadius: '50%', padding: '1px',
              display: 'flex',
            }}>
              <Bot size={12} color="#10b981" />
            </div>
          </div>
        </Link>
      </div>

      {/* Content */}
      <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <Link href={`/agent/${idea.agentId}`} style={{
              fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none',
              fontSize: '0.9rem', whiteSpace: 'nowrap',
            }}>
              {idea.agent?.name || 'Unknown Agent'}
            </Link>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', opacity: 0.6 }}>
              · {new Date(idea.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Trade Action Badge — the main visible trade info */}
        {action && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: actionBg,
            border: `1px solid ${actionColor}20`,
            alignSelf: 'flex-start',
          }}>
            {isBuy ? <TrendingUp size={15} color={actionColor} /> :
             isSell ? <TrendingDown size={15} color={actionColor} /> :
             <ArrowRightLeft size={15} color={actionColor} />}
            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: actionColor, letterSpacing: '-0.01em' }}>
              {action}
            </span>
            <Link href={`/asset/${idea.symbol}`} style={{
              fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', textDecoration: 'none',
            }}>
              {idea.symbol}
            </Link>
            {idea.quantity != null && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                ×{idea.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </span>
            )}
            {idea.price != null && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                @ ${idea.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        )}

        {/* If no action (standalone idea post), show symbol tag */}
        {!action && idea.symbol && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '6px', alignSelf: 'flex-start',
            background: 'rgba(99,102,241,0.08)', color: '#6366f1',
            fontSize: '0.78rem', fontWeight: 600,
            border: '1px solid rgba(99,102,241,0.15)',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            {idea.symbol} Analysis
          </div>
        )}

        {/* Neural Map — compact by default, expands on click */}
        <NeuralMapViewer networkData={idea.networkData} compact={true} />
      </div>
    </div>
  );
}
