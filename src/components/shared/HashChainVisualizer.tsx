import React, { useState } from 'react';
import { usePharmaChain } from '../../context/PharmaChainContext';
import {
  Link2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  Lock,
  Layers,
  ChevronRight,
  Database,
  ArrowDown,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { verifyChainIntegrity, computeHash } from '../../services/crypto';

export const HashChainVisualizer: React.FC = () => {
  const {
    ledger,
    batches,
    tamperLedgerEntry,
    restoreOriginalLedger,
    verifyLedgerForBatch,
  } = usePharmaChain();

  const [selectedBatchNumber, setSelectedBatchNumber] = useState<string>(
    batches[0]?.batchNumber || 'AZI-500-2026A'
  );
  const [tamperingNotice, setTamperingNotice] = useState<string | null>(null);

  // Filter ledger entries for the chosen batch
  const batchEntries = ledger
    .filter((l) => l.batchNumber === selectedBatchNumber)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Run cryptographic verification
  const verification = verifyChainIntegrity(batchEntries);

  const handleSimulateTamper = (entryId: number) => {
    const entry = ledger.find((e) => e.id === entryId);
    if (!entry) return;

    try {
      const parsed = JSON.parse(entry.eventData);
      // Maliciously alter claimed quantity or actor
      const fakeData = JSON.stringify({
        ...parsed,
        claimedQuantity: 9999,
        confirmedQuantity: 1,
        actor: 'UNAUTHORIZED_INTRUDER_MALICIOUS_NODE',
        hackedTimestamp: new Date().toISOString(),
      });
      tamperLedgerEntry(entryId, fakeData);
      setTamperingNotice(
        `🚨 Record Tampering Injected into Block #${entryId}! Hash calculation intentionally severed.`
      );
    } catch {
      tamperLedgerEntry(entryId, '{"TAMPERED":"MALICIOUS_UPDATE_DETECTED"}');
      setTamperingNotice(`🚨 Malicious data injected into Block #${entryId}!`);
    }
  };

  const handleRestore = () => {
    restoreOriginalLedger();
    setTamperingNotice(null);
  };

  return (
    <div className="space-y-6" id="hash-chain-visualizer">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#071d18] via-[#0b2b24] to-[#071d18] text-white rounded-2xl p-6 shadow-lg border border-teal-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider">
            <Link2 className="w-4 h-4 text-teal-400" /> Cryptographic Innovation & Anti-Tamper Engine
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
            Batch Number Series Cryptographic Hash Chain
          </h2>
          <p className="text-xs sm:text-sm text-teal-200/80 mt-1 max-w-2xl">
            Every status transition and stock update is cryptographically chained via SHA-256:
            <code className="text-emerald-300 font-mono text-xs ml-1.5 px-2 py-0.5 rounded bg-teal-950/80 border border-teal-500/30">
              CurrentHash = SHA256(EventData + PreviousHash + Timestamp)
            </code>.
            If any adversary modifies historical data, the chain breaks instantly and triggers an alert!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="restore-ledger-btn"
            onClick={handleRestore}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-800/80 hover:bg-teal-700 text-teal-100 border border-teal-600/40 shadow-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore Chain Integrity
          </button>
        </div>
      </div>

      {/* Tamper Alert Banner when chain is compromised */}
      {!verification.isValid ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/15 dark:bg-rose-950/40 border-2 border-rose-500/70 text-rose-900 dark:text-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md animate-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-sm flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <span>🚨 CRITICAL SECURITY BREACH: HASH CHAIN BROKEN AT BLOCK #{batchEntries[verification.brokenIndex ?? 0]?.id || 'N/A'}</span>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-200/90 mt-1 font-mono">
                {verification.errorMessage || 'Cryptographic verification failed: Historical ledger data was disturbed or tampered with! CDSCO immediate freeze triggered.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleRestore}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all whitespace-nowrap"
          >
            Fix & Restore Ledger Proof
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>
              Cryptographic Hash Chain 100% Mathematically Verified ({batchEntries.length} connected blocks intact). Zero unauthorized disturbances detected.
            </span>
          </div>
          <span className="text-[11px] font-mono bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-700">
            INTEGRITY: PRISTINE
          </span>
        </div>
      )}

      {/* Batch Selector Bar */}
      <div className="bg-white dark:bg-[#071d18] rounded-2xl p-4 border border-slate-200 dark:border-teal-900/60 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-teal-200 uppercase tracking-wider">
            Select Batch Series:
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {batches.map((b) => (
            <button
              key={b.batchNumber}
              onClick={() => {
                setSelectedBatchNumber(b.batchNumber);
                setTamperingNotice(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                selectedBatchNumber === b.batchNumber
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-teal-950/50 text-slate-700 dark:text-teal-300 hover:bg-slate-200 dark:hover:bg-teal-900/50 border border-slate-200 dark:border-teal-900/40'
              }`}
            >
              {b.batchNumber} ({b.drugName.split(' ')[0]})
            </button>
          ))}
        </div>
      </div>

      {/* Chained Blocks Visualization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-teal-300/70 font-semibold px-1">
          <span>CHRONOLOGICAL AUDIT CHAIN FOR BATCH #{selectedBatchNumber}</span>
          <span>{batchEntries.length} BLOCKS IN SEQUENCE</span>
        </div>

        {batchEntries.map((entry, index) => {
          // Recompute hash to check if this block is valid
          const recalculated = computeHash(`${entry.eventData}|${entry.previousHash}|${entry.timestamp}`);
          const prevEntry = index > 0 ? batchEntries[index - 1] : null;
          const isLinkValid = index === 0 ? true : entry.previousHash === prevEntry?.currentHash;
          const isSelfValid = recalculated === entry.currentHash;
          const isBlockBroken = !isLinkValid || !isSelfValid;

          let parsedEventData: any = {};
          try {
            parsedEventData = JSON.parse(entry.eventData);
          } catch {
            parsedEventData = { raw: entry.eventData };
          }

          return (
            <div key={entry.id} className="relative">
              {/* Connector Line between blocks */}
              {index > 0 && (
                <div className="flex justify-center -my-2.5 relative z-0">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold shadow-xs border ${
                      isLinkValid
                        ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800'
                        : 'bg-rose-100 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 border-rose-400 dark:border-rose-700 animate-bounce'
                    }`}
                  >
                    <ArrowDown className="w-3 h-3" />
                    <span>{isLinkValid ? 'HASH LINK CONNECTED' : 'CHAIN LINK BROKEN (MISMATCH)'}</span>
                  </div>
                </div>
              )}

              {/* Block Card */}
              <div
                className={`rounded-2xl p-5 border transition-all relative z-10 ${
                  isBlockBroken
                    ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600/80 shadow-lg ring-2 ring-rose-400/40'
                    : 'bg-white dark:bg-[#071d18] border-slate-200 dark:border-teal-900/60 shadow-xs hover:border-teal-500/40'
                }`}
              >
                {/* Block Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-teal-900/40">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-bold font-mono flex items-center justify-center ${
                        isBlockBroken
                          ? 'bg-rose-600 text-white'
                          : 'bg-teal-800 text-white'
                      }`}
                    >
                      #{entry.id}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{entry.eventType}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            isBlockBroken
                              ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200 font-bold'
                              : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {isBlockBroken ? 'TAMPERED / CORRUPT' : 'VERIFIED PROOF'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-teal-300/70">
                        Recorded: {new Date(entry.timestamp).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Tamper Button */}
                  <div>
                    {!isBlockBroken ? (
                      <button
                        onClick={() => handleSimulateTamper(entry.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition-all flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        Simulate Tamper / Alter Data
                      </button>
                    ) : (
                      <button
                        onClick={handleRestore}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Undo Tamper
                      </button>
                    )}
                  </div>
                </div>

                {/* Hashes Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3 font-mono text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-teal-950/40 border border-slate-200 dark:border-teal-900/50">
                    <span className="text-slate-400 dark:text-teal-400 block text-[10px] uppercase font-sans font-bold">
                      Previous Block Hash (Link)
                    </span>
                    <span className="text-slate-700 dark:text-teal-200 break-all select-all font-mono">
                      {entry.previousHash}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-teal-950/40 border border-slate-200 dark:border-teal-900/50">
                    <span className="text-slate-400 dark:text-teal-400 block text-[10px] uppercase font-sans font-bold">
                      Current SHA-256 Hash
                    </span>
                    <span
                      className={`break-all select-all font-mono ${
                        isBlockBroken
                          ? 'text-rose-600 dark:text-rose-400 font-bold'
                          : 'text-teal-700 dark:text-teal-300 font-semibold'
                      }`}
                    >
                      {entry.currentHash}
                    </span>
                  </div>
                </div>

                {/* Event Payload Data Details */}
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-teal-950/30 border border-slate-100 dark:border-teal-900/30 text-xs">
                  <div className="text-[10.5px] font-bold text-slate-500 dark:text-teal-400 uppercase tracking-wider mb-1.5">
                    Immutable Payload Context:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 dark:text-teal-100">
                    {parsedEventData.fromStatus && (
                      <div>
                        <span className="text-[10px] text-slate-400 block">From Status:</span>
                        <span className="font-semibold">{parsedEventData.fromStatus}</span>
                      </div>
                    )}
                    {parsedEventData.toStatus && (
                      <div>
                        <span className="text-[10px] text-slate-400 block">To Status:</span>
                        <span className="font-semibold text-teal-700 dark:text-teal-300">{parsedEventData.toStatus}</span>
                      </div>
                    )}
                    {parsedEventData.actor && (
                      <div>
                        <span className="text-[10px] text-slate-400 block">Authorized Actor:</span>
                        <span className="font-semibold truncate block">{parsedEventData.actor}</span>
                      </div>
                    )}
                    {parsedEventData.claimedQuantity !== undefined && (
                      <div>
                        <span className="text-[10px] text-slate-400 block">Quantity Units:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {parsedEventData.claimedQuantity} units
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
