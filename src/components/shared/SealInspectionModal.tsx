import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  AlertTriangle,
  Lock,
  X,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { usePharmaChain } from '../../context/PharmaChainContext';
import { PortalModal } from './PortalModal';

interface SealInspectionModalProps {
  onClose: () => void;
  initialSeal?: string;
}

export const SealInspectionModal: React.FC<SealInspectionModalProps> = ({
  onClose,
  initialSeal = '',
}) => {
  const { checkSealNumber, flaggedSealAlerts } = usePharmaChain();
  const [sealInput, setSealInput] = useState<string>(initialSeal);
  const [verificationResult, setVerificationResult] = useState<{
    isFlagged: boolean;
    sealNumber: string;
    message: string;
    reason?: string;
    alertCreated?: boolean;
  } | null>(null);

  const handleVerify = (sealToTest?: string) => {
    const target = (sealToTest || sealInput).trim();
    if (!target) return;
    const res = checkSealNumber(target, 'User Statutory Seal Entry Check');
    setVerificationResult(res);
  };

  const sampleFlaggedSeals = [
    {
      code: 'CPCB-HAZ-2025-SEAL-8849',
      label: 'Destroyed Batch Seal (AZI-500)',
      desc: 'Tied to an already incinerated batch; entering it simulates illegal packaging recycling.',
    },
    {
      code: 'CDSCO-FLAGGED-SEAL-991',
      label: 'Revoked Compromised Seal',
      desc: 'Compromised seal stolen from state transit corridor.',
    },
    {
      code: 'DISP-SEAL-COMPROMISED-442',
      label: 'Counterfeit Cloned Seal',
      desc: 'Reported duplicate serial number caught in Maharashtra.',
    },
  ];

  const sampleValidSeal = {
    code: 'CPCB-SEAL-2026-OK-118',
    label: 'Authorized Active Seal',
    desc: 'Authorized new tamper-evident security seal with zero incident history.',
  };

  return (
    <PortalModal
      id="seal-inspection-modal"
      onClose={onClose}
      className="relative w-full max-w-2xl bg-white dark:bg-[#071d18] rounded-3xl shadow-2xl border border-teal-900/40 overflow-hidden my-4 text-slate-900 dark:text-white"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-950 via-[#071d18] to-teal-950 text-white border-b border-teal-900/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-800/80 text-teal-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Statutory Security Seal Verification & Re-Entry Sentry
              </h3>
              <p className="text-xs text-teal-300/80">
                CDSCO & CPCB Anti-Diversion Sentry: Detects reused, revoked, or compromised seals.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-slate-900 dark:text-slate-100">
          {/* Input Bar */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-teal-200">
              Enter or Scan Security Seal Number:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={sealInput}
                  onChange={(e) => setSealInput(e.target.value)}
                  placeholder="e.g. CPCB-HAZ-2025-SEAL-8849"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-teal-900/60 bg-slate-50 dark:bg-teal-950/40 text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <button
                onClick={() => handleVerify()}
                className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                Inspect Seal
              </button>
            </div>
          </div>

          {/* Quick Demo Test Buttons */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-teal-400">
              Test One-Click Test Cases (Innovation Verification):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleFlaggedSeals.map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    setSealInput(item.code);
                    handleVerify(item.code);
                  }}
                  className="p-2.5 text-left rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all text-xs"
                >
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold font-mono">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{item.code}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 font-sans mt-0.5">
                    {item.label}
                  </div>
                </button>
              ))}

              <button
                onClick={() => {
                  setSealInput(sampleValidSeal.code);
                  handleVerify(sampleValidSeal.code);
                }}
                className="p-2.5 text-left rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all text-xs"
              >
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{sampleValidSeal.code}</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 font-sans mt-0.5">
                  {sampleValidSeal.label}
                </div>
              </button>
            </div>
          </div>

          {/* Verification Results Display */}
          {verificationResult && (
            <div
              className={`p-5 rounded-2xl border-2 transition-all ${
                verificationResult.isFlagged
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-950 dark:text-rose-100 animate-pulse'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl text-white ${
                    verificationResult.isFlagged ? 'bg-rose-600' : 'bg-emerald-600'
                  }`}
                >
                  {verificationResult.isFlagged ? (
                    <ShieldAlert className="w-6 h-6" />
                  ) : (
                    <ShieldCheck className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="text-sm font-extrabold flex items-center justify-between">
                    <span>
                      {verificationResult.isFlagged
                        ? '🚨 CRITICAL STATUTORY RE-ENTRY ALERT!'
                        : '✅ AUTHORIZED GENUINE SECURITY SEAL'}
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white/80 dark:bg-black/40">
                      {verificationResult.sealNumber}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {verificationResult.message}
                  </p>
                  {verificationResult.reason && (
                    <div className="text-[11px] font-mono mt-2 p-2 rounded-lg bg-white/70 dark:bg-black/40 border border-current/20">
                      Reason: {verificationResult.reason}
                    </div>
                  )}
                  {verificationResult.alertCreated && (
                    <div className="text-[10.5px] font-bold text-rose-700 dark:text-rose-300 uppercase mt-1">
                      ⚠️ Sentry Triggered: Incident logged into CDSCO Central Enforcement Ledger.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Existing Flagged Seals Registry */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-teal-900/40">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-teal-300 font-bold uppercase">
              <span>National Flagged Seal Blacklist Database</span>
              <span>{flaggedSealAlerts.length} Active Statutory Holds</span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2">
              {flaggedSealAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-teal-950/30 border border-slate-200 dark:border-teal-900/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {alert.sealNumber}
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-teal-200 mt-0.5">
                      {alert.flaggedReason}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(alert.flaggedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalModal>
  );
};
