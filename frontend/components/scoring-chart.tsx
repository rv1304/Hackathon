'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ScoringChartProps {
  fullHeight?: boolean;
}

export function ScoringChart({ fullHeight }: ScoringChartProps) {
  const data = [
    {
      name: 'Option 1',
      landed_cost: 85,
      safety: 78,
      supply_reliability: 88,
      geopolitical_risk: 72,
      timing_flexibility: 80,
      environmental: 75,
    },
    {
      name: 'Option 2',
      landed_cost: 82,
      safety: 85,
      supply_reliability: 80,
      geopolitical_risk: 80,
      timing_flexibility: 88,
      environmental: 82,
    },
    {
      name: 'Option 3',
      landed_cost: 87,
      safety: 88,
      supply_reliability: 92,
      geopolitical_risk: 85,
      timing_flexibility: 75,
      environmental: 88,
    },
    {
      name: 'Option 4',
      landed_cost: 75,
      safety: 70,
      supply_reliability: 75,
      geopolitical_risk: 65,
      timing_flexibility: 92,
      environmental: 78,
    },
  ];

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 ${fullHeight ? 'col-span-2' : ''}`}>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground">Criterion Scores</h2>
        <p className="text-sm text-muted mt-1">TOPSIS weighted evaluation across 6 criteria</p>
      </div>

      <ResponsiveContainer width="100%" height={fullHeight ? 400 : 300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="name"
            stroke="var(--muted)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="var(--muted)"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'var(--foreground)' }}
            cursor={{ fill: 'rgba(15, 118, 110, 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="landed_cost" stackId="a" fill="var(--primary)" />
          <Bar dataKey="safety" stackId="a" fill="var(--accent)" />
          <Bar dataKey="supply_reliability" stackId="a" fill="var(--success)" />
          <Bar dataKey="geopolitical_risk" stackId="a" fill="var(--warning)" />
          <Bar dataKey="timing_flexibility" stackId="a" fill="var(--primary-light)" />
          <Bar dataKey="environmental" stackId="a" fill="var(--muted)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
