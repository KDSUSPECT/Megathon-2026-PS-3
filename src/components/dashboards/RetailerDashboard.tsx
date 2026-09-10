import React, { useState } from 'react';
import { usePharmaChain } from '../../context/PharmaChainContext';
import { Batch } from '../../types/pharmachain';
import {
  Package,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Camera,
  Upload,
  Search,
  ScanLine,
  FileText,
  HelpCircle,
  ShieldCheck,
  Building2,
  Calendar,
  AlertCircle,
  Eye,
  X,
} from 'lucide-react';
import { QrDisplayModal } from '../shared/QrDisplayModal';
import { BatchStatusTimeline } from '../shared/BatchStatusTimeline';
import { InitiateReturnModal } from '../shared/InitiateReturnModal';
import { CameraCaptureModal } from '../shared/CameraCaptureModal';
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

export const RetailerDashboard: React.FC = () => {
  const {
    batches,
    returnRequests,
    createReturnRequest,
    scanPhotoOcr,
    currentUser,
  } = usePharmaChain();

  // Return Request Form state
  const [selectedBatchNumber, setSelectedBatchNumber] = useState('');
  const [claimedQuantity, setClaimedQuantity] = useState<number>(50);
  const [conditionNotes, setConditionNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // OCR state
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrLog, setOcrLog] = useState<string | null>(null);

  // Modals & inspect
  const [activeReturnBatch, setActiveReturnBatch] = useState<Batch | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [activeQrBatch, setActiveQrBatch] = useState<string | null>(null);
  const [inspectBatchNumber, setInspectBatchNumber] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter inventory for Retailer
  const retailerInventory = batches.filter(
    (b) =>
      b.currentHolderRole === 'RETAILER' &&
      (b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.drugName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper for expiry countdown badge
  const getExpiryBadge = (expiryDateStr: string) => {
    const today = new Date();
    const expiry = new Date(expiryDateStr);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 3) {
      return {
        label: diffDays <= 0 ? 'EXPIRED' : `${diffDays}d REMAINING`,
        badgeClass: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse font-bold',
        icon: AlertTriangle,
        urgent: true,
        severity: 'CRITICAL',
      };
    }
    if (diffDays < 15) {
      return {
        label: `${diffDays}d REMAINING`,
        badgeClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-semibold',
        icon: Clock,
        urgent: false,
        severity: 'WARNING',
      };
    }
    if (diffDays < 30) {
      return {
        label: `${diffDays}d REMAINING`,
        badgeClass: 'bg-yellow-50 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 font-medium',
        icon: Clock,
        urgent: false,
        severity: 'CAUTION',
      };
    }
    return {
      label: `${diffDays}d`,
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle2,
      urgent: false,
      severity: 'SAFE',
    };
  };

  // OCR Photo Upload / Scan Simulation
  const handleOcrSimulation = async (sampleBatchOverride?: string) => {
    setIsScanningOcr(true);
    setOcrLog('Initializing Tesseract Optical Engine & CDSCO Regex Parser...');
    try {
      const mockImageSample = sampleBatchOverride || 'IMAGE_PACK_WITH_TEXT: B.No: PAR-650-2026C EXP: 2026-09';
      const ocrRes = await scanPhotoOcr(mockImageSample);
      if (ocrRes.detectedBatchNumber) {
        setSelectedBatchNumber(ocrRes.detectedBatchNumber);
        setPhotoPreview('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80');
        setOcrLog(`✅ OCR Success: Extracted Batch No. [${ocrRes.detectedBatchNumber}] (Confidence ${(ocrRes.confidence * 100).toFixed(0)}%). Form pre-filled!`);
      }
    } finally {
      setIsScanningOcr(false);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchNumber || claimedQuantity <= 0) {
      setFormMessage({ type: 'error', text: 'Please select a batch and enter a valid return quantity.' });
      return;
    }

    setIsSubmitting(true);
    setFormMessage(null);

    const res = await createReturnRequest({
      batchNumber: selectedBatchNumber,
      claimedQuantity,
      conditionNotes: conditionNotes || 'Batch flagged for reverse logistics disposal via Apollo Pharmacy.',
      photoUrl: photoPreview || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setFormMessage({ type: 'success', text: res.message });
      setSelectedBatchNumber('');
      setClaimedQuantity(50);
      setConditionNotes('');
      setPhotoPreview(null);
      setOcrLog(null);
    } else {
      setFormMessage({ type: 'error', text: res.message });
    }
  };

  const inspectedBatch = batches.find((b) => b.batchNumber === inspectBatchNumber);
  const criticalExpiriesCount = retailerInventory.filter((b) => {
    const today = new Date();
    const expiry = new Date(b.expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < 3;
  }).length;

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100" id="retailer-dashboard">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/50 to-slate-50 dark:from-[#0b2b24] dark:via-[#0f3830] dark:to-[#0b2b24] text-slate-900 dark:text-white rounded-2xl p-6 shadow-xs dark:shadow-md border border-teal-200 dark:border-teal-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Package className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Authorized Retail Pharmacy Counter
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
            {currentUser?.fullName || currentUser?.entityName || 'Apollo Pharmacy #402, Mumbai'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-teal-200/80 mt-1">
            Retail Drug License:{' '}
            <span className="font-mono font-bold text-teal-900 dark:text-white bg-teal-100 dark:bg-teal-900/80 px-2 py-0.5 rounded border border-teal-300 dark:border-teal-500/40">
              {currentUser?.licenseNumber || 'MH-RET-2024-881'}
            </span>{' '}
            | Reverse Supply Custody & Pre-Expiry Auto-Quarantine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/90 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-500/30 rounded-xl px-4 py-2.5 text-right shadow-xs">
            <div className="text-[11px] text-teal-800 dark:text-teal-300 font-bold uppercase tracking-wider">
              CDSCO Rule 65 Compliance
            </div>
            <div className="text-xs text-slate-700 dark:text-teal-100 font-mono">
              OCR Batch Extraction & Ingress Verification Active
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Active Shelf Inventory */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80 uppercase tracking-wider">
              Active Shelf Batches
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
              {retailerInventory.length}
            </div>
            <div className="text-[11.5px] text-slate-500 dark:text-teal-200/70 mt-1 flex items-center gap-1">
              <span className="text-teal-700 dark:text-teal-400 font-bold">In-Stock</span> on retail dispensary shelves
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center border border-teal-200 dark:border-teal-800/60">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Critical Expiry Flag (≤3 Days) */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80 uppercase tracking-wider">
              Critical Expiry Batches (≤3d)
            </div>
            <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 font-mono">
              {criticalExpiriesCount}
            </div>
            <div className="text-[11.5px] text-slate-500 dark:text-teal-200/70 mt-1 flex items-center gap-1">
              <span className="text-rose-600 dark:text-rose-400 font-bold">Automatic Quarantine</span> required by law
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800/60">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Pending Reverse Returns */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80 uppercase tracking-wider">
              Pending Reverse Dispatches
            </div>
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {returnRequests.filter((r) => r.status === 'PENDING').length}
            </div>
            <div className="text-[11.5px] text-slate-500 dark:text-teal-200/70 mt-1 flex items-center gap-1">
              <span className="text-amber-600 dark:text-amber-400 font-bold">Awaiting Distributor</span> agent pickup
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* LIVE TABLET EXPIRY ALERTS SENTRY */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50/50 to-teal-50/30 dark:from-rose-950/30 dark:via-amber-950/20 dark:to-teal-950/20 border border-rose-200 dark:border-rose-900/50 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-600 text-white animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Tablet Expiry & Pre-Emptive Recall Sentry
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-teal-200/80">
                Automated regulatory surveillance under CDSCO Rule 65. Batches near expiration must be quarantined.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold border border-rose-300 dark:border-rose-800 self-start sm:self-auto">
            {criticalExpiriesCount} Batches Require Quarantine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {retailerInventory
            .filter((b) => {
              const diff = Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
              return diff < 60;
            })
            .slice(0, 3)
            .map((b) => {
              const badge = getExpiryBadge(b.expiryDate);
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={b.batchNumber}
                  className="p-3 rounded-xl bg-white dark:bg-[#071d18] border border-slate-200 dark:border-teal-900/60 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {b.drugName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-teal-300/80 mt-0.5">
                        Batch: <span className="font-bold text-slate-800 dark:text-teal-100">{b.batchNumber}</span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] border ${badge.badgeClass}`}
                    >
                      <BadgeIcon className="w-2.5 h-2.5" />
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-teal-200/70 pt-2 border-t border-slate-100 dark:border-teal-900/30">
                    <span>Stock: <strong className="text-slate-800 dark:text-slate-200 font-mono">{b.unitsCount} units</strong></span>
                    <button
                      onClick={() => {
                        setSelectedBatchNumber(b.batchNumber);
                        setClaimedQuantity(b.unitsCount);
                        setActiveReturnBatch(b);
                      }}
                      className="px-2 py-1 rounded bg-teal-800 hover:bg-teal-700 text-white text-[10px] font-bold transition-all"
                    >
                      Initiate Return &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* RETAILER ANALYTICS GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Graph 1: Expiry Timeline Distribution */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-teal-200">
                Tablet Expiry Risk Profile
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-teal-300/70">
                Active shelf inventory by days to expiration
              </p>
            </div>
          </div>

          <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    range: '< 3d (Crit)',
                    count: retailerInventory.filter((b) => {
                      const diff = (new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                      return diff < 3;
                    }).length,
                    fill: '#e11d48',
                  },
                  {
                    range: '< 30d',
                    count: retailerInventory.filter((b) => {
                      const diff = (new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                      return diff >= 3 && diff < 30;
                    }).length,
                    fill: '#f59e0b',
                  },
                  {
                    range: '< 60d',
                    count: retailerInventory.filter((b) => {
                      const diff = (new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                      return diff >= 30 && diff < 60;
                    }).length,
                    fill: '#0d9488',
                  },
                  {
                    range: '> 60d (Safe)',
                    count: retailerInventory.filter((b) => {
                      const diff = (new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                      return diff >= 60;
                    }).length,
                    fill: '#10b981',
                  },
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="range" interval={0} tick={{ fontSize: 10, fill: '#64748b' }} />
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
                  formatter={(value: any) => [`${value} batch${value === 1 ? '' : 'es'}`, 'Inventory Tier']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} minPointSize={8}>
                  <Cell fill="#e11d48" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#0d9488" />
                  <Cell fill="#10b981" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Stock Breakdown by Therapeutic Class */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-teal-200">
                Therapeutic Class Volume
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-teal-300/70">
                Dispensed medicine volume distribution
              </p>
            </div>
          </div>

          <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Antibiotics', value: 42, color: '#0d9488' },
                    { name: 'Antidiabetic', value: 28, color: '#0284c7' },
                    { name: 'Cardiac / BP', value: 18, color: '#8b5cf6' },
                    { name: 'Analgesics', value: 12, color: '#f59e0b' },
                  ]}
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill="#0d9488" />
                  <Cell fill="#0284c7" />
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#f59e0b" />
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
                <Legend
                  wrapperStyle={{ fontSize: '10px' }}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 3: Reverse Returns vs Salvage Trend */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-teal-200">
                Monthly Reverse Return Trajectory
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-teal-300/70">
                Expired packs quarantined vs dispatches
              </p>
            </div>
          </div>

          <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { month: 'Oct', quarantined: 35, dispatched: 30 },
                  { month: 'Nov', quarantined: 55, dispatched: 50 },
                  { month: 'Dec', quarantined: 70, dispatched: 65 },
                  { month: 'Jan', quarantined: 40, dispatched: 40 },
                  { month: 'Feb', quarantined: 85, dispatched: 80 },
                  { month: 'Mar', quarantined: 105, dispatched: 95 },
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
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
                <Area
                  type="monotone"
                  dataKey="quarantined"
                  stroke="#e11d48"
                  fill="#ffe4e6"
                  name="Quarantined"
                />
                <Area
                  type="monotone"
                  dataKey="dispatched"
                  stroke="#0d9488"
                  fill="#ccfbf1"
                  name="Dispatched"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Grid: Inventory & Return Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inventory with Expiry Badges */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Pharmacy Shelf Inventory</h3>
                <p className="text-xs text-slate-500 dark:text-teal-300/70">Color-coded real-time expiry countdowns</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-teal-400/60" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search drug or batch..."
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-teal-800/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 w-full sm:w-52 bg-white dark:bg-[#061813] text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              {retailerInventory.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-teal-400/50">
                  No batches currently held at this pharmacy location.
                </div>
              ) : (
                retailerInventory.map((batch) => {
                  const badge = getExpiryBadge(batch.expiryDate);
                  return (
                    <div
                      key={batch.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-teal-900/50 hover:border-teal-500/50 transition-all bg-slate-50/50 dark:bg-[#081f19] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                            {batch.batchNumber}
                          </span>
                          <span className={`text-[10.5px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.badgeClass}`}>
                            <badge.icon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-teal-200">
                          {batch.drugName} ({batch.unitsCount} units)
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-teal-300/60">
                          Mfg: {batch.manufacturingDate} • Exp: <strong className="text-slate-700 dark:text-teal-100">{batch.expiryDate}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setActiveQrBatch(batch.batchNumber)}
                          className="p-1.5 text-slate-500 hover:text-teal-800 dark:text-teal-300/70 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-teal-900/50 transition-colors"
                          title="View HMAC Cryptographic QR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setInspectBatchNumber(batch.batchNumber)}
                          className="p-1.5 text-slate-500 hover:text-teal-800 dark:text-teal-300/70 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-teal-900/50 transition-colors"
                          title="Inspect Batch Lifecycle Timeline"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReturnBatch(batch);
                            setSelectedBatchNumber(batch.batchNumber);
                            setClaimedQuantity(batch.unitsCount);
                            setConditionNotes(`Expired shelf batch ${batch.batchNumber} quarantined for reverse pickup.`);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-800 text-white hover:bg-teal-700 transition-colors shadow-xs flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Init Return</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Initiate Return Request Form & OCR */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 shadow-xs p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                Initiate Reverse Return Request
              </h3>
              <p className="text-xs text-slate-500 dark:text-teal-300/70">
                Seal expired medicine for reverse supply chain pickup & distributor handover
              </p>
            </div>

            {/* OCR Auto-Extractor helper */}
            <div className="p-3 bg-teal-50 dark:bg-teal-950/60 rounded-xl border border-teal-200 dark:border-teal-800/60 text-xs space-y-2">
              <div className="font-bold text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span>Medicine Packaging OCR & Camera Scanner</span>
              </div>
              <p className="text-teal-900/80 dark:text-teal-300/80 text-[11px]">
                Point camera at strip packaging to extract printed Batch No & pre-populate return form.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Open Live Camera</span>
                </button>
                <button
                  type="button"
                  disabled={isScanningOcr}
                  onClick={() => handleOcrSimulation('IMAGE_BLISTER_PAR-650-2026C')}
                  className="px-3 py-1.5 bg-teal-800 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isScanningOcr ? 'Scanning with OCR...' : 'Auto-Scan Batch PAR-650'}
                </button>
              </div>
              {ocrLog && (
                <div className="p-2 bg-teal-100/60 dark:bg-teal-900/60 rounded text-[11px] font-mono text-teal-950 dark:text-teal-200">
                  {ocrLog}
                </div>
              )}
            </div>

            {/* Return Form */}
            <form onSubmit={handleSubmitReturn} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Selected Batch:
                </label>
                <select
                  value={selectedBatchNumber}
                  onChange={(e) => {
                    setSelectedBatchNumber(e.target.value);
                    const b = batches.find((x) => x.batchNumber === e.target.value);
                    if (b) setClaimedQuantity(b.unitsCount);
                  }}
                  className="w-full p-2.5 border border-slate-300 dark:border-teal-700 rounded-lg font-mono bg-white dark:bg-[#061813] text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Choose Batch From Shelf --</option>
                  {retailerInventory.map((b) => (
                    <option key={b.id} value={b.batchNumber}>
                      {b.batchNumber} - {b.drugName} (Available: {b.unitsCount} units)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Claimed Units to Return:
                </label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={claimedQuantity}
                  onChange={(e) => setClaimedQuantity(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-300 dark:border-teal-700 rounded-lg font-mono bg-white dark:bg-[#061813] text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Condition Notes:
                </label>
                <textarea
                  rows={2}
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="e.g. Expired strip blister packs; intact security seals."
                  className="w-full p-2.5 border border-slate-300 dark:border-teal-700 rounded-lg bg-white dark:bg-[#061813] text-slate-900 dark:text-white"
                />
              </div>

              {/* Photo Evidence Section in side form */}
              <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-[#081f19] rounded-xl border border-slate-200 dark:border-teal-900/50">
                <label className="font-semibold text-slate-700 dark:text-teal-300 flex items-center justify-between">
                  <span>Medicine / Packaging Photo:</span>
                  {photoPreview && (
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">Attached</span>
                  )}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="px-2.5 py-1.5 bg-teal-800 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Camera</span>
                  </button>
                  <label className="cursor-pointer px-2.5 py-1.5 border border-slate-300 dark:border-teal-800 text-slate-700 dark:text-teal-300 hover:bg-slate-100 dark:hover:bg-teal-900/50 rounded-lg text-xs font-semibold flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) setPhotoPreview(ev.target.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setPhotoPreview('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80')}
                    className="px-2 py-1 bg-white dark:bg-[#061813] border border-slate-300 dark:border-teal-800 text-[11px] rounded text-slate-600 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/40"
                  >
                    + Sample
                  </button>
                </div>
                {photoPreview && (
                  <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-teal-500/40 mt-1">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-black/70 text-white rounded hover:bg-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {formMessage && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold ${
                    formMessage.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  {formMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-bold transition-colors shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Transmitting Manifest...' : 'Confirm Quarantine & Transmit Return Request'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Interactive Return Request Modal (Opened by Init Return button) */}
      {activeReturnBatch && (
        <InitiateReturnModal
          batch={activeReturnBatch}
          onClose={() => setActiveReturnBatch(null)}
          onSubmitReturn={async (params) => {
            const res = await createReturnRequest(params);
            if (res.success) {
              setFormMessage({ type: 'success', text: res.message });
            }
            return res;
          }}
        />
      )}

      {/* Live Camera Modal */}
      {isCameraOpen && (
        <CameraCaptureModal
          title="Medicine Packaging Camera Capture"
          description="Snap a photo of the medicine packaging, blister pack, or barcode"
          onCapture={async (dataUrl) => {
            setPhotoPreview(dataUrl);
            setIsCameraOpen(false);
            // Run quick OCR on the captured photo
            try {
              setIsScanningOcr(true);
              setOcrLog('Processing captured frame with OCR parser...');
              const ocrRes = await scanPhotoOcr(dataUrl);
              if (ocrRes.detectedBatchNumber) {
                setSelectedBatchNumber(ocrRes.detectedBatchNumber);
                const matchedBatch = batches.find((b) => b.batchNumber === ocrRes.detectedBatchNumber);
                if (matchedBatch) {
                  setClaimedQuantity(matchedBatch.unitsCount);
                }
                setOcrLog(`✅ Camera Capture + OCR Success: Identified Batch [${ocrRes.detectedBatchNumber}]. Form pre-filled!`);
              } else {
                setOcrLog('📷 Photo captured and attached to return manifest.');
              }
            } finally {
              setIsScanningOcr(false);
            }
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {/* QR Modal */}
      {activeQrBatch && (
        <QrDisplayModal
          batchNumber={activeQrBatch}
          onClose={() => setActiveQrBatch(null)}
        />
      )}

      {/* Batch Lifecycle Inspect Modal */}
      {inspectedBatch && (
        <PortalModal
          id="retailer-inspect-batch-modal"
          onClose={() => setInspectBatchNumber(null)}
          className="bg-white dark:bg-[#071914] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-teal-900/60"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-teal-900/40 pb-3">
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white font-mono">
                {inspectedBatch.batchNumber}
              </h4>
              <p className="text-xs text-slate-500 dark:text-teal-300/70">{inspectedBatch.drugName}</p>
            </div>
            <button
              onClick={() => setInspectBatchNumber(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
            >
              ✕
            </button>
          </div>

          <BatchStatusTimeline currentStatus={inspectedBatch.currentStatus} />

          <div className="text-right pt-2">
            <button
              onClick={() => setInspectBatchNumber(null)}
              className="px-4 py-2 rounded-lg bg-teal-800 text-white text-xs font-semibold hover:bg-teal-700"
            >
              Close Inspector
            </button>
          </div>
        </PortalModal>
      )}
    </div>
  );
};
