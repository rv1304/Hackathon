'use client';

import { useEffect, useRef, forwardRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Route {
  id: string;
  origin: { name: string; lng: number; lat: number };
  destination: { name: string; lng: number; lat: number };
  vessel: string;
  eta: string;
  distance: number;
  status: 'in-route' | 'transit' | 'loading' | 'idle' | 'blocked';
  heading: number;
  speed?: string;
  riskScore?: string;
}

interface ShippingMapProps {
  routes: Route[];
  selectedRouteId?: string;
  onRouteSelect?: (routeId: string) => void;
}

// Hardcoded sea-route waypoints for each route to follow actual shipping lanes
const SEA_ROUTE_WAYPOINTS: Record<string, [number, number][]> = {
  // Ras Al Khaimah → Mumbai: Gulf of Oman → Arabian Sea
  'route-1': [
    [55.94, 25.79],   // Ras Al Khaimah
    [57.50, 23.60],   // Strait of Hormuz exit
    [59.00, 21.50],   // Arabian Sea approach
    [63.00, 20.00],   // Mid Arabian Sea
    [67.50, 19.50],   // Indian Ocean approach
    [72.84, 19.08],   // Mumbai
  ],
  // Yanbu → Jamnagar: Red Sea → Suez / Indian Ocean
  'route-2': [
    [38.06, 24.09],   // Yanbu
    [37.80, 20.00],   // Red Sea southward
    [43.30, 12.60],   // Bab-el-Mandeb Strait
    [48.50, 11.50],   // Gulf of Aden
    [55.00, 13.00],   // Arabian Sea
    [60.00, 16.00],   // Mid route
    [64.00, 18.00],   // NW Indian Ocean
    [67.00, 20.50],   // Approach
    [69.10, 22.10],   // Jamnagar
  ],
  // Basrah → Mumbai: Arabian Gulf → Strait of Hormuz → Arabian Sea
  'route-3': [
    [47.80, 30.50],   // Basrah
    [50.20, 27.00],   // Down the Gulf
    [56.30, 24.50],   // Near Musandam
    [57.80, 23.40],   // Strait of Hormuz
    [60.00, 21.50],   // Gulf of Oman
    [64.00, 19.50],   // Arabian Sea
    [68.00, 19.00],   // Mid Arabian Sea
    [72.84, 19.08],   // Mumbai
  ],
  // Ruwais → Vadinar: Gulf → Hormuz → short Arabian Sea
  'route-4': [
    [52.73, 24.11],   // Ruwais
    [55.00, 24.50],   // East along Gulf
    [57.50, 23.50],   // Hormuz
    [59.00, 22.50],   // Gulf of Oman
    [62.00, 21.00],   // Arabian Sea
    [66.00, 21.00],   // Approach
    [69.70, 22.40],   // Vadinar
  ],
  // Kuwait → Kochi: Gulf → Hormuz → full Arabian Sea
  'route-5': [
    [48.08, 29.08],   // Kuwait
    [50.50, 26.50],   // Down the Gulf
    [56.50, 24.00],   // Near Hormuz
    [57.80, 23.00],   // Hormuz exit
    [60.50, 21.00],   // Gulf of Oman
    [65.00, 16.00],   // Arabian Sea
    [70.00, 12.00],   // Approaching India west coast
    [73.00, 11.00],   // Off Goa
    [76.27, 9.93],    // Kochi
  ],
  // Novorossiysk → Paradip: Black Sea → Bosphorus → Med → Suez → Indian Ocean
  'route-6': [
    [37.78, 44.72],   // Novorossiysk
    [31.00, 41.00],   // Black Sea
    [28.97, 41.01],   // Bosphorus (Istanbul)
    [26.00, 40.00],   // Aegean Sea
    [25.00, 37.50],   // Aegean exit
    [23.00, 34.50],   // Eastern Mediterranean
    [32.60, 32.00],   // Suez Canal (Port Said)
    [32.60, 30.00],   // Suez Canal mid
    [32.60, 28.00],   // Red Sea entry
    [37.00, 21.00],   // Red Sea
    [43.30, 12.60],   // Bab-el-Mandeb
    [50.00, 11.50],   // Gulf of Aden
    [58.00, 11.00],   // Arabian Sea
    [65.00, 13.00],   // Mid Indian Ocean
    [72.00, 16.00],   // Approach east coast
    [80.00, 18.00],   // East India approach
    [86.68, 20.27],   // Paradip
  ],
  // Ceyhan → Visakhapatnam: Med → Suez → Indian Ocean
  'route-7': [
    [35.86, 37.03],   // Ceyhan
    [33.00, 35.00],   // Cyprus area
    [32.60, 32.00],   // Suez Canal
    [32.60, 28.00],   // Red Sea
    [37.00, 21.00],   // Red Sea south
    [43.30, 12.60],   // Bab-el-Mandeb
    [50.00, 11.00],   // Gulf of Aden
    [58.00, 10.00],   // Arabian Sea
    [65.00, 11.00],   // Mid Indian Ocean
    [72.00, 13.00],   // Approaching India
    [78.00, 15.00],   // East coast approach
    [83.22, 17.69],   // Visakhapatnam
  ],
  // Gwadar → Mundra: Short Arabian Sea (BLOCKED)
  'route-8': [
    [62.32, 25.12],   // Gwadar
    [64.00, 24.00],   // Arabian Sea
    [67.00, 23.00],   // Approach
    [69.73, 22.84],   // Mundra
  ],
};

// Get point 40% along a polyline
function getPointAlongPolyline(coords: [number, number][], fraction: number): [number, number] {
  if (coords.length === 0) return [0, 0];
  if (coords.length === 1) return coords[0];

  let totalLen = 0;
  const segs: number[] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const dx = coords[i + 1][0] - coords[i][0];
    const dy = coords[i + 1][1] - coords[i][1];
    const d = Math.sqrt(dx * dx + dy * dy);
    segs.push(d);
    totalLen += d;
  }

  let target = totalLen * fraction;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i]) {
      const t = target / segs[i];
      return [
        coords[i][0] + t * (coords[i + 1][0] - coords[i][0]),
        coords[i][1] + t * (coords[i + 1][1] - coords[i][1]),
      ];
    }
    target -= segs[i];
  }
  return coords[coords.length - 1];
}

