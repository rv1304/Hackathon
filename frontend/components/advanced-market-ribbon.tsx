'use client';

import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface MarketData {
  brentCrude: number;
  brentChange: number;
  wtiCrude: number;
  wtiChange: number;
  usdInr: number;
  usdInrChange: number;
  freightIndex: number;
  freightChange: number;
  gulfRisk: string;
  gulfRiskScore: string;
  weatherIndex: number;
  weatherChange: number;
  activeTankers: number;
  portCongestion: string;
  insuranceIndex: number;
  insuranceChange: number;
}

interface AdvancedMarketRibbonProps {
  marketData: MarketData;
}

const MarketCard = ({
  label,
  value,
  unit,
  change,
  subLabel,
}: {
  label: string;
  value: string | number;
  unit?: string;
  change?: number;
  subLabel?: string;
}) => (
  <div className="bg-surface/60 border border-border-light rounded p-3 min-w-max">
    <div className="text-xs text-muted font-semibold mb-1">{label}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-bold text-foreground">
        {value}
        {unit && <span className="text-xs text-muted ml-1">{unit}</span>}
      </span>
      {change !== undefined && (
        <span
          className={`text-xs font-semibold flex items-center gap-1 ${
            change >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {change >= 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(change).toFixed(2)}%
        </span>
      )}
    </div>
    {subLabel && <div className="text-xs text-muted mt-1">{subLabel}</div>}
  </div>
);

export function AdvancedMarketRibbon({ marketData }: AdvancedMarketRibbonProps) {
  return (
    <div className="border-b border-border-light bg-surface/30 backdrop-blur px-3 py-3 overflow-x-auto">
      <div className="flex gap-2">
        <MarketCard
          label="BRENT CRUDE"
          value={`$${marketData.brentCrude.toFixed(2)}`}
          unit="/bbl"
          change={marketData.brentChange}
        />
        <MarketCard
          label="WTI CRUDE"
          value={`$${marketData.wtiCrude.toFixed(2)}`}
          unit="/bbl"
          change={marketData.wtiChange}
        />
        <MarketCard
          label="USD / INR"
          value={`₹${marketData.usdInr.toFixed(2)}`}
          change={marketData.usdInrChange}
        />
        <MarketCard
          label="FREIGHT INDEX"
          value={marketData.freightIndex.toLocaleString()}
          change={marketData.freightChange}
        />
        <div className="bg-surface/60 border border-border-light rounded p-3 min-w-max">
          <div className="text-xs text-muted font-semibold mb-1">GULF RISK</div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-orange">{marketData.gulfRisk}</span>
            <AlertTriangle className="w-4 h-4 text-orange" />
          </div>
          <div className="text-xs text-muted mt-1">{marketData.gulfRiskScore}</div>
        </div>
        <MarketCard
          label="WEATHER INDEX"
          value={`${marketData.weatherIndex}%`}
          change={marketData.weatherChange}
        />
        <MarketCard label="ACTIVE TANKERS" value={marketData.activeTankers} />
        <div className="bg-surface/60 border border-border-light rounded p-3 min-w-max">
          <div className="text-xs text-muted font-semibold mb-1">PORT CONGESTION</div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-red-400">{marketData.portCongestion}</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
        </div>
        <MarketCard
          label="INSURANCE INDEX"
          value={marketData.insuranceIndex.toFixed(2)}
          unit="x"
          change={marketData.insuranceChange}
        />
      </div>
    </div>
  );
}
