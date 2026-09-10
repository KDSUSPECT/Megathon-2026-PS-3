import React, { useState } from 'react';
import { usePharmaChain } from '../../context/PharmaChainContext';
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ScanLine,
  HelpCircle,
  FileSpreadsheet,
  Check,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  BarChart3,
  Calendar,
  Camera,
  Upload,
  X,
  Plus,
  Award,
  FileCheck,
  Eye,
  Sparkles,
} from 'lucide-react';
import { ReturnRequest, PickupConfirmation } from '../../types/pharmachain';
import { DistributorCertificateModal } from '../shared/DistributorCertificateModal';
import { CameraCaptureModal } from '../shared/CameraCaptureModal';
import { PortalModal } from '../shared/PortalModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const SAMPLE_MEDICINE_PHOTOS = [
  {
    name: 'Expired Blister Pack',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Tamper Seal / Broken Strip',
    url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Outer Shipper Carton',
    url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Foil Packaging with Exp Date',
    url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cold-Chain Insulin Vials',
    url: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
  },
];

export const DistributorDashboard: React.FC = () => {
  const {
    returnRequests,
    pickupConfirmations,
    disputes,
    batches,
    confirmPickup,
    resolveDispute,
    currentUser,
  } = usePharmaChain();

  // Selected request for confirmation modal
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const [confirmedQuantity, setConfirmedQuantity] = useState<number>(0);
  const [confirmedWeightKg, setConfirmedWeightKg] = useState<number>(10.5);
  const [scannedBatchInput, setScannedBatchInput] = useState<string>('');
  const [signingPin, setSigningPin] = useState<string>('4421');
  const [agentNotes, setAgentNotes] = useState<string>('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  // Certificate Modal State (to conclude the reverse custody loop)
  const [activeCertificate, setActiveCertificate] = useState<PickupConfirmation | null>(null);

  // Dispute resolution state
  const [resolvingDisputeId, setResolvingDisputeId] = useState<number | null>(null);
  const [resolutionNotesInput, setResolutionNotesInput] = useState('');
  const [resolutionPin, setResolutionPin] = useState('4421');

  // Stats calculation
  const pendingCount = returnRequests.filter((r) => r.status === 'PENDING').length;
  const confirmedTransits = returnRequests.filter((r) => r.status === 'CONFIRMED').length;
  const openDisputes = disputes.filter((d) => d.status === 'OPEN').length;

  const openPickupModal = (req: ReturnRequest) => {
    setSelectedRequest(req);
    setConfirmedQuantity(req.claimedQuantity);
    setConfirmedWeightKg(parseFloat((req.claimedQuantity * 0.025).toFixed(2))); // ~25g per unit average
    setScannedBatchInput(req.batchNumber);
    setSigningPin(currentUser?.pin || '4421');
    setAgentNotes(`Physical counter audit complete at ${req.retailerName}. Expired tablets verified against dispatch manifest.`);
    // Initial photo from pharmacy claim if available, up to max 5
    setUploadedPhotos(req.photoUrl ? [req.photoUrl] : [SAMPLE_MEDICINE_PHOTOS[0].url]);
    setConfirmationNotice(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files: File[] = Array.from(e.target.files);
    
    files.forEach((file: File) => {
      if (uploadedPhotos.length >= 5) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setUploadedPhotos((prev) => {
            if (prev.length >= 5) return prev;
            return [...prev, event.target!.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddSamplePhoto = (photoUrl: string) => {
    if (uploadedPhotos.length >= 5) return;
    setUploadedPhotos((prev) => [...prev, photoUrl]);
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setUploadedPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleConfirmPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setIsConfirming(true);
    const res = await confirmPickup({
      returnRequestId: selectedRequest.id,
      confirmedQuantity,
      confirmedWeightKg,
      batchNumberScanned: scannedBatchInput.trim(),
      photos: uploadedPhotos.slice(0, 5),
      agentNotes,
      signingPin,
    });
    setIsConfirming(false);

    setConfirmationNotice(res.message);

    // Conclude loop: display the statutory certificate with Distributor License Seal immediately
    setTimeout(() => {
      const createdConf = res.confirmation || {
        id: pickupConfirmations.length + 1,
        returnRequestId: selectedRequest.id,
        distributorId: currentUser?.linkedEntityId || 1,
        distributorName: currentUser?.fullName || 'Medilogix Logistics Hub',
        distributorLicense: currentUser?.licenseNumber || 'DL-2023-DIS-33014',
        confirmedQuantity,
        confirmedWeightKg,
        batchNumberScanned: scannedBatchInput.trim(),
        photos: uploadedPhotos.slice(0, 5),
        agentNotes,
        signingPinUsed: signingPin,
        certificateReference: `CDSCO-REV-DIST-2026-${String(pickupConfirmations.length + 1).padStart(5, '0')}`,
        certificateHash: 'b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8',
        sealAuthorized: true,
        confirmedAt: new Date().toISOString(),
      };
      setSelectedRequest(null);
      setConfirmationNotice(null);
      setActiveCertificate(createdConf);
    }, 1200);
  };

  const handleResolveDispute = (disputeId: number) => {
    if (!resolutionNotesInput.trim()) return;
    resolveDispute(disputeId, resolutionNotesInput);
    setResolvingDisputeId(null);
    setResolutionNotesInput('');
  };

  // Weekly throughput data for chart
  const weeklyData = [
    { day: 'Mon', count: 1200, height: '40%' },
    { day: 'Tue', count: 2400, height: '70%' },
    { day: 'Wed', count: 1800, height: '55%' },
    { day: 'Thu', count: 3100, height: '90%' },
    { day: 'Fri', count: 2200, height: '65%' },
    { day: 'Sat', count: 950, height: '30%' },
    { day: 'Sun', count: 400, height: '15%' },
  ];

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100" id="distributor-dashboard">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/50 to-slate-50 dark:from-[#0b2b24] dark:via-[#0f3830] dark:to-[#0b2b24] text-slate-900 dark:text-white rounded-2xl p-6 shadow-xs dark:shadow-md border border-teal-200 dark:border-teal-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Truck className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Authorized Distributor Logistics Hub
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
            {currentUser?.fullName || currentUser?.entityName || 'Medilogix Logistics Hub'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-teal-200/80 mt-1">
            Wholesale Drug License:{' '}
            <span className="font-mono font-bold text-teal-900 dark:text-white bg-teal-100 dark:bg-teal-900/80 px-2 py-0.5 rounded border border-teal-300 dark:border-teal-500/40">
              {currentUser?.licenseNumber || 'DL-2023-DIS-33014'}
            </span>{' '}
            | Reverse Supply Custody Agent & Tare Verification Engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/90 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-500/30 rounded-xl px-4 py-2.5 text-right shadow-xs">
            <div className="text-[11px] text-teal-800 dark:text-teal-300 font-bold uppercase tracking-wider flex items-center justify-end gap-1.5">
              <Camera className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Photo Audit Loop Active
            </div>
            <div className="text-xs text-slate-700 dark:text-teal-100 font-mono">
              Max 5 Photos / Handover Certificate Sealed
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Pending Pharmacy Ingress Pickups */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80 uppercase tracking-wider">
              Pending Pharmacy Ingress Pickups
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
              {pendingCount}
            </div>
            <div className="text-[11.5px] text-slate-500 dark:text-teal-200/70 mt-1 flex items-center gap-1">
              <span className="text-amber-600 dark:text-amber-400 font-bold">● Awaiting Agent Handover</span> & photo verification
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Confirmed Reverse Transits (Certificates Sealed) */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80 uppercase tracking-wider">
              Sealed Handover Certificates
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
              {pickupConfirmations.length}
            </div>
            <div className="text-[11.5px] text-slate-500 dark:text-teal-200/70 mt-1 flex items-center gap-1">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">100% Licensed & Sealed</span> with photo proof
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center border border-teal-200 dark:border-teal-800/60">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Open Cross-Chain Collusion Disputes */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80 uppercase tracking-wider">
              Disputed Ingress Discrepancies
            </div>
            <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 font-mono">
              {openDisputes}
            </div>
            <div className="text-[11.5px] text-slate-500 dark:text-teal-200/70 mt-1 flex items-center gap-1">
              <span className="text-rose-600 dark:text-rose-400 font-bold">Under CDSCO Audit</span> • Physical Tare check
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800/60">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table: Incoming Pharmacy Return Manifests */}
      <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-teal-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              Incoming Pharmacy Return Manifests (Expired Tablets / Ingress Pipeline)
            </h3>
            <p className="text-xs text-slate-500 dark:text-teal-300/70">
              Agent physical verification, photo audit (max 5 photos), gross weight confirmation & statutory certificate generation
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
            CDSCO Schedule M Reverse Custody
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-[#081b16] text-slate-500 dark:text-teal-300/80 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-teal-900/40">
              <tr>
                <th className="py-3 px-4">BATCH & MEDICINE</th>
                <th className="py-3 px-4">ORIGIN PHARMACY</th>
                <th className="py-3 px-4">CLAIMED UNITS</th>
                <th className="py-3 px-4">EVIDENCE & NOTES</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">STATUTORY ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-teal-900/30 font-sans">
              {returnRequests.map((req) => {
                const isPending = req.status === 'PENDING';
                const isDisputed = req.status === 'DISPUTED';
                const isConfirmed = req.status === 'CONFIRMED';
                const matchedConfirmation = pickupConfirmations.find(
                  (c) => c.returnRequestId === req.id || c.batchNumberScanned === req.batchNumber
                );

                return (
                  <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-teal-950/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">{req.batchNumber}</div>
                      <div className="text-[11px] text-slate-500 dark:text-teal-300/70">
                        {req.batchNumber.includes('RET-204') && 'Amoxicillin Trihydrate 500mg (Amoxil)'}
                        {req.batchNumber.includes('DISP-305') && 'Human Insulin 40IU/ml Cartridges'}
                        {req.batchNumber.includes('CONF-406') && 'Ceftriaxone 1g Sterile Injection'}
                        {req.batchNumber.includes('DEST-881') && 'Azithromycin 500mg Film-coated'}
                        {req.batchNumber.includes('9981') && 'Ciprofloxacin 500mg Infusion'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <div className="font-medium text-slate-900 dark:text-white">{req.retailerName}</div>
                      <div className="text-[10.5px] font-mono text-slate-400 dark:text-teal-300/60">
                        {req.originPharmacyLicense || 'DL-2024-RET-88129'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-mono">
                      {req.claimedQuantity} units
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-teal-200/80 max-w-xs text-[11.5px] leading-snug">
                      <div>{req.conditionNotes}</div>
                      {matchedConfirmation && matchedConfirmation.photos && matchedConfirmation.photos.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Camera className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          <span className="text-[10.5px] font-mono text-teal-800 dark:text-teal-300 font-semibold">
                            {matchedConfirmation.photos.length} photo(s) bound to audit
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          PENDING
                        </span>
                      )}
                      {isDisputed && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                          DISPUTED
                        </span>
                      )}
                      {isConfirmed && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          CONFIRMED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isPending ? (
                        <button
                          id={`btn-confirm-pickup-${req.id}`}
                          onClick={() => openPickupModal(req)}
                          className="px-3.5 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Pickup & Photo Audit</span>
                        </button>
                      ) : matchedConfirmation ? (
                        <button
                          onClick={() => setActiveCertificate(matchedConfirmation)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-700/60 text-teal-900 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900/60 font-bold text-xs shadow-xs transition-colors ml-auto"
                        >
                          <Award className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                          <span>View Certificate & Seal</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-teal-300/50 text-xs font-medium">Handover Complete</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Disputes Panel & Weekly Transit Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Disputes Panel */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-teal-900/40 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Cross-Chain Collusion & Disputes Panel
              </h3>
              <p className="text-xs text-slate-500 dark:text-teal-300/70">
                Discrepancies between pharmacy claim and distributor verified count
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Layer 3 Proof
            </span>
          </div>

          <div className="space-y-3">
            {disputes.map((dispute) => {
              const diff = dispute.retailerClaimedQty - dispute.distributorConfirmedQty;
              const isOpen = dispute.status === 'OPEN';

              return (
                <div
                  key={dispute.id}
                  className={`p-4 rounded-xl border text-xs space-y-3 transition-all ${
                    isOpen
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 ring-1 ring-rose-100 dark:ring-rose-900/30'
                      : 'bg-slate-50 dark:bg-[#081a15] border-slate-200 dark:border-teal-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {dispute.batchNumber}
                      </span>
                      <span className="text-slate-500 dark:text-teal-300/70 ml-2">
                        Origin: {dispute.originPharmacy || 'Apollo Pharmacy #402'} ({dispute.originPharmacyLicense || 'DL-2024-RET-88129'})
                      </span>
                    </div>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                        isOpen
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                          : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                      }`}
                    >
                      {dispute.status}
                    </span>
                  </div>

                  {/* Quantity Discrepancy Breakdown */}
                  <div className="grid grid-cols-3 gap-2 bg-white dark:bg-[#071914] p-2.5 rounded-lg border border-slate-200 dark:border-teal-900/40 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 dark:text-teal-300/60 block text-[10px] font-sans">Pharmacy Claimed:</span>
                      <strong className="text-slate-900 dark:text-white">{dispute.retailerClaimedQty} units</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-teal-300/60 block text-[10px] font-sans">Distributor Verified:</span>
                      <strong className="text-slate-900 dark:text-white">{dispute.distributorConfirmedQty} units</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-teal-300/60 block text-[10px] font-sans">Variance:</span>
                      <strong className="text-rose-600 dark:text-rose-400 font-bold">-{diff} units missing</strong>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-teal-200/80 leading-relaxed text-[11.5px]">
                    {dispute.resolutionNotes || 'Quarantined under joint investigation for suspected tampering or transit breakage.'}
                  </p>

                  {isOpen ? (
                    <div className="pt-2 border-t border-rose-200/80 dark:border-rose-900/40 flex items-center justify-between">
                      {resolvingDisputeId === dispute.id ? (
                        <div className="w-full space-y-2">
                          <input
                            type="text"
                            placeholder="Enter joint investigation findings / disposal protocol..."
                            value={resolutionNotesInput}
                            onChange={(e) => setResolutionNotesInput(e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-teal-700 rounded-lg text-xs bg-white dark:bg-[#051713] text-slate-900 dark:text-white"
                          />
                          <div className="flex gap-2">
                            <input
                              type="password"
                              maxLength={4}
                              placeholder="PIN"
                              value={resolutionPin}
                              onChange={(e) => setResolutionPin(e.target.value)}
                              className="w-20 p-2 border border-slate-300 dark:border-teal-700 rounded-lg font-mono text-center text-xs bg-white dark:bg-[#051713] text-slate-900 dark:text-white"
                            />
                            <button
                              onClick={() => handleResolveDispute(dispute.id)}
                              className="flex-1 py-1.5 rounded-lg bg-teal-800 text-white font-bold text-xs hover:bg-teal-700 transition-colors"
                            >
                              Confirm Resolution on Ledger
                            </button>
                            <button
                              onClick={() => setResolvingDisputeId(null)}
                              className="px-3 py-1.5 border border-slate-300 dark:border-teal-700 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-teal-900/50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setResolvingDisputeId(dispute.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-teal-950 text-white font-semibold text-xs hover:bg-slate-800 dark:hover:bg-teal-900 transition-colors border border-slate-700 dark:border-teal-700"
                        >
                          Resolve Dispute (PIN Sign)
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Resolved on ledger by Authorized Officer</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Pickups Confirmed Over Last 7 Days Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-teal-900/40 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Pickups Confirmed Over Last 7 Days</h3>
                <p className="text-xs text-slate-500 dark:text-teal-300/70">Reverse supply chain transit throughput</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                Cold-Chain Verified
              </span>
            </div>

            {/* Recharts Bar Graph */}
            <div className="mt-4 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
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
                    formatter={(value: any) => [`${value} units`, 'Collected']}
                  />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} minPointSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500 dark:text-teal-300/70">
            <span>Average: <strong className="text-slate-900 dark:text-white">1,700 units / day</strong></span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">100% Ingress Reconciled</span>
          </div>
        </div>
      </div>

      {/* Pickup & Physical Photo Audit Confirmation Modal */}
      {selectedRequest && (
        <PortalModal
          id="pickup-confirmation-modal"
          onClose={() => setSelectedRequest(null)}
          className="bg-white dark:bg-[#071914] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-teal-900/60 max-h-[92vh] overflow-y-auto text-slate-900 dark:text-slate-100"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-teal-900/40 pb-3">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Agent Medicine Photo Audit & Pickup Confirmation</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-teal-300/70">
                  Pharmacy: <strong className="text-slate-800 dark:text-white">{selectedRequest.retailerName}</strong> • Batch: <strong className="font-mono text-teal-700 dark:text-teal-300">{selectedRequest.batchNumber}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPickup} className="space-y-4 text-xs">
              {/* Pharmacy Claimed Quantity Banner */}
              <div className="bg-teal-50 dark:bg-teal-950/60 p-3 rounded-xl border border-teal-200 dark:border-teal-800/60 flex justify-between items-center text-teal-950 dark:text-teal-200">
                <span>Origin Pharmacy Claimed Expired Units:</span>
                <strong className="font-mono text-sm">{selectedRequest.claimedQuantity} units</strong>
              </div>

              {/* Requirement 1: Photo Upload of the Expired Tablet (Max 5 Photos) */}
              <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-[#09221b] rounded-xl border border-slate-200 dark:border-teal-900/50">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <Camera className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <span>Upload Medicine / Tablet Photos (Max 5 Photos)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                      uploadedPhotos.length === 5
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        : 'bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-200'
                    }`}
                  >
                    {uploadedPhotos.length} / 5 Photos Uploaded
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-teal-300/70 leading-relaxed">
                  The agent must upload photos of the expired medicine/tablets taken during pharmacy pickup. These photos will be bound directly to the statutory handover certificate.
                </p>

                {/* Upload Action Area */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={uploadedPhotos.length >= 5}
                    onClick={() => setIsCameraOpen(true)}
                    className="px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors bg-teal-800 hover:bg-teal-700 text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Open Live Camera</span>
                  </button>

                  <label className={`cursor-pointer px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors ${
                    uploadedPhotos.length >= 5
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'border border-slate-300 dark:border-teal-800 text-slate-700 dark:text-teal-200 hover:bg-slate-100 dark:hover:bg-teal-900/50'
                  }`}>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Photo File</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadedPhotos.length >= 5}
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  <span className="text-[11px] text-slate-400 dark:text-teal-400/60">or quick sample:</span>

                  {SAMPLE_MEDICINE_PHOTOS.slice(0, 3).map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={uploadedPhotos.length >= 5}
                      onClick={() => handleAddSamplePhoto(sample.url)}
                      className="px-2.5 py-1 rounded-md bg-white dark:bg-[#071914] border border-slate-300 dark:border-teal-800 text-slate-700 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/50 text-[11px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      + {sample.name}
                    </button>
                  ))}
                </div>

                {/* Photo Previews (Max 5) */}
                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                    {uploadedPhotos.map((url, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg overflow-hidden border border-slate-300 dark:border-teal-700 bg-slate-900 aspect-square shadow-xs"
                      >
                        <img
                          src={url}
                          alt={`Expired Tablet Photo ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] hover:bg-rose-700 shadow-md"
                          title="Remove photo"
                        >
                          ✕
                        </button>
                        <div className="absolute inset-x-0 bottom-0 bg-black/75 p-1 text-[9px] font-mono text-center text-teal-200">
                          Photo #{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scanned Batch Barcode Verification */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Scanned Batch Barcode / 2D Matrix:
                </label>
                <input
                  type="text"
                  value={scannedBatchInput}
                  onChange={(e) => setScannedBatchInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-teal-700 rounded-lg font-mono bg-white dark:bg-[#061813] text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-700"
                  required
                />
              </div>

              {/* Quantity and Weight Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Confirmed Expired Count (Units):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={confirmedQuantity}
                    onChange={(e) => setConfirmedQuantity(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-300 dark:border-teal-700 rounded-lg font-mono bg-white dark:bg-[#061813] text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-700"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Gross Tare Weight (kg):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0.1}
                    value={confirmedWeightKg}
                    onChange={(e) => setConfirmedWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-300 dark:border-teal-700 rounded-lg font-mono bg-white dark:bg-[#061813] text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-700"
                    required
                  />
                </div>
              </div>

              {/* Physical Condition Notes */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Physical Condition Inspection Notes:
                </label>
                <input
                  type="text"
                  value={agentNotes}
                  onChange={(e) => setAgentNotes(e.target.value)}
                  placeholder="e.g. Expired blister packs intact; verified cold shipper temperature at 4°C"
                  className="w-full p-2.5 border border-slate-300 dark:border-teal-700 rounded-lg bg-white dark:bg-[#061813] text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-700"
                />
              </div>

              {/* Signing PIN */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Distributor Officer Digital Signing PIN (DL-2023-DIS-33014):
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={signingPin}
                  onChange={(e) => setSigningPin(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-teal-700 rounded-lg font-mono tracking-widest bg-white dark:bg-[#061813] text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-700"
                  required
                />
                <span className="text-[10.5px] text-slate-400 dark:text-teal-300/60 mt-0.5 block">
                  Authorizes the official CDSCO Reverse Custody Seal on the Handover Certificate
                </span>
              </div>

              {/* Live Quantity Discrepancy Alert */}
              {confirmedQuantity !== selectedRequest.claimedQuantity && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900 rounded-xl text-rose-950 dark:text-rose-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>AUTOMATIC DISPUTE TRIGGER:</strong> Confirmed count ({confirmedQuantity}) does not match
                    Pharmacy claim ({selectedRequest.claimedQuantity}). Committing will transition batch to{' '}
                    <strong className="text-rose-700 dark:text-rose-300">DISPUTED</strong> and raise an official collusion audit.
                  </div>
                </div>
              )}

              {confirmationNotice && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-900 dark:text-emerald-200 font-semibold text-xs">
                  {confirmationNotice}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-teal-700 text-slate-700 dark:text-teal-200 font-semibold hover:bg-slate-50 dark:hover:bg-teal-950/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConfirming}
                  className="flex-1 py-2.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Award className="w-4 h-4 text-teal-300" />
                  <span>{isConfirming ? 'Writing to Ledger...' : 'Commit Pickup & Generate Certificate'}</span>
                </button>
              </div>
            </form>
          </div>
        </PortalModal>
      )}

      {/* Requirement 2: Statutory Certificate Modal displaying expired disposed tablets & Distributor License Seal */}
      {activeCertificate && (
        <DistributorCertificateModal
          confirmation={activeCertificate}
          request={returnRequests.find(
            (r) =>
              r.id === activeCertificate.returnRequestId ||
              r.batchNumber === activeCertificate.batchNumberScanned
          )}
          batch={batches.find((b) => b.batchNumber === activeCertificate.batchNumberScanned)}
          onClose={() => setActiveCertificate(null)}
        />
      )}

      {/* Live Camera Modal for Field Agent Photo Audit */}
      {isCameraOpen && (
        <CameraCaptureModal
          title="Field Agent Medicine Audit Camera"
          description={selectedRequest ? `Capturing medicine verification for Batch ${selectedRequest.batchNumber}` : 'Capture medicine photo'}
          onCapture={(dataUrl) => {
            setUploadedPhotos((prev) => {
              if (prev.length >= 5) return prev;
              return [...prev, dataUrl];
            });
            setIsCameraOpen(false);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
};
