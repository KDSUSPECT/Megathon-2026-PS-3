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
} from 'lucide-react';
import { ReturnRequest } from '../../types/pharmachain';

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
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

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
    setConfirmationNotice(null);
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
    });
    setIsConfirming(false);

    setConfirmationNotice(res.message);
    setTimeout(() => {
      setSelectedRequest(null);
      setConfirmationNotice(null);
    }, 1800);
  };

  const handleResolveDispute = (disputeId: number) => {
    if (!resolutionNotesInput.trim()) return;
    resolveDispute(disputeId, resolutionNotesInput);
    setResolvingDisputeId(null);
    setResolutionNotesInput('');
  };

  // Mock weekly throughput data for chart
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
    <div className="space-y-6" id="distributor-dashboard">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0b2b24] via-[#0f3830] to-[#0b2b24] text-white rounded-2xl p-6 shadow-md border border-teal-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider">
            <Truck className="w-4 h-4 text-teal-400" /> Medilogix Logistics Hub
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
            {currentUser?.fullName || currentUser?.entityName || 'Medilogix Logistics Hub'}
          </h2>
          <p className="text-xs sm:text-sm text-teal-200/80 mt-1">
            Distributor License: <span className="font-mono font-medium text-white">{currentUser?.licenseNumber || 'DL-2023-DIS-33014'}</span> | Mapped Pharmacies: Connaught Place, South Ext, Gurgaon Central
          </p>
        </div>

        <div className="flex items-center">
          <div className="bg-teal-950/80 border border-teal-500/30 rounded-xl px-4 py-2.5 text-right">
            <div className="text-[11px] text-teal-300 font-bold uppercase tracking-wider">
              Cross-Chain Quantity Reconciliation
            </div>
            <div className="text-xs text-teal-100 font-mono">
              Tare & Gross Weight Verification Active
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Pending Pharmacy Pickups</div>
          <div className="text-3xl font-extrabold text-amber-500 mt-2">{pendingCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting physical barcode & weight scan</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Confirmed Transits</div>
          <div className="text-3xl font-extrabold text-teal-700 mt-2">{confirmedTransits}</div>
          <p className="text-[11px] text-slate-400 mt-1">Signed onto Ledger</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Open Disputes / Collusion Alerts</div>
          <div className="text-3xl font-extrabold text-rose-600 mt-2">{openDisputes}</div>
          <p className="text-[11px] text-slate-400 mt-1">Quantity Variance Flagged</p>
        </div>
      </div>

      {/* Incoming Pharmacy Return Manifests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Incoming Pharmacy Return Manifests</h3>
            <p className="text-xs text-slate-500">
              Verify batch QR and gross weight before accepting custody into distributor transit
            </p>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            PIN Authorized Handover
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b uppercase text-[10.5px] tracking-wider">
              <tr>
                <th className="py-3 px-4">BATCH & DRUG</th>
                <th className="py-3 px-4">ORIGIN PHARMACY</th>
                <th className="py-3 px-4">CLAIMED QTY</th>
                <th className="py-3 px-4">PHYSICAL CONDITION NOTES</th>
                <th className="py-3 px-4">TRANSIT STATUS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {returnRequests.map((req) => {
                const isPending = req.status === 'PENDING';
                const isDisputed = req.status === 'DISPUTED';
                const isConfirmed = req.status === 'CONFIRMED';

                return (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{req.batchNumber}</div>
                      <div className="text-[11px] text-slate-500">
                        {req.batchNumber.includes('RET-204') && 'Amoxicillin Trihydrate 500mg'}
                        {req.batchNumber.includes('DISP-305') && 'Human Insulin 40IU/ml Cartridges'}
                        {req.batchNumber.includes('CONF-406') && 'Ceftriaxone 1g Sterile Injection'}
                        {req.batchNumber.includes('DEST-881') && 'Azithromycin 500mg Film-coated'}
                        {req.batchNumber.includes('9981') && 'Ciprofloxacin 500mg Infusion'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-medium text-slate-900">{req.retailerName}</div>
                      <div className="text-[10.5px] font-mono text-slate-400">DL-2024-RET-88129</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {req.claimedQuantity} units
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs text-[11.5px] leading-snug">
                      {req.conditionNotes}
                    </td>
                    <td className="py-3.5 px-4">
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                          PENDING
                        </span>
                      )}
                      {isDisputed && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase bg-rose-50 text-rose-800 border border-rose-200">
                          DISPUTED
                        </span>
                      )}
                      {isConfirmed && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                          CONFIRMED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isPending ? (
                        <button
                          id={`btn-confirm-pickup-${req.id}`}
                          onClick={() => openPickupModal(req)}
                          className="px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          Confirm Pickup
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">Handover Complete</span>
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
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Cross-Chain Collusion & Disputes Panel
              </h3>
              <p className="text-xs text-slate-500">
                Mathematical discrepancies between pharmacy claimed quantity and distributor verified scan
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
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
                      ? 'bg-rose-50/40 border-rose-200 ring-1 ring-rose-100'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {dispute.batchNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase ${
                        isOpen ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {dispute.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-lg border border-slate-200 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Claimed (Pharmacy)</span>
                      <strong className="text-slate-900 text-sm">{dispute.retailerClaimedQty}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Received (Distributor)</span>
                      <strong className="text-slate-900 text-sm">{dispute.distributorConfirmedQty}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Variance Deficit</span>
                      <strong className="text-rose-600 text-sm font-bold">
                        {diff > 0 ? `-${diff} units` : `+${Math.abs(diff)} units`}
                      </strong>
                    </div>
                  </div>

                  <p className="text-[11.5px] leading-relaxed text-slate-700">
                    {dispute.resolutionNotes}
                  </p>

                  {isOpen ? (
                    <div>
                      {resolvingDisputeId === dispute.id ? (
                        <div className="space-y-2 pt-2 border-t border-rose-200">
                          <textarea
                            value={resolutionNotesInput}
                            onChange={(e) => setResolutionNotesInput(e.target.value)}
                            rows={2}
                            placeholder="Enter signed dock reconciliation report..."
                            className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-teal-700"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="password"
                              maxLength={4}
                              placeholder="Officer PIN (4421)"
                              value={resolutionPin}
                              onChange={(e) => setResolutionPin(e.target.value)}
                              className="w-36 p-1.5 border border-slate-300 rounded text-xs font-mono"
                            />
                            <button
                              onClick={() => handleResolveDispute(dispute.id)}
                              className="flex-1 py-1.5 px-3 bg-teal-800 text-white rounded font-bold hover:bg-teal-900 transition-colors"
                            >
                              Confirm Sign & Resolve
                            </button>
                            <button
                              onClick={() => setResolvingDisputeId(null)}
                              className="py-1.5 px-3 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setResolvingDisputeId(dispute.id);
                            setResolutionNotesInput('Physically recounted and confirmed 150 units breakages documented in cold dock transit incident log #INC-441.');
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs transition-colors"
                        >
                          Resolve Dispute (PIN Sign)
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Resolved on ledger by Authorized Officer
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Pickups Confirmed Over Last 7 Days Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Pickups Confirmed Over Last 7 Days</h3>
                <p className="text-xs text-slate-500">Reverse supply chain transit throughput</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Cold-Chain Verified
              </span>
            </div>

            {/* Custom Bar Graph */}
            <div className="mt-6 flex items-end justify-between gap-3 h-44 px-2 pt-6 pb-2 border-b border-slate-200">
              {weeklyData.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[10px] font-mono text-slate-400 group-hover:text-teal-900 group-hover:font-bold">
                    {d.count}
                  </div>
                  <div
                    style={{ height: d.height }}
                    className="w-full max-w-[28px] bg-teal-700 group-hover:bg-teal-600 rounded-t-sm transition-all"
                  />
                  <div className="text-[11px] font-bold text-slate-600 mt-1">{d.day}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Average: <strong>1,700 units / day</strong></span>
            <span className="text-emerald-700 font-semibold">100% Ingress Reconciled</span>
          </div>
        </div>
      </div>

      {/* Pickup Confirmation Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  Confirm Ingress Pickup: <span className="font-mono text-teal-800">{selectedRequest.batchNumber}</span>
                </h4>
                <p className="text-xs text-slate-500">Retailer: {selectedRequest.retailerName}</p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPickup} className="space-y-4 text-xs">
              <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 flex justify-between items-center text-teal-950">
                <span>Pharmacy Claimed Quantity:</span>
                <strong className="font-mono text-sm">{selectedRequest.claimedQuantity} units</strong>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Batch Number Barcode / QR Scan:</label>
                <input
                  type="text"
                  value={scannedBatchInput}
                  onChange={(e) => setScannedBatchInput(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-teal-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Confirmed Count (Units):</label>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={confirmedQuantity}
                    onChange={(e) => setConfirmedQuantity(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-teal-700"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gross Weight (kg):</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0.1}
                    value={confirmedWeightKg}
                    onChange={(e) => setConfirmedWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-teal-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Distributor Officer Digital Signing PIN:</label>
                <input
                  type="password"
                  maxLength={4}
                  value={signingPin}
                  onChange={(e) => setSigningPin(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono tracking-widest focus:ring-2 focus:ring-teal-700"
                  required
                />
                <span className="text-[10.5px] text-slate-400 mt-0.5 block">PIN for DL-2023-DIS-33014 is default 4421</span>
              </div>

              {/* Live Quantity Discrepancy Alert */}
              {confirmedQuantity !== selectedRequest.claimedQuantity && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>AUTOMATIC DISPUTE TRIGGER:</strong> Confirmed count ({confirmedQuantity}) does not match
                    Pharmacy claim ({selectedRequest.claimedQuantity}). Committing will transition batch to{' '}
                    <strong className="text-rose-800">DISPUTED</strong> and raise an official collusion investigation.
                  </div>
                </div>
              )}

              {confirmationNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-semibold text-xs">
                  {confirmationNotice}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConfirming}
                  className="flex-1 py-2 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-bold transition-colors shadow-xs"
                >
                  {isConfirming ? 'Writing to Ledger...' : 'Commit Pickup to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
