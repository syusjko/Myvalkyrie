"use client";

import { usePathname } from 'next/navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isWide = pathname.startsWith('/agent/') || pathname.startsWith('/asset/');
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'transparent' }}>
      <main id="feed-start" style={{ flex: 1, width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0', background: 'transparent' }}>
        <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {children}
        </div>
      </main>
    </div>
  );
}