function getRouteColor(riskScore?: string, status?: string): string {
  if (status === 'blocked') return '#FF3B3B';
  switch (riskScore?.toUpperCase()) {
    case 'LOW':    return '#00E676';
    case 'MEDIUM': return '#FF9800';
    case 'HIGH':   return '#FF3B3B';
    default:       return '#00D9FF';
  }
}

export const ShippingMap = forwardRef<HTMLDivElement, ShippingMapProps>(
  ({ routes, selectedRouteId, onRouteSelect }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
      if (!containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [60, 20],
        zoom: 3.2,
        pitch: 0,
        bearing: 0,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      map.on('load', () => {
        routes.forEach((route) => {
          const id = route.id;
          const waypoints: [number, number][] = SEA_ROUTE_WAYPOINTS[id] || [
            [route.origin.lng, route.origin.lat],
            [route.destination.lng, route.destination.lat],
          ];

          const isSelected = selectedRouteId === id;
          const isBlocked = route.status === 'blocked';
          const color = isSelected
            ? '#00D9FF'
            : getRouteColor(route.riskScore, route.status);

          // Route source
          map.addSource(`route-${id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: waypoints },
              properties: {},
            },
          });

          // Glow for selected route
          if (isSelected) {
            map.addLayer({
              id: `route-glow-${id}`,
              type: 'line',
              source: `route-${id}`,
              paint: {
                'line-color': color,
                'line-width': 12,
                'line-opacity': 0.15,
                'line-blur': 6,
              },
            });
          }

          // Main route line
          map.addLayer({
            id: `route-line-${id}`,
            type: 'line',
            source: `route-${id}`,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': color,
              'line-width': isSelected ? 3.5 : 2,
              'line-opacity': isSelected ? 1 : isBlocked ? 0.7 : 0.55,
              ...(isBlocked ? { 'line-dasharray': [4, 3] } : {}),
            },
          });

          // Invisible clickable hit area
          map.addLayer({
            id: `route-hit-${id}`,
            type: 'line',
            source: `route-${id}`,
            paint: { 'line-color': 'rgba(0,0,0,0)', 'line-width': 18 },
          });

          map.on('click', `route-hit-${id}`, () => onRouteSelect?.(id));
          map.on('mouseenter', `route-hit-${id}`, () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', `route-hit-${id}`, () => {
            map.getCanvas().style.cursor = '';
          });

          // Origin marker
          const originEl = document.createElement('div');
          originEl.style.cssText = `
            width:12px;height:12px;border-radius:50%;
            background:${isBlocked ? '#FF3B3B' : '#00E676'};
            border:2px solid #0A0E1A;
            box-shadow:0 0 8px ${isBlocked ? '#FF3B3B' : '#00E676'}88;
          `;
          new maplibregl.Marker({ element: originEl })
            .setLngLat([route.origin.lng, route.origin.lat])
            .setPopup(new maplibregl.Popup({ offset: 15, closeButton: false })
              .setText(`📍 ${route.origin.name}`))
            .addTo(map);

          // Destination marker
          const destEl = document.createElement('div');
          destEl.style.cssText = `
            width:12px;height:12px;border-radius:50%;
            background:#FF9800;
            border:2px solid #0A0E1A;
            box-shadow:0 0 8px #FF980088;
          `;
          new maplibregl.Marker({ element: destEl })
            .setLngLat([route.destination.lng, route.destination.lat])
            .setPopup(new maplibregl.Popup({ offset: 15, closeButton: false })
              .setText(`🏭 ${route.destination.name}`))
            .addTo(map);

          // Vessel marker at 40% along route
          if (!isBlocked) {
            const vesselPos = getPointAlongPolyline(waypoints, 0.4);
            const vesselEl = document.createElement('div');
            vesselEl.style.cssText = `
              width:${isSelected ? 14 : 10}px;
              height:${isSelected ? 14 : 10}px;
              border-radius:50%;
              background:${isSelected ? '#00D9FF' : color};
              border:2px solid #0A0E1A;
              box-shadow:0 0 ${isSelected ? '12' : '6'}px ${isSelected ? '#00D9FF' : color}AA;
              cursor:pointer;
            `;
            vesselEl.title = route.vessel;
            new maplibregl.Marker({ element: vesselEl })
              .setLngLat(vesselPos)
              .setPopup(
                new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(
                  `<div style="font-size:11px;line-height:1.6;font-family:monospace;color:#E8EAED;background:#0A0E1A;padding:6px 10px;border-radius:6px;">
                    <strong style="color:#00D9FF">${route.vessel}</strong><br/>
                    ETA: ${route.eta} &nbsp;|&nbsp; ${route.speed ?? '—'}
                  </div>`
                )
              )
              .addTo(map);
          } else {
            // Blocked indicator
            const blockedEl = document.createElement('div');
            blockedEl.style.cssText = `
              padding:2px 6px;border-radius:4px;
              background:#FF3B3B;color:#fff;
              font-size:9px;font-weight:700;font-family:monospace;
              border:1px solid #FF3B3BAA;white-space:nowrap;
              box-shadow:0 0 8px #FF3B3B66;
            `;
            blockedEl.textContent = '⛔ BLOCKED';
            const midPos = getPointAlongPolyline(waypoints, 0.5);
            new maplibregl.Marker({ element: blockedEl })
              .setLngLat(midPos)
              .addTo(map);
          }
        });
      });

      mapRef.current = map;
      return () => { map.remove(); };
    }, [routes, selectedRouteId, onRouteSelect]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full relative bg-black"
        style={{ minHeight: '100%' }}
      />
    );
  }
);

ShippingMap.displayName = 'ShippingMap';
