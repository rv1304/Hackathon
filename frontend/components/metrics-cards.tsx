'use client';

import { TrendingUp, AlertCircle, Target, Zap } from 'lucide-react';

export function MetricsCards() {
  const metrics = [
    {
      icon: Target,
      label: 'Recommended Option',
      value: 'Option 3',
      subtitle: 'Mundra Port - GCC Supply',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: TrendingUp,
      label: 'Estimated Savings',
      value: '₹ 2.4 Cr',
      subtitle: 'vs. spot market baseline',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Zap,
      label: 'Processing Speed',
      value: '2.3s',
      subtitle: 'Full pipeline execution',
      color: 'from-orange-500 to-amber-500',
    },
    {
      icon: AlertCircle,
      label: 'Risk Level',
      value: 'Medium',
      subtitle: 'Gulf geopolitical factor',
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all animate-slideUp"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${metric.color} mb-3`}>
            <metric.icon className="w-5 h-5 text-white" />
          </div>
          <p className="text-xs font-medium text-muted mb-1">{metric.label}</p>
          <h3 className="text-2xl font-bold text-foreground mb-1">{metric.value}</h3>
          <p className="text-xs text-muted">{metric.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
