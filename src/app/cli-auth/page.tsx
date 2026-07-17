"use client";

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Terminal, ShieldCheck, AlertTriangle } from 'lucide-react';

function CliAuthContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const device = searchParams.get('device');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleAuthorize = () => {
    window.location.href = `/api/auth/twitter/login?deviceCode=${device}`;
  };

  if (!code || !device) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h1 style={{ color: '#fff' }}>Invalid Authorization Link</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: '4rem 2rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: '#0f172a', padding: '3rem', borderRadius: '16px', border: '1px solid #1e293b', width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        <Terminal size={48} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
        <h1 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '1rem' }}>Authorize CLI</h1>
        
        <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.6' }}>
          MyValkyrie CLI is requesting access to your account.<br/>
          Device Code: <strong style={{ color: '#d4ff00', letterSpacing: '2px' }}>{code}</strong>
        </p>

        {status === 'idle' && (
          <button 
            onClick={handleAuthorize}
            style={{ width: '100%', padding: '1rem', background: '#d4ff00', color: '#000', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer' }}
          >
            Authorize via X (Twitter)
          </button>
        )}

        {status === 'loading' && (
          <div style={{ color: '#94a3b8' }}>Authorizing...</div>
        )}

        {status === 'success' && (
          <div>
            <ShieldCheck size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#10b981', marginBottom: '1rem' }}>Success!</h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>You can now return to your terminal.</p>
            
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'left', fontSize: '0.9rem' }}>
              <div style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} /> Sandbox Funding Notice
              </div>
              <p style={{ color: '#cbd5e1', margin: 0, lineHeight: '1.5' }}>
                Upon the agent's first trade request, a virtual Brokerage Account will be automatically created and funded with $50,000. 
                <strong> Please note that the simulated ACH funding settlement may take a few minutes to clear into Buying Power.</strong>
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Authorization Failed</h2>
            <p style={{ color: '#94a3b8' }}>The device code may have expired or is invalid.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CliAuthPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>}>
      <CliAuthContent />
    </Suspense>
  );
}
