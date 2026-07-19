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
  status: 'in-route' | 'transit' | 'loading' | 'idle' | 'blocked';
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
      eta: '23 Jan 2026',
      price: 81.62,
      savings: 2400000,
      riskLevel: 'Low',
      reasoning: 'Optimal blend of cost, short transit, and supply reliability.',
      criteria: {
        cost: 92,
        safety: 88,
        reliability: 95,
        geopolitical: 85,
        timing: 90,
      },
    },
    {
      rank: 2,
      supplier: 'Saudi Aramco Trading',
      port: 'Yanbu',
      eta: '27 Jan 2026',
      price: 82.15,
      savings: 2200000,
      riskLevel: 'Low',
      reasoning: 'Premium reliability with stable geopolitical route.',
      criteria: {
        cost: 88,
        safety: 95,
        reliability: 98,
        geopolitical: 88,
        timing: 82,
      },
    },
    {
      rank: 3,
      supplier: 'Iraq State Organization',
      port: 'Basrah',
      eta: '25 Jan 2026',
      price: 79.50,
      savings: 2800000,
      riskLevel: 'Medium',
      reasoning: 'Highly competitive pricing but elevated Suez security risks.',
      criteria: {
        cost: 98,
        safety: 78,
        reliability: 82,
        geopolitical: 65,
        timing: 85,
      },
    },
    {
      rank: 4,
      supplier: 'Adnoc Sourcing',
      port: 'Ruwais',
      eta: '24 Jan 2026',
      price: 82.40,
      savings: 1900000,
      riskLevel: 'Low',
      reasoning: 'Very low risk profile, though premium price applies.',
      criteria: {
        cost: 85,
        safety: 92,
        reliability: 94,
        geopolitical: 87,
        timing: 88,
      },
    },
    {
      rank: 5,
      supplier: 'KPC Kuwait',
      port: 'Mina Al Ahmadi',
      eta: '26 Jan 2026',
      price: 81.90,
      savings: 2100000,
      riskLevel: 'Low',
      reasoning: 'Balanced pricing with strong volume availability.',
      criteria: {
        cost: 89,
        safety: 90,
        reliability: 92,
        geopolitical: 84,
        timing: 84,
      },
    },
    {
      rank: 6,
      supplier: 'Rosneft Export',
      port: 'Novorossiysk',
      eta: '10 Feb 2026',
      price: 74.80,
      savings: 4200000,
      riskLevel: 'High',
      reasoning: 'Steep discount but long transit and complex compliance.',
      criteria: {
        cost: 99,
        safety: 60,
        reliability: 75,
        geopolitical: 45,
        timing: 40,
      },
    },
    {
      rank: 7,
      supplier: 'Socar Azerbaijan',
      port: 'Ceyhan',
      eta: '08 Feb 2026',
      price: 78.20,
      savings: 2900000,
      riskLevel: 'Medium',
      reasoning: 'Moderate costs, but long detour around the Cape.',
      criteria: {
        cost: 82,
        safety: 75,
        reliability: 80,
        geopolitical: 70,
        timing: 45,
      },
    },
    {
      rank: 8,
      supplier: 'Pak Petroleum Corp',
      port: 'Gwadar',
      eta: '21 Jan 2026',
      price: 68.00,
      savings: 0,
      riskLevel: 'Blocked',
      reasoning: 'Country not friendly. Sourcing from this region is strictly prohibited.',
      criteria: {
        cost: 0,
        safety: 0,
        reliability: 0,
        geopolitical: 0,
        timing: 0,
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
        <div className="px-4 py-4 flex flex-col gap-2 border-t border-border-light">
          {selected.riskLevel === 'Blocked' ? (
            <div className="w-full flex flex-col gap-2">
              <div className="p-3 bg-red/10 border border-red/40 rounded text-red text-xs font-semibold text-center uppercase tracking-wider animate-pulse">
                ⚠️ Blocked: Country Not Friendly
              </div>
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-950/20 border border-red-900/40 text-red-500/50 font-semibold rounded cursor-not-allowed"
              >
                <X size={16} />
                Sourcing Prohibited
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
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
          )}
        </div>

        {/* Status message */}
        {approved && selected.riskLevel !== 'Blocked' && (
          <div className="mx-4 mb-4 p-3 bg-green/10 border border-green/30 rounded text-green text-sm">
            ✓ PO sent to SAP successfully. Tracking ID: PO-2026-847291
          </div>
        )}
      </div>
    </div>
  );
}
