"use client";

import dynamic from 'next/dynamic';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f180', fontSize: '0.75rem' }}>⟐</div>
});

const GROUP_COLORS: Record<number, string> = {
  1: '#6366f1', // input / macro - indigo
  2: '#0ea5e9', // processing / technical - sky  
  3: '#10b981', // decision - emerald
  4: '#f59e0b', // risk / convergence - amber
  5: '#ef4444', // bearish - red
};

function getColor(group: number) {
  return GROUP_COLORS[group] || '#8b5cf6';
}

interface NeuralMapViewerProps {
  networkData: string;
}

export default function NeuralMapViewer({ networkData }: NeuralMapViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const graphData = useMemo(() => {
    try {
      const parsed = typeof networkData === 'string' ? JSON.parse(networkData) : networkData;
      if (parsed.nodes && parsed.links) return parsed;
      return { nodes: [{ id: '1', name: 'Analysis', group: 1, val: 2 }], links: [] };
    } catch {
      return { nodes: [{ id: '1', name: 'Parse Error', group: 1, val: 2 }], links: [] };
    }
  }, [networkData]);

  // ── Static Canvas Neural Network (compact view) ──
  useEffect(() => {
    if (expanded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.parentElement?.clientWidth || 560;
    const H = 180;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    // Layout: arrange nodes in columns by group
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
    const positions = new Map<string, { x: number; y: number }>();
    const PAD_X = 60;
    const PAD_Y = 30;
    const usableW = W - PAD_X * 2;
    const usableH = H - PAD_Y * 2;

    sortedGroups.forEach((g, colIdx) => {
      const col = groups.get(g)!;
      const x = PAD_X + (colCount === 1 ? usableW / 2 : (colIdx / (colCount - 1)) * usableW);
      col.forEach((node, rowIdx) => {
        const y = PAD_Y + (col.length === 1 ? usableH / 2 : (rowIdx / (col.length - 1)) * usableH);
        positions.set(node.id, { x, y });
      });
    });

    let t = 0;
    const particles: { link: any; progress: number; speed: number }[] = [];
    links.forEach((link: any) => {
      const count = Math.max(1, Math.min(3, link.value || 1));
      for (let i = 0; i < count; i++) {
        particles.push({
          link,
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.004,
        });
      }
    });

    function draw() {
      if (!ctx || !canvas) return;
      const w = W;
      const h = H;
      ctx.clearRect(0, 0, w, h);

      t += 0.01;

      // Draw connections
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

        // Bezier curve
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        const curvature = 0.2 + Math.sin(t + src.x * 0.01) * 0.1;
        const cpX = midX + dy * curvature;
        const cpY = midY - dx * curvature;

        // Glow line
        const grad = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
        grad.addColorStop(0, srcColor + '30');
        grad.addColorStop(1, tgtColor + '30');
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.quadraticCurveTo(cpX, cpY, tgt.x, tgt.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Brighter inner line
        const grad2 = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
        grad2.addColorStop(0, srcColor + '15');
        grad2.addColorStop(1, tgtColor + '15');
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.quadraticCurveTo(cpX, cpY, tgt.x, tgt.y);
        ctx.strokeStyle = grad2;
        ctx.lineWidth = 4;
        ctx.stroke();
      });

      // Draw particles flowing along links
      particles.forEach(p => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        const srcId = typeof p.link.source === 'object' ? p.link.source.id : p.link.source;
        const tgtId = typeof p.link.target === 'object' ? p.link.target.id : p.link.target;
        const src = positions.get(srcId);
        const tgt = positions.get(tgtId);
        if (!src || !tgt) return;

        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        const curvature = 0.2 + Math.sin(t + src.x * 0.01) * 0.1;
        const cpX = midX + dy * curvature;
        const cpY = midY - dx * curvature;

        // Quadratic bezier point at t
        const tt = p.progress;
        const px = (1 - tt) * (1 - tt) * src.x + 2 * (1 - tt) * tt * cpX + tt * tt * tgt.x;
        const py = (1 - tt) * (1 - tt) * src.y + 2 * (1 - tt) * tt * cpY + tt * tt * tgt.y;

        const srcNode = nodes.find(n => n.id === srcId);
        const color = getColor(srcNode?.group || 1);

        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw nodes
      nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (!pos) return;
        const color = getColor(node.group || 1);
        const r = node.group === 3 ? 16 : (8 + (node.val || 2) * 2);

        // Outer glow
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = color + '10';
        ctx.fill();

        // Pulse ring for decision nodes
        if (node.group === 3) {
          const pulseR = r + 4 + Math.sin(t * 3) * 3;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = color + '40';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        const nodeGrad = ctx.createRadialGradient(pos.x - r * 0.3, pos.y - r * 0.3, 0, pos.x, pos.y, r);
        nodeGrad.addColorStop(0, color + 'dd');
        nodeGrad.addColorStop(1, color + '88');
        ctx.fillStyle = nodeGrad;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner highlight
        ctx.beginPath();
        ctx.arc(pos.x - r * 0.2, pos.y - r * 0.2, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fill();

        // Label
        const fontSize = node.group === 3 ? 9 : 7.5;
        ctx.font = `${node.group === 3 ? '600' : '500'} ${fontSize}px Inter, -apple-system, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(node.name, pos.x, pos.y + r + fontSize + 4);
      });

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [graphData, expanded]);

  // ── Expanded ForceGraph callbacks ──
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name || '';
    const r = node.group === 3 ? 10 : (4 + (node.val || 2) * 1.5);
    const color = getColor(node.group || 1);
    const fontSize = Math.max(11 / globalScale, 3);

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, 0, node.x, node.y, r);
    grad.addColorStop(0, color + 'ee');
    grad.addColorStop(1, color + '99');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ring for decision
    if (node.group === 3) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
    }

    // Label
    ctx.font = `${node.group === 3 ? '600' : '500'} ${fontSize}px Inter, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(label, node.x, node.y + r + fontSize + 1);
  }, []);

  if (!expanded) {
    return (
      <div
        ref={containerRef}
        onClick={() => setExpanded(true)}
        style={{
          position: 'relative',
          width: '100%',
          height: '180px',
          borderRadius: '10px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(2,6,23,0.9), rgba(15,23,42,0.9))',
          border: '1px solid rgba(99,102,241,0.12)',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
        }}
        onMouseOver={e => {
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(99,102,241,0.08)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.12)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block' }} />
        {/* Expand hint overlay */}
        <div style={{
          position: 'absolute', bottom: '0', left: '0', right: '0',
          background: 'linear-gradient(transparent, rgba(2,6,23,0.85))',
          padding: '20px 12px 8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          fontSize: '0.68rem', color: 'rgba(148,163,184,0.6)', letterSpacing: '0.03em',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          Click to expand interactive view
        </div>
      </div>
    );
  }

  // ── Expanded interactive view ──
  return (
    <div style={{
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid rgba(99,102,241,0.15)',
      background: 'linear-gradient(135deg, rgba(2,6,23,0.95), rgba(15,23,42,0.95))',
    }}>
      <div style={{ width: '100%', height: '320px' }}>
        <ForceGraph2D
          graphData={graphData}
          width={580}
          height={320}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={(node: any, color, ctx) => {
            const r = node.group === 3 ? 12 : (5 + (node.val || 2) * 2);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 5, 0, Math.PI * 2);
            ctx.fill();
          }}
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

            // Glow line
            ctx.beginPath();
            ctx.moveTo(src.x, src.y);
            ctx.quadraticCurveTo(cpX, cpY, tgt.x, tgt.y);
            ctx.strokeStyle = srcColor + '18';
            ctx.lineWidth = 5;
            ctx.stroke();

            // Core line
            const g = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
            g.addColorStop(0, srcColor + '50');
            g.addColorStop(1, tgtColor + '50');
            ctx.beginPath();
            ctx.moveTo(src.x, src.y);
            ctx.quadraticCurveTo(cpX, cpY, tgt.x, tgt.y);
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }}
          linkDirectionalParticles={3}
          linkDirectionalParticleWidth={2.5}
          linkDirectionalParticleSpeed={(d: any) => 0.004}
          linkDirectionalParticleColor={(link: any) => {
            const src = typeof link.source === 'object' ? link.source : null;
            return getColor(src?.group || 1);
          }}
          backgroundColor="transparent"
          cooldownTicks={80}
          d3VelocityDecay={0.25}
          d3AlphaDecay={0.02}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
      </div>
      <button
        onClick={() => setExpanded(false)}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.02)',
          border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          color: 'rgba(148,163,184,0.6)',
          padding: '8px',
          fontSize: '0.7rem',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          transition: 'all 0.15s',
        }}
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(148,163,184,0.6)'; }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
        Collapse
      </button>
    </div>
  );
}
