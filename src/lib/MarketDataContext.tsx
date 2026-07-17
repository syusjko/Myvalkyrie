"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface MarketData {
  prices: Record<string, number>;
  details: Record<string, { price: number, change: number, changePercent: number }>;
  ticks: Record<string, 'up' | 'down' | null>;
  leaderboard: any[];
}

const MarketDataContext = createContext<MarketData | undefined>(undefined);

function getDynamicWatchlist() {
  const hour = new Date().getUTCHours();
  if (hour >= 0 && hour < 7) {
    return ['^KS11', 'N225', '000001.SS', '^HSI', '005930.KS', '000660.KS', '6758.T', '7203.T', 'BTC', 'ETH', 'SOL', 'DOGE', 'CL=F', 'GC=F'];
  } else if (hour >= 7 && hour < 13) {
    return ['^GDAXI', '^FTSE', '^FCHI', '^STOXX50E', 'ASML.AS', 'SAP.DE', 'SIE.DE', 'MC.PA', 'BTC', 'ETH', 'SOL', 'DOGE', 'CL=F', 'GC=F'];
  }
  return ['^GSPC', '^IXIC', '^DJI', '^VIX', 'AAPL', 'TSLA', 'NFLX', 'MSFT', 'NVDA', 'BTC', 'ETH', 'SOL', 'DOGE', 'CL=F', 'GC=F'];
}

export function MarketDataProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [details, setDetails] = useState<Record<string, { price: number, change: number, changePercent: number }>>({});
  const [ticks, setTicks] = useState<Record<string, 'up' | 'down' | null>>({});
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  const prevPricesRef = useRef<Record<string, number>>({});
  const pricesStateRef = useRef<Record<string, number>>({});
  const detailsStateRef = useRef<Record<string, { price: number, change: number, changePercent: number }>>({});

  // Sync refs with state for use in callbacks
  useEffect(() => {
    pricesStateRef.current = prices;
  }, [prices]);

  useEffect(() => {
    detailsStateRef.current = details;
  }, [details]);

  const fetchData = async () => {
    try {
      const symbols = Array.from(new Set([...getDynamicWatchlist(), '^GSPC', '^NDX', '^DJI', 'IWM', '^IXIC']));
      const symbolsQuery = symbols.join(',');
      
      const [priceRes, leadRes] = await Promise.all([
        fetch(`/api/market/prices?symbols=${symbolsQuery}`),
        fetch('/api/leaderboard')
      ]);
      const priceData = await priceRes.json();
      const leadData = await leadRes.json();

      const fetchedPrices = priceData.prices || {};
      const fetchedDetails = priceData.details || {};
      const newTicks: Record<string, 'up' | 'down' | null> = {};

      Object.keys(fetchedPrices).forEach(sym => {
        const oldPrice = prevPricesRef.current[sym];
        const newPrice = fetchedPrices[sym];
        
        // Flag tick only if it's a real change and not starting from 0
        if (oldPrice !== undefined && oldPrice > 0 && newPrice > 0 && newPrice !== oldPrice) {
          newTicks[sym] = newPrice > oldPrice ? 'up' : 'down';
        }
      });

      setPrices(fetchedPrices);
      setDetails(fetchedDetails);
      if (leadData.leaderboard) setLeaderboard(leadData.leaderboard);

      if (Object.keys(newTicks).length > 0) {
        setTicks(prev => ({ ...prev, ...newTicks }));
        setTimeout(() => {
          setTicks(prev => {
            const cleared = { ...prev };
            Object.keys(newTicks).forEach(sym => {
              cleared[sym] = null;
            });
            return cleared;
          });
        }, 1000);
      }

      prevPricesRef.current = fetchedPrices;
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const fetchInterval = setInterval(fetchData, 6000); // Fetch real data every 6s
    return () => clearInterval(fetchInterval);
  }, []);

  // Simulate micro-fluctuations (every 300ms) to look hyper real-time
  useEffect(() => {
    const microTick = () => {
      const currentPrices = { ...pricesStateRef.current };
      const currentDetails = { ...detailsStateRef.current };
      const microTicks: Record<string, 'up' | 'down' | null> = {};

      // Select 1-3 random assets to fluctuate
      const symbols = Object.keys(currentPrices).filter(sym => currentPrices[sym] > 0);
      if (symbols.length === 0) return;

      const numChanges = Math.floor(Math.random() * 3) + 1;
      let changed = false;

      for (let i = 0; i < numChanges; i++) {
        const sym = symbols[Math.floor(Math.random() * symbols.length)];
        const oldPrice = currentPrices[sym];
        
        // Very tiny change (-0.02% to +0.02%)
        const percentChange = (Math.random() * 0.04 - 0.02) / 100;
        if (percentChange === 0) continue;

        const delta = oldPrice * percentChange;
        const newPrice = oldPrice + delta;

        currentPrices[sym] = newPrice;
        microTicks[sym] = newPrice > oldPrice ? 'up' : 'down';

        if (currentDetails[sym]) {
          const detail = currentDetails[sym];
          currentDetails[sym] = {
            ...detail,
            price: newPrice,
            change: detail.change + delta,
            changePercent: ((detail.price + delta - (detail.price - detail.change)) / (detail.price - detail.change)) * 100
          };
        }
        changed = true;
      }

      if (changed) {
        setPrices(currentPrices);
        setDetails(currentDetails);
        setTicks(prev => ({ ...prev, ...microTicks }));
        setTimeout(() => {
          setTicks(prev => {
            const cleared = { ...prev };
            Object.keys(microTicks).forEach(sym => {
              cleared[sym] = null;
            });
            return cleared;
          });
        }, 600);
      }
    };

    const microInterval = setInterval(microTick, 400); // Trigger micro tick every 400ms
    return () => clearInterval(microInterval);
  }, []);

  return (
    <MarketDataContext.Provider value={{ prices, details, ticks, leaderboard }}>
      {children}
    </MarketDataContext.Provider>
  );
}

export function useMarketData() {
  const context = useContext(MarketDataContext);
  if (!context) {
    throw new Error('useMarketData must be used within a MarketDataProvider');
  }
  return context;
}
