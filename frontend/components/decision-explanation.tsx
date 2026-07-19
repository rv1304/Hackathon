'use client';

import { ChevronDown, Code } from 'lucide-react';
import { useState } from 'react';

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

interface DecisionExplanationProps {
  recommendation: Recommendation;
  showDeveloperDetails?: boolean;
}

export function DecisionExplanation({
  recommendation,
  showDeveloperDetails,
}: DecisionExplanationProps) {
  const [showPayload, setShowPayload] = useState(false);

  const sapPayload = {
    purchaseOrder: {
      vendor: recommendation.supplier,
      material: 'CRUDE_OIL_BRENT',
      quantity: 1000,
      quantityUnit: 'BBL',
      netPrice: recommendation.price,
      currency: 'USD',
      deliveryLocation: 'Paradip Port, India',
      expectedDeliveryDate: recommendation.eta,
      sourcePort: recommendation.port,
      vessel: 'MT Marjan Explorer',
      paymentTerms: 'LC at Sight',
      incoTerms: 'CIF',
      createdBy: 'ProcureIntel Command Center',
      timestamp: new Date().toISOString(),
    },
  };

  return (
    <div className="px-4 py-4 space-y-4 border-t border-border-light">
      {/* Main reasoning */}
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">Decision Reasoning</h3>
        <p className="text-sm text-foreground/80 leading-relaxed">{recommendation.reasoning}</p>
      </div>

      {/* Savings highlight */}
      <div className="p-3 bg-green/5 border border-green/30 rounded">
        <p className="text-xs text-muted uppercase tracking-wide mb-1">Estimated Savings</p>
        <p className="text-lg font-bold text-green">₹{(recommendation.savings / 100000).toFixed(1)} Cr</p>
        <p className="text-xs text-muted mt-1">vs. market average</p>
      </div>

      {/* Criteria breakdown */}
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">Evaluation Criteria</h3>
        <div className="space-y-2">
          {Object.entries(recommendation.criteria).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-xs font-semibold text-cyan">{value}%</span>
              </div>
              <div className="h-1.5 bg-surface rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan to-green"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Developer section */}
      {showDeveloperDetails && (
        <div className="pt-4 border-t border-border-light">
          <button
            onClick={() => setShowPayload(!showPayload)}
            className="w-full flex items-center justify-between p-2 text-xs font-semibold text-purple bg-purple/10 border border-purple/30 rounded hover:bg-purple/20 transition-all"
          >
            <span className="flex items-center gap-2">
              <Code size={14} />
              SAP OData Payload
            </span>
            <ChevronDown size={14} className={`transition-transform ${showPayload ? 'rotate-180' : ''}`} />
          </button>

          {showPayload && (
            <div className="mt-2 p-2 bg-black/30 border border-purple/20 rounded text-xs font-mono text-purple/80 overflow-x-auto max-h-40 overflow-y-auto">
              <pre>{JSON.stringify(sapPayload, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
