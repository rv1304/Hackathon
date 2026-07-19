'use client';

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

export function DeveloperMode({ routes }: { routes: Route[] }) {
  return (
    <div className="fixed top-20 right-4 max-w-sm bg-surface/95 border border-purple/50 rounded p-4 text-xs font-mono text-purple backdrop-blur-sm">
      <div className="font-bold mb-2 text-purple">DEV: Route Analysis</div>
      {routes.map((route) => (
        <div key={route.id} className="mb-2 pb-2 border-b border-purple/20">
          <div className="text-purple/70">{route.vessel}</div>
          <div className="text-purple/60">Distance: {route.distance}km | Status: {route.status}</div>
        </div>
      ))}
    </div>
  );
}
