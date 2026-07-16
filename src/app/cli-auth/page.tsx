"use client";

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Terminal, ShieldCheck, AlertTriangle } from 'lucide-react';

function CliAuthContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const device = searchParams.get('device');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleAuthorize = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/cli-token/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceCode: device })
      });
      
      const data = await res.json();
      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (e) {
      setStatus('error');
    }
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
            <p style={{ color: '#94a3b8' }}>You can now return to your terminal.</p>
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
