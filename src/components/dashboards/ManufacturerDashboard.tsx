import React, { useState } from 'react';
import { usePharmaChain } from '../../context/PharmaChainContext';
import {
  Building2,
  CheckCircle2,
  Calendar,
  FileCheck,
  ShieldCheck,
  ExternalLink,
  Flame,
  Award,
  Layers,
  FileText,
  Clock,
  KeyRound,
  Bell,
  Truck,
  Send,
  Package,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Batch } from '../../types/pharmachain';
import { DestructionCertificateModal } from '../shared/DestructionCertificateModal';
import { PortalModal } from '../shared/PortalModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Legend,
} from 'recharts';

export const ManufacturerDashboard: React.FC = () => {
  const {
    batches,
    productionRecords,
    destructionCertificates,
    pickupReminders,
    sendPickupReminder,
    receiveMedicineAtFactory,
    dispatchToDisposer,
    scheduleDisposal,
    currentUser,
  } = usePharmaChain();

  // Selected batch for disposal dispatch modal
  const [selectedBatchForDispatch, setSelectedBatchForDispatch] = useState<Batch | null>(null);
  const [targetFacilityName, setTargetFacilityName] = useState(
    'CleanEco Hazardous Incinerator (CPCB-HAZ-2024-887)'
  );
  const [manifestNumber, setManifestNumber] = useState('');
  const [sealNumber, setSealNumber] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Receiving state
  const [isReceivingBatch, setIsReceivingBatch] = useState<string | null>(null);

  // Certificate Modal State
  const [viewingCertificate, setViewingCertificate] = useState<any | null>(null);

  // Reminder state
  const [reminderNotice, setReminderNotice] = useState<string | null>(null);

  // Batches by stage
  const quarantinedAtRetailers = batches.filter(
    (b) => b.currentStatus === 'RETURN_INITIATED' || (b.currentHolderRole === 'RETAILER' && b.currentStatus !== 'ACTIVE')
  );
  const distributorTransitBatches = batches.filter((b) => b.currentStatus === 'DISTRIBUTOR_CONFIRMED');
  const factoryReceivedBatches = batches.filter((b) => b.currentStatus === 'RECEIVED_AT_MANUFACTURER');
  const scheduledForDestructionBatches = batches.filter(
    (b) => b.currentStatus === 'SCHEDULED_FOR_DESTRUCTION'
  );
  const destroyedBatches = batches.filter((b) => b.currentStatus === 'DESTROYED');

  // Handle send reminder to logistics/retailer
  const handleSendReminder = (batchNumber: string) => {
    const res = sendPickupReminder(batchNumber);
    setReminderNotice(res.message);
    setTimeout(() => setReminderNotice(null), 5000);
  };

  // Handle Factory Dock Receipt
  const handleReceiveAtFactory = async (batchNumber: string) => {
    setIsReceivingBatch(batchNumber);
    const res = await receiveMedicineAtFactory(batchNumber);
    setIsReceivingBatch(null);
    if (res.success) {
      setActionNotice(`✅ Factory Intake Complete: Batch ${batchNumber} received at Plant Dock.`);
      setTimeout(() => setActionNotice(null), 5000);
    } else {
      setActionNotice(`⚠️ Factory Intake Error: ${res.message}`);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  // Handle Dispatch to Hazardous Disposer
  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForDispatch) return;

    setIsDispatching(true);
    setDispatchError(null);
    const res = await dispatchToDisposer({
      batchNumber: selectedBatchForDispatch.batchNumber,
      targetFacilityName,
      manifestNumber: manifestNumber || `CPCB-HAZ-DISP-${Date.now().toString().slice(-6)}`,
      sealNumber: sealNumber || `DISP-SEAL-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setIsDispatching(false);

    if (res.success) {
      setActionNotice(res.message);
      setSelectedBatchForDispatch(null);
      setDispatchError(null);
      setTimeout(() => setActionNotice(null), 5000);
    } else {
      setDispatchError(res.message || 'Authorization failed: Could not dispatch to disposer.');
    }
  };

  // Chart 1: Funnel of batches across reverse lifecycle
  const pipelineFunnelData = [
    { stage: 'Retailer Quarantined', count: quarantinedAtRetailers.length, fill: '#f59e0b' },
    { stage: 'Logistics Transit', count: distributorTransitBatches.length, fill: '#0284c7' },
    { stage: 'Factory Dock Intake', count: factoryReceivedBatches.length, fill: '#8b5cf6' },
    { stage: 'Dispatched to HazMat', count: scheduledForDestructionBatches.length, fill: '#f97316' },
    { stage: 'Terminally Destroyed', count: destroyedBatches.length, fill: '#10b981' },
  ];

  // Chart 2: Drug molecule expiry return volumes
  const drugReturnData = [
    { drug: 'Azithromycin', returns: 480, safe: 3200, fill: '#0d9488' },
    { drug: 'Metformin', returns: 320, safe: 4500, fill: '#0284c7' },
    { drug: 'Telmisartan', returns: 210, safe: 2800, fill: '#8b5cf6' },
    { drug: 'Paracetamol', returns: 150, safe: 5000, fill: '#f59e0b' },
    { drug: 'Amoxicillin', returns: 190, safe: 3100, fill: '#10b981' },
  ];

  // Chart 3: Reclamation & Disposal Breakdown
  const dispositionData = [
    { name: 'Certified Incineration (1200°C)', value: 68, color: '#e11d48' },
    { name: 'Active Shelf Yield', value: 24, color: '#10b981' },
    { name: 'Salvaged Raw Excipients', value: 8, color: '#0284c7' },
  ];

  return (
    <div className="space-y-6" id="manufacturer-dashboard">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/50 to-slate-50 dark:from-[#0b2b24] dark:via-[#0f3830] dark:to-[#0b2b24] text-slate-900 dark:text-white rounded-2xl p-6 shadow-xs dark:shadow-md border border-teal-200 dark:border-teal-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Manufacturing Compliance & Reverse Logistics Hub
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
            {currentUser?.fullName || currentUser?.entityName || 'Sun Pharma Baddi Unit III'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-teal-200/80 mt-1">
            Manufacturing License:{' '}
            <span className="font-mono font-bold text-teal-900 dark:text-white bg-teal-100 dark:bg-teal-900/80 px-2 py-0.5 rounded border border-teal-300 dark:border-teal-500/40">
              {currentUser?.licenseNumber || 'MFG-2022-IND-00412'}
            </span>{' '}
            | Schedule M Reclamation & HazMat Tracking
          </p>
        </div>

        <div className="flex items-center">
          <div className="bg-white/90 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-500/30 rounded-xl px-4 py-2.5 text-right shadow-xs">
            <div className="text-[11px] text-teal-800 dark:text-teal-300 font-bold uppercase tracking-wider">
              Statutory Custody Link
            </div>
            <div className="text-xs text-slate-700 dark:text-teal-100 font-mono">
              Terminal Incineration Sentry Active
            </div>
          </div>
        </div>
      </div>

      {/* Global Alerts / Action Notices */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {reminderNotice && (
        <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{reminderNotice}</span>
          <button onClick={() => setReminderNotice(null)} className="text-teal-700 hover:text-teal-900 font-bold">✕</button>
        </div>
      )}

      {/* 4 Life-Cycle Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl p-4 border border-slate-200 dark:border-teal-900/50 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80">Retailer Quarantined</div>
          <div className="text-2xl font-extrabold text-amber-500 mt-1 font-mono">{quarantinedAtRetailers.length} Batches</div>
          <p className="text-[11px] text-slate-400 dark:text-teal-300/60 mt-1">Awaiting reverse pickup</p>
        </div>

        <div className="bg-white dark:bg-[#0a231d] rounded-2xl p-4 border border-slate-200 dark:border-teal-900/50 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80">At Distributor Hub</div>
          <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1 font-mono">{distributorTransitBatches.length} Batches</div>
          <p className="text-[11px] text-slate-400 dark:text-teal-300/60 mt-1">Ready for factory dock receipt</p>
        </div>

        <div className="bg-white dark:bg-[#0a231d] rounded-2xl p-4 border border-slate-200 dark:border-teal-900/50 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80">Received at Factory Dock</div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 font-mono">{factoryReceivedBatches.length} Batches</div>
          <p className="text-[11px] text-slate-400 dark:text-teal-300/60 mt-1">Awaiting HazMat dispatch</p>
        </div>

        <div className="bg-white dark:bg-[#0a231d] rounded-2xl p-4 border border-slate-200 dark:border-teal-900/50 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80">Certified Destroyed</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{destroyedBatches.length} Batches</div>
          <p className="text-[11px] text-slate-400 dark:text-teal-300/60 mt-1">CPCB seals & manifests logged</p>
        </div>
      </div>

      {/* REVERSE PROCESS MONITORING PIPELINE */}
      <div className="bg-white dark:bg-[#0a231d] rounded-2xl p-5 border border-slate-200 dark:border-teal-900/50 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Reverse Logistics Process Monitoring Pipeline
            </h3>
            <p className="text-xs text-slate-500 dark:text-teal-300/70">
              Live custody handoffs strictly audited to prevent black-market diversion
            </p>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-800">
            CDSCO 5-STAGE AUDIT
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs">
            <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">Stage 1</div>
            <div className="font-bold text-slate-900 dark:text-white mt-0.5">Retailer Quarantine</div>
            <div className="text-[11px] text-slate-500 dark:text-teal-200/70 mt-1 font-mono">{quarantinedAtRetailers.length} active lots</div>
          </div>

          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 text-xs">
            <div className="text-[10px] font-bold text-sky-800 dark:text-sky-300 uppercase">Stage 2</div>
            <div className="font-bold text-slate-900 dark:text-white mt-0.5">Logistics Transit</div>
            <div className="text-[11px] text-slate-500 dark:text-teal-200/70 mt-1 font-mono">{distributorTransitBatches.length} verified hubs</div>
          </div>

          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 text-xs">
            <div className="text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase">Stage 3</div>
            <div className="font-bold text-slate-900 dark:text-white mt-0.5">Factory Intake</div>
            <div className="text-[11px] text-slate-500 dark:text-teal-200/70 mt-1 font-mono">{factoryReceivedBatches.length} inspected</div>
          </div>

          <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 text-xs">
            <div className="text-[10px] font-bold text-orange-800 dark:text-orange-300 uppercase">Stage 4</div>
            <div className="font-bold text-slate-900 dark:text-white mt-0.5">Dispatched to Disposer</div>
            <div className="text-[11px] text-slate-500 dark:text-teal-200/70 mt-1 font-mono">{scheduledForDestructionBatches.length} sealed runs</div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs">
            <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Stage 5</div>
            <div className="font-bold text-slate-900 dark:text-white mt-0.5">Incinerated & Certified</div>
            <div className="text-[11px] text-slate-500 dark:text-teal-200/70 mt-1 font-mono">{destroyedBatches.length} CPCB seals</div>
          </div>
        </div>
      </div>

      {/* RETAILER PICKUP REMINDERS BOARD (User Requirement: "reminder to pick the medicine from retailer") */}
      <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-teal-900/40 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
              Retail Pharmacy Expired Stock Pickup Reminders
            </h3>
            <p className="text-xs text-slate-500 dark:text-teal-300/70">
              Issue automated reverse logistics pickup directives to courier partners to retrieve quarantined medicines from retail counters.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300">
            {pickupReminders.length} Active Directives
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* List of batches at Retailers that need reminders */}
          {batches
            .filter((b) => b.currentHolderRole === 'RETAILER' && b.currentStatus !== 'DESTROYED')
            .slice(0, 4)
            .map((b) => {
              const existingReminder = pickupReminders.find((r) => r.batchNumber === b.batchNumber);
              return (
                <div
                  key={b.batchNumber}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-teal-900/50 bg-slate-50/60 dark:bg-[#071d18] flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {b.drugName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-teal-300">
                        Batch #{b.batchNumber} | Units: <strong className="text-slate-800 dark:text-teal-100">{b.unitsCount}</strong>
                      </div>
                      <div className="text-[10.5px] text-slate-500 dark:text-teal-300/70 mt-0.5">
                        Pharmacy: Apollo Medicos #402, Mumbai (Exp: {b.expiryDate})
                      </div>
                    </div>

                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                        existingReminder
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                      }`}
                    >
                      {existingReminder ? `REMINDER ${existingReminder.status}` : 'PICKUP PENDING'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-teal-900/30 text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {existingReminder
                        ? `Directive sent: ${new Date(existingReminder.reminderSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Reverse courier not yet dispatched'}
                    </span>
                    <button
                      onClick={() => handleSendReminder(b.batchNumber)}
                      className="px-3 py-1 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      {existingReminder ? 'Resend Reminder' : 'Dispatch Pickup Directive'}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* MANUFACTURING PROCESS: 
          1. Acknowledge Receipt of Medicines at Factory Dock
          2. Send Received Medicines to Disposers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Table 1: In-Transit Batches to Receive at Factory */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-teal-900/40 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-600" />
                Step 1: Receive Arriving Medicines at Factory Dock
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-teal-300/70">
                Log physical delivery from logistics hub into plant inventory
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-200 border border-sky-300">
              {distributorTransitBatches.length} Awaiting
            </span>
          </div>

          <div className="space-y-2.5">
            {distributorTransitBatches.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No batches currently in transit awaiting factory dock receipt.
              </div>
            ) : (
              distributorTransitBatches.map((b) => (
                <div
                  key={b.batchNumber}
                  className="p-3 rounded-xl border border-slate-200 dark:border-teal-900/40 bg-slate-50/60 dark:bg-[#071d18] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      {b.drugName}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 dark:text-teal-300">
                      Batch #{b.batchNumber} • {b.unitsCount} units
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                      ✓ Distributor Strip Count Verified
                    </div>
                  </div>

                  <button
                    disabled={isReceivingBatch === b.batchNumber}
                    onClick={() => handleReceiveAtFactory(b.batchNumber)}
                    className="px-3 py-1.5 rounded-lg bg-sky-800 hover:bg-sky-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isReceivingBatch === b.batchNumber ? 'Logging Intake...' : 'Acknowledge Factory Receipt'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Table 2: Send Received Medicines to Waste Disposer */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-teal-900/40 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-600" />
                Step 2: Send Received Medicines to Disposers
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-teal-300/70">
                Dispatch verified stock to CPCB-authorized high-temp incinerator
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border border-purple-300">
              {factoryReceivedBatches.length} Ready for Disposer
            </span>
          </div>

          <div className="space-y-2.5">
            {factoryReceivedBatches.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No batches currently at factory dock awaiting hazardous disposer dispatch.
              </div>
            ) : (
              factoryReceivedBatches.map((b) => (
                <div
                  key={b.batchNumber}
                  className="p-3 rounded-xl border border-slate-200 dark:border-teal-900/40 bg-slate-50/60 dark:bg-[#071d18] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      {b.drugName}
                    </div>
                    <div className="font-mono text-[11px] text-purple-700 dark:text-purple-300">
                      Batch #{b.batchNumber} • Dock Intake Logged
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-teal-300/70 mt-0.5">
                      Ready for Terminal Incineration Staging
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedBatchForDispatch(b);
                      setManifestNumber(`CPCB-HAZ-DISP-${Date.now().toString().slice(-6)}`);
                      setSealNumber(`DISP-SEAL-${Math.floor(1000 + Math.random() * 9000)}`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-orange-700 hover:bg-orange-600 text-white text-xs font-bold transition-all"
                  >
                    Send to Disposer &rarr;
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* THREE RICH RECHARTS ANALYTICS GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Graph 1: Funnel of Reverse Pipeline */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-teal-200">
                Reverse Chain Funnel
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-teal-300/70">
                Batches across 5 lifecycle audit stages
              </p>
            </div>
          </div>

          <div className="h-52 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineFunnelData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="stage" tick={{ fontSize: 9, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
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
                  formatter={(value: any) => [`${value} batch${value === 1 ? '' : 'es'}`, 'Pipeline Stage']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} minPointSize={8}>
                  {pipelineFunnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Drug Expiry Breakdown */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-teal-200">
                Returned Medicine Molecule Volume
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-teal-300/70">
                Reverse returns by drug formulation (units)
              </p>
            </div>
          </div>

          <div className="h-52 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={drugReturnData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="drug"
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={35}
                  tick={{ fontSize: 9.5, fill: '#64748b' }}
                />
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
                  formatter={(value: any) => [`${value} units`, 'Expired Returns']}
                />
                <Bar dataKey="returns" name="Expired Returns" radius={[4, 4, 0, 0]} minPointSize={8}>
                  {drugReturnData.map((entry, index) => (
                    <Cell key={`drug-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 3: Salvage vs Destruction Yield */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-teal-200">
                Terminal Reclamation & Yield
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-teal-300/70">
                Incineration vs Raw material salvage
              </p>
            </div>
          </div>

          <div className="h-52 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dispositionData}
                  innerRadius={38}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {dispositionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
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

      {/* DISPATCH TO DISPOSER MODAL */}
      {selectedBatchForDispatch && (
        <PortalModal
          id="dispatch-disposer-modal"
          onClose={() => {
            setSelectedBatchForDispatch(null);
            setDispatchError(null);
          }}
          className="bg-white dark:bg-[#071d18] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-teal-900/50 text-slate-900 dark:text-white"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-teal-900/40 pb-3">
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Send Medicine to Authorized Disposer
              </h4>
              <p className="text-xs text-slate-500 dark:text-teal-300/70">
                Batch: <span className="font-mono text-teal-800 dark:text-teal-200 font-bold">{selectedBatchForDispatch.batchNumber}</span>
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedBatchForDispatch(null);
                setDispatchError(null);
              }}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
            >
              ✕
            </button>
          </div>

          {dispatchError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 rounded-xl text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{dispatchError}</span>
            </div>
          )}

          <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
            <div className="bg-teal-50 dark:bg-teal-950/50 p-3 rounded-xl border border-teal-200 dark:border-teal-800">
              <div className="text-teal-950 dark:text-white font-semibold">{selectedBatchForDispatch.drugName}</div>
              <div className="text-teal-800 dark:text-teal-200 text-[11px] font-mono">
                Volume: {selectedBatchForDispatch.unitsCount} units • Factory Dock Bay 4
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-teal-200 block mb-1">
                CPCB Authorized Waste Facility:
              </label>
              <select
                value={targetFacilityName}
                onChange={(e) => setTargetFacilityName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 dark:border-teal-900/60 rounded-xl text-xs bg-slate-50 dark:bg-teal-950/40 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-700"
              >
                <option value="CleanEco Hazardous Incinerator (CPCB-HAZ-2024-887)">
                  CleanEco Hazardous Incinerator (CPCB-HAZ-2024-887, Baddi HP)
                </option>
                <option value="GreenEarth Bio-Destruction Facility (CPCB-MH-0091)">
                  GreenEarth Bio-Destruction Facility (CPCB-MH-0091, Taloja MH)
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-teal-200 block mb-1">
                  CPCB HazMat Gate Pass Manifest #:
                </label>
                <input
                  type="text"
                  value={manifestNumber}
                  onChange={(e) => setManifestNumber(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-teal-900/60 rounded-xl text-xs font-mono bg-slate-50 dark:bg-teal-950/40 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-teal-200 block mb-1">
                  Security Seal Barcode #:
                </label>
                <input
                  type="text"
                  value={sealNumber}
                  onChange={(e) => setSealNumber(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-teal-900/60 rounded-xl text-xs font-mono bg-slate-50 dark:bg-teal-950/40 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedBatchForDispatch(null);
                  setDispatchError(null);
                }}
                className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-teal-900/60 text-slate-700 dark:text-teal-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDispatching}
                className="flex-1 py-2 rounded-xl bg-orange-700 hover:bg-orange-600 text-white font-bold transition-all disabled:opacity-50"
              >
                {isDispatching ? 'Authorizing Dispatch...' : 'Authorize & Dispatch to Disposer'}
              </button>
            </div>
          </form>
        </PortalModal>
      )}

      {/* CPCB DESTRUCTION CERTIFICATES ARCHIVE */}
      <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-teal-900/40 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-600" />
              CPCB Certified Destruction Manifests & Seals
            </h3>
            <p className="text-xs text-slate-500 dark:text-teal-300/70">
              Official certificates issued by disposers containing authorized seals and itemized lists of disposed medicines
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-teal-950 text-slate-700 dark:text-teal-200 border border-slate-200 dark:border-teal-800">
            {destructionCertificates.length} Certified Manifests
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {destructionCertificates.map((cert) => (
            <div
              key={cert.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-teal-900/40 bg-slate-50/60 dark:bg-[#071d18] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-sm text-teal-900 dark:text-teal-200">
                    {cert.batchNumber}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    CPCB SEALED
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {cert.facilityName || 'CleanEco Hazardous Incinerator'}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-teal-300/70 mt-1">
                  Qty: {cert.recordedDisposedQty || cert.destroyedQuantity || 500} units • Method: {cert.disposalMethod || 'Thermal 1200°C'}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 dark:border-teal-900/30">
                <span className="text-[10px] font-mono text-slate-400">
                  Date: {cert.disposalDate || new Date().toISOString().split('T')[0]}
                </span>
                <button
                  onClick={() => setViewingCertificate(cert)}
                  className="text-xs font-bold text-teal-800 dark:text-teal-300 hover:underline flex items-center gap-1"
                >
                  <span>View Authorized Seal Certificate</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OFFICIAL DESTRUCTION CERTIFICATE MODAL */}
      {viewingCertificate && (
        <DestructionCertificateModal
          certificate={viewingCertificate}
          onClose={() => setViewingCertificate(null)}
        />
      )}
    </div>
  );
};
