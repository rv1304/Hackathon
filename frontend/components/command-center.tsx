'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ShippingMap } from './shipping-map';
import { AdvancedMarketRibbon } from './advanced-market-ribbon';
import { api, formatInr } from '@/lib/api';
import { usePipelineWebSocket } from '@/lib/websocket';
import type { PipelineResult, ScoredOption, MarketSignals } from '@/lib/types';
import {
  Bell, Settings, AlertTriangle, CheckCircle, RefreshCw,
  TrendingUp, TrendingDown, Anchor, Clock, Shield, Zap, ChevronRight
} from 'lucide-react';

// ─── Static sea-route map config (unchanged) ─────────────────────────────────
const STATIC_ROUTES = [
  { id: 'route-1', supplierId: 'UAE',    origin: { name: 'Ruwais, UAE',            lng: 52.73, lat: 24.11 }, destination: { name: 'Mundra, India',         lng: 69.73, lat: 22.84 } },
  { id: 'route-2', supplierId: 'SAUDI',  origin: { name: 'Yanbu, Saudi Arabia',    lng: 38.06, lat: 24.09 }, destination: { name: 'Jamnagar, India',       lng: 69.10, lat: 22.10 } },
  { id: 'route-3', supplierId: 'IRAQ',   origin: { name: 'Basrah, Iraq',           lng: 47.80, lat: 30.50 }, destination: { name: 'Mumbai, India',         lng: 72.85, lat: 19.08 } },
  { id: 'route-4', supplierId: 'KUWAIT', origin: { name: 'Mina Al Ahmadi, Kuwait', lng: 48.08, lat: 29.08 }, destination: { name: 'Kochi, India',          lng: 76.27, lat:  9.93 } },
  { id: 'route-5', supplierId: 'NIGERIA',origin: { name: 'Bonny, Nigeria',         lng:  7.15, lat:  4.44 }, destination: { name: 'Paradip, India',        lng: 86.68, lat: 20.27 } },
  { id: 'route-6', supplierId: 'USA',    origin: { name: 'Houston, USA',           lng: -95.37,lat: 29.75 }, destination: { name: 'Visakhapatnam, India',  lng: 83.22, lat: 17.69 } },
  { id: 'route-7', supplierId: 'RUSSIA', origin: { name: 'Novorossiysk, Russia',   lng: 37.78, lat: 44.72 }, destination: { name: 'Paradip, India',        lng: 86.68, lat: 20.27 }, blocked: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function riskLabel(score: number): { label: string; cls: string } {
  if (score >= 0.75) return { label: 'HIGH',   cls: 'text-red-400 bg-red-500/15 border-red-500/30' };
  if (score >= 0.40) return { label: 'MEDIUM', cls: 'text-orange-400 bg-orange-500/15 border-orange-500/30' };
  return                     { label: 'LOW',   cls: 'text-green-400 bg-green-500/15 border-green-500/30' };
}

function geoRiskFor(supplierId: string, signals: MarketSignals): number {
  const gulfCountries = ['SAUDI', 'UAE', 'IRAQ', 'KUWAIT'];
  if (gulfCountries.includes(supplierId)) {
    return Math.min(1, signals.gulfNegativeEvents7d / 40 + signals.portCongestion * 0.3);
  }
  if (supplierId === 'RUSSIA') return 0.9;
  return 0.2 + signals.weatherSeverity * 0.3;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function LiveBadge({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
      <span className={`text-xs font-bold ${connected ? 'text-green-400' : 'text-yellow-400'}`}>
        {connected ? 'LIVE' : 'POLLING'}
      </span>
    </div>
  );
}

function MetricCard({
  label, value, sub, delta, icon: Icon, accent = 'cyan'
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  icon: React.ElementType;
  accent?: string;
}) {
  const accentCls: Record<string, string> = {
    cyan:   'border-cyan/30 text-cyan',
    green:  'border-green-500/30 text-green-400',
    orange: 'border-orange-500/30 text-orange-400',
    red:    'border-red-500/30 text-red-400',
  };
  return (
    <div className={`bg-surface border ${accentCls[accent] ?? accentCls.cyan} border-l-2 rounded-lg p-3 flex flex-col gap-1`}>
      <div className="flex items-center gap-1.5 text-xs opacity-70">
        <Icon size={11} />
        <span>{label}</span>
      </div>
      <div className="font-bold text-foreground text-sm leading-none">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
      {delta !== undefined && (
        <div className={`text-xs flex items-center gap-0.5 ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {delta >= 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
          {Math.abs(delta).toFixed(2)}%
        </div>
      )}
    </div>
  );
}

function RouteOptionRow({
  option,
  staticRoute,
  signals,
  isSelected,
  isBest,
  onClick,
}: {
  option: ScoredOption;
  staticRoute: typeof STATIC_ROUTES[0];
  signals: MarketSignals;
  isSelected: boolean;
  isBest: boolean;
  onClick: () => void;
}) {
  const landedInr = option.features.landedCostInr;
  const geoRisk = geoRiskFor(staticRoute.supplierId, signals);
  const risk = riskLabel(geoRisk);
  const isBlocked = staticRoute.blocked;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border transition-all duration-150 p-3 group ${
        isBlocked
          ? 'border-red-500/40 bg-red-900/10 opacity-70 cursor-not-allowed'
          : isSelected
          ? 'border-cyan bg-cyan/5 shadow-[0_0_0_1px_rgba(0,217,255,0.15)]'
          : 'border-border-light bg-surface hover:border-cyan/40 hover:bg-surface/80'
      }`}
      disabled={isBlocked}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-xs text-foreground truncate">
              {option.option.supplier} · {option.option.crudeGrade}
            </span>
            {isBest && !isBlocked && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan/20 text-cyan border border-cyan/30 shrink-0">
                BEST
              </span>
            )}
            {isBlocked && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red/20 text-red border border-red/30 shrink-0 animate-pulse">
                BLOCKED
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted mt-0.5 truncate">{option.option.route}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-bold text-foreground">{formatInr(landedInr)}</div>
          <div className="text-[10px] text-muted">landed/MT</div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
        <div className="text-center">
          <div className="text-muted">ETA</div>
          <div className="font-semibold text-foreground">{option.features.etaDays}d</div>
        </div>
        <div className="text-center">
          <div className="text-muted">TOPSIS</div>
          <div className="font-semibold text-cyan">{(option.topsisScore * 100).toFixed(0)}</div>
        </div>
        <div className="text-center">
          <div className="text-muted">Risk</div>
          <span className={`font-bold text-[9px] px-1 py-0.5 rounded border ${risk.cls}`}>{risk.label}</span>
        </div>
      </div>
    </button>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function CommandCenter() {
  const [pipeline, setPipeline] = useState<PipelineResult | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('');
  const mapRef = useRef(null);

  // ── Load on mount ──
  const loadPipeline = useCallback(async () => {
    try {
      const result = await api.getLatest();
      setPipeline(result);
      setLastUpdated(new Date(result.computedAt).toLocaleTimeString('en-IN'));
    } catch (e) {
      console.warn('Backend unavailable, will retry');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPipeline(); }, [loadPipeline]);

  // ── Poll every 15s as fallback ──
  useEffect(() => {
    const id = setInterval(loadPipeline, 15000);
    return () => clearInterval(id);
  }, [loadPipeline]);

  // ── WebSocket live updates ──
  usePipelineWebSocket(useCallback((data: PipelineResult) => {
    setWsConnected(true);
    setPipeline(data);
    setLastUpdated(new Date(data.computedAt).toLocaleTimeString('en-IN'));
  }, []));

  // ── Derive display data ──
  const signals = pipeline?.signals;
  const rankedOptions = pipeline?.rankedOptions ?? [];

  // Map each static route to a backend ranked option (by supplier match)
  const routeOptionPairs = STATIC_ROUTES.map((sr) => {
    const matched = rankedOptions.find(
      (o) => o.option.supplier.toUpperCase() === sr.supplierId.toUpperCase()
    ) ?? null;
    return { staticRoute: sr, option: matched };
  });

  const selectedPair = routeOptionPairs[selectedRouteIdx];
  const selectedOption = selectedPair?.option;
  const selectedStaticRoute = selectedPair?.staticRoute;
  const bestRank1 = rankedOptions.find((o) => o.rank === 1);

  // Map routes for ShippingMap component
  const mapRoutes = STATIC_ROUTES.map((sr, i) => {
    const opt = routeOptionPairs[i]?.option;
    const geo = signals ? geoRiskFor(sr.supplierId, signals) : 0.2;
    const riskStr = geo >= 0.75 ? 'HIGH' : geo >= 0.4 ? 'MEDIUM' : 'LOW';
    return {
      id: sr.id,
      origin: sr.origin,
      destination: sr.destination,
      vessel: opt?.option.supplier ?? sr.supplierId,
      eta: opt ? `${opt.features.etaDays}d` : '—',
      distance: 0,
      status: (sr.blocked ? 'blocked' : 'in-route') as 'blocked' | 'in-route',
      heading: 135,
      speed: '15 kn',
      riskScore: sr.blocked ? 'BLOCKED' : riskStr,
    };
  });

  const handleSelectRoute = (routeId: string) => {
    const idx = STATIC_ROUTES.findIndex((r) => r.id === routeId);
    if (idx !== -1) setSelectedRouteIdx(idx);
  };

  // Market data for ribbon — sourced from backend signals
  const marketData = {
    brentCrude: signals?.rawOilPriceUsd ?? 82.5,
    brentChange: signals ? (signals.rawOilPriceUsd - 82.5) / 82.5 * 100 : 0,
    wtiCrude: signals ? signals.rawOilPriceUsd * 0.946 : 78.1,
    wtiChange: 0,
    usdInr: signals?.fxRate ?? 83.45,
    usdInrChange: 0,
    freightIndex: signals ? Math.round(1200 + signals.portCongestion * 400) : 1285,
    freightChange: signals ? signals.portCongestion * 5 : 2.3,
    gulfRisk: signals ? (signals.gulfNegativeEvents7d > 25 ? 'HIGH' : signals.gulfNegativeEvents7d > 12 ? 'MEDIUM' : 'LOW') : 'MEDIUM',
    gulfRiskScore: signals ? `${signals.gulfNegativeEvents7d} events` : '—',
    weatherIndex: signals ? Math.round((1 - signals.weatherSeverity) * 100) : 68,
    weatherChange: 1,
    activeTankers: pipeline?.eligibleCount ?? 0,
    portCongestion: signals ? `${(signals.portCongestion * 100).toFixed(0)}% congested` : '—',
    insuranceIndex: signals ? 1.0 + signals.gulfNegativeEvents7d * 0.01 : 1.18,
    insuranceChange: 1.2,
  };

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="border-b border-border-light bg-surface/50 backdrop-blur px-5 py-2.5 flex-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cyan flex items-center justify-center font-bold text-background text-sm select-none">
              PI
            </div>
            <div>
              <h1 className="font-bold text-base leading-none">ProcureIntel</h1>
              <p className="text-[11px] text-muted leading-none mt-0.5">Crude Procurement Command Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LiveBadge connected={wsConnected} />
            {lastUpdated && <span className="text-xs text-muted">Updated {lastUpdated}</span>}
            <button
              onClick={async () => { setLoading(true); const r = await api.runPipeline(); setPipeline(r); setLoading(false); }}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-muted hover:text-cyan transition-colors disabled:opacity-40"
              title="Re-run pipeline"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <Bell className="w-4 h-4 text-muted cursor-pointer hover:text-foreground" />
            <Settings className="w-4 h-4 text-muted cursor-pointer hover:text-foreground" />
            <div className="w-6 h-6 rounded bg-purple/20 border border-purple flex items-center justify-center text-xs font-bold text-purple">
              RV
            </div>
          </div>
        </div>
      </header>

      {/* ── Market Ribbon (live from backend signals) ────────────── */}
      <div className="flex-none">
        <AdvancedMarketRibbon marketData={marketData} />
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left: Map */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <ShippingMap
            ref={mapRef}
            routes={mapRoutes}
            selectedRouteId={STATIC_ROUTES[selectedRouteIdx]?.id}
            onRouteSelect={handleSelectRoute}
          />

          {/* Legend */}
          <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur border border-border-light rounded-lg px-3 py-2 flex items-center gap-3 text-[10px] pointer-events-none">
            <div className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-400 inline-block rounded" />Low Risk</div>
            <div className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-400 inline-block rounded" />Medium</div>
            <div className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block rounded" />High</div>
            <div className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-600 inline-block rounded opacity-60 border-t border-dashed border-red-500" />Blocked</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan inline-block" />Vessel</div>
          </div>

          {/* Pipeline summary overlay */}
          {pipeline && (
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur border border-border-light rounded-lg px-3 py-2 text-[10px] space-y-0.5 pointer-events-none">
              <div className="text-muted font-semibold uppercase tracking-wide">Pipeline</div>
              <div className="flex items-center gap-3">
                <span className="text-foreground">{pipeline.totalCandidates} candidates</span>
                <span className="text-green-400">{pipeline.eligibleCount} eligible</span>
                <span className="text-cyan font-bold">₹{pipeline.finalPrice.toFixed(0)}/bbl</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: 370px fixed */}
        <div className="w-[370px] flex-none border-l border-border-light flex flex-col overflow-hidden bg-background">

          {/* Selected Route Detail */}
          <div className="flex-none p-3 border-b border-border-light space-y-3">

            {/* KPI row for selected option */}
            {selectedOption && signals ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-muted uppercase tracking-wide">Selected Route</div>
                    <div className="font-bold text-sm text-foreground">
                      {selectedOption.option.supplier} · {selectedOption.option.crudeGrade}
                    </div>
                    <div className="text-[10px] text-muted">{selectedStaticRoute?.origin.name} → {selectedStaticRoute?.destination.name}</div>
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-1 rounded border ${riskLabel(geoRiskFor(selectedStaticRoute?.supplierId ?? '', signals)).cls}`}>
                    {riskLabel(geoRiskFor(selectedStaticRoute?.supplierId ?? '', signals)).label} RISK
                  </div>
                </div>

                {/* 4 live metric cards */}
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard
                    label="Landed Cost"
                    value={formatInr(selectedOption.features.landedCostInr)}
                    sub="per metric ton"
                    icon={TrendingUp}
                    accent="cyan"
                  />
                  <MetricCard
                    label="Crude Price"
                    value={`$${selectedOption.option.crudePriceUsd.toFixed(2)}`}
                    sub={`FX: ₹${signals.fxRate.toFixed(2)}`}
                    icon={Zap}
                    accent={selectedOption.features.priceScore > 0.7 ? 'green' : 'orange'}
                  />
                  <MetricCard
                    label="ETA"
                    value={`${selectedOption.features.etaDays} days`}
                    sub={`Wait: ${selectedOption.option.waitDays}d`}
                    icon={Clock}
                    accent="cyan"
                  />
                  <MetricCard
                    label="TOPSIS Score"
                    value={`${(selectedOption.topsisScore * 100).toFixed(1)}`}
                    sub={`Rank #${selectedOption.rank}`}
                    icon={Shield}
                    accent={selectedOption.rank === 1 ? 'green' : selectedOption.rank <= 3 ? 'cyan' : 'orange'}
                  />
                </div>

                {/* Freight + weather */}
                <div className="flex gap-2 text-[10px]">
                  <div className="flex-1 bg-surface border border-border-light rounded p-2">
                    <div className="text-muted flex items-center gap-1"><Anchor size={9}/>Freight</div>
                    <div className="font-bold text-foreground">${selectedOption.option.freightUsd.toFixed(2)}/bbl</div>
                  </div>
                  <div className="flex-1 bg-surface border border-border-light rounded p-2">
                    <div className="text-muted">Weather Severity</div>
                    <div className="font-bold text-foreground">{(signals.weatherSeverity * 100).toFixed(0)}%</div>
                  </div>
                  <div className="flex-1 bg-surface border border-border-light rounded p-2">
                    <div className="text-muted">Port Congestion</div>
                    <div className="font-bold text-foreground">{(signals.portCongestion * 100).toFixed(0)}%</div>
                  </div>
                </div>

                {/* AI Recommendation */}
                {pipeline?.recommendation && selectedOption.rank === 1 && (
                  <div className="bg-cyan/5 border border-cyan/20 rounded-lg p-2.5">
                    <div className="text-[10px] font-bold text-cyan mb-1">🤖 AI Recommendation</div>
                    <div className="text-[10px] text-foreground leading-relaxed line-clamp-3">
                      {pipeline.recommendation.headline}
                    </div>
                    {pipeline.recommendation.estimatedSavingsInr > 0 && (
                      <div className="text-[10px] text-green-400 font-bold mt-1">
                        Estimated savings: {formatInr(pipeline.recommendation.estimatedSavingsInr)}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : loading ? (
              <div className="flex items-center gap-2 text-muted text-xs p-2">
                <RefreshCw size={12} className="animate-spin" />
                Connecting to backend…
              </div>
            ) : (
              <div className="text-muted text-xs p-2">
                ⚠️ Backend offline — start the Spring Boot server at port 8080
              </div>
            )}

            {/* Alerts */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-cyan uppercase tracking-wide">Live Alerts</div>
              {signals && signals.gulfNegativeEvents7d > 20 && (
                <div className="flex items-start gap-1.5 text-[10px] p-1.5 bg-red/10 border border-red/25 rounded">
                  <AlertTriangle size={9} className="text-red-400 shrink-0 mt-0.5"/>
                  <span className="text-red-300">{signals.gulfNegativeEvents7d} Gulf incidents in 7 days — elevated risk</span>
                </div>
              )}
              {signals && signals.weatherSeverity > 0.5 && (
                <div className="flex items-start gap-1.5 text-[10px] p-1.5 bg-orange/10 border border-orange/25 rounded">
                  <AlertTriangle size={9} className="text-orange-400 shrink-0 mt-0.5"/>
                  <span className="text-orange-300">High weather severity ({(signals.weatherSeverity * 100).toFixed(0)}%) — delays possible</span>
                </div>
              )}
              {signals && signals.portCongestion > 0.5 && (
                <div className="flex items-start gap-1.5 text-[10px] p-1.5 bg-orange/10 border border-orange/25 rounded">
                  <AlertTriangle size={9} className="text-orange-400 shrink-0 mt-0.5"/>
                  <span className="text-orange-300">Port congestion {(signals.portCongestion * 100).toFixed(0)}% — rerouting advised</span>
                </div>
              )}
              <div className="flex items-start gap-1.5 text-[10px]">
                <CheckCircle size={9} className="text-green-400 shrink-0 mt-0.5"/>
                <span className="text-green-300">{pipeline?.eligibleCount ?? 0} routes cleared eligibility filter</span>
              </div>
            </div>
          </div>

          {/* Route Option List (scrollable) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] font-bold text-cyan uppercase tracking-wide">
                Ranked Procurement Options
              </div>
              <div className="text-[10px] text-muted">
                {rankedOptions.length} options
              </div>
            </div>

            {routeOptionPairs.map((pair, idx) => {
              if (!pair.option) return null;
              return (
                <RouteOptionRow
                  key={pair.staticRoute.id}
                  option={pair.option}
                  staticRoute={pair.staticRoute}
                  signals={signals ?? { rawOilPriceUsd: 82.5, fxRate: 83.45, weatherSeverity: 0.15, portCongestion: 0.22, gulfNegativeEvents7d: 12, priceVolatility30d: 0.09, monsoonFactor: 1, updatedAt: '' }}
                  isSelected={idx === selectedRouteIdx}
                  isBest={pair.option.rank === 1}
                  onClick={() => {
                    setSelectedRouteIdx(idx);
                  }}
                />
              );
            })}

            {/* Bottom: market signals summary */}
            {signals && (
              <div className="mt-3 pt-3 border-t border-border-light">
                <div className="text-[10px] font-bold text-cyan uppercase tracking-wide mb-2">Market Signals (Live)</div>
                <div className="space-y-1.5 text-[10px]">
                  {[
                    ['Brent Crude', `$${signals.rawOilPriceUsd.toFixed(2)}/bbl`],
                    ['USD/INR FX', `₹${signals.fxRate.toFixed(2)}`],
                    ['Weather Severity', `${(signals.weatherSeverity * 100).toFixed(0)}%`],
                    ['Port Congestion', `${(signals.portCongestion * 100).toFixed(0)}%`],
                    ['Gulf Incidents (7d)', `${signals.gulfNegativeEvents7d}`],
                    ['Price Volatility 30d', `${(signals.priceVolatility30d * 100).toFixed(1)}%`],
                    ['Monsoon Factor', `${signals.monsoonFactor.toFixed(2)}×`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-muted">{k}</span>
                      <span className="font-semibold text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Run pipeline button */}
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const r = await api.runPipeline();
                  setPipeline(r);
                  setLastUpdated(new Date(r.computedAt).toLocaleTimeString('en-IN'));
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full mt-3 py-2.5 rounded-lg bg-cyan/10 border border-cyan/30 text-cyan text-xs font-bold hover:bg-cyan/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Recalculating…' : 'Re-run Pricing Pipeline'}
              <ChevronRight size={12}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
