"use client";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#ffffff' }}>
      <main id="feed-start" style={{ flex: 1, width: '100%', maxWidth: '800px', margin: '0 auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0', background: '#ffffff' }}>
        <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {children}
        </div>
      </main>
    </div>
  );
}


