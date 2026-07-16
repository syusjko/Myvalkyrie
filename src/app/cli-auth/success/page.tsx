import { ShieldCheck } from 'lucide-react';

export default function CliAuthSuccessPage() {
  return (
    <div style={{ padding: '4rem 2rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: '#0f172a', padding: '3rem', borderRadius: '16px', border: '1px solid #1e293b', width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        <ShieldCheck size={48} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
        <h1 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '1rem' }}>Authorization Successful!</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.6' }}>
          Your X (Twitter) account is now linked with MyValkyrie CLI.<br/>
          You can safely close this browser window and return to your terminal.
        </p>
      </div>
    </div>
  );
}
