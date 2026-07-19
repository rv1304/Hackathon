'use client';

import { useEffect, useRef, forwardRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface Route {
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
  // ── Rich data for hover tooltips ──────────────────────────
  supplier?: string;
  crudeGrade?: string;
  landedCostInr?: number;
  crudePriceUsd?: number;
  freightUsd?: number;
  topsisScore?: number;
  rank?: number;
  etaDays?: number;
  gulfRisk?: string;         // 'LOW' | 'MEDIUM' | 'HIGH'
  gulfEvents?: number;       // raw event count
  portCongestion?: number;   // 0-1 fraction
  weatherSeverity?: number;  // 0-1 fraction
  contractType?: string;
  refinery?: string;
}

interface ShippingMapProps {
  routes: Route[];
  selectedRouteId?: string;
  onRouteSelect?: (routeId: string) => void;
}

// ─── Sea-route waypoints (strictly ocean-only, no land crossings) ─────────────
//
//  Key choke points used:
//   Strait of Hormuz      : [56.5, 24.0] exit
//   Bab-el-Mandeb (strait): [43.4, 11.6]
//   Suez Canal north      : [32.3, 31.2]  (Port Said)
//   Suez Canal south      : [32.5, 30.0]  (Suez City)
//   Bosphorus (Istanbul)  : [29.0, 41.1] → [28.9, 41.0] → [26.7, 40.1] (Dardanelles)
//   Cape of Good Hope     : [18.5, -34.4]
//
const SEA_ROUTE_WAYPOINTS: Record<string, [number, number][]> = {

  // ── Route 1: UAE (Ruwais) → Mundra ──────────────────────────────────────────
  // Persian Gulf → Strait of Hormuz → Gulf of Oman → Arabian Sea → Gujarat
  'route-1': [
    [52.73, 24.11],  // Ruwais (UAE)
    [54.50, 24.30],  // Central Persian Gulf
    [56.00, 24.40],  // East Gulf
    [56.50, 24.00],  // Strait of Hormuz (west)
    [57.80, 23.60],  // Strait of Hormuz (east) / Gulf of Oman entry
    [59.50, 22.80],  // Gulf of Oman
    [61.50, 21.50],  // Arabian Sea
    [65.00, 21.50],  // Mid Arabian Sea
    [67.50, 22.20],  // Approach Gujarat
    [69.73, 22.84],  // Mundra (India)
  ],

  // ── Route 2: Saudi (Yanbu) → Jamnagar ───────────────────────────────────────
  // Red Sea south → Bab-el-Mandeb → Gulf of Aden → Arabian Sea
  'route-2': [
    [38.06, 24.09],  // Yanbu (Saudi Arabia)
    [37.50, 21.00],  // Red Sea (mid)
    [36.80, 17.00],  // Red Sea (south)
    [36.00, 14.00],  // Red Sea (approaching strait)
    [43.40, 11.60],  // Bab-el-Mandeb Strait
    [46.00, 11.20],  // Gulf of Aden (west)
    [50.00, 11.50],  // Gulf of Aden (east)
    [55.00, 12.50],  // Arabian Sea (west)
    [60.00, 16.00],  // Arabian Sea (mid)
    [64.50, 19.00],  // NW Indian Ocean
    [67.00, 20.80],  // Approach Gujarat coast
    [69.10, 22.10],  // Jamnagar (India)
  ],

  // ── Route 3: Iraq (Basrah) → Mumbai ─────────────────────────────────────────
  // Shatt-al-Arab → Persian Gulf → Hormuz → Arabian Sea
  'route-3': [
    [47.80, 30.50],  // Basrah (Iraq)
    [49.00, 28.50],  // North Persian Gulf
    [51.00, 26.50],  // Mid Persian Gulf
    [54.00, 25.00],  // South Persian Gulf
    [56.50, 24.00],  // Strait of Hormuz
    [58.00, 23.20],  // Gulf of Oman
    [60.00, 22.00],  // Arabian Sea entry
    [63.50, 19.50],  // Mid Arabian Sea
    [67.00, 19.00],  // Approach Mumbai
    [70.00, 18.80],  // Approaching coast
    [72.85, 19.08],  // Mumbai (India)
  ],

  // ── Route 4: Kuwait → Kochi ──────────────────────────────────────────────────
  // Persian Gulf → Hormuz → Arabian Sea south → Laccadive Sea → Kochi
  'route-4': [
    [48.08, 29.08],  // Mina Al Ahmadi (Kuwait)
    [49.50, 27.50],  // North Gulf
    [52.00, 26.00],  // Mid Gulf
    [55.00, 25.00],  // South Gulf
    [56.50, 24.00],  // Strait of Hormuz
    [58.50, 22.50],  // Gulf of Oman
    [61.00, 20.00],  // Arabian Sea
    [65.00, 15.00],  // Mid Arabian Sea
    [68.00, 12.50],  // Approaching Laccadive Sea
    [72.00, 10.80],  // Off Kerala coast
    [74.50, 10.20],  // Near Kochi
    [76.27,  9.93],  // Kochi (India)
  ],

  // ── Route 5: Nigeria (Bonny) → Paradip ──────────────────────────────────────
  // Gulf of Guinea → South Atlantic (stay west of Africa) → Cape of Good Hope
  // → Southern Indian Ocean → Bay of Bengal
  'route-5': [
    [ 7.15,  4.44],  // Bonny Terminal (Nigeria)
    [ 5.00,  1.50],  // Gulf of Guinea coast
    [ 2.00, -2.00],  // Equatorial Atlantic
    [-1.00, -8.00],  // South Atlantic (west of Gabon)
    [-3.00,-18.00],  // South Atlantic
    [-1.00,-28.00],  // South Atlantic
    [ 8.00,-32.00],  // Approaching Cape route (staying in ocean)
    [15.00,-34.00],  // South of Cape Town
    [18.50,-34.40],  // Cape of Good Hope
    [25.00,-37.00],  // Southern Ocean (east of Cape)
    [35.00,-36.00],  // Southern Indian Ocean
    [45.00,-32.00],  // Southern Indian Ocean
    [55.00,-24.00],  // Indian Ocean
    [63.00,-16.00],  // Indian Ocean
    [68.00, -8.00],  // Indian Ocean (north-bound)
    [72.00,  2.00],  // Equatorial Indian Ocean
    [76.00, 10.00],  // Bay of Bengal approach
    [80.00, 15.00],  // Bay of Bengal
    [84.00, 18.00],  // Approaching Paradip
    [86.68, 20.27],  // Paradip (India)
  ],

  // ── Route 6: USA (Houston) → Visakhapatnam ──────────────────────────────────
  // Gulf of Mexico → Florida Strait → Atlantic → Cape of Good Hope
  // → Indian Ocean → Bay of Bengal
  'route-6': [
    [-95.37, 29.75],  // Houston (USA)
    [-89.00, 25.00],  // Gulf of Mexico
    [-82.00, 24.00],  // Florida Strait
    [-79.00, 22.50],  // Caribbean Sea
    [-75.00, 20.00],  // Caribbean
    [-65.00, 13.00],  // Eastern Caribbean
    [-52.00,  8.00],  // Atlantic (approaching equator)
    [-38.00,  3.00],  // Mid-Atlantic
    [-22.00, -5.00],  // South Atlantic
    [-12.00,-15.00],  // South Atlantic
    [ -5.00,-24.00],  // South Atlantic
    [  5.00,-32.00],  // South Atlantic (approaching Cape)
    [ 13.00,-34.50],  // South of Cape Town
    [ 18.50,-34.40],  // Cape of Good Hope
    [ 26.00,-38.00],  // Southern Ocean
    [ 37.00,-36.00],  // Southern Indian Ocean
    [ 48.00,-30.00],  // Southern Indian Ocean
    [ 58.00,-20.00],  // Indian Ocean
    [ 65.00,-10.00],  // Indian Ocean
    [ 70.00,  0.00],  // Equatorial Indian Ocean
    [ 75.00,  8.00],  // Bay of Bengal approach
    [ 79.00, 13.00],  // Bay of Bengal
    [ 83.22, 17.69],  // Visakhapatnam (India)
  ],

  // ── Route 7: Russia (Novorossiysk) → Paradip ────────────────────────────────
  // Black Sea → Bosphorus → Sea of Marmara → Dardanelles → Aegean
  // → Mediterranean → Suez Canal → Red Sea → Bab-el-Mandeb → Indian Ocean
  'route-7': [
    [ 37.78, 44.72],  // Novorossiysk (Russia) - Black Sea
    [ 33.00, 43.50],  // Black Sea (mid)
    [ 29.00, 41.15],  // Bosphorus (Black Sea side)
    [ 28.97, 41.01],  // Istanbul / Bosphorus
    [ 28.00, 40.70],  // Sea of Marmara
    [ 27.50, 40.40],  // Sea of Marmara (west)
    [ 26.70, 40.10],  // Dardanelles
    [ 25.80, 39.50],  // Aegean Sea
    [ 24.50, 38.00],  // Aegean Sea
    [ 23.00, 36.00],  // Southern Aegean
    [ 25.00, 34.00],  // Eastern Mediterranean
    [ 28.50, 33.00],  // Eastern Mediterranean
    [ 32.30, 31.20],  // Port Said (Suez Canal north)
    [ 32.50, 30.00],  // Suez Canal (mid)
    [ 32.55, 29.97],  // Suez (Red Sea entry)
    [ 33.50, 28.00],  // Red Sea (north)
    [ 35.00, 25.00],  // Red Sea
    [ 36.50, 21.00],  // Red Sea (mid)
    [ 38.50, 17.00],  // Red Sea (south)
    [ 40.50, 14.00],  // Red Sea (approaching strait)
    [ 43.40, 11.60],  // Bab-el-Mandeb Strait
    [ 47.00, 11.20],  // Gulf of Aden
    [ 52.00, 11.50],  // Gulf of Aden (east)
    [ 58.00, 11.00],  // Arabian Sea
    [ 65.00, 10.50],  // Mid Indian Ocean
    [ 72.00, 13.00],  // Approaching India
    [ 78.00, 16.00],  // Bay of Bengal approach
    [ 82.00, 18.00],  // Bay of Bengal
    [ 86.68, 20.27],  // Paradip (India)
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getPointAlongPolyline(coords: [number, number][], fraction: number): [number, number] {
  if (coords.length === 0) return [0, 0];
  if (coords.length === 1) return coords[0];
  let total = 0;
  const segs: number[] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const dx = coords[i + 1][0] - coords[i][0];
    const dy = coords[i + 1][1] - coords[i][1];
    const d = Math.sqrt(dx * dx + dy * dy);
    segs.push(d);
    total += d;
  }
  let target = total * fraction;
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

function riskColor(label?: string): string {
  switch (label?.toUpperCase()) {
    case 'HIGH':    return '#FF3B3B';
    case 'MEDIUM':  return '#FF9800';
    case 'LOW':     return '#00E676';
    case 'BLOCKED': return '#FF3B3B';
    default:        return '#9E9E9E';
  }
}

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

/** Build the rich HTML tooltip shown on hover over vessel / route */
function buildTooltipHTML(route: Route): string {
  const isBlocked = route.status === 'blocked';
  const risk = route.gulfRisk ?? route.riskScore ?? '—';
  const riskClr = riskColor(risk);
  const congPct = route.portCongestion != null
    ? `${(route.portCongestion * 100).toFixed(0)}% congested`
    : '—';
  const weatherPct = route.weatherSeverity != null
    ? `${(route.weatherSeverity * 100).toFixed(0)}%`
    : '—';

  const row = (label: string, value: string, color = '#E8EAED') =>
    `<tr>
      <td style="color:#9E9E9E;padding:2px 8px 2px 0;white-space:nowrap">${label}</td>
      <td style="color:${color};font-weight:600;text-align:right">${value}</td>
    </tr>`;

  const divider = `<tr><td colspan="2" style="border-top:1px solid #1E2A3A;padding:3px 0"></td></tr>`;

  return `
    <div style="
      font-family:'Inter',system-ui,sans-serif;
      font-size:11px;
      background:#0A0E1A;
      border:1px solid #1E3A4A;
      border-radius:8px;
      padding:10px 12px;
      min-width:220px;
      box-shadow:0 4px 20px rgba(0,0,0,0.6);
      color:#E8EAED;
    ">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div>
          <div style="font-weight:700;font-size:12px;color:#00D9FF">${route.supplier ?? route.vessel}</div>
          <div style="color:#9E9E9E;font-size:10px;margin-top:1px">${route.crudeGrade ?? ''} &nbsp;·&nbsp; ${route.contractType ?? ''}</div>
        </div>
        ${isBlocked
          ? `<span style="background:#FF3B3B22;color:#FF3B3B;border:1px solid #FF3B3B55;border-radius:4px;padding:2px 7px;font-weight:700;font-size:9px">⛔ BLOCKED</span>`
          : route.rank
            ? `<span style="background:#00D9FF22;color:#00D9FF;border:1px solid #00D9FF55;border-radius:4px;padding:2px 7px;font-weight:700;font-size:9px">RANK #${route.rank}</span>`
            : ''
        }
      </div>

      <!-- Route -->
      <div style="color:#9E9E9E;font-size:10px;margin-bottom:8px;padding:5px 7px;background:#0F1624;border-radius:5px;border-left:2px solid #1E3A4A">
        📍 ${route.origin.name}<br/>
        <span style="padding-left:6px">↓</span><br/>
        🏭 ${route.destination.name}
      </div>

      ${isBlocked ? `
        <div style="background:#FF3B3B15;border:1px solid #FF3B3B40;border-radius:5px;padding:7px;color:#FF6B6B;font-size:10px;text-align:center;font-weight:600">
          ⚠️ Trade Prohibited — Country Not Friendly
        </div>
      ` : `
      <!-- Primary metrics -->
      <table style="width:100%;border-collapse:collapse">
        ${route.landedCostInr != null ? row('Landed Cost', formatInr(route.landedCostInr), '#00D9FF') : ''}
        ${route.crudePriceUsd != null ? row('Crude Price', `$${route.crudePriceUsd.toFixed(2)}/bbl`) : ''}
        ${route.freightUsd    != null ? row('Freight',     `$${route.freightUsd.toFixed(2)}/bbl`) : ''}
        ${route.topsisScore   != null ? row('TOPSIS Score', `${(route.topsisScore * 100).toFixed(1)}`, '#A78BFA') : ''}
        ${divider}
        <!-- Risk & conditions -->
        <tr>
          <td style="color:#9E9E9E;padding:2px 8px 2px 0">GULF RISK</td>
          <td style="text-align:right">
            <span style="
              color:${riskClr};
              background:${riskClr}22;
              border:1px solid ${riskClr}55;
              border-radius:3px;padding:1px 6px;font-weight:700;font-size:10px
            ">${risk}</span>
            ${route.gulfEvents != null ? `<span style="color:#9E9E9E;margin-left:5px">${route.gulfEvents} events</span>` : ''}
          </td>
        </tr>
        ${row('PORT CONGESTION', congPct, '#FF9800')}
        ${row('WEATHER SEVERITY', weatherPct, '#64B5F6')}
        ${divider}
        <!-- Logistics -->
        ${route.etaDays != null ? row('ETA', `${route.etaDays} days`) : row('ETA', route.eta)}
        ${route.speed   ? row('Speed', route.speed) : ''}
        ${route.refinery ? row('Refinery', route.refinery) : ''}
      </table>
      `}
    </div>
  `;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const ShippingMap = forwardRef<HTMLDivElement, ShippingMapProps>(
  ({ routes, selectedRouteId, onRouteSelect }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const hoverPopupRef = useRef<maplibregl.Popup | null>(null);

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

      // Shared hover popup (one instance, moves around)
      const hoverPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'procure-hover-popup',
        offset: 12,
        maxWidth: '280px',
      });
      hoverPopupRef.current = hoverPopup;

      map.on('load', () => {
        routes.forEach((route) => {
          const id = route.id;
          const waypoints: [number, number][] = SEA_ROUTE_WAYPOINTS[id] || [
            [route.origin.lng, route.origin.lat],
            [route.destination.lng, route.destination.lat],
          ];

          const isSelected = selectedRouteId === id;
          const isBlocked = route.status === 'blocked';
          const color = isSelected ? '#00D9FF' : getRouteColor(route.riskScore, route.status);

          // ── Route GeoJSON source ──────────────────────────────────
          map.addSource(`route-${id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: waypoints },
              properties: { id, supplier: route.supplier, risk: route.gulfRisk },
            },
          });

          // Glow for selected
          if (isSelected) {
            map.addLayer({
              id: `route-glow-${id}`,
              type: 'line',
              source: `route-${id}`,
              paint: { 'line-color': color, 'line-width': 14, 'line-opacity': 0.15, 'line-blur': 8 },
            });
          }

          // Main line
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

          // Wide invisible hit/hover area
          map.addLayer({
            id: `route-hit-${id}`,
            type: 'line',
            source: `route-${id}`,
            paint: { 'line-color': 'rgba(0,0,0,0)', 'line-width': 24 },
          });

          // ── Route click ───────────────────────────────────────────
          map.on('click', `route-hit-${id}`, () => onRouteSelect?.(id));

          // ── Route hover: show popup at cursor ─────────────────────
          map.on('mousemove', `route-hit-${id}`, (e) => {
            map.getCanvas().style.cursor = 'pointer';
            hoverPopup
              .setLngLat(e.lngLat)
              .setHTML(buildTooltipHTML(route))
              .addTo(map);
          });

          map.on('mouseleave', `route-hit-${id}`, () => {
            map.getCanvas().style.cursor = '';
            hoverPopup.remove();
          });

          // ── Origin marker ─────────────────────────────────────────
          const originEl = document.createElement('div');
          originEl.style.cssText = `
            width:10px;height:10px;border-radius:50%;
            background:${isBlocked ? '#FF3B3B' : '#00E676'};
            border:2px solid #0A0E1A;
            box-shadow:0 0 8px ${isBlocked ? '#FF3B3B' : '#00E676'}99;
            cursor:default;
          `;
          new maplibregl.Marker({ element: originEl })
            .setLngLat([route.origin.lng, route.origin.lat])
            .setPopup(
              new maplibregl.Popup({ offset: 12, closeButton: false, maxWidth: '240px' })
                .setHTML(`<div style="font-family:monospace;font-size:11px;color:#E8EAED;background:#0A0E1A;padding:5px 8px;border-radius:5px">📍 <strong style="color:#00E676">${route.origin.name}</strong><br/><span style="color:#9E9E9E">${route.supplier ?? ''} Origin Port</span></div>`)
            )
            .addTo(map);

          // ── Destination marker ────────────────────────────────────
          const destEl = document.createElement('div');
          destEl.style.cssText = `
            width:10px;height:10px;border-radius:50%;
            background:#FF9800;
            border:2px solid #0A0E1A;
            box-shadow:0 0 8px #FF980099;
            cursor:default;
          `;
          new maplibregl.Marker({ element: destEl })
            .setLngLat([route.destination.lng, route.destination.lat])
            .setPopup(
              new maplibregl.Popup({ offset: 12, closeButton: false, maxWidth: '240px' })
                .setHTML(`<div style="font-family:monospace;font-size:11px;color:#E8EAED;background:#0A0E1A;padding:5px 8px;border-radius:5px">🏭 <strong style="color:#FF9800">${route.destination.name}</strong><br/><span style="color:#9E9E9E">Destination Refinery Port</span></div>`)
            )
            .addTo(map);

          // ── Vessel marker ─────────────────────────────────────────
          if (!isBlocked) {
            const vesselPos = getPointAlongPolyline(waypoints, 0.42);
            const sz = isSelected ? 15 : 10;
            const vesselEl = document.createElement('div');
            vesselEl.style.cssText = `
              width:${sz}px;height:${sz}px;border-radius:50%;
              background:${isSelected ? '#00D9FF' : color};
              border:2px solid #0A0E1A;
              box-shadow:0 0 ${isSelected ? '14' : '7'}px ${isSelected ? '#00D9FF' : color}BB;
              cursor:pointer;
              transition:all 0.15s;
            `;

            // Pulse ring for selected vessel
            if (isSelected) {
              const ring = document.createElement('div');
              ring.style.cssText = `
                position:absolute;top:-5px;left:-5px;
                width:${sz + 10}px;height:${sz + 10}px;
                border-radius:50%;border:1.5px solid #00D9FF55;
                animation:pulse-ring 1.5s ease-out infinite;
                pointer-events:none;
              `;
              vesselEl.style.position = 'relative';
              vesselEl.appendChild(ring);
            }

            const vesselMarker = new maplibregl.Marker({ element: vesselEl })
              .setLngLat(vesselPos)
              .setPopup(
                new maplibregl.Popup({
                  offset: 18, closeButton: false,
                  maxWidth: '280px', className: 'procure-hover-popup',
                }).setHTML(buildTooltipHTML(route))
              )
              .addTo(map);

            // Hover on vessel marker element
            vesselEl.addEventListener('mouseenter', () => {
              vesselMarker.getPopup()?.addTo(map);
            });
            vesselEl.addEventListener('mouseleave', () => {
              vesselMarker.getPopup()?.remove();
            });
            vesselEl.addEventListener('click', () => {
              onRouteSelect?.(id);
            });

          } else {
            // Blocked badge
            const blockedEl = document.createElement('div');
            blockedEl.style.cssText = `
              padding:2px 7px;border-radius:4px;
              background:#FF3B3B;color:#fff;
              font-size:9px;font-weight:700;font-family:monospace;
              border:1px solid #FF3B3BAA;white-space:nowrap;
              box-shadow:0 0 8px #FF3B3B66;cursor:pointer;
            `;
            blockedEl.textContent = '⛔ BLOCKED';
            const midPos = getPointAlongPolyline(waypoints, 0.5);
            const blockedMarker = new maplibregl.Marker({ element: blockedEl })
              .setLngLat(midPos)
              .setPopup(
                new maplibregl.Popup({ offset: 12, closeButton: false, maxWidth: '280px' })
                  .setHTML(buildTooltipHTML(route))
              )
              .addTo(map);

            blockedEl.addEventListener('mouseenter', () => blockedMarker.getPopup()?.addTo(map));
            blockedEl.addEventListener('mouseleave', () => blockedMarker.getPopup()?.remove());
          }
        });
      });

      // Inject popup CSS once
      if (!document.getElementById('procure-popup-style')) {
        const style = document.createElement('style');
        style.id = 'procure-popup-style';
        style.textContent = `
          .procure-hover-popup .maplibregl-popup-content {
            background:transparent !important;
            padding:0 !important;
            border-radius:8px;
            box-shadow:none !important;
          }
          .procure-hover-popup .maplibregl-popup-tip { display:none; }
          @keyframes pulse-ring {
            0%   { transform:scale(1);   opacity:0.8; }
            100% { transform:scale(1.8); opacity:0;   }
          }
        `;
        document.head.appendChild(style);
      }

      mapRef.current = map;
      return () => {
        hoverPopup.remove();
        map.remove();
      };
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
