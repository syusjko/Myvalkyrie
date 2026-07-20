"use client";

import dynamic from 'next/dynamic';
import { useMemo, useState, useCallback } from 'react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Loading...</div>
});

const GROUP_COLORS: Record<number, string> = {
  1: '#6366f1', // macro / market - indigo
  2: '#0ea5e9', // technical / data - sky
  3: '#10b981', // decision - emerald
  4: '#f59e0b', // risk - amber
  5: '#ef4444', // bearish - red
};

function getGroupColor(group: number) {
  return GROUP_COLORS[group] || '#8b5cf6';
}

interface NeuralMapViewerProps {
  networkData: string;
  compact?: boolean;
}

export default function NeuralMapViewer({ networkData, compact = true }: NeuralMapViewerProps) {
  const [expanded, setExpanded] = useState(false);

  const graphData = useMemo(() => {
    try {
      const parsed = typeof networkData === 'string' ? JSON.parse(networkData) : networkData;
      if (parsed.nodes && parsed.links) return parsed;
      return { nodes: [{ id: '1', name: 'Analysis', group: 1 }], links: [] };
    } catch (e) {
      return { nodes: [{ id: '1', name: 'Invalid Data', group: 1 }], links: [] };
    }
  }, [networkData]);

  // Compact inline summary view — shows the flow as a text chain
  if (compact && !expanded) {
    // Build a readable logic chain from nodes
    const decisionNode = graphData.nodes.find((n: any) => n.group === 3);
    const evidenceNodes = graphData.nodes.filter((n: any) => n.group !== 3);

    return (
      <div
        onClick={() => setExpanded(true)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '14px 16px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        }}
      >
        {/* Evidence Flow */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          {evidenceNodes.map((node: any, i: number) => (
            <span key={node.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 500,
                background: `${getGroupColor(node.group)}15`,
                color: getGroupColor(node.group),
                border: `1px solid ${getGroupColor(node.group)}25`,
                letterSpacing: '-0.01em',
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: getGroupColor(node.group),
                  flexShrink: 0,
                }}/>
                {node.name}
              </span>
              {i < evidenceNodes.length - 1 && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                  <polyline points="9 6 15 12 9 18"/>
                </svg>
              )}
            </span>
          ))}
          {/* Arrow to decision */}
          {decisionNode && (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: `${getGroupColor(decisionNode.group)}18`,
                color: getGroupColor(decisionNode.group),
                border: `1px solid ${getGroupColor(decisionNode.group)}35`,
                letterSpacing: '-0.01em',
              }}>
                {decisionNode.name}
              </span>
            </>
          )}
        </div>

        {/* Expand hint */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          Click to expand neural map
        </div>
      </div>
    );
  }

  // Expanded interactive graph view
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name || '';
    const fontSize = Math.max(10 / globalScale, 2.5);
    const nodeRadius = (node.val || 3) * 2.5;
    const color = getGroupColor(node.group || 1);

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    // Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Ring for decision nodes
    if (node.group === 3) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
    }

    // Label
    ctx.font = `${node.group === 3 ? 'bold' : '500'} ${fontSize}px Inter, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(label, node.x, node.y + nodeRadius + fontSize + 2);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Interactive Graph */}
      <div style={{ width: '100%', height: '280px', background: 'rgba(2,6,23,0.8)' }}>
        <ForceGraph2D
          graphData={graphData}
          width={580}
          height={280}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node: any, color, ctx) => {
            const r = (node.val || 3) * 2.5;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI, false);
            ctx.fill();
          }}
          linkColor={() => 'rgba(99, 102, 241, 0.2)'}
          linkWidth={1.5}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={(d: any) => (d.value || 1) * 0.003}
          linkDirectionalParticleColor={() => '#6366f1'}
          backgroundColor="transparent"
          cooldownTicks={60}
          d3VelocityDecay={0.3}
          enableZoomInteraction={false}
          enablePanInteraction={false}
        />
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setExpanded(false)}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: 'var(--text-secondary)',
          padding: '8px',
          fontSize: '0.72rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          transition: 'all 0.15s',
        }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
        Collapse
      </button>
    </div>
  );
}
