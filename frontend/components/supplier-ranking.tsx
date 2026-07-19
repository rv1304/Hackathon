'use client';

interface Supplier {
  rank: number;
  name: string;
  price: number;
  eta: number;
  weather: number;
  insurance: number;
  topsisScore: number;
  savings: number;
  status: string;
}

const suppliers: Supplier[] = [
  {
    rank: 1,
    name: 'Murban',
    price: 3182,
    eta: 11,
    weather: 0.33,
    insurance: 0.22,
    topsisScore: 0.893,
    savings: 9855,
    status: 'Optimal',
  },
  {
    rank: 2,
    name: 'Basra Light',
    price: 3177,
    eta: 11,
    weather: 0.31,
    insurance: 0.19,
    topsisScore: 0.804,
    savings: 3210,
    status: 'Alternative',
  },
  {
    rank: 3,
    name: 'Arab Light',
    price: 1433,
    eta: 10,
    weather: 0.32,
    insurance: 0.21,
    topsisScore: 0.778,
    savings: 2145,
    status: 'Backup',
  },
  {
    rank: 4,
    name: 'WTI',
    price: 1610,
    eta: 8,
    weather: 0.28,
    insurance: 0.25,
    topsisScore: 0.649,
    savings: null,
    status: '',
  },
  {
    rank: 5,
    name: 'Bomey Light',
    price: 3191,
    eta: 14,
    weather: 0.25,
    insurance: 0.27,
    topsisScore: 0.114,
    savings: null,
    status: '',
  },
];

export function SupplierRanking() {
  return (
    <div className="bg-surface border border-border-light rounded p-3 overflow-y-auto">
      <h3 className="text-xs font-bold text-cyan mb-2">TOP SUPPLIER RANKING (TOPSIS)</h3>
      <div className="space-y-2">
        {suppliers.map((supplier) => (
          <div
            key={supplier.rank}
            className={`p-2 rounded border ${
              supplier.rank === 1
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-border-light bg-surface/50'
            }`}
          >
            <div className="flex items-start gap-2">
              <div
                className={`w-6 h-6 rounded font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                  supplier.rank === 1
                    ? 'bg-green-500 text-background'
                    : 'bg-purple/20 text-purple'
                }`}
              >
                {supplier.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground">{supplier.name}</div>
                <div className="grid grid-cols-3 gap-1 text-xs mt-1">
                  <div className="text-muted">Price ₹{supplier.price}</div>
                  <div className="text-muted">ETA {supplier.eta}d</div>
                  <div className="text-muted">Score {supplier.topsisScore.toFixed(3)}</div>
                </div>
                {supplier.savings && (
                  <div className="text-xs text-green-400 font-semibold mt-1">
                    Savings ₹{supplier.savings.toLocaleString()}
                  </div>
                )}
              </div>
              {supplier.status && (
                <span
                  className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                    supplier.status === 'Optimal'
                      ? 'bg-green-500/20 text-green-400'
                      : supplier.status === 'Alternative'
                        ? 'bg-cyan/20 text-cyan'
                        : 'bg-muted/20 text-muted'
                  }`}
                >
                  {supplier.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
