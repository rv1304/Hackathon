'use client';

import { useState, useRef } from 'react';
import { ShippingMap } from './shipping-map';
import { MarketRibbon } from './market-ribbon';
import { RecommendationPanel } from './recommendation-panel';
import { DeveloperMode } from './developer-mode';

export function CommandCenter() {
  const [selectedOption, setSelectedOption] = useState(0);
  const [showDeveloperMode, setShowDeveloperMode] = useState(false);
  const mapRef = useRef(null);

  // Simulated live shipping routes data
  const shippingRoutes = [
    {
      id: 'route-1',
      origin: { name: 'Ras Al Khaimah', lng: 55.9754, lat: 25.7833 },
      destination: { name: 'Paradip Port, India', lng: 86.6, lat: 19.87 },
      vessel: 'MT Marjan Explorer',
      eta: '18 Jan 2026',
      distance: 2847,
      status: 'transit',
      heading: 145,
    },
    {
      id: 'route-2',
      origin: { name: 'Yanbu, Saudi Arabia', lng: 38.0547, lat: 24.1294 },
      destination: { name: 'Paradip Port, India', lng: 86.6, lat: 19.87 },
      vessel: 'MT Al Waha',
      eta: '22 Jan 2026',
      distance: 3105,
      status: 'transit',
      heading: 155,
    },
    {
      id: 'route-3',
      origin: { name: 'Basrah, Iraq', lng: 47.8, lat: 30.5 },
      destination: { name: 'Mangalore Port, India', lng: 74.86, lat: 12.97 },
      vessel: 'MT Gulf Liberty',
      eta: '25 Jan 2026',
      distance: 2456,
      status: 'loading',
      heading: 160,
    },
  ];

  // Live market data
  const marketData = {
    brentCrude: 87.42,
    brentChange: 2.8,
    wtiCrude: 82.15,
    wtiChange: 1.9,
    spread: 5.27,
    volatility: 18.3,
    updatedAt: new Date(),
  };

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header with market ribbon */}
      <MarketRibbon marketData={marketData} />

      {/* Main content area: Map + Recommendation side-by-side */}
      <div className="flex-1 flex overflow-hidden">
        {/* Shipping Map - 65-70% */}
        <div className="flex-1 bg-black/20 relative">
          <ShippingMap
            ref={mapRef}
            routes={shippingRoutes}
            selectedRouteId={shippingRoutes[selectedOption]?.id}
          />

          {/* Developer Mode toggle */}
          <button
            onClick={() => setShowDeveloperMode(!showDeveloperMode)}
            className="absolute bottom-4 left-4 px-3 py-1 bg-surface/80 border border-border-light text-xs text-muted hover:text-foreground transition-colors rounded"
          >
            {showDeveloperMode ? '◉ Dev Mode' : '○ Dev Mode'}
          </button>
        </div>

        {/* Recommendation Panel - 30-35% */}
        <div className="w-[35%] bg-surface border-l border-border-light flex flex-col overflow-hidden">
          <RecommendationPanel
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            routes={shippingRoutes}
            showDeveloperDetails={showDeveloperMode}
          />
        </div>
      </div>

      {/* Developer Mode Overlay */}
      {showDeveloperMode && (
        <div className="absolute inset-0 pointer-events-none">
          <DeveloperMode routes={shippingRoutes} />
        </div>
      )}
    </div>
  );
}
