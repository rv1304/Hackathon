'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export function WeightsPanel() {
  const [weights, setWeights] = useState({
    landed_cost: 25,
    safety: 20,
    supply_reliability: 20,
    geopolitical_risk: 15,
    timing_flexibility: 12,
    environmental: 8,
  });

  const criteria = [
    { key: 'landed_cost', label: 'Landed Cost' },
    { key: 'safety', label: 'Safety' },
    { key: 'supply_reliability', label: 'Supply Reliability' },
    { key: 'geopolitical_risk', label: 'Geopolitical Risk' },
    { key: 'timing_flexibility', label: 'Timing Flexibility' },
    { key: 'environmental', label: 'Environmental' },
  ];

  const handleWeightChange = (key: string, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleReset = () => {
    setWeights({
      landed_cost: 25,
      safety: 20,
      supply_reliability: 20,
      geopolitical_risk: 15,
      timing_flexibility: 12,
      environmental: 8,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">TOPSIS Weights</h2>
          <p className="text-sm text-muted mt-1">Adjust criteria importance</p>
        </div>
        <button
          onClick={handleReset}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Reset to default"
        >
          <RotateCcw className="w-5 h-5 text-muted" />
        </button>
      </div>

      <div className="space-y-4">
        {criteria.map((criterion) => (
          <div key={criterion.key}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">
                {criterion.label}
              </label>
              <span className="text-xs font-bold text-primary">
                {weights[criterion.key as keyof typeof weights]}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={weights[criterion.key as keyof typeof weights]}
              onChange={(e) => handleWeightChange(criterion.key, parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Total Weight:</span>
          <span className={`text-lg font-bold ${total === 100 ? 'text-success' : 'text-warning'}`}>
            {total}%
          </span>
        </div>
        <p className="text-xs text-muted mt-2">
          {total === 100
            ? 'Weights sum to 100% ✓'
            : `Adjust to 100% (currently ${total}%)`}
        </p>
      </div>

      <button
        disabled={total !== 100}
        className="w-full mt-4 px-4 py-2 bg-primary text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-light transition-colors"
      >
        Apply Weights
      </button>
    </div>
  );
}
