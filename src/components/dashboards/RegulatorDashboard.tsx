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
  Database,
  Lock,
} from 'lucide-react';
import { Batch, ReEntryAlert } from '../../types/pharmachain';
import { CdscoReportModal } from '../shared/CdscoReportModal';
import { BatchStatusTimeline } from '../shared/BatchStatusTimeline';
import { HashChainVisualizer } from '../shared/HashChainVisualizer';
import { SealInspectionModal } from '../shared/SealInspectionModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

export const RegulatorDashboard: React.FC = () => {
  const {
    batches,
    reEntryAlerts,
    flaggedSealAlerts,
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

  // Active section tab
  const [activeTab, setActiveTab] = useState<'HASH_CHAIN' | 'ALERTS' | 'ANALYTICS' | 'BATCH_AUDIT'>('HASH_CHAIN');

  // Seal Inspection modal state
  const [isSealModalOpen, setIsSealModalOpen] = useState(false);

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
    <div className="space-y-6 text-slate-900 dark:text-slate-100" id="regulator-dashboard">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/50 to-slate-50 dark:from-[#0b2b24] dark:via-[#0f3830] dark:to-[#0b2b24] text-slate-900 dark:text-white rounded-2xl p-6 shadow-xs dark:shadow-md border border-teal-200 dark:border-teal-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" /> CDSCO Drug Regulatory & Enforcement Directorate
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
            {currentUser?.fullName || 'Insp. R. K. Verma (CDSCO Enforcement)'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-teal-200/80 mt-1">
            Zonal Authority:{' '}
            <span className="font-mono font-bold text-teal-900 dark:text-white bg-teal-100 dark:bg-teal-900/80 px-2 py-0.5 rounded border border-teal-300 dark:border-teal-500/40">
              {currentUser?.licenseNumber || 'CDSCO-WZ-REG-01'}
            </span>{' '}
            | Immutable Ledger Verification & Anti-Diversion Oversight
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="inspect-security-seal-btn"
            onClick={() => setIsSealModalOpen(true)}
            className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 dark:bg-rose-800 dark:hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs border border-rose-600 dark:border-rose-500/40"
          >
            <ShieldAlert className="w-4 h-4 text-rose-100 dark:text-rose-200" />
            <span>Inspect Security Seal (Fraud Sentry)</span>
          </button>

          <button
            id="generate-cdsco-report-btn"
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 dark:bg-teal-800 dark:hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs border border-teal-600 dark:border-teal-500/30"
          >
            <FileText className="w-4 h-4 text-teal-100 dark:text-teal-200" />
            <span>Generate CDSCO Compliance Report</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Re-Entry Interceptions */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80 uppercase tracking-wider">
              Intercepted Fraud Scans
            </div>
            <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 font-mono">
              {reEntryAlerts.length}
            </div>
            <div className="text-[11.5px] text-slate-500 dark:text-teal-200/70 mt-1 flex items-center gap-1">
              <span className="text-rose-600 dark:text-rose-400 font-bold">Counterfeit / Re-Entry Flagged</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800/60">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Cryptographic Ledger Chain Status */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80 uppercase tracking-wider">
              Ledger Blocks Integrity
            </div>
            <div className="text-3xl font-extrabold text-teal-700 dark:text-teal-300 mt-1 font-mono">
              {ledger.length} <span className="text-xs font-normal">Blocks</span>
            </div>
            <div className="text-[11.5px] text-slate-500 dark:text-teal-200/70 mt-1 flex items-center gap-1">
              <span className="text-teal-700 dark:text-teal-400 font-bold">SHA-256 Chained</span> & tamper-evident
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center border border-teal-200 dark:border-teal-800/60">
            <Database className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Active Monitored Batches */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80 uppercase tracking-wider">
              Network Monitored Batches
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
              {batches.length}
            </div>
            <div className="text-[11.5px] text-slate-500 dark:text-teal-200/70 mt-1 flex items-center gap-1">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">End-to-End Custody</span> tracked
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60">
            <Lock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-teal-900/50 pb-2">
        <button
          onClick={() => setActiveTab('HASH_CHAIN')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'HASH_CHAIN'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white dark:bg-[#071f19] text-slate-600 dark:text-teal-300 hover:bg-slate-100 dark:hover:bg-teal-900/40 border border-slate-200 dark:border-teal-900/40'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-teal-300" />
          <span>Hash Chain & Tamper Sentry (Key Innovation)</span>
        </button>
        <button
          onClick={() => setActiveTab('ALERTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ALERTS'
              ? 'bg-rose-700 text-white shadow-sm'
              : 'bg-white dark:bg-[#071f19] text-slate-600 dark:text-teal-300 hover:bg-slate-100 dark:hover:bg-teal-900/40 border border-slate-200 dark:border-teal-900/40'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Fraud Interceptions & Flagged Seals ({reEntryAlerts.length + flaggedSealAlerts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ANALYTICS'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white dark:bg-[#071f19] text-slate-600 dark:text-teal-300 hover:bg-slate-100 dark:hover:bg-teal-900/40 border border-slate-200 dark:border-teal-900/40'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-teal-300" />
          <span>CDSCO Enforcement Analytics & Risk</span>
        </button>
        <button
          onClick={() => setActiveTab('BATCH_AUDIT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'BATCH_AUDIT'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white dark:bg-[#071f19] text-slate-600 dark:text-teal-300 hover:bg-slate-100 dark:hover:bg-teal-900/40 border border-slate-200 dark:border-teal-900/40'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-teal-300" />
          <span>Single Batch Lifecycle & Ledger Ingress</span>
        </button>
      </div>

      {/* TAB CONTENT 1: HASH CHAIN VISUALIZER (INNOVATION) */}
      {activeTab === 'HASH_CHAIN' && (
        <div className="space-y-4">
          <HashChainVisualizer />
        </div>
      )}

      {/* TAB CONTENT 2: FRAUD ALERTS & FLAGGED SEALS */}
      {activeTab === 'ALERTS' && (
        <div className="space-y-6">
          {/* Flagged Seals Sentry Section */}
          <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-teal-900/40 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  Statutory Security Seal Re-Entry Sentry
                </h3>
                <p className="text-xs text-slate-500 dark:text-teal-300/70">
                  If an authorized seal number tied to a destroyed batch or stolen inventory is entered again, a critical diversion alert is triggered.
                </p>
              </div>
              <button
                onClick={() => setIsSealModalOpen(true)}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Test / Inspect Seal Number</span>
              </button>
            </div>

            {flaggedSealAlerts.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-500 dark:text-teal-300/60 border border-dashed rounded-xl bg-slate-50 dark:bg-[#071914] border-slate-200 dark:border-teal-900/50">
                No duplicate or compromised seals flagged in the current session. Click &quot;Test / Inspect Seal Number&quot; above to simulate an attempted re-entry with a destroyed batch seal.
              </div>
            ) : (
              <div className="space-y-3">
                {flaggedSealAlerts.map((flag) => (
                  <div
                    key={flag.id}
                    className="p-4 rounded-xl border border-rose-300 dark:border-rose-900/70 bg-rose-50/80 dark:bg-rose-950/40 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm bg-rose-700 text-white px-2.5 py-0.5 rounded">
                          {flag.sealNumber}
                        </span>
                        <span className="font-bold text-rose-900 dark:text-rose-200">
                          {flag.context}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-rose-700 dark:text-rose-400">
                        {new Date(flag.flaggedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-[#061813] p-2.5 rounded border border-rose-200 dark:border-rose-900/40">
                      <strong>Flag Reason:</strong> {flag.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Fraud & Re-Entry Alerts Feed */}
          <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-teal-900/40 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600 dark:text-rose-400 animate-pulse" />
                  Live Intercepted Re-Entry & Counterfeit Alerts Feed
                </h3>
                <p className="text-xs text-slate-500 dark:text-teal-300/70">
                  Real-time statutory alerts triggered by scans of destroyed or diverted batches
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                {reEntryAlerts.length} Interceptions
              </span>
            </div>

            {reEntryAlerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-teal-400/50 border border-dashed rounded-xl bg-slate-50 dark:bg-[#071914] border-slate-200 dark:border-teal-900/50">
                No active fraud alerts detected in the supply network.
              </div>
            ) : (
              <div className="space-y-3">
                {reEntryAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 space-y-2.5 text-xs text-rose-950 dark:text-rose-200"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-rose-900 dark:text-white bg-white dark:bg-rose-950 px-2.5 py-0.5 rounded border border-rose-300 dark:border-rose-800">
                          {alert.batchNumber}
                        </span>
                        <span className="text-xs text-rose-800 dark:text-rose-300 font-semibold">
                          Interception Point: {alert.scannedAtRetailerName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-rose-700 dark:text-rose-400">
                          {new Date(alert.scannedAt).toLocaleString()}
                        </span>
                        <select
                          value={alert.alertStatus}
                          onChange={(e) => updateAlertStatus(alert.id, e.target.value as any)}
                          className="px-2 py-1 rounded font-bold text-[10px] bg-rose-700 text-white border-0 focus:ring-1 focus:ring-white"
                        >
                          <option value="NEW">NEW</option>
                          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                          <option value="CONFIRMED_FRAUD">CONFIRMED_FRAUD</option>
                          <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed bg-white/80 dark:bg-[#071d18] p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/40">
                      {alert.notes}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">
                        Statutory Action: Batch transitioned to RE_ENTRY_FLAGGED. Commercial sale blocked.
                      </span>
                      <button
                        onClick={() => {
                          setSelectedBatchForAudit(alert.batchNumber);
                          setSearchBatchNumber(alert.batchNumber);
                          setActiveTab('HASH_CHAIN');
                        }}
                        className="text-teal-700 hover:text-teal-900 dark:text-teal-300 dark:hover:text-white font-bold flex items-center gap-1 text-[11px]"
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
        </div>
      )}

      {/* TAB CONTENT 3: ENFORCEMENT ANALYTICS & RISK MATRICES */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          {/* Recharts Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 1: Monthly Interception & Seizures */}
            <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-teal-200 mb-1">
                State-Wise Seizure & Counterfeit Trends
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-teal-300/70 mb-3">
                Monthly intercepted re-entry attempts across major zones
              </p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { month: 'Oct', west: 12, north: 8, south: 4 },
                      { month: 'Nov', west: 18, north: 11, south: 6 },
                      { month: 'Dec', west: 14, north: 16, south: 7 },
                      { month: 'Jan', west: 22, north: 19, south: 9 },
                      { month: 'Feb', west: 29, north: 24, south: 12 },
                    ]}
                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="month" interval={0} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      cursor={false}
                      contentStyle={{
                        backgroundColor: '#071d18',
                        borderColor: '#0d9488',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                      itemStyle={{ color: '#2dd4bf' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="west" stroke="#e11d48" fill="#ffe4e6" name="West Zone" />
                    <Area type="monotone" dataKey="north" stroke="#0284c7" fill="#e0f2fe" name="North Zone" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Entity Risk Score Comparison */}
            <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-teal-200 mb-1">
                Audited Participant Risk Scores
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-teal-300/70 mb-3">
                Calculated dynamically via dispute history &amp; transit lag
              </p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Retailer #1', score: retailerRisk.calculatedScore, color: '#0d9488' },
                      { name: 'Distributor #1', score: distributorRisk.calculatedScore, color: '#f59e0b' },
                      { name: 'Apex Retail', score: 32, color: '#0d9488' },
                      { name: 'Western Hub', score: 76, color: '#e11d48' },
                    ]}
                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="name" interval={0} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      cursor={false}
                      contentStyle={{
                        backgroundColor: '#071d18',
                        borderColor: '#0d9488',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                      itemStyle={{ color: '#2dd4bf' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 600 }}
                    />
                    <Bar dataKey="score" name="Risk Score (/100)" radius={[4, 4, 0, 0]} minPointSize={8}>
                      <Cell fill="#0d9488" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#0d9488" />
                      <Cell fill="#e11d48" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Alert Resolution Breakdown */}
            <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-teal-200 mb-1">
                Interception Investigation Status
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-teal-300/70 mb-3">
                Disposition of logged counterfeit alerts
              </p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Confirmed Fraud', value: 55, color: '#e11d48' },
                        { name: 'Under Review', value: 30, color: '#f59e0b' },
                        { name: 'Resolved / Sealed', value: 15, color: '#10b981' },
                      ]}
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell fill="#e11d48" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip
                      cursor={false}
                      contentStyle={{
                        backgroundColor: '#071d18',
                        borderColor: '#0d9488',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                      itemStyle={{ color: '#2dd4bf' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Participant Risk Scoring Matrix Cards */}
          <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 shadow-xs p-5 space-y-4">
            <div className="border-b border-slate-200 dark:border-teal-900/40 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                <Scale className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                Participant Regulatory Risk Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-teal-300/70">
                Formula: Weighted past disputes (40%) + late confirmations (25%) + disputed ratio (35%)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Retailer Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-teal-900/50 bg-slate-50/70 dark:bg-[#081f19] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-teal-400/60">Retailer Entity #1</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{retailerRisk.entityName}</h4>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        retailerRisk.riskLevel === 'HIGH'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300'
                          : retailerRisk.riskLevel === 'MEDIUM'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                      }`}
                    >
                      Score: {retailerRisk.calculatedScore} / 100 ({retailerRisk.riskLevel})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white dark:bg-[#061813] p-2 rounded border border-slate-200 dark:border-teal-900/50 text-center text-[11px]">
                  <div>
                    <div className="text-slate-400 dark:text-teal-300/60 text-[10px]">Disputes</div>
                    <strong className="text-slate-900 dark:text-white">{retailerRisk.disputeCount}</strong>
                  </div>
                  <div>
                    <div className="text-slate-400 dark:text-teal-300/60 text-[10px]">Transactions</div>
                    <strong className="text-slate-900 dark:text-white">{retailerRisk.totalTransactions}</strong>
                  </div>
                  <div>
                    <div className="text-slate-400 dark:text-teal-300/60 text-[10px]">Dispute %</div>
                    <strong className="text-slate-900 dark:text-white">{retailerRisk.disputedRatio}%</strong>
                  </div>
                </div>
              </div>

              {/* Distributor Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-teal-900/50 bg-slate-50/70 dark:bg-[#081f19] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-teal-400/60">Distributor Entity #1</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{distributorRisk.entityName}</h4>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        distributorRisk.riskLevel === 'HIGH'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300'
                          : distributorRisk.riskLevel === 'MEDIUM'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                      }`}
                    >
                      Score: {distributorRisk.calculatedScore} / 100 ({distributorRisk.riskLevel})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white dark:bg-[#061813] p-2 rounded border border-slate-200 dark:border-teal-900/50 text-center text-[11px]">
                  <div>
                    <div className="text-slate-400 dark:text-teal-300/60 text-[10px]">Disputes</div>
                    <strong className="text-slate-900 dark:text-white">{distributorRisk.disputeCount}</strong>
                  </div>
                  <div>
                    <div className="text-slate-400 dark:text-teal-300/60 text-[10px]">Late Ingress</div>
                    <strong className="text-slate-900 dark:text-white">{distributorRisk.lateConfirmationCount}</strong>
                  </div>
                  <div>
                    <div className="text-slate-400 dark:text-teal-300/60 text-[10px]">Dispute %</div>
                    <strong className="text-slate-900 dark:text-white">{distributorRisk.disputedRatio}%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: BATCH AUDIT & RECONCILE */}
      {activeTab === 'BATCH_AUDIT' && (
        <div className="space-y-6">
          {/* Full Batch Lifecycle Audit Trail Viewer & Cryptographic Ledger Inspector */}
          <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Full Batch-Lifecycle Audit Trail & Hash Chain Inspector</h3>
                <p className="text-xs text-slate-500 dark:text-teal-300/70">
                  Walks the SHA-256 cryptographic chain to verify zero database tampering
                </p>
              </div>

              <form onSubmit={handleSearchBatch} className="flex gap-2">
                <input
                  type="text"
                  value={searchBatchNumber}
                  onChange={(e) => setSearchBatchNumber(e.target.value)}
                  placeholder="Enter Batch Number..."
                  className="px-3 py-1.5 text-xs font-mono border border-slate-300 dark:border-teal-700 rounded-lg bg-white dark:bg-[#061813] text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-700 w-48 sm:w-60"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-teal-800 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Selected Batch Summary Card */}
            {targetBatch && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#081f19] border border-slate-200 dark:border-teal-900/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-sm text-teal-800 dark:text-teal-300">{targetBatch.batchNumber}</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-teal-100 ml-2">{targetBatch.drugName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunReconcile(targetBatch.batchNumber)}
                      className="px-2.5 py-1 rounded bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800 font-semibold text-xs flex items-center gap-1 hover:bg-teal-100 dark:hover:bg-teal-900"
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
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      {reconcileResult.matched ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
            <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-[#051713] text-slate-900 dark:text-white border-slate-200 dark:border-teal-900/60 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-teal-300/80 font-mono">Chain Verification Walk:</span>
                  {chainVerification.isValid ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      CRYPTOGRAPHICALLY INTACT & VERIFIED
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 flex items-center gap-1 animate-pulse">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      CHAIN SEVERED: TAMPER DETECTED AT BLOCK #{chainVerification.brokenIndex}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-teal-200/70">
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
                      className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
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
              <h4 className="font-bold text-xs text-slate-700 dark:text-teal-300/90 uppercase tracking-wider">
                Cryptographic Block Sequence ({currentBatchLedger.length} Blocks):
              </h4>

              <div className="space-y-2.5">
                {currentBatchLedger.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-teal-900/50 bg-slate-50/60 dark:bg-[#081f19] font-mono text-xs space-y-2 hover:border-teal-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-teal-800 text-white flex items-center justify-center font-bold text-[11px]">
                          #{entry.id}
                        </span>
                        <span className="font-bold text-teal-800 dark:text-teal-300 font-sans">{entry.eventType}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-teal-200/60">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>

                    <div className="bg-[#051713] text-slate-200 p-2.5 rounded-lg text-[11px] overflow-x-auto border border-teal-900/50">
                      <div className="text-teal-300/70 text-[10px]">Previous Hash:</div>
                      <div className="text-teal-200 truncate">{entry.previousHash}</div>
                      <div className="text-teal-300/70 text-[10px] mt-1">Current Hash (SHA-256):</div>
                      <div className="text-emerald-400 truncate">{entry.currentHash}</div>
                    </div>

                    <div className="text-slate-600 dark:text-slate-300 text-[11px] font-sans break-all bg-white dark:bg-[#061813] p-2 rounded border border-slate-200 dark:border-teal-900/50">
                      <strong className="text-slate-800 dark:text-teal-100">Payload:</strong> {entry.eventData}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Random Audit Sampler */}
          <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-teal-900/40 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                  <Dice5 className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                  Statutory Random Audit Sampler
                </h3>
                <p className="text-xs text-slate-500 dark:text-teal-300/70">
                  Selects a random {samplePercent}% sample of DESTROYED batches for physical compliance re-verification
                </p>
              </div>

              <button
                onClick={handleResample}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-teal-800 hover:bg-slate-100 dark:hover:bg-teal-900/60 text-slate-600 dark:text-teal-200 transition-colors"
                title="Resample random batches"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-600 dark:text-teal-300 font-medium">Sampling Rate:</span>
              {[20, 30, 50, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => {
                    setSamplePercent(pct);
                    setSampledBatches(getRandomAuditBatches(pct));
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    samplePercent === pct
                      ? 'bg-teal-800 text-white'
                      : 'bg-slate-100 dark:bg-teal-950/60 text-slate-600 dark:text-teal-300/80 hover:bg-slate-200 dark:hover:bg-teal-900/50'
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
                  className="p-3 rounded-xl border border-slate-200 dark:border-teal-900/50 bg-slate-50/50 dark:bg-[#081f19] flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono font-bold text-teal-800 dark:text-teal-300">{b.batchNumber}</div>
                    <div className="text-slate-600 dark:text-teal-200/70 text-[11px]">{b.drugName} • Units: {b.unitsCount}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBatchForAudit(b.batchNumber);
                      setSearchBatchNumber(b.batchNumber);
                    }}
                    className="px-2.5 py-1 rounded bg-white dark:bg-[#071914] text-teal-800 dark:text-teal-300 font-bold border border-teal-300 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/50 transition-colors text-[11px]"
                  >
                    Inspect Ledger
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Official CDSCO Report Modal */}
      {showReportModal && <CdscoReportModal onClose={() => setShowReportModal(false)} />}

      {/* Official Statutory Seal Inspection Modal */}
      {isSealModalOpen && <SealInspectionModal onClose={() => setIsSealModalOpen(false)} />}
    </div>
  );
};
