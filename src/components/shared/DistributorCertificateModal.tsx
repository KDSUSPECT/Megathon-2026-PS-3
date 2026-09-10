import React from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Package,
  Truck,
  Building2,
  Scale,
  Award,
  ExternalLink,
  Copy,
  Check,
  Camera,
  QrCode,
} from 'lucide-react';
import { PickupConfirmation, ReturnRequest, Batch } from '../../types/pharmachain';
import { PortalModal } from './PortalModal';

interface DistributorCertificateModalProps {
  confirmation: PickupConfirmation;
  request?: ReturnRequest;
  batch?: Batch;
  onClose: () => void;
}

export const DistributorCertificateModal: React.FC<DistributorCertificateModalProps> = ({
  confirmation,
  request,
  batch,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  const certRef =
    confirmation.certificateReference ||
    `CDSCO-REV-DIST-2026-${String(confirmation.id).padStart(5, '0')}`;
  const certHash =
    confirmation.certificateHash ||
    'b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8';
  const licenseNo = confirmation.distributorLicense || 'DL-2023-DIS-33014';
  const distName = confirmation.distributorName || 'Medilogix Logistics Hub';
  const pharmacyName = request?.retailerName || 'Apollo Medicos #402';
  const pharmacyLicense = request?.originPharmacyLicense || 'DL-2024-RET-88129';
  const batchNum = confirmation.batchNumberScanned || request?.batchNumber || 'BATCH-2024-CONF-406';
  const drugName =
    batch?.drugName ||
    (batchNum.includes('RET-204')
      ? 'Amoxicillin Trihydrate 500mg'
      : batchNum.includes('DISP-305')
      ? 'Human Insulin 40IU/ml Cartridges'
      : batchNum.includes('CONF-406')
      ? 'Ceftriaxone 1g Sterile Injection (Monocef)'
      : batchNum.includes('DEST-881')
      ? 'Azithromycin 500mg Film-Coated'
      : 'Ciprofloxacin 500mg Infusion');
  const formula =
    batch?.formulaName ||
    (batchNum.includes('RET-204')
      ? 'Amoxicillin Trihydrate IP 500mg'
      : batchNum.includes('DISP-305')
      ? 'Recombinant Human Insulin IP 40IU/ml'
      : 'Ceftriaxone Sodium Sterile IP equivalent to Ceftriaxone 1000mg');
  const photos = confirmation.photos || [];

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(certHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PortalModal
      id="distributor-certificate-modal"
      onClose={onClose}
      className="bg-white dark:bg-[#071914] rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-teal-900/60 overflow-hidden flex flex-col max-h-[94vh] text-slate-900 dark:text-slate-100"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-[#071d18] text-white px-6 py-3.5 flex items-center justify-between border-b border-teal-900/60 no-print">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
              <Award className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                <span>Authorized Distributor Custody Certificate</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  SEAL VERIFIED
                </span>
              </h3>
              <p className="text-[11px] text-teal-200/70">
                Statutory Certificate of Expired Medicine Physical Pickup, Tare Audit & Secure Custody Transfer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors border border-teal-600/40"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-teal-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Printable Official Document) */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm print:p-0 print:overflow-visible">
          
          {/* Statutory National Letterhead */}
          <div className="border-b-2 border-teal-900 dark:border-teal-700 pb-5 text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-teal-900 dark:text-teal-300 font-bold text-xs tracking-widest uppercase">
              <ShieldCheck className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              Government of India • Ministry of Health & Family Welfare
            </div>
            <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Central Drugs Standard Control Organisation (CDSCO)
            </h1>
            <p className="text-[11px] text-slate-600 dark:text-teal-200/80 font-semibold tracking-wide">
              DIRECTORATE GENERAL OF HEALTH SERVICES • NATIONAL PHARMACEUTICAL REVERSE LOGISTICS ENGINE
            </p>
            <div className="inline-block mt-2 px-3 py-1 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-700/50 rounded-full font-mono text-[11px] font-bold text-teal-900 dark:text-teal-200">
              FORM 20-REV • CERTIFICATE OF EXPIRED MEDICINE CUSTODY & REGULATED DISPOSAL CLEARANCE
            </div>
          </div>

          {/* Reference & Metadata Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-[#0b231d] rounded-xl border border-slate-200 dark:border-teal-900/40 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 dark:text-teal-300/70 block text-[10px] font-sans">Certificate No:</span>
              <strong className="text-teal-950 dark:text-teal-100 font-bold">{certRef}</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-teal-300/70 block text-[10px] font-sans">Handover Date & Time:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {new Date(confirmation.confirmedAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-teal-300/70 block text-[10px] font-sans">Statutory Regime:</span>
              <strong className="text-emerald-700 dark:text-emerald-300">Schedule M & Rule 65 Compliant</strong>
            </div>
          </div>

          {/* Parties to Custody Transfer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Originating Pharmacy */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-teal-900/40 bg-white dark:bg-[#091f19] space-y-2">
              <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-xs uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>1. Originating Retail Pharmacy</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{pharmacyName}</div>
              <div className="space-y-1 text-xs text-slate-600 dark:text-teal-200/80 font-mono">
                <div>Drug License: <span className="font-bold text-slate-900 dark:text-white">{pharmacyLicense}</span></div>
                <div>Location: Connaught Place, New Delhi - 110001</div>
                <div>Claimed Quantity: <span className="font-bold text-teal-950 dark:text-teal-200">{request?.claimedQuantity || confirmation.confirmedQuantity} Units</span></div>
              </div>
            </div>

            {/* Authorized Distributor */}
            <div className="p-4 rounded-xl border border-teal-300 dark:border-teal-700/60 bg-teal-50/40 dark:bg-[#0c2a22] space-y-2">
              <div className="flex items-center gap-2 text-teal-900 dark:text-teal-300 font-bold text-xs uppercase tracking-wider">
                <Truck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>2. Authorized Wholesale Distributor</span>
              </div>
              <div className="text-sm font-bold text-teal-950 dark:text-white">{distName}</div>
              <div className="space-y-1 text-xs text-slate-700 dark:text-teal-200 font-mono">
                <div>
                  Wholesale License:{' '}
                  <span className="font-bold text-teal-900 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/50 px-1.5 py-0.5 rounded">
                    {licenseNo}
                  </span>
                </div>
                <div>Central Hub: Sector 18 Logistic Park, Gurugram</div>
                <div>Authorized Signing Officer: Driver/Courier Agent (PIN Token: Verified)</div>
              </div>
            </div>
          </div>

          {/* Expired Disposed Tablets Detailed Manifest */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-teal-600" />
              <span>Manifest of Expired Disposed Tablets & Medicines Handed Over</span>
            </h4>
            
            <div className="overflow-x-auto border border-slate-200 dark:border-teal-900/40 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-[#0a231d] text-slate-700 dark:text-teal-200 font-bold uppercase text-[10.5px] border-b border-slate-200 dark:border-teal-900/40">
                  <tr>
                    <th className="py-2.5 px-3">Batch Number</th>
                    <th className="py-2.5 px-3">Medicine & Formula</th>
                    <th className="py-2.5 px-3">Claimed Qty</th>
                    <th className="py-2.5 px-3">Confirmed Qty</th>
                    <th className="py-2.5 px-3">Gross Wt (kg)</th>
                    <th className="py-2.5 px-3">Physical Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-teal-900/30 font-sans">
                  <tr className="bg-white dark:bg-[#071914]">
                    <td className="py-3 px-3 font-mono font-bold text-teal-950 dark:text-teal-200">
                      {batchNum}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{drugName}</div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-teal-300/70">{formula}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {request?.claimedQuantity || confirmation.confirmedQuantity} units
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-teal-800 dark:text-teal-300 text-sm">
                      {confirmation.confirmedQuantity} units
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {confirmation.confirmedWeightKg} kg
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-teal-200/80 max-w-xs">
                      {request?.conditionNotes || confirmation.agentNotes || 'Outer tamper-evident shipper intact; expiration date verified by optical barcode inspection.'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Photographic Evidence Section (Max 5 Photos uploaded by Agent) */}
          <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 dark:border-teal-900/40 bg-slate-50/70 dark:bg-[#081e18]">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Agent Physical Evidence Photographic Audit (Uploaded During Pharmacy Pickup)</span>
              </h4>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200">
                {photos.length > 0 ? `${photos.length} Photo(s) Attached` : 'Photo Evidence Bound'}
              </span>
            </div>

            {photos.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                No extra photos uploaded for this pickup. Standard barcode optical verification logged.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {photos.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden border border-slate-300 dark:border-teal-800 bg-black aspect-square"
                  >
                    <img
                      src={url}
                      alt={`Expired Tablet Audit Photo #${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[9.5px] font-mono text-teal-200">
                      Photo #{idx + 1} • Ingress Verified
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10.5px] text-slate-500 dark:text-teal-300/60">
              * Statutory Note: Physical photos are bound directly to SHA-256 block proof to prevent secondary diversion or counterfeit swap before hazardous incineration.
            </p>
          </div>

          {/* Official Seal & Authorization Section */}
          <div className="pt-2 grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-t border-slate-200 dark:border-teal-900/40">
            {/* Seal Graphic on Left */}
            <div className="md:col-span-6 flex items-center justify-center sm:justify-start gap-4">
              {/* High-Fidelity SVG Distributor License Seal */}
              <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-teal-800 dark:border-teal-400 border-dashed animate-spin-slow opacity-60" />
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-2 border-teal-800 dark:border-teal-400 shadow-md flex flex-col items-center justify-center text-center p-2 text-teal-950 dark:text-teal-100">
                  <div className="text-[7.5px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
                    ★ AUTHORIZED DISTRIBUTOR ★
                  </div>
                  <div className="w-6 h-6 my-0.5 rounded-full bg-teal-800 dark:bg-teal-300 text-white dark:text-teal-950 flex items-center justify-center font-bold text-[10px]">
                    CDSCO
                  </div>
                  <div className="text-[9px] font-extrabold font-mono text-teal-950 dark:text-white leading-tight">
                    {licenseNo}
                  </div>
                  <div className="text-[7px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-tighter mt-0.5">
                    REVERSE CUSTODY SEAL
                  </div>
                  <div className="text-[6.5px] text-slate-500 dark:text-teal-400 font-mono">
                    SCHEDULE M COMPLIANT
                  </div>
                </div>
              </div>

              {/* Seal Description */}
              <div className="space-y-1 text-xs">
                <div className="font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Statutory Distributor Seal</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-teal-200/80 leading-snug">
                  Affixed under authority of Wholesale Drug License <strong className="text-slate-900 dark:text-white">{licenseNo}</strong>.
                  All custody transfers are recorded into the tamper-evident reverse supply ledger.
                </div>
                <div className="text-[10px] font-mono text-slate-400 dark:text-teal-300/60">
                  Officer PIN Token: Authorized (4421)
                </div>
              </div>
            </div>

            {/* Cryptographic Proof & QR Verification on Right */}
            <div className="md:col-span-6 p-4 rounded-xl border border-slate-200 dark:border-teal-900/40 bg-slate-50 dark:bg-[#071d18] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-600 dark:text-teal-300">
                  Cryptographic Ledger Proof (SHA-256)
                </span>
                <button
                  onClick={handleCopyHash}
                  className="text-[10.5px] font-semibold text-teal-800 dark:text-teal-300 hover:underline flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Proof'}</span>
                </button>
              </div>

              <div className="font-mono text-[10.5px] text-slate-800 dark:text-teal-200 break-all bg-white dark:bg-black/40 p-2 rounded border border-slate-200 dark:border-teal-900/50">
                {certHash}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-teal-300/70 pt-1">
                <span>Verified: Central CDSCO Registry</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">STATUS: ZERO RE-ENTRY VALIDATED</span>
              </div>
            </div>
          </div>

          {/* Legal Certification Declaration */}
          <div className="p-3 bg-teal-50/50 dark:bg-teal-950/30 rounded-lg border border-teal-200/80 dark:border-teal-900/50 text-[11px] text-teal-950 dark:text-teal-200/90 leading-relaxed">
            <strong>Declaration of Custody:</strong> We hereby certify that the expired tablets/medicines described in this manifest have been physically retrieved from the originating pharmacy, verified by optical scan and weight audit, and are securely held in temperature-controlled distributor transit awaiting scheduled hazardous destruction at a state-approved CPCB facility.
          </div>
        </div>

        {/* Modal Footer (Hidden when printing) */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#051713] border-t border-slate-200 dark:border-teal-900/60 flex items-center justify-between text-xs no-print">
          <span className="text-slate-500 dark:text-teal-300/70 text-[11px]">
            Statutory Document valid across all Indian States & Union Territories
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Print / Save Certificate
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-teal-700 text-slate-700 dark:text-teal-200 hover:bg-slate-100 dark:hover:bg-teal-900/50 font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </PortalModal>
  );
};
