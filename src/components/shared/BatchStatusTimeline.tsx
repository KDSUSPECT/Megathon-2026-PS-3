import React from 'react';
import { BatchStatus } from '../../types/pharmachain';
import { CheckCircle2, AlertTriangle, ShieldAlert, XCircle, ArrowRight } from 'lucide-react';

interface BatchStatusTimelineProps {
  status: BatchStatus;
  manufacturingDate?: string;
  expiryDate?: string;
  currentHolder?: string;
}

const STEPS: { status: BatchStatus; label: string; description: string }[] = [
  { status: 'MANUFACTURED', label: 'Manufactured', description: 'Production record verified' },
  { status: 'ACTIVE', label: 'In Circulation', description: 'Active at Retailer' },
  { status: 'RETURN_INITIATED', label: 'Return Initiated', description: 'Reverse logistics request' },
  { status: 'DISTRIBUTOR_CONFIRMED', label: 'Dock Confirmed', description: 'Pickup verified by Distributor' },
  { status: 'SCHEDULED_FOR_DESTRUCTION', label: 'Disposal Scheduled', description: 'En route to Waste Facility' },
  { status: 'DESTROYED', label: 'Certified Destroyed', description: 'Incinerated with certificate' },
];

export const BatchStatusTimeline: React.FC<BatchStatusTimelineProps> = ({
  status,
  manufacturingDate,
  expiryDate,
  currentHolder,
}) => {
  const isDisputed = status === 'DISPUTED';
  const isFraud = status === 'RE_ENTRY_FLAGGED';

  // Map status index
  const getActiveIndex = () => {
    switch (status) {
      case 'MANUFACTURED': return 0;
      case 'ACTIVE': return 1;
      case 'RETURN_INITIATED': return 2;
      case 'DISTRIBUTOR_CONFIRMED': return 3;
      case 'DISPUTED': return 3;
      case 'SCHEDULED_FOR_DESTRUCTION': return 4;
      case 'DESTROYED': return 5;
      case 'RE_ENTRY_FLAGGED': return 5;
      default: return 0;
    }
  };

  const currentIndex = getActiveIndex();

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lifecycle State</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : status === 'DESTROYED'
                  ? 'bg-slate-200 text-slate-800'
                  : status === 'RE_ENTRY_FLAGGED'
                  ? 'bg-red-600 text-white animate-pulse'
                  : status === 'DISPUTED'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </span>
            {currentHolder && (
              <span className="text-xs text-slate-600">
                Holder: <strong className="text-slate-800">{currentHolder}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          {manufacturingDate && (
            <div>Mfg: <span className="font-mono font-medium text-slate-700">{manufacturingDate}</span></div>
          )}
          {expiryDate && (
            <div>Exp: <span className="font-mono font-medium text-slate-700">{expiryDate}</span></div>
          )}
        </div>
      </div>

      {/* Special Fraud Alert Banner if Re-Entry Flagged */}
      {isFraud && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800 text-sm">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <strong>CRITICAL FRAUD ALERT:</strong> This batch was certified DESTROYED but was intercepted attempting
            unlawful re-entry into the commercial market. All transactions are permanently frozen.
          </div>
        </div>
      )}

      {/* Disputed Alert Banner */}
      {isDisputed && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <strong>DISPUTE ACTIVE:</strong> Quantity discrepancy detected between Retailer claim and Distributor pickup scan.
            Awaiting CDSCO/Joint reconciliation.
          </div>
        </div>
      )}

      {/* Horizontal Step Timeline */}
      <div className="relative pt-2 pb-1">
        <div className="hidden md:flex items-center justify-between relative z-10">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex || (idx === currentIndex && status !== 'DISPUTED' && status !== 'RE_ENTRY_FLAGGED');
            const isCurrent = idx === currentIndex;
            
            return (
              <div key={step.status} className="flex-1 flex flex-col items-center text-center relative px-2">
                {/* Connector line */}
                {idx !== 0 && (
                  <div
                    className={`absolute top-4 -left-1/2 w-full h-0.5 -z-10 ${
                      idx <= currentIndex ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCurrent && isFraud
                      ? 'bg-red-600 text-white ring-4 ring-red-100'
                      : isCurrent && isDisputed
                      ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 font-bold'
                      : isCompleted
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCurrent && isFraud ? (
                    <XCircle className="w-5 h-5" />
                  ) : isCurrent && isDisputed ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="text-xs">{idx + 1}</span>
                  )}
                </div>

                <div className="mt-2 text-xs font-semibold text-slate-800">{step.label}</div>
                <div className="text-[11px] text-slate-500 max-w-[110px] leading-tight mt-0.5">{step.description}</div>
              </div>
            );
          })}
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Stage: <strong>{currentIndex + 1} of 6</strong></span>
            <span className="font-semibold text-blue-700">{STEPS[currentIndex]?.label}</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${isFraud ? 'bg-red-600' : isDisputed ? 'bg-amber-500' : 'bg-blue-600'}`}
              style={{ width: `${((currentIndex + 1) / 6) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
