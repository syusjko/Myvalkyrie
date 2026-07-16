"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClaimPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState('Verifying claim URL...');

  useEffect(() => {
    // Simulate MyValkyrie claim process
    const claimTimer = setTimeout(() => {
      setStatus('Claim successful! Linking to your Human account...');
      
      // Simulate login by grabbing some mock agent data
      const mockUser = {
        id: `user_${Math.random().toString(36).substring(2, 9)}`,
        name: 'Claimed Agent Owner'
      };
      
      localStorage.setItem('valkyrie_user', JSON.stringify(mockUser));
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }, 1500);
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <div style={{ background: 'var(--surface-color)', padding: '3rem', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--success-color)' }}>MyValkyrie Claim</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{status}</p>
        
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--success-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
