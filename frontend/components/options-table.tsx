'use client';

import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export function OptionsTable() {
  const options = [
    {
      id: 1,
      name: 'Mundra Port - GCC Supply',
      source: 'Saudi Aramco (Yasref)',
      port: 'Mundra',
      eta: '18 days',
      finalPrice: '₹ 8,420/bbl',
      score: 87,
      ranking: 1,
      status: 'recommended',
    },
    {
      id: 2,
      name: 'Jamnagar - Spot Buy',
      source: 'International Spot Market',
      port: 'Jamnagar',
      eta: '12 days',
      finalPrice: '₹ 8,650/bbl',
      score: 82,
      ranking: 2,
      status: 'eligible',
    },
    {
      id: 3,
      name: 'Vadinar - Long-term Contract',
      source: 'Kuwait Petroleum',
      port: 'Vadinar',
      eta: '21 days',
      finalPrice: '₹ 8,380/bbl',
      score: 79,
      ranking: 3,
      status: 'eligible',
    },
    {
      id: 4,
      name: 'Paradip Port - IRE Blend',
      source: 'Reliance (Indian Refining)',
      port: 'Paradip',
      eta: '8 days',
      finalPrice: '₹ 8,520/bbl',
      score: 75,
      ranking: 4,
      status: 'ineligible',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recommended':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'eligible':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'ineligible':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'recommended':
        return <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'eligible':
        return <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'ineligible':
        return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-foreground">Sourcing Options (TOPSIS Ranked)</h2>
        <p className="text-sm text-muted mt-1">5-7 options scored across 6 criteria</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted">Option</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted">Source</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted">Port</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted">ETA</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted">Final Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted">TOPSIS Score</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {options.map((option) => (
              <tr
                key={option.id}
                className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-l-4 border-transparent ${
                  option.status === 'recommended' ? 'border-l-emerald-500' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{option.ranking}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-foreground text-sm">{option.name}</p>
                </td>
                <td className="px-6 py-4 text-sm text-muted">{option.source}</td>
                <td className="px-6 py-4 text-sm text-muted">{option.port}</td>
                <td className="px-6 py-4 text-sm text-muted">{option.eta}</td>
                <td className="px-6 py-4 font-semibold text-foreground text-sm">{option.finalPrice}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-light"
                        style={{ width: `${option.score}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-foreground">{option.score}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${getStatusColor(option.status)}`}>
                    {getStatusIcon(option.status)}
                    {option.status === 'recommended' && 'Recommended'}
                    {option.status === 'eligible' && 'Eligible'}
                    {option.status === 'ineligible' && 'Ineligible'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
