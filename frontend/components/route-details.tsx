'use client';

interface Route {
  id: string;
  origin: { name: string; lng: number; lat: number };
  destination: { name: string; lng: number; lat: number };
  vessel: string;
  eta: string;
  distance: number;
  speed: string;
  status: string;
  avgSpeed: string;
  fuelCost: number;
  freightCost: number;
  insurance: number;
  riskScore: string;
}

interface RouteDetailsProps {
  route?: Route;
}

export function RouteDetails({ route }: RouteDetailsProps) {
  if (!route) {
    return (
      <div className="bg-surface border border-border-light rounded p-3 flex items-center justify-center text-muted">
        <p className="text-xs">Select a route to view details</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-light rounded p-3 overflow-y-auto">
      <h3 className="text-xs font-bold text-cyan mb-2">ROUTE OVERVIEW ({route.vessel} - {route.destination.name})</h3>
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div className="border-l-2 border-cyan/30 pl-2">
            <div className="text-muted">Distance</div>
            <div className="font-semibold text-foreground">{route.distance.toLocaleString()} nm</div>
          </div>
          <div className="border-l-2 border-cyan/30 pl-2">
            <div className="text-muted">ETA</div>
            <div className="font-semibold text-foreground">{route.eta}</div>
          </div>
          <div className="border-l-2 border-cyan/30 pl-2">
            <div className="text-muted">Avg Speed</div>
            <div className="font-semibold text-foreground">{route.avgSpeed}</div>
          </div>
          <div className="border-l-2 border-cyan/30 pl-2">
            <div className="text-muted">Fuel Cost</div>
            <div className="font-semibold text-foreground">₹{route.fuelCost}</div>
          </div>
          <div className="border-l-2 border-cyan/30 pl-2">
            <div className="text-muted">Freight Cost</div>
            <div className="font-semibold text-foreground">₹{route.freightCost}</div>
          </div>
          <div className="border-l-2 border-cyan/30 pl-2">
            <div className="text-muted">Insurance</div>
            <div className="font-semibold text-foreground">{route.insurance.toFixed(2)}x</div>
          </div>
        </div>
        <div className="pt-1 mt-2 border-t border-border-light">
          <div className="flex justify-between items-center">
            <span className="text-muted">Risk Score</span>
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                route.riskScore === 'LOW'
                  ? 'bg-green-500/20 text-green-400'
                  : route.riskScore === 'MEDIUM'
                    ? 'bg-orange-500/20 text-orange'
                    : 'bg-red-500/20 text-red-400'
              }`}
            >
              {route.riskScore}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
