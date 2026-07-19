'use client';

import { useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { SupplierCards } from './supplier-cards';
import { DecisionExplanation } from './decision-explanation';

interface Route {
  id: string;
  origin: { name: string; lng: number; lat: number };
  destination: { name: string; lng: number; lat: number };
  vessel: string;
  eta: string;
  distance: number;
  status: 'transit' | 'loading' | 'idle';
  heading: number;
}

interface RecommendationPanelProps {
  selectedOption: number;
  onSelectOption: (index: number) => void;
  routes: Route[];
  showDeveloperDetails?: boolean;
}

export function RecommendationPanel({
  selectedOption,
  onSelectOption,
  routes,
  showDeveloperDetails,
}: RecommendationPanelProps) {
  const [expandedSection, setExpandedSection] = useState<'explanation' | 'supplier' | null>('explanation');
  const [approved, setApproved] = useState(false);

  const recommendations = [
    {
      rank: 1,
      supplier: 'Gulf Energy Trading',
      port: 'Ras Al Khaimah',
      eta: '18 Jan 2026',
      price: 85.92,
      savings: 2400000,
      riskLevel: 'Low',
      reasoning: 'Optimal blend of cost, timing, and supply reliability',
      criteria: {
        cost: 92,
        safety: 88,
        reliability: 95,
        geopolitical: 85,
        timing: 90,
        environmental: 82,
      },
    },
    {
      rank: 2,
      supplier: 'Saudi Aramco Trading',
      port: 'Yanbu',
      eta: '22 Jan 2026',
      price: 86.15,
      savings: 2200000,
      riskLevel: 'Low',
      reasoning: 'Premium reliability with competitive pricing',
      criteria: {
        cost: 88,
        safety: 95,
        reliability: 98,
        geopolitical: 88,
        timing: 82,
        environmental: 85,
      },
    },
    {
      rank: 3,
      supplier: 'Iraq State Organization',
      port: 'Basrah',
      eta: '25 Jan 2026',
      price: 84.50,
      savings: 2800000,
      riskLevel: 'Medium',
      reasoning: 'Best price but with heightened geopolitical considerations',
      criteria: {
        cost: 98,
        safety: 78,
        reliability: 82,
        geopolitical: 65,
        timing: 75,
        environmental: 80,
      },
    },
  ];

  const selected = recommendations[selectedOption];

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border-light">
        <h2 className="text-base font-bold text-foreground mb-1">RECOMMENDATION ENGINE</h2>
        <p className="text-xs text-muted">AI-powered procurement decision</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Supplier Cards - Selection */}
        <SupplierCards
          recommendations={recommendations}
          selectedIndex={selectedOption}
          onSelect={onSelectOption}
        />

        {/* Decision Explanation Section */}
        {expandedSection === 'explanation' && (
          <DecisionExplanation
            recommendation={selected}
            showDeveloperDetails={showDeveloperDetails}
          />
        )}

        {/* Action Buttons */}
        <div className="px-4 py-4 flex gap-2 border-t border-border-light">
          <button
            onClick={() => setApproved(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green/20 border border-green hover:bg-green/30 text-green font-semibold rounded transition-all"
          >
            <Check size={16} />
            Approve & Create PO
          </button>
          <button
            onClick={() => setApproved(false)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red/20 border border-red hover:bg-red/30 text-red font-semibold rounded transition-all"
          >
            <X size={16} />
            Reject
          </button>
        </div>

        {/* Status message */}
        {approved && (
          <div className="mx-4 mb-4 p-3 bg-green/10 border border-green/30 rounded text-green text-sm">
            ✓ PO sent to SAP successfully. Tracking ID: PO-2026-847291
          </div>
        )}
      </div>
    </div>
  );
}
