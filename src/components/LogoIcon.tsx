"use client";

import { useState, useEffect } from 'react';

interface LogoIconProps {
  symbol: string;
  size: number;
  fallbackBg?: string;
  fallbackColor?: string;
}

export default function LogoIcon({ symbol, size, fallbackBg = 'linear-gradient(135deg, #3b82f6, #1e1b4b)', fallbackColor = '#fff' }: LogoIconProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/market/logo?symbol=${symbol}`)
      .then(r => r.json())
      .then(data => {
        if (isMounted && data.url) {
          setLogoUrl(data.url);
        }
      })
      .catch(() => {
        if (isMounted) setError(true);
      });

    return () => { isMounted = false; };
  }, [symbol]);

  if (logoUrl && !error) {
    return (
      <img 
        src={logoUrl} 
        alt={`${symbol} logo`}
        onError={() => setError(true)}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`, 
          borderRadius: '50%', 
          objectFit: 'contain', 
          background: '#fff', 
          padding: size > 30 ? '4px' : '1px', 
          border: size > 30 ? '2px solid var(--glass-border)' : '1px solid rgba(255,255,255,0.1)'
        }}
      />
    );
  }

  const fontSize = size * 0.45;

  const MACRO_INITIALS: Record<string, string> = {
    '^IXIC': 'NQ',
    '^GSPC': 'SP',
    '^DJI': 'DJ',
    '^VIX': 'VX',
    'CL=F': 'CL',
    'GC=F': 'GL',
    '^TNX': '10Y',
    'BTC': '₿',
    'ETH': 'Ξ'
  };

  const displayText = MACRO_INITIALS[symbol] || symbol.replace(/[^A-Za-z0-9]/g, '').substring(0, 1).toUpperCase();

  return (
    <div style={{ 
      width: `${size}px`, 
      height: `${size}px`, 
      borderRadius: '50%', 
      background: fallbackBg, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontSize: `${displayText.length > 1 ? fontSize * 0.7 : fontSize}px`, 
      fontWeight: 'bold', 
      color: fallbackColor,
      border: size > 30 ? 'none' : '1px solid rgba(255,255,255,0.1)'
    }}>
      {displayText}
    </div>
  );
}
