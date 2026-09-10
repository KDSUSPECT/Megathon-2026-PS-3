import React, { useState } from 'react';
import { usePharmaChain } from '../../context/PharmaChainContext';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ScanLine,
  Info,
  Calendar,
  Building,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DEMO_KNOWN_DESTROYED_BATCH } from '../../data/seedData';

export const PublicVerifyPage: React.FC = () => {
  const { verifyBatchScan, productionRecords } = usePharmaChain();

  const [inputBatch, setInputBatch] = useState('');
  const [result, setResult] = useState<{
    checked: boolean;
    batchNumber: string;
    isAuthentic: boolean;
    isFraud: boolean;
    status: string;
    plainMessage: string;
    plainBadge: string;
    drugName?: string;
    mfrName?: string;
    expiryDate?: string;
  } | null>(null);

  const handleVerify = (bNo: string) => {
    const raw = bNo.trim();
    if (!raw) return;

    const res = verifyBatchScan(raw, 'Public Consumer Portal');
    const prod = productionRecords.find((p) => p.batchNumber === raw);

    let plainBadge = '✅ Authentic — Active';
    let plainMessage =
      'This medicine batch is genuine, registered with the Central Drugs Standard Control Organisation (CDSCO), and is safe for retail dispensation and consumer usage.';

    if (res.isFraud || res.status === 'RE_ENTRY_FLAGGED') {
      plainBadge = '🚫 Flagged — Do Not Consume, Report to Authorities';
      plainMessage =
        'CRITICAL WARNING: This batch was recorded as officially DESTROYED or counterfeit. It has been illegally diverted or forged. Do not take this medicine. Hand it over to the nearest drug inspector.';
    } else if (res.status === 'DESTROYED') {
      plainBadge = '✅ Properly Destroyed — Retired Stock';
      plainMessage =
        'This batch was expired or quarantined and has already been verified as legally destroyed at a licensed hazardous waste facility. No genuine packs should remain in commercial sale.';
    } else if (res.status === 'UNREGISTERED_COUNTERFEIT') {
      plainBadge = '🚫 Counterfeit Warning — Unregistered';
      plainMessage =
        'WARNING: This batch number has no valid manufacturing registration record. It may be a counterfeit or imitation product.';
    } else if (res.status === 'RETURN_INITIATED' || res.status === 'DISTRIBUTOR_CONFIRMED' || res.status === 'SCHEDULED_FOR_DESTRUCTION') {
      plainBadge = '⚠️ In Reverse Logistics / Quarantined';
      plainMessage =
        'This batch is currently recalled, expired, or returned in reverse logistics transit. It should not be dispensed across the counter.';
    }

    if (res.isAuthentic && !res.isFraud) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    setResult({
      checked: true,
      batchNumber: raw,
      isAuthentic: res.isAuthentic,
      isFraud: res.isFraud,
      status: res.status,
      plainBadge,
      plainMessage,
      drugName: prod?.drugName || res.batch?.drugName,
      mfrName: 'Cipla Therapeutics Ltd (License MH-MFG-2021-009)',
      expiryDate: prod?.expiryDate || res.batch?.expiryDate,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header card */}
      <div className="text-center space-y-3 py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          National Drug Authentication Portal (Consumer Protection)
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Verify Your Medicine Batch
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Enter the batch number printed on your medicine carton, blister strip, or bottle to verify genuine origin and confirm it has not been recalled or unlawfully re-circulated.
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify(inputBatch);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={inputBatch}
              onChange={(e) => setInputBatch(e.target.value)}
              placeholder="e.g. AZI-500-2026A or PAR-650-2026C..."
              className="w-full pl-11 pr-4 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
          >
            Check Batch
          </button>
        </form>

        {/* 1-Click Quick Demo Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-medium">Try test batch:</span>
          <button
            onClick={() => {
              setInputBatch('AZI-500-2026A');
              handleVerify('AZI-500-2026A');
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-semibold hover:bg-emerald-100"
          >
            AZI-500-2026A (Genuine Active)
          </button>
          <button
            onClick={() => {
              setInputBatch(DEMO_KNOWN_DESTROYED_BATCH);
              handleVerify(DEMO_KNOWN_DESTROYED_BATCH);
            }}
            className="px-2.5 py-1 rounded-lg bg-red-50 text-red-800 border border-red-200 font-mono font-bold hover:bg-red-100 animate-pulse"
          >
            {DEMO_KNOWN_DESTROYED_BATCH} (Destroyed Fraud Test)
          </button>
          <button
            onClick={() => {
              setInputBatch('FAK-COUNTERFEIT-999');
              handleVerify('FAK-COUNTERFEIT-999');
            }}
            className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-mono font-semibold hover:bg-amber-100"
          >
            FAK-COUNTERFEIT-999 (Unregistered)
          </button>
        </div>
      </div>

      {/* Verification Result Card */}
      {result && (
        <div
          className={`rounded-2xl border p-6 shadow-md transition-all text-sm space-y-4 ${
            result.isFraud
              ? 'bg-red-50 border-red-300 text-red-950 ring-2 ring-red-400'
              : result.isAuthentic
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-start justify-between gap-3 border-b border-black/10 pb-4">
            <div>
              <span className="text-xs uppercase font-mono font-bold opacity-70 block">
                Batch Verification Status
              </span>
              <h3 className="text-lg font-black font-mono mt-0.5">{result.batchNumber}</h3>
            </div>

            <span
              className={`px-3 py-1 rounded-full font-bold text-xs shadow-sm ${
                result.isFraud
                  ? 'bg-red-600 text-white'
                  : result.isAuthentic
                  ? 'bg-emerald-700 text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              {result.plainBadge}
            </span>
          </div>

          <p className="text-sm sm:text-base leading-relaxed font-medium">{result.plainMessage}</p>

          {result.drugName && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-black/10 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 block">Identified Medicine:</span>
                <strong className="text-slate-900 text-sm">{result.drugName}</strong>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 block">Manufacturer:</span>
                <strong className="text-slate-900">{result.mfrName}</strong>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 block">Official Expiry Date:</span>
                <strong className="text-slate-900 font-mono">{result.expiryDate}</strong>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 block">Regulatory Register:</span>
                <strong className="text-blue-800">CDSCO Central Formulary (Schedule M Verified)</strong>
              </div>
            </div>
          )}

          <div className="pt-2 text-[11px] opacity-75 flex items-center gap-1.5">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              Consumer Protection Notice: No personal tracking or patient records are exposed or retained in public verification queries.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
