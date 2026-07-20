"use client";

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

// Dynamically import ForceGraph2D to prevent SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#10b981' }}>Loading Neural Map...</div>
});

export default function NeuralMapViewer({ networkData }: { networkData: string }) {
  const graphData = useMemo(() => {
    try {
      const parsed = JSON.parse(networkData);
      // Ensure the structure matches what ForceGraph expects { nodes: [], links: [] }
      if (parsed.nodes && parsed.links) return parsed;
      // Fallback simple graph if parse fails or structure is wrong
      return { nodes: [{ id: '1', name: 'Analysis' }], links: [] };
    } catch (e) {
      return { nodes: [{ id: '1', name: 'Invalid Data' }], links: [] };
    }
  }, [networkData]);

  return (
    <div style={{ width: '100%', height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', background: '#0f172a' }}>
      <ForceGraph2D
        graphData={graphData}
        width={600}
        height={300}
        nodeLabel="name"
        nodeAutoColorBy="group"
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={d => (d as any).value * 0.001 || 0.005}
        backgroundColor="#0f172a"
        linkColor={() => 'rgba(16, 185, 129, 0.4)'}
        nodeColor={(node: any) => node.color || '#10b981'}
        nodeRelSize={6}
      />
    </div>
  );
}
