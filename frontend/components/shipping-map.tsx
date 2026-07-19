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
  status: 'in-route' | 'loading' | 'idle';
  heading: number;
  speed?: string;
  riskScore?: string;
}

interface ShippingMapProps {
  routes: Route[];
  selectedRouteId?: string;
  onRouteSelect?: (routeId: string) => void;
}

// Generate curved route using great circle arc
function generateCurvedRoute(
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number,
  points: number = 50
) {
  const coordinates: [number, number][] = [];

  for (let i = 0; i <= points; i++) {
    const f = i / points;
    const A = Math.sin((1 - f) * Math.PI) / Math.sin(Math.PI);
    const B = Math.sin(f * Math.PI) / Math.sin(Math.PI);

    const x =
      A * Math.cos((fromLat * Math.PI) / 180) * Math.cos((fromLng * Math.PI) / 180) +
      B * Math.cos((toLat * Math.PI) / 180) * Math.cos((toLng * Math.PI) / 180);
    const y =
      A * Math.cos((fromLat * Math.PI) / 180) * Math.sin((fromLng * Math.PI) / 180) +
      B * Math.cos((toLat * Math.PI) / 180) * Math.sin((toLng * Math.PI) / 180);
    const z = A * Math.sin((fromLat * Math.PI) / 180) + B * Math.sin((toLat * Math.PI) / 180);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI);
    const lng = Math.atan2(y, x) * (180 / Math.PI);

    coordinates.push([lng, lat]);
  }

  return coordinates;
}

export const ShippingMap = forwardRef<HTMLDivElement, ShippingMapProps>(
  ({ routes, selectedRouteId, onRouteSelect }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const popupRef = useRef<maplibregl.Popup | null>(null);

    useEffect(() => {
      if (!containerRef.current) return;

      // Initialize map with satellite/terrain view
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://tile.openstreetmap.org/styles/klokantech-satellite.json',
        center: [55, 15],
        zoom: 3.5,
        pitch: 20,
        bearing: 0,
      });

      // Fallback for satellite map if API fails
      map.on('style.load', () => {
        map.setFog({
          color: 'rgb(20, 20, 30)',
          'high-color': 'rgb(50, 50, 80)',
          'horizon-blend': 0.05,
          'space-color': 'rgb(10, 10, 20)',
        });
      });

      // Add water/terrain layers for better visualization
      map.on('load', () => {
        // Add route lines with curves
        routes.forEach((route) => {
          const id = route.id;
          const curvedCoords = generateCurvedRoute(
            route.origin.lng,
            route.origin.lat,
            route.destination.lng,
            route.destination.lat
          );

          // Add geojson source for curved route
          map.addSource(`route-${id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: curvedCoords,
              },
              properties: { id, vessel: route.vessel },
            },
          });

          // Add glow layer (for selected routes)
          if (selectedRouteId === id) {
            map.addLayer({
              id: `route-glow-${id}`,
              type: 'line',
              source: `route-${id}`,
              paint: {
                'line-color': '#00D9FF',
                'line-width': 8,
                'line-opacity': 0.2,
                'line-blur': 4,
              },
            });
          }

          // Add main route line
          map.addLayer({
            id: `route-line-${id}`,
            type: 'line',
            source: `route-${id}`,
            paint: {
              'line-color': selectedRouteId === id ? '#00D9FF' : '#00D9FF',
              'line-width': selectedRouteId === id ? 4 : 2,
              'line-opacity': selectedRouteId === id ? 1 : 0.6,
              'line-dasharray': selectedRouteId === id ? [0] : [4, 4],
            },
          });

          // Add interactive clickable layer
          map.addLayer({
            id: `route-clickable-${id}`,
            type: 'line',
            source: `route-${id}`,
            paint: {
              'line-color': 'transparent',
              'line-width': 20,
              'line-opacity': 0,
            },
          });

          map.on('click', `route-clickable-${id}`, () => {
            onRouteSelect?.(id);
          });

          map.on('mouseenter', `route-clickable-${id}`, () => {
            map.getCanvas().style.cursor = 'pointer';
          });

          map.on('mouseleave', `route-clickable-${id}`, () => {
            map.getCanvas().style.cursor = '';
          });

          // Add origin point (port)
          map.addSource(`origin-${id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [route.origin.lng, route.origin.lat],
              },
              properties: { name: route.origin.name, type: 'port' },
            },
          });

          map.addLayer({
            id: `origin-glow-${id}`,
            type: 'circle',
            source: `origin-${id}`,
            paint: {
              'circle-radius': 10,
              'circle-color': '#00E676',
              'circle-opacity': 0.2,
            },
          });

          map.addLayer({
            id: `origin-${id}`,
            type: 'circle',
            source: `origin-${id}`,
            paint: {
              'circle-radius': 6,
              'circle-color': '#00E676',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#0A0E1A',
              'circle-opacity': 1,
            },
          });

          // Add destination point
          map.addSource(`destination-${id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [route.destination.lng, route.destination.lat],
              },
              properties: { name: route.destination.name, type: 'destination' },
            },
          });

          map.addLayer({
            id: `destination-glow-${id}`,
            type: 'circle',
            source: `destination-${id}`,
            paint: {
              'circle-radius': 12,
              'circle-color': '#FF9800',
              'circle-opacity': 0.2,
            },
          });

          map.addLayer({
            id: `destination-${id}`,
            type: 'circle',
            source: `destination-${id}`,
            paint: {
              'circle-radius': 8,
              'circle-color': '#FF9800',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#0A0E1A',
              'circle-opacity': 1,
            },
          });

          // Add vessel marker with glow
          const vessels = generateCurvedRoute(
            route.origin.lng,
            route.origin.lat,
            route.destination.lng,
            route.destination.lat,
            1
          );
          const vesselPos = vessels[Math.floor(vessels.length * 0.4)];

          map.addSource(`vessel-${id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: vesselPos,
              },
              properties: {
                name: route.vessel,
                status: route.status,
                speed: route.speed,
              },
            },
          });

          map.addLayer({
            id: `vessel-glow-${id}`,
            type: 'circle',
            source: `vessel-${id}`,
            paint: {
              'circle-radius': 12,
              'circle-color': selectedRouteId === id ? '#00D9FF' : '#0099BB',
              'circle-opacity': 0.3,
            },
          });

          map.addLayer({
            id: `vessel-${id}`,
            type: 'circle',
            source: `vessel-${id}`,
            paint: {
              'circle-radius': 8,
              'circle-color': selectedRouteId === id ? '#00D9FF' : '#0099BB',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#0A0E1A',
              'circle-opacity': 1,
            },
          });

          map.addLayer({
            id: `vessel-label-${id}`,
            type: 'symbol',
            source: `vessel-${id}`,
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Open Sans Bold'],
              'text-size': 11,
              'text-offset': [0, 2],
              'text-anchor': 'top',
            },
            paint: {
              'text-color': selectedRouteId === id ? '#00D9FF' : '#E8EAED',
              'text-halo-color': '#0A0E1A',
              'text-halo-width': 1,
              'text-opacity': 1,
            },
          });
        });
      });

      mapRef.current = map;

      return () => {
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
