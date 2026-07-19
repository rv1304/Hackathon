'use client';

import { useEffect, useState } from 'react';
import { OptionsTable } from './options-table';
import { ScoringChart } from './scoring-chart';
import { ParetoChart } from './pareto-chart';
import { WeightsPanel } from './weights-panel';
import { MetricsCards } from './metrics-cards';
import { ApprovalPanel } from './approval-panel';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="p-6 space-y-6">
        {/* Metrics */}
        <MetricsCards />

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'analysis', label: 'Analysis' },
            { id: 'approval', label: 'Approval' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <OptionsTable />
            </div>
            <ScoringChart />
            <ParetoChart />
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ScoringChart fullHeight />
            </div>
            <WeightsPanel />
          </div>
        )}

        {activeTab === 'approval' && (
          <ApprovalPanel />
        )}
      </div>
    </main>
  );
}
