'use client';

import { BarChart3, Zap, CheckCircle, TrendingUp, LogOut } from 'lucide-react';

export function Sidebar() {
  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', active: true },
    { icon: Zap, label: 'Triggers', active: false },
    { icon: TrendingUp, label: 'Analytics', active: false },
    { icon: CheckCircle, label: 'Approvals', active: false },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 h-screen flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">ProcureIntel</h2>
            <p className="text-xs text-muted">India</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              item.active
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-6 border-t border-slate-200 dark:border-slate-700">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-muted hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
