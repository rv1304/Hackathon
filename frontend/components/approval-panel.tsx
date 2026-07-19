'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, FileText } from 'lucide-react';

export function ApprovalPanel() {
  const [showDetails, setShowDetails] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

  const recommendation = {
    id: 'REC-2024-001',
    option: 'Mundra Port - GCC Supply',
    source: 'Saudi Aramco (Yasref)',
    estimatedSavings: '₹ 2.4 Cr',
    reasoning: 'TOPSIS ranking weighted heavily on landed cost optimization (25%) and supply reliability (20%). This option provides optimal balance between cost efficiency (₹8,420/bbl) and supply certainty (92% reliability score). Geopolitical risk is acceptable at 85/100 given diversified Gulf sourcing.',
    sapPayload: {
      PO_NUMBER: 'PO-2024-00451',
      VENDOR: 'ARAMCO_YASREF',
      QUANTITY: '150000 BBL',
      PRICE: '8420 INR/BBL',
      DELIVERY_PORT: 'MUNDRA',
      ETA: '2024-08-06',
      PAYMENT_TERMS: 'LC at sight',
    },
  };

  const handleApprove = () => {
    setApprovalStatus('approved');
  };

  const handleReject = () => {
    setApprovalStatus('rejected');
  };

  if (approvalStatus === 'approved') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mb-2">
            Recommendation Approved
          </h2>
          <p className="text-emerald-700 dark:text-emerald-300 mb-4">
            SAP Purchase Order {recommendation.sapPayload.PO_NUMBER} has been created.
          </p>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-left mt-6 border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-mono text-muted">{JSON.stringify(recommendation.sapPayload, null, 2)}</p>
          </div>
          <button
            onClick={() => setApprovalStatus(null)}
            className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (approvalStatus === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 dark:text-red-200 mb-2">
            Recommendation Rejected
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-4">
            The recommendation has been rejected. The system will re-evaluate with updated parameters.
          </p>
          <button
            onClick={() => setApprovalStatus(null)}
            className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Recommendation Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-light px-6 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-white bg-white/20 px-2.5 py-0.5 rounded-full">
              {recommendation.id}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">{recommendation.option}</h2>
          <p className="text-sm text-white/90 mt-1">Source: {recommendation.source}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-muted mb-1">Estimated Savings</p>
              <p className="text-2xl font-bold text-foreground">{recommendation.estimatedSavings}</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-muted mb-1">Delivery Port</p>
              <p className="text-2xl font-bold text-foreground">{recommendation.sapPayload.DELIVERY_PORT}</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-xs text-muted mb-1">ETA</p>
              <p className="text-2xl font-bold text-foreground">{recommendation.sapPayload.ETA}</p>
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Decision Intelligence</h3>
            <p className="text-sm text-muted leading-relaxed">{recommendation.reasoning}</p>
          </div>

          {/* SAP Payload */}
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-light transition-colors"
            >
              <FileText className="w-4 h-4" />
              {showDetails ? 'Hide' : 'Show'} SAP OData Purchase Order
            </button>
            {showDetails && (
              <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs overflow-x-auto">
                <pre className="text-muted">{JSON.stringify(recommendation.sapPayload, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleApprove}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle className="w-5 h-5 inline mr-2" />
              Approve & Create SAP PO
            </button>
            <button
              onClick={handleReject}
              className="flex-1 px-6 py-3 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <AlertCircle className="w-5 h-5 inline mr-2" />
              Reject
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-900 dark:text-blue-200">
          <strong>Note:</strong> Approval creates a Purchase Order in SAP S/4HANA via OData. This action cannot be undone without SAP modification.
        </p>
      </div>
    </div>
  );
}
