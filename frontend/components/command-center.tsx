'use client';

import { useState, useRef } from 'react';
import { ShippingMap } from './shipping-map';
import { AdvancedMarketRibbon } from './advanced-market-ribbon';
import { RecommendationPanel } from './recommendation-panel';
import { SupplierRanking } from './supplier-ranking';
import { RouteDetails } from './route-details';
import { DecisionTimeline } from './decision-timeline';
import { Bell, Settings } from 'lucide-react';

export function CommandCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOption, setSelectedOption] = useState(0);
  const [selectedRoute, setSelectedRoute] = useState('route-1');
  const mapRef = useRef(null);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'routes', label: 'Routes' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'simulator', label: 'Scenario Simulator' },
    { id: 'reports', label: 'Reports' },
    { id: 'admin', label: 'Admin' },
  ];

  // Simulated live shipping routes data with curved paths
  const shippingRoutes = [
    {
      id: 'route-1',
      origin: { name: 'Basrah, Iraq', lng: 47.8, lat: 30.5 },
      destination: { name: 'Mumbai, India', lng: 72.8479, lat: 19.0760 },
      vessel: 'BASRA LIGHT',
      eta: '11d 04h',
      distance: 1420,
      speed: '17.4 kn',
      status: 'in-route',
      heading: 160,
      fuelCost: 318,
      freightCost: 420,
      insurance: 1.18,
      riskScore: 'MEDIUM',
      avgSpeed: '17.4 kn',
    },
    {
      id: 'route-2',
      origin: { name: 'Fujairah, UAE', lng: 56.35, lat: 25.1165 },
      destination: { name: 'Jamnagar, India', lng: 69.1, lat: 22.1 },
      vessel: 'MURBAN',
      eta: '8d 12h',
      distance: 1150,
      speed: '18.2 kn',
      status: 'loading',
      heading: 145,
      fuelCost: 285,
      freightCost: 380,
      insurance: 1.12,
      riskScore: 'LOW',
      avgSpeed: '18.2 kn',
    },
  ];

  // Live market data
  const marketData = {
    brentCrude: 81.62,
    brentChange: 1.42,
    wtiCrude: 77.19,
    wtiChange: 1.21,
    usdInr: 96.38,
    usdInrChange: -0.21,
    freightIndex: 1285,
    freightChange: 2.31,
    gulfRisk: 'MEDIUM',
    gulfRiskScore: '56 ms',
    weatherIndex: 68,
    weatherChange: 1,
    activeTankers: 42,
    portCongestion: '3 Delayed',
    insuranceIndex: 1.18,
    insuranceChange: 1.2,
  };

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border-light bg-surface/50 backdrop-blur px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan flex items-center justify-center font-bold text-background text-sm">
              PI
            </div>
            <div>
              <h1 className="font-bold text-lg">ProcureIntel</h1>
              <p className="text-xs text-muted">Crude Procurement Command Center</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-green-400">LIVE</span>
            </div>
            <span className="text-xs text-muted">11:25 AM IST</span>
            <Bell className="w-4 h-4 text-muted cursor-pointer hover:text-foreground" />
            <Settings className="w-4 h-4 text-muted cursor-pointer hover:text-foreground" />
            <div className="w-6 h-6 rounded bg-purple/20 border border-purple flex items-center justify-center text-xs font-bold">
              RV
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-border-light bg-surface/30 px-6 flex gap-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-cyan text-cyan'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Market Ribbon */}
      <AdvancedMarketRibbon marketData={marketData} />

      {/* Main Content */}
      {activeTab === 'overview' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Map + Recommendation */}
          <div className="flex flex-1 gap-3 p-3 overflow-hidden">
            {/* Map Section - 65% */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              {/* Map Tabs */}
              <div className="flex gap-2 border-b border-border-light px-3 pt-2">
                <button className="px-3 py-2 text-sm font-medium text-cyan border-b-2 border-cyan">
                  MAP
                </button>
                <button className="px-3 py-2 text-sm text-muted hover:text-foreground">
                  ROUTES
                </button>
                <button className="px-3 py-2 text-sm text-muted hover:text-foreground">
                  LAYERS
                </button>
              </div>

              {/* Map Container */}
              <div className="flex-1 bg-black/40 rounded border border-border-light overflow-hidden relative">
                <ShippingMap
                  ref={mapRef}
                  routes={shippingRoutes}
                  selectedRouteId={selectedRoute}
                  onRouteSelect={setSelectedRoute}
                />
              </div>

              {/* Bottom Grid: Decision Timeline + Route Details + Alerts */}
              <div className="grid grid-cols-3 gap-3 h-48">
                <DecisionTimeline />
                <RouteDetails route={shippingRoutes.find((r) => r.id === selectedRoute)} />
                <div className="bg-surface border border-border-light rounded p-3 overflow-y-auto">
                  <h3 className="text-xs font-bold text-cyan mb-2">ALERTS & NOTIFICATIONS</h3>
                  <div className="space-y-2">
                    <div className="text-xs p-2 bg-orange/10 border border-orange/30 rounded">
                      <div className="font-semibold text-orange">Mumbai Port congestion expected in 2 days</div>
                      <div className="text-muted">High Impact • 2m ago</div>
                    </div>
                    <div className="text-xs p-2 bg-green/10 border border-green/30 rounded">
                      <div className="font-semibold text-green">Weather improving in Arabian Sea</div>
                      <div className="text-muted">Low Impact • 8m ago</div>
                    </div>
                    <div className="text-xs p-2 bg-orange/10 border border-orange/30 rounded">
                      <div className="font-semibold text-orange">Insurance rates may increase if tensions escalate</div>
                      <div className="text-muted">Medium Impact • 10m ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - 35% */}
            <div className="w-[35%] flex flex-col gap-3 min-w-0 overflow-hidden">
              <RecommendationPanel
                selectedOption={selectedOption}
                onSelectOption={setSelectedOption}
                routes={shippingRoutes}
              />

              {/* Supplier Ranking */}
              <SupplierRanking />
            </div>
          </div>
        </div>
      )}

      {/* Placeholder for other tabs */}
      {activeTab !== 'overview' && (
        <div className="flex-1 flex items-center justify-center text-muted">
          <p className="text-lg">{tabs.find((t) => t.id === activeTab)?.label} tab coming soon...</p>
        </div>
      )}
    </div>
  );
}
