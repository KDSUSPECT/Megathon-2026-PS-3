import React, { useState } from 'react';
import { usePharmaChain } from '../../context/PharmaChainContext';
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
} from 'lucide-react';
import { QrDisplayModal } from '../shared/QrDisplayModal';
import { BatchStatusTimeline } from '../shared/BatchStatusTimeline';

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
        bg: 'bg-red-100 text-red-800 border-red-200',
        label: diffDays <= 0 ? `Expired (${Math.abs(diffDays)}d ago)` : `Critical (< 3d remaining: ${diffDays}d)`,
        days: diffDays,
        severity: 'CRITICAL',
      };
    }
    if (diffDays <= 60) {
      return {
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
        label: `Warning (3-60d: ${diffDays}d left)`,
        days: diffDays,
        severity: 'WARNING',
      };
    }
    return {
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      label: `Safe (> 60d: ${diffDays}d left)`,
      days: diffDays,
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider">
            <Package className="w-4 h-4" /> Retailer Dispensary Portal
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {currentUser?.fullName || 'Apollo Pharmacy #402, Mumbai'}
          </h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
            CDSCO License: <span className="font-mono font-medium text-white">MH-RET-2024-881</span> • Automated Expiry Quarantine & Reverse Logistics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/10">
            <div className="text-xs text-blue-200">Active Batches</div>
            <div className="text-xl font-bold">{retailerInventory.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/10">
            <div className="text-xs text-blue-200">Pending Returns</div>
            <div className="text-xl font-bold">
              {returnRequests.filter((r) => r.status === 'PENDING').length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Inventory & Return Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inventory with Expiry Badges */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Pharmacy Shelf Inventory</h3>
                <p className="text-xs text-slate-500">Color-coded real-time expiry countdowns</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search drug or batch..."
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-52"
                />
              </div>
            </div>

            <div className="space-y-3">
              {retailerInventory.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No batches currently held at this pharmacy location.
                </div>
              ) : (
                retailerInventory.map((batch) => {
                  const badge = getExpiryBadge(batch.expiryDate);
                  return (
                    <div
                      key={batch.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-all bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {batch.batchNumber}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-900 text-sm">{batch.drugName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span>Stock: <strong>{batch.unitsCount} units</strong></span>
                          <span>•</span>
                          <span>Expiry: <strong>{batch.expiryDate}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setActiveQrBatch(batch.batchNumber)}
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          title="View Signed QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBatchNumber(batch.batchNumber);
                            setClaimedQuantity(Math.min(batch.unitsCount, 100));
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Initiate Return</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Return Request Form with OCR Integration */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Initiate Reverse Return Request</h3>
              <p className="text-xs text-slate-500">
                Moves batch to <strong className="text-blue-700">RETURN_INITIATED</strong> and logs event to Hash-Chained Ledger.
              </p>
            </div>

            {/* OCR Capture Widget */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  OCR Batch Capture (Prompt 6)
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                  Tesseract Engine
                </span>
              </div>
              <p className="text-[11px] text-indigo-800 leading-tight">
                Scan blister pack photo to auto-extract batch code via alphanumeric regex pattern matching.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleOcrSimulation('PAR-650-2026C')}
                  disabled={isScanningOcr}
                  className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  <span>{isScanningOcr ? 'Scanning OCR...' : 'Auto-Capture Pack Photo'}</span>
                </button>
              </div>

              {ocrLog && (
                <div className="p-2 bg-white rounded-lg border border-indigo-100 text-[11px] font-mono text-indigo-900">
                  {ocrLog}
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReturn} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Batch Number:</label>
                <select
                  value={selectedBatchNumber}
                  onChange={(e) => setSelectedBatchNumber(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="">-- Select a batch from inventory --</option>
                  {retailerInventory.map((b) => (
                    <option key={b.id} value={b.batchNumber}>
                      {b.batchNumber} - {b.drugName} (Stock: {b.unitsCount})
                    </option>
                  ))}
                  {/* Allow selecting other batches for flexibility */}
                  <option value="PAR-650-2026C">PAR-650-2026C (Paracetamol 650mg - &lt;3d Critical)</option>
                  <option value="MET-850-2026B">MET-850-2026B (Metformin 850mg - Approaching Expiry)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Return Claimed Quantity (Units):</label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={claimedQuantity}
                  onChange={(e) => setClaimedQuantity(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  placeholder="e.g. 50"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Packaging Condition & Reason:</label>
                <textarea
                  rows={2}
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="e.g. Expiry within 3 days. Seals intact, cold chain maintained."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {photoPreview && (
                <div className="relative rounded-lg overflow-hidden border border-slate-200">
                  <img src={photoPreview} alt="Packaging inspection" className="w-full h-24 object-cover" />
                  <span className="absolute bottom-1 right-1 text-[10px] bg-slate-900/80 text-white px-1.5 py-0.5 rounded font-mono">
                    Photo Attached
                  </span>
                </div>
              )}

              {formMessage && (
                <div
                  className={`p-2.5 rounded-lg text-xs ${
                    formMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {formMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !selectedBatchNumber}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isSubmitting ? 'Recording Ledger Event...' : 'Submit Return Request'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Section: Submitted Returns Status Tracker (Pending -> Confirmed -> Disputed) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Submitted Returns Status Tracker</h3>
            <p className="text-xs text-slate-500">Live multi-party custody lifecycle (Retailer → Distributor → Disposal)</p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            Total Requests: {returnRequests.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
              <tr>
                <th className="p-3">Request ID</th>
                <th className="p-3">Batch Number</th>
                <th className="p-3">Claimed Qty</th>
                <th className="p-3">Condition Notes</th>
                <th className="p-3">Initiated At</th>
                <th className="p-3">Current Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {returnRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-mono font-semibold text-slate-600">#{req.id}</td>
                  <td className="p-3 font-mono font-bold text-blue-900">{req.batchNumber}</td>
                  <td className="p-3 font-bold">{req.claimedQuantity} units</td>
                  <td className="p-3 text-slate-600 max-w-[200px] truncate">{req.conditionNotes}</td>
                  <td className="p-3 text-slate-500 font-mono text-[11px]">
                    {new Date(req.initiatedAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        req.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800 animate-pulse'
                      }`}
                    >
                      {req.status === 'PENDING' && <Clock className="w-3 h-3" />}
                      {req.status === 'CONFIRMED' && <CheckCircle2 className="w-3 h-3" />}
                      {req.status === 'DISPUTED' && <AlertTriangle className="w-3 h-3" />}
                      {req.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setInspectBatchNumber(req.batchNumber)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      Lifecycle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Timeline Modal */}
      {inspectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  Batch Lifecycle Timeline: <span className="font-mono text-blue-700">{inspectedBatch.batchNumber}</span>
                </h4>
                <p className="text-xs text-slate-500">{inspectedBatch.drugName}</p>
              </div>
              <button
                onClick={() => setInspectBatchNumber(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <BatchStatusTimeline
              status={inspectedBatch.currentStatus}
              manufacturingDate={inspectedBatch.manufacturingDate}
              expiryDate={inspectedBatch.expiryDate}
              currentHolder={inspectedBatch.currentHolderName}
            />

            <div className="text-right">
              <button
                onClick={() => setInspectBatchNumber(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signed QR Code Modal */}
      {activeQrBatch && (
        <QrDisplayModal batchNumber={activeQrBatch} onClose={() => setActiveQrBatch(null)} />
      )}
    </div>
  );
};
