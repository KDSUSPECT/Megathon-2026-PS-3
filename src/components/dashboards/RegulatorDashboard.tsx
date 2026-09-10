import React, { useState } from 'react';
import { usePharmaChain } from '../../context/PharmaChainContext';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
  Scale,
  Dice5,
  Bug,
  Flame,
  Check,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Batch, ReEntryAlert } from '../../types/pharmachain';
import { CdscoReportModal } from '../shared/CdscoReportModal';
import { BatchStatusTimeline } from '../shared/BatchStatusTimeline';

export const RegulatorDashboard: React.FC = () => {
  const {
    batches,
    reEntryAlerts,
    disputes,
    ledger,
    updateAlertStatus,
    verifyLedgerForBatch,
    reconcileBatch,
    tamperLedgerEntry,
    restoreOriginalLedger,
    getRiskScoreForEntity,
    getRandomAuditBatches,
    currentUser,
  } = usePharmaChain();

  // Search & audit trail state
  const [searchBatchNumber, setSearchBatchNumber] = useState('PHARMA-DEST-8891');
  const [selectedBatchForAudit, setSelectedBatchForAudit] = useState<string>('PHARMA-DEST-8891');
  const [reconcileResult, setReconcileResult] = useState<any>(null);

  // Random audit state
  const [samplePercent, setSamplePercent] = useState<number>(30);
  const [sampledBatches, setSampledBatches] = useState<Batch[]>(() => getRandomAuditBatches(30));

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);

  // Tamper state
  const [tamperMessage, setTamperMessage] = useState<string | null>(null);

  // Active ledger entries for selected batch
  const currentBatchLedger = ledger
    .filter((l) => l.batchNumber === selectedBatchForAudit)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Run cryptographic verification on selected batch's chain
  const chainVerification = verifyLedgerForBatch(selectedBatchForAudit);

  const handleSearchBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchBatchNumber.trim()) return;
    setSelectedBatchForAudit(searchBatchNumber.trim());
    setReconcileResult(null);
  };

  const handleRunReconcile = (bNo: string) => {
    const res = reconcileBatch(bNo);
    setReconcileResult(res);
  };

  const handleTamperDemo = (entryId: number) => {
    tamperLedgerEntry(entryId, '{"tampered":true,"counterfeitInjected":true,"stolenUnits":500}');
    setTamperMessage(`Malicious payload injected into Block #${entryId}! Cryptographic hash integrity check will now detect the severed chain.`);
  };

  const handleRestoreDemo = () => {
    restoreOriginalLedger();
    setTamperMessage(null);
  };

  const handleResample = () => {
    setSampledBatches(getRandomAuditBatches(samplePercent));
  };

  const targetBatch = batches.find((b) => b.batchNumber === selectedBatchForAudit);

  // Calculate risk scores for Retailer (id: 1) and Distributor (id: 1)
  const retailerRisk = getRiskScoreForEntity(1, 'RETAILER');
  const distributorRisk = getRiskScoreForEntity(1, 'DISTRIBUTOR');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> CDSCO Drug Regulatory & Enforcement Directorate
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {currentUser?.fullName || 'Insp. R. K. Verma (CDSCO Enforcement)'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Zonal Authority: <span className="font-mono font-medium text-white">CDSCO-WZ-REG-01</span> • Immutable Ledger Verification & Anti-Diversion Oversight
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="generate-cdsco-report-btn"
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md hover:shadow-blue-500/20"
          >
            <FileText className="w-4 h-4" />
            <span>Generate CDSCO Compliance Report</span>
          </button>
        </div>
      </div>

      {/* Live Fraud & Re-Entry Alerts Feed (Prompt 5 & 7f) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
              Live Intercepted Re-Entry & Counterfeit Alerts Feed
            </h3>
            <p className="text-xs text-slate-500">Real-time alerts triggered by scans of destroyed or diverted batches</p>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
            {reEntryAlerts.length} Interceptions
          </span>
        </div>

        {reEntryAlerts.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl bg-slate-50">
            No active fraud alerts detected in the supply network.
          </div>
        ) : (
          <div className="space-y-3">
            {reEntryAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl border border-red-300 bg-red-50/70 space-y-2.5 text-xs text-red-950"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-red-900 bg-white px-2.5 py-0.5 rounded border border-red-300">
                      {alert.batchNumber}
                    </span>
                    <span className="text-xs text-red-800 font-semibold">
                      Interception Point: {alert.scannedAtRetailerName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-red-700">
                      {new Date(alert.scannedAt).toLocaleString()}
                    </span>
                    <select
                      value={alert.alertStatus}
                      onChange={(e) => updateAlertStatus(alert.id, e.target.value as any)}
                      className="px-2 py-1 rounded font-bold text-[10px] bg-red-600 text-white border-0 focus:ring-1 focus:ring-white"
                    >
                      <option value="NEW">NEW</option>
                      <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                      <option value="CONFIRMED_FRAUD">CONFIRMED_FRAUD</option>
                      <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                    </select>
                  </div>
                </div>

                <p className="text-slate-800 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-red-200">
                  {alert.notes}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-red-700 font-semibold">
                    Statutory Action: Batch transitioned to RE_ENTRY_FLAGGED. Commercial sale blocked.
                  </span>
                  <button
                    onClick={() => {
                      setSelectedBatchForAudit(alert.batchNumber);
                      setSearchBatchNumber(alert.batchNumber);
                    }}
                    className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 text-[11px]"
                  >
                    <span>Inspect Cryptographic Chain</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Batch Lifecycle Audit Trail Viewer & Cryptographic Ledger Inspector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Full Batch-Lifecycle Audit Trail & Hash Chain Inspector</h3>
            <p className="text-xs text-slate-500">
              Walks the SHA-256 cryptographic chain to verify zero database tampering
            </p>
          </div>

          <form onSubmit={handleSearchBatch} className="flex gap-2">
            <input
              type="text"
              value={searchBatchNumber}
              onChange={(e) => setSearchBatchNumber(e.target.value)}
              placeholder="Enter Batch Number..."
              className="px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 w-48 sm:w-60"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold"
            >
              Search
            </button>
          </form>
        </div>

        {/* Selected Batch Summary Card */}
        {targetBatch && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono font-bold text-sm text-blue-900">{targetBatch.batchNumber}</span>
                <span className="text-xs font-semibold text-slate-700 ml-2">{targetBatch.drugName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunReconcile(targetBatch.batchNumber)}
                  className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-xs flex items-center gap-1 hover:bg-blue-100"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Reconcile Conservation of Qty</span>
                </button>
              </div>
            </div>

            <BatchStatusTimeline
              status={targetBatch.currentStatus}
              manufacturingDate={targetBatch.manufacturingDate}
              expiryDate={targetBatch.expiryDate}
              currentHolder={targetBatch.currentHolderName}
            />

            {reconcileResult && (
              <div
                className={`p-3 rounded-lg text-xs border ${
                  reconcileResult.matched
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {reconcileResult.matched ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                  {reconcileResult.message}
                </div>
                <div className="text-[11px] font-mono mt-1 opacity-80">
                  Claimed Returns: {reconcileResult.claimedQuantity} units | Disposed in Certificate: {reconcileResult.disposedQuantity} units | Discrepancy: {reconcileResult.discrepancy} units
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cryptographic Hash Chain Walk Status */}
        <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Chain Verification Walk:</span>
              {chainVerification.isValid ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  CRYPTOGRAPHICALLY INTACT & VERIFIED
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1 animate-pulse">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  CHAIN SEVERED: TAMPER DETECTED AT BLOCK #{chainVerification.brokenIndex}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {chainVerification.isValid
                ? `All ${chainVerification.totalEntries} blocks match their calculated SHA-256 hashes and previous-block pointers.`
                : chainVerification.errorMessage}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {tamperMessage ? (
              <button
                onClick={handleRestoreDemo}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore Clean Ledger</span>
              </button>
            ) : (
              currentBatchLedger.length > 0 && (
                <button
                  onClick={() => handleTamperDemo(currentBatchLedger[currentBatchLedger.length - 1].id)}
                  className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  title="Simulates an attacker modifying database rows to demonstrate cryptographic integrity check failing"
                >
                  <Bug className="w-3.5 h-3.5" />
                  <span>Simulate DB Tampering</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Ledger Blocks Flow */}
        <div className="space-y-3 pt-2">
          <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
            Cryptographic Block Sequence ({currentBatchLedger.length} Blocks):
          </h4>

          <div className="space-y-2.5">
            {currentBatchLedger.map((entry, idx) => (
              <div
                key={entry.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 font-mono text-xs space-y-2 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-blue-900 text-white flex items-center justify-center font-bold text-[11px]">
                      #{entry.id}
                    </span>
                    <span className="font-bold text-blue-900 font-sans">{entry.eventType}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">{new Date(entry.timestamp).toLocaleString()}</span>
                </div>

                <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg text-[11px] overflow-x-auto">
                  <div className="text-slate-400 text-[10px]">Previous Hash:</div>
                  <div className="text-blue-300 truncate">{entry.previousHash}</div>
                  <div className="text-slate-400 text-[10px] mt-1">Current Hash (SHA-256):</div>
                  <div className="text-emerald-400 truncate">{entry.currentHash}</div>
                </div>

                <div className="text-slate-600 text-[11px] font-sans break-all bg-white p-2 rounded border border-slate-200">
                  <strong>Payload:</strong> {entry.eventData}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Random Audit Sampler & Risk Score Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Random Audit Sampler (Prompt 5) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                  <Dice5 className="w-5 h-5 text-purple-600" />
                  Random Audit Sampler
                </h3>
                <p className="text-xs text-slate-500">
                  Selects a random {samplePercent}% sample of DESTROYED batches for physical compliance re-verification
                </p>
              </div>

              <button
                onClick={handleResample}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                title="Resample random batches"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-600 font-medium">Sampling Rate:</span>
              {[20, 30, 50, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => {
                    setSamplePercent(pct);
                    setSampledBatches(getRandomAuditBatches(pct));
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    samplePercent === pct
                      ? 'bg-purple-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>

            <div className="space-y-2.5 text-xs">
              {sampledBatches.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl border border-slate-200 bg-purple-50/40 flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono font-bold text-blue-900">{b.batchNumber}</div>
                    <div className="text-slate-600 text-[11px]">{b.drugName} • Units: {b.unitsCount}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBatchForAudit(b.batchNumber);
                      setSearchBatchNumber(b.batchNumber);
                    }}
                    className="px-2.5 py-1 rounded bg-white text-purple-700 font-bold border border-purple-200 hover:bg-purple-50 transition-colors text-[11px]"
                  >
                    Inspect Ledger
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Participant Risk Scoring Matrix (Prompt 4 Differentiator #6) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <Scale className="w-5 h-5 text-blue-600" />
                Participant Risk Scoring Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Formula: Weighted past disputes (40%) + late confirmations (25%) + disputed ratio (35%)
              </p>
            </div>

            <div className="space-y-3">
              {/* Retailer Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Retailer Entity #1</span>
                    <h4 className="font-bold text-slate-900 text-sm">{retailerRisk.entityName}</h4>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        retailerRisk.riskLevel === 'HIGH'
                          ? 'bg-red-100 text-red-800'
                          : retailerRisk.riskLevel === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      Score: {retailerRisk.calculatedScore} / 100 ({retailerRisk.riskLevel})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded border border-slate-200 text-center text-[11px]">
                  <div>
                    <div className="text-slate-400 text-[10px]">Disputes</div>
                    <strong className="text-slate-900">{retailerRisk.disputeCount}</strong>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Transactions</div>
                    <strong className="text-slate-900">{retailerRisk.totalTransactions}</strong>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Dispute %</div>
                    <strong className="text-slate-900">{retailerRisk.disputedRatio}%</strong>
                  </div>
                </div>
              </div>

              {/* Distributor Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Distributor Entity #1</span>
                    <h4 className="font-bold text-slate-900 text-sm">{distributorRisk.entityName}</h4>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        distributorRisk.riskLevel === 'HIGH'
                          ? 'bg-red-100 text-red-800'
                          : distributorRisk.riskLevel === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      Score: {distributorRisk.calculatedScore} / 100 ({distributorRisk.riskLevel})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded border border-slate-200 text-center text-[11px]">
                  <div>
                    <div className="text-slate-400 text-[10px]">Disputes</div>
                    <strong className="text-slate-900">{distributorRisk.disputeCount}</strong>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Late Dock Ingress</div>
                    <strong className="text-slate-900">{distributorRisk.lateConfirmationCount}</strong>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Dispute %</div>
                    <strong className="text-slate-900">{distributorRisk.disputedRatio}%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official CDSCO Report Modal */}
      {showReportModal && <CdscoReportModal onClose={() => setShowReportModal(false)} />}
    </div>
  );
};
