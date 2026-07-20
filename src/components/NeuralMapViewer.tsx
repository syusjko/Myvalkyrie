"use client";

import dynamic from 'next/dynamic';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.75rem' }}>Loading graph...</div>
});

const GROUP_COLORS: Record<number, string> = {
  1: '#7c83db',
  2: '#5ba4cf',
  3: '#5bb98c',
  4: '#c9a94e',
  5: '#c75f5f',
};

function getColor(group: number) {
  return GROUP_COLORS[group] || '#8b7fc7';
}

interface NeuralMapViewerProps {
  networkData: string;
}

export default function NeuralMapViewer({ networkData }: NeuralMapViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: any } | null>(null);

  const graphData = useMemo(() => {
    try {
      const parsed = typeof networkData === 'string' ? JSON.parse(networkData) : networkData;
      if (parsed.nodes && parsed.links) return parsed;
      return { nodes: [{ id: '1', name: 'Analysis', group: 1, val: 2 }], links: [], summary: '' };
    } catch {
      return { nodes: [{ id: '1', name: 'Parse Error', group: 1, val: 2 }], links: [], summary: '' };
    }
  }, [networkData]);

  const summary = graphData.summary || '';
  const positionsRef = useRef(new Map<string, { x: number; y: number; r: number }>());

  useEffect(() => {
    if (expanded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.parentElement?.clientWidth || 700;
    const H = 420;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const nodes = graphData.nodes as any[];
    const links = graphData.links as any[];
    const groups = new Map<number, any[]>();
    nodes.forEach(n => {
      const g = n.group || 1;
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(n);
    });

    const sortedGroups = Array.from(groups.keys()).sort((a, b) => a - b);
    const colCount = sortedGroups.length || 1;
    const positions = new Map<string, { x: number; y: number; r: number }>();
    const PAD_X = 80;
    const PAD_Y = 50;
    const usableW = W - PAD_X * 2;
    const usableH = H - PAD_Y * 2;

    sortedGroups.forEach((g, colIdx) => {
      const col = groups.get(g)!;
      const x = PAD_X + (colCount === 1 ? usableW / 2 : (colIdx / (colCount - 1)) * usableW);
      col.forEach((node, rowIdx) => {
        const y = PAD_Y + (col.length === 1 ? usableH / 2 : (rowIdx / (col.length - 1)) * usableH);
        const r = node.group === 3 ? 20 : (10 + (node.val || 2) * 2.5);
        positions.set(node.id, { x, y, r });
      });
    });
    positionsRef.current = positions;

    const particles: { link: any; progress: number; speed: number }[] = [];
    links.forEach((link: any) => {
      const count = Math.max(1, Math.min(2, link.value || 1));
      for (let i = 0; i < count; i++) {
        particles.push({ link, progress: Math.random(), speed: 0.0015 + Math.random() * 0.002 });
      }
    });

    function getCurveCP(src: { x: number; y: number }, tgt: { x: number; y: number }) {
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      return { x: (src.x + tgt.x) / 2 + dy * 0.2, y: (src.y + tgt.y) / 2 - dx * 0.2 };
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      links.forEach((link: any) => {
        const srcId = typeof link.source === 'object' ? link.source.id : link.source;
        const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
        const src = positions.get(srcId);
        const tgt = positions.get(tgtId);
        if (!src || !tgt) return;

        const srcNode = nodes.find(n => n.id === srcId);
        const tgtNode = nodes.find(n => n.id === tgtId);
        const srcColor = getColor(srcNode?.group || 1);
        const tgtColor = getColor(tgtNode?.group || 1);
        const cp = getCurveCP(src, tgt);

        const grad = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
        grad.addColorStop(0, srcColor + '45');
        grad.addColorStop(1, tgtColor + '45');
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.quadraticCurveTo(cp.x, cp.y, tgt.x, tgt.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      });

      particles.forEach(p => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        const srcId = typeof p.link.source === 'object' ? p.link.source.id : p.link.source;
        const tgtId = typeof p.link.target === 'object' ? p.link.target.id : p.link.target;
        const src = positions.get(srcId);
        const tgt = positions.get(tgtId);
        if (!src || !tgt) return;
        const cp = getCurveCP(src, tgt);
        const t = p.progress;
        const px = (1 - t) * (1 - t) * src.x + 2 * (1 - t) * t * cp.x + t * t * tgt.x;
        const py = (1 - t) * (1 - t) * src.y + 2 * (1 - t) * t * cp.y + t * t * tgt.y;
        const srcNode = nodes.find(n => n.id === srcId);
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = getColor(srcNode?.group || 1) + '80';
        ctx.fill();
      });

      nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (!pos) return;
        const color = getColor(node.group || 1);

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (node.group === 3) {
          ctx.strokeStyle = '#ffffff30';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        const fontSize = node.group === 3 ? 10.5 : 9;
        ctx.font = `${node.group === 3 ? '600' : '400'} ${fontSize}px Inter, -apple-system, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(node.name, pos.x, pos.y + pos.r + fontSize + 6);
      });

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [graphData, expanded]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const nodes = graphData.nodes as any[];
    let found: any = null;
    for (const node of nodes) {
      const pos = positionsRef.current.get(node.id);
      if (!pos) continue;
      const dx = mx - pos.x;
      const dy = my - pos.y;
      if (dx * dx + dy * dy < (pos.r + 10) * (pos.r + 10)) {
        found = node;
        break;
      }
    }
    if (found) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, node: found });
    } else {
      setTooltip(null);
    }
  }, [graphData]);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name || '';
    const r = node.group === 3 ? 12 : (6 + (node.val || 2) * 1.8);
    const color = getColor(node.group || 1);
    const fontSize = Math.max(12 / globalScale, 3.5);

    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (node.group === 3) {
      ctx.strokeStyle = '#ffffff40';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
    }
    ctx.font = `${node.group === 3 ? '600' : '400'} ${fontSize}px Inter, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(label, node.x, node.y + r + fontSize + 2);
  }, []);

  const groupLabels: Record<number, string> = {
    1: 'Macro / Market Signal',
    2: 'Technical / Fundamental',
    3: 'Decision',
    4: 'Convergence / Risk',
    5: 'Bearish Indicator',
  };

  // Summary section below graph
  const summarySection = summary ? (
    <div style={{
      padding: '14px 18px',
      borderTop: '1px solid #1e293b',
      background: '#0a0f1a',
      fontSize: '0.82rem',
      lineHeight: 1.7,
      color: '#94a3b8',
      whiteSpace: 'pre-wrap',
    }}>
      {summary}
    </div>
  ) : null;

  if (!expanded) {
    return (
      <div
        style={{ position: 'relative', width: '100%' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <div
          onClick={() => setExpanded(true)}
          style={{
            width: '100%',
            height: '420px',
            borderRadius: '10px 10px 0 0',
            overflow: 'hidden',
            background: '#0c1222',
            border: '1px solid #1e293b',
            borderBottom: summary ? 'none' : '1px solid #1e293b',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <canvas ref={canvasRef} style={{ display: 'block' }} />
          <div style={{
            position: 'absolute', bottom: '0', left: '0', right: '0',
            background: 'linear-gradient(transparent, #0c1222)',
            padding: '16px 12px 8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            fontSize: '0.68rem', color: '#475569',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            Click to expand interactive view
          </div>
        </div>

        {/* Summary below graph */}
        {summary && (
          <div style={{
            padding: '14px 18px',
            border: '1px solid #1e293b',
            borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            background: '#0a0f1a',
            fontSize: '0.82rem',
            lineHeight: 1.75,
            color: '#94a3b8',
            whiteSpace: 'pre-wrap',
          }}>
            {summary}
          </div>
        )}

        {tooltip && (
          <div style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 14, (canvasRef.current?.parentElement?.clientWidth || 500) - 260),
            top: tooltip.y - 10,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '10px 14px',
            pointerEvents: 'none',
            zIndex: 50,
            maxWidth: '260px',
            fontSize: '0.8rem',
            lineHeight: 1.5,
          }}>
            <div style={{ fontWeight: 600, color: getColor(tooltip.node.group || 1), marginBottom: '4px', fontSize: '0.85rem' }}>
              {tooltip.node.name}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
              {groupLabels[tooltip.node.group] || 'Signal'} · weight {tooltip.node.val || 1}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid #1e293b',
      background: '#0c1222',
    }}>
      <div style={{ width: '100%', height: '500px' }}>
        <ForceGraph2D
          graphData={graphData}
          width={700}
          height={500}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node: any, color, ctx) => {
            const r = node.group === 3 ? 14 : (7 + (node.val || 2) * 2);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 5, 0, Math.PI * 2);
            ctx.fill();
          }}
          nodeLabel={(node: any) => `<div style="background:#1e293b;padding:8px 12px;border-radius:6px;border:1px solid #334155;font-size:12px;color:#e2e8f0"><b style="color:${getColor(node.group)}">${node.name}</b><br/><span style="color:#64748b;font-size:11px">${groupLabels[node.group] || 'Signal'} · weight ${node.val || 1}</span></div>`}
          linkCanvasObject={(link: any, ctx: CanvasRenderingContext2D) => {
            const src = link.source;
            const tgt = link.target;
            if (!src || !tgt || src.x == null || tgt.x == null) return;
            const srcColor = getColor(src.group || 1);
            const tgtColor = getColor(tgt.group || 1);
            const dx = tgt.x - src.x;
            const dy = tgt.y - src.y;
            const cpX = (src.x + tgt.x) / 2 + dy * 0.15;
            const cpY = (src.y + tgt.y) / 2 - dx * 0.15;
            const g = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
            g.addColorStop(0, srcColor + '40');
            g.addColorStop(1, tgtColor + '40');
            ctx.beginPath();
            ctx.moveTo(src.x, src.y);
            ctx.quadraticCurveTo(cpX, cpY, tgt.x, tgt.y);
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.3;
            ctx.stroke();
          }}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={() => 0.003}
          linkDirectionalParticleColor={(link: any) => {
            const src = typeof link.source === 'object' ? link.source : null;
            return getColor(src?.group || 1) + '70';
          }}
          backgroundColor="transparent"
          cooldownTicks={80}
          d3VelocityDecay={0.25}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
      </div>
      {summarySection}
      <button
        onClick={() => setExpanded(false)}
        style={{
          width: '100%', background: 'transparent', border: 'none',
          borderTop: '1px solid #1e293b', color: '#475569',
          padding: '8px', fontSize: '0.7rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}
        onMouseOver={e => e.currentTarget.style.color = '#94a3b8'}
        onMouseOut={e => e.currentTarget.style.color = '#475569'}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
        Collapse
      </button>
    </div>
  );
}
