'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ParetoChart() {
  const data = [
    { x: 85, y: 8.42, name: 'Option 1 (Recommended)', dominated: false },
    { x: 82, y: 8.65, name: 'Option 2', dominated: true },
    { x: 87, y: 8.38, name: 'Option 3', dominated: false },
    { x: 75, y: 8.52, name: 'Option 4', dominated: true },
    { x: 80, y: 8.55, name: 'Option 5', dominated: true },
    { x: 83, y: 8.48, name: 'Option 6', dominated: true },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground">Pareto Frontier</h2>
        <p className="text-sm text-muted mt-1">Non-dominated options (green)</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey="x"
            name="TOPSIS Score"
            stroke="var(--muted)"
            style={{ fontSize: '12px' }}
            domain={[70, 90]}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Final Price (₹)"
            stroke="var(--muted)"
            style={{ fontSize: '12px' }}
            domain={[8.3, 8.7]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'var(--foreground)' }}
            cursor={{ fill: 'rgba(15, 118, 110, 0.1)' }}
            formatter={(value) => value.toFixed(2)}
          />
          <Scatter
            name="Non-dominated"
            data={data.filter((d) => !d.dominated)}
            fill="var(--success)"
          />
          <Scatter
            name="Dominated"
            data={data.filter((d) => d.dominated)}
            fill="var(--muted)"
            opacity={0.5}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-900 dark:text-blue-200">
          <strong>Pareto frontier:</strong> Green dots represent non-dominated options—no option is strictly better across all criteria.
        </p>
      </div>
    </div>
  );
}
