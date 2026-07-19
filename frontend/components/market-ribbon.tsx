'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketData {
  brentCrude: number;
  brentChange: number;
  wtiCrude: number;
  wtiChange: number;
  spread: number;
  volatility: number;
  updatedAt: Date;
}

export function MarketRibbon({ marketData }: { marketData: MarketData }) {
  const formatPrice = (price: number) => `$${price.toFixed(2)}/bbl`;
  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-surface border-b border-border-light px-6 py-3 flex items-center justify-between">
      {/* Left side - Market prices */}
      <div className="flex items-center gap-8 flex-1">
        {/* Brent Crude */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted uppercase tracking-wide">Brent Crude</span>
            <span className="text-lg font-bold text-foreground">{formatPrice(marketData.brentCrude)}</span>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded bg-surface-light border ${
            marketData.brentChange >= 0 ? 'border-green-dim' : 'border-red-dim'
          }`}>
            {marketData.brentChange >= 0 ? (
              <>
                <TrendingUp size={14} className="text-green" />
                <span className="text-sm text-green font-semibold">{marketData.brentChange.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <TrendingDown size={14} className="text-red" />
                <span className="text-sm text-red font-semibold">{marketData.brentChange.toFixed(1)}%</span>
              </>
            )}
          </div>
        </div>

        {/* WTI Crude */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted uppercase tracking-wide">WTI Crude</span>
            <span className="text-lg font-bold text-foreground">{formatPrice(marketData.wtiCrude)}</span>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded bg-surface-light border ${
            marketData.wtiChange >= 0 ? 'border-green-dim' : 'border-red-dim'
          }`}>
            {marketData.wtiChange >= 0 ? (
              <>
                <TrendingUp size={14} className="text-green" />
                <span className="text-sm text-green font-semibold">{marketData.wtiChange.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <TrendingDown size={14} className="text-red" />
                <span className="text-sm text-red font-semibold">{marketData.wtiChange.toFixed(1)}%</span>
              </>
            )}
          </div>
        </div>

        {/* Spread */}
        <div className="flex flex-col gap-1 pl-4 border-l border-border-light">
          <span className="text-xs text-muted uppercase tracking-wide">Spread</span>
          <span className="text-base font-semibold text-cyan">${marketData.spread.toFixed(2)}</span>
        </div>

        {/* Volatility */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted uppercase tracking-wide">Volatility</span>
          <span className="text-base font-semibold text-orange">{marketData.volatility.toFixed(1)}%</span>
        </div>
      </div>

      {/* Right side - Status and timestamp */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green animate-pulse-glow" />
          <span className="text-xs text-muted">Live</span>
        </div>
        <span className="text-xs text-muted">{formatTime(marketData.updatedAt)}</span>
      </div>
    </div>
  );
}
