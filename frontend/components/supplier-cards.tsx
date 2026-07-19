'use client';

import { Award, AlertCircle } from 'lucide-react';

interface Recommendation {
  rank: number;
  supplier: string;
  port: string;
  eta: string;
  price: number;
  savings: number;
  riskLevel: string;
  reasoning: string;
  criteria: Record<string, number>;
}

interface SupplierCardsProps {
  recommendations: Recommendation[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function SupplierCards({
  recommendations,
  selectedIndex,
  onSelect,
}: SupplierCardsProps) {
  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'bg-green/10 border-green/50 text-green';
      case 'medium':
        return 'bg-orange/10 border-orange/50 text-orange';
      case 'high':
        return 'bg-red/10 border-red/50 text-red';
      default:
        return 'bg-cyan/10 border-cyan/50 text-cyan';
    }
  };

  return (
    <div className="px-4 py-4 space-y-2">
      {recommendations.map((rec, idx) => (
        <div
          key={rec.rank}
          onClick={() => onSelect(idx)}
          className={`p-3 rounded border cursor-pointer transition-all ${
            selectedIndex === idx
              ? 'bg-cyan/10 border-cyan shadow-lg shadow-cyan/20'
              : 'bg-surface-light border-border-light hover:border-border'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {rec.rank === 1 && <Award size={16} className="text-yellow-500" />}
              <div>
                <p className="font-semibold text-sm text-foreground">{rec.supplier}</p>
                <p className="text-xs text-muted">{rec.port}</p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-semibold border ${getRiskColor(rec.riskLevel)}`}>
              {rec.riskLevel} Risk
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div>
              <span className="text-muted">ETA</span>
              <p className="text-foreground font-semibold">{rec.eta}</p>
            </div>
            <div>
              <span className="text-muted">Price</span>
              <p className="text-cyan font-semibold">${rec.price.toFixed(2)}/bbl</p>
            </div>
          </div>

          <div className="text-xs text-muted line-clamp-1 mb-2">{rec.reasoning}</div>

          {/* Mini criteria bar */}
          <div className="flex items-center gap-1 text-xs">
            {Object.entries(rec.criteria)
              .slice(0, 5)
              .map(([key, value]) => (
                <div
                  key={key}
                  title={`${key}: ${value}`}
                  className="h-2 flex-1 bg-surface rounded overflow-hidden"
                >
                  <div
                    className="h-full bg-gradient-to-r from-cyan to-green"
                    style={{ width: `${value}%` }}
                  />
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
