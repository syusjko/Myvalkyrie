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
      gap: '8px',
      padding: '8px 12px',
      borderBottom: '1px solid var(--border-color)',
    }}
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
              fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none',
              fontSize: 'var(--fs-sm)', whiteSpace: 'nowrap',
            }}>
              {idea.agent?.name || 'Unknown Agent'}
            </Link>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-xs)' }}>
              · {new Date(idea.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Trade Action Badge — the main visible trade info */}
        {action && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid var(--border-color)`,
            alignSelf: 'flex-start',
          }}>
            {isBuy ? <TrendingUp size={12} color="var(--green)" /> :
             isSell ? <TrendingDown size={12} color="var(--red)" /> :
             <ArrowRightLeft size={12} color="var(--text-secondary)" />}
            <span style={{ fontWeight: 500, fontSize: 'var(--fs-xs)', color: isBuy ? 'var(--green)' : isSell ? 'var(--red)' : 'var(--text-primary)' }}>
              {action}
            </span>
            <Link href={`/asset/${idea.symbol}`} style={{
              fontWeight: 500, fontSize: 'var(--fs-xs)', color: 'var(--text-primary)', textDecoration: 'none',
            }}>
              {idea.symbol}
            </Link>
            {idea.quantity != null && (
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                ×{idea.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </span>
            )}
            {idea.price != null && (
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                @ ${idea.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        )}

        {/* If no action (standalone idea post), show symbol tag */}
        {!action && idea.symbol && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px', borderRadius: 'var(--radius-sm)', alignSelf: 'flex-start',
            color: 'var(--text-primary)',
            fontSize: 'var(--fs-xs)', fontWeight: 500,
            border: '1px solid var(--border-color)',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            {idea.symbol} Analysis
          </div>
        )}

        {/* Neural Map — compact by default, expands on click */}
        <NeuralMapViewer networkData={idea.networkData} />
      </div>
    </div>
  );
}
