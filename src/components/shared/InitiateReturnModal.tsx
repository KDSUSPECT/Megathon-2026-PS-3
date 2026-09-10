import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, Camera, Upload, CheckCircle2, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Batch } from '../../types/pharmachain';
import { CameraCaptureModal } from './CameraCaptureModal';
import { PortalModal } from './PortalModal';

interface InitiateReturnModalProps {
  batch: Batch;
  onClose: () => void;
  onSubmitReturn: (params: {
    batchNumber: string;
    claimedQuantity: number;
    conditionNotes: string;
    photoUrl?: string;
  }) => Promise<{ success: boolean; message: string }>;
}

const PRESET_RETURN_PHOTOS = [
  {
    name: 'Expired Strip',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Tamper Seal / Broken Foil',
    url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Outer Carton Batch Mark',
    url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80',
  },
];

export const InitiateReturnModal: React.FC<InitiateReturnModalProps> = ({
  batch,
  onClose,
  onSubmitReturn,
}) => {
  const maxUnits = batch.unitsCount || 50;
  const [returnQuantity, setReturnQuantity] = useState<number>(maxUnits);
  const [conditionNotes, setConditionNotes] = useState<string>(
    `Expired/Pre-expiry shelf stock for batch ${batch.batchNumber} quarantined for reverse logistics collection.`
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(PRESET_RETURN_PHOTOS[0].url);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusResult, setStatusResult] = useState<{ success: boolean; message: string } | null>(null);

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        setPhotoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (returnQuantity <= 0) return;

    setIsSubmitting(true);
    setStatusResult(null);

    const res = await onSubmitReturn({
      batchNumber: batch.batchNumber,
      claimedQuantity: returnQuantity,
      conditionNotes: conditionNotes.trim() || `Quarantined stock for batch ${batch.batchNumber}`,
      photoUrl: photoUrl || undefined,
    });

    setIsSubmitting(false);
    setStatusResult(res);

    if (res.success) {
      setTimeout(() => {
        onClose();
      }, 1600);
    }
  };

  return (
    <>
      <PortalModal
        id="initiate-return-modal"
        onClose={onClose}
        className="bg-white dark:bg-[#081f19] rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-teal-900/60 overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-white"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#07251e] to-[#0c382f] text-white p-4 sm:p-5 flex items-center justify-between border-b border-teal-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-700/80 flex items-center justify-center text-teal-200">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Initiate Reverse Return Request</h3>
                <p className="text-xs text-teal-200/80 mt-0.5">
                  CDSCO Rule 65 Quarantine & Reverse Supply Custody
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-teal-300 hover:text-white hover:bg-teal-900/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleFormSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
            {/* Batch Overview Card */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#051713] rounded-xl border border-slate-200 dark:border-teal-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 dark:text-teal-400 font-mono uppercase">
                    Quarantine Target Batch
                  </span>
                  <div className="text-sm font-bold font-mono text-teal-900 dark:text-teal-200">
                    {batch.batchNumber}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 dark:text-teal-400">Available Stock</span>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">
                    {maxUnits} units
                  </div>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-800 dark:text-white pt-1 border-t border-slate-200 dark:border-teal-900/40">
                {batch.drugName}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-teal-300/70">
                <span>Mfg: {batch.manufacturingDate}</span>
                <span>
                  Expiry: <strong className="text-rose-600 dark:text-rose-400 font-semibold">{batch.expiryDate}</strong>
                </span>
              </div>
            </div>

            {/* Return Quantity Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-teal-200">
                  Quantity to Quarantine & Return:
                </label>
                <span className="text-[11px] text-slate-400 dark:text-teal-300/70 font-mono">
                  Max available: {maxUnits}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max={maxUnits}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(Math.max(1, Math.min(maxUnits, parseInt(e.target.value) || 1)))}
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-teal-700 rounded-lg font-mono text-sm bg-white dark:bg-[#051713] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                  required
                />
                <button
                  type="button"
                  onClick={() => setReturnQuantity(maxUnits)}
                  className="px-3 py-1.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-200 font-semibold text-xs hover:bg-teal-200 dark:hover:bg-teal-900 transition-colors border border-teal-300 dark:border-teal-800"
                >
                  Return All ({maxUnits})
                </button>
                {maxUnits > 1 && (
                  <button
                    type="button"
                    onClick={() => setReturnQuantity(Math.max(1, Math.floor(maxUnits / 2)))}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#071f19] text-slate-700 dark:text-teal-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-teal-900/50 transition-colors border border-slate-300 dark:border-teal-800"
                  >
                    Half ({Math.floor(maxUnits / 2)})
                  </button>
                )}
              </div>
            </div>

            {/* Condition Notes */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 dark:text-teal-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Physical Condition & Reason Notes:</span>
              </label>
              <textarea
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                rows={2}
                className="w-full p-2.5 border border-slate-300 dark:border-teal-700 rounded-lg text-xs bg-white dark:bg-[#051713] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-700 leading-relaxed"
                placeholder="e.g. Expired shelf batch, sealed packaging intact, blister pack quarantined for reverse pickup."
              />
            </div>

            {/* Medicine Photo Evidence (Live Camera + Upload) */}
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-[#051713] rounded-xl border border-slate-200 dark:border-teal-900/50">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-teal-200 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Medicine / Packaging Photo Evidence</span>
                </label>
                {photoUrl && (
                  <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded">
                    Photo Attached
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Open Live Camera</span>
                </button>

                <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-300 dark:border-teal-800 text-slate-700 dark:text-teal-300 hover:bg-slate-100 dark:hover:bg-teal-900/50 font-semibold text-xs flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoFileUpload}
                    className="hidden"
                  />
                </label>

                {PRESET_RETURN_PHOTOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoUrl(preset.url)}
                    className="px-2 py-1 rounded bg-white dark:bg-[#0a2720] border border-slate-200 dark:border-teal-800 text-slate-600 dark:text-teal-300 text-[10.5px] hover:bg-teal-50 dark:hover:bg-teal-900/60 transition-colors"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>

              {photoUrl && (
                <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-teal-500/50 shadow-xs mt-2 group">
                  <img src={photoUrl} alt="Medicine Photo Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    className="absolute top-1 right-1 p-0.5 bg-black/70 text-white rounded hover:bg-rose-600 transition-colors"
                    title="Remove Photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Status Message */}
            {statusResult && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                  statusResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 text-rose-900 dark:text-rose-200'
                }`}
              >
                {statusResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{statusResult.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-teal-900/40">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-teal-800 text-slate-700 dark:text-teal-300 hover:bg-slate-100 dark:hover:bg-teal-900/50 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || returnQuantity <= 0}
                className="px-5 py-2 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Submitting to Ledger...</span>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm Quarantine & Submit Return</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </PortalModal>

      {/* Live Camera Modal */}
      {isCameraOpen && (
        <CameraCaptureModal
          title="Live Medicine Camera Capture"
          description={`Capturing expired medicine packaging for Batch ${batch.batchNumber}`}
          onCapture={(dataUrl) => {
            setPhotoUrl(dataUrl);
            setIsCameraOpen(false);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </>
  );
};
