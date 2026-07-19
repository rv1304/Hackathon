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
  status: 'transit' | 'loading' | 'idle';
  heading: number;
}

interface ShippingMapProps {
  routes: Route[];
  selectedRouteId?: string;
}

export const ShippingMap = forwardRef<HTMLDivElement, ShippingMapProps>(
  ({ routes, selectedRouteId }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
      if (!containerRef.current) return;

      // Initialize map centered on India's coastal region
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [72.5, 15],
        zoom: 3,
        pitch: 25,
        bearing: -15,
      });

      map.on('load', () => {
        // Add route lines
        routes.forEach((route) => {
          const id = route.id;

          // Add geojson source for this route
          map.addSource(`route-${id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [route.origin.lng, route.origin.lat],
                  [route.destination.lng, route.destination.lat],
                ],
              },
              properties: {},
            },
          });

          // Add route line layer
          map.addLayer({
            id: `route-line-${id}`,
            type: 'line',
            source: `route-${id}`,
            paint: {
              'line-color': selectedRouteId === id ? '#00D9FF' : '#0099BB',
              'line-width': selectedRouteId === id ? 3 : 2,
              'line-opacity': selectedRouteId === id ? 0.8 : 0.5,
              'line-dasharray': [5, 5],
            },
          });

          // Add origin point
          map.addSource(`origin-${id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [route.origin.lng, route.origin.lat],
              },
              properties: { name: route.origin.name },
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
              'circle-opacity': 0.9,
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
              properties: { name: route.destination.name },
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
              'circle-opacity': 0.9,
            },
          });

          // Add vessel position marker
          const midLng = (route.origin.lng + route.destination.lng) / 2;
          const midLat = (route.origin.lat + route.destination.lat) / 2;

          map.addSource(`vessel-${id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [midLng, midLat],
              },
              properties: {
                name: route.vessel,
                status: route.status,
              },
            },
          });

          map.addLayer({
            id: `vessel-symbol-${id}`,
            type: 'symbol',
            source: `vessel-${id}`,
            layout: {
              'icon-image': 'harbor-15',
              'icon-size': 1.5,
              'text-field': ['get', 'name'],
              'text-font': ['Open Sans Regular'],
              'text-size': 10,
              'text-offset': [0, 1.5],
              'text-anchor': 'top',
            },
            paint: {
              'text-color': selectedRouteId === id ? '#00D9FF' : '#E8EAED',
              'text-opacity': selectedRouteId === id ? 1 : 0.7,
            },
          });
        });
      });

      mapRef.current = map;

      return () => {
        map.remove();
      };
    }, [routes, selectedRouteId]);

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
