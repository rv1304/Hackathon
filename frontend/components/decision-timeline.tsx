'use client';

export function DecisionTimeline() {
  const events = [
    { time: '09:10', event: 'Brent crude dropped 2.1%', source: 'Market Update' },
    { time: '09:11', event: 'All routes recomputed', source: 'System' },
    { time: '09:12', event: 'Supplier ranking updated', source: 'AI Engine' },
    { time: '09:14', event: 'Recommendation changed', source: 'AI Engine' },
    { time: '09:15', event: 'Manager approved', source: 'User Action' },
    { time: '09:16', event: 'SAP PO created', source: 'SAP Integration' },
  ];

  return (
    <div className="bg-surface border border-border-light rounded p-3 overflow-y-auto">
      <h3 className="text-xs font-bold text-cyan mb-2">DECISION TIMELINE</h3>
      <div className="space-y-1">
        {events.map((e, i) => (
          <div key={i} className="flex gap-2 text-xs">
            <div className="flex-shrink-0 w-12 text-muted font-mono">{e.time}</div>
            <div className="flex-shrink-0 w-1.5 bg-gradient-to-b from-cyan to-transparent"></div>
            <div className="flex-1 min-w-0">
              <div className="text-foreground truncate">{e.event}</div>
              <div className="text-muted text-xs">{e.source}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
