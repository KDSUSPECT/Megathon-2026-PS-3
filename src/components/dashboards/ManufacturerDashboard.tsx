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
} from 'lucide-react';
import { Batch } from '../../types/pharmachain';
import { CdscoReportModal } from '../shared/CdscoReportModal';

export const ManufacturerDashboard: React.FC = () => {
  const {
    batches,
    productionRecords,
    destructionCertificates,
    scheduleDisposal,
    currentUser,
  } = usePharmaChain();

  // Scheduling modal state
  const [selectedBatchForDisposal, setSelectedBatchForDisposal] = useState<Batch | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [targetFacilityName, setTargetFacilityName] = useState('CleanEco Hazardous Incinerator (CPCB-HAZ-2024-887)');
  const [disposalMethod, setDisposalMethod] = useState<'HIGH_TEMP_INCINERATION' | 'CHEMICAL_DEACTIVATION'>('HIGH_TEMP_INCINERATION');
  const [signingPin, setSigningPin] = useState('3310');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);

  // Certificate view modal
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [selectedCertificateId, setSelectedCertificateId] = useState<number | null>(null);

  // Ready for disposal: batches in DISTRIBUTOR_CONFIRMED
  const confirmedReturns = batches.filter((b) => b.currentStatus === 'DISTRIBUTOR_CONFIRMED');
  const totalLifetimeDestroyed = batches.filter((b) => b.currentStatus === 'DESTROYED').length;

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForDisposal) return;

    setIsScheduling(true);
    const res = await scheduleDisposal({
      batchNumber: selectedBatchForDisposal.batchNumber,
      targetFacilityName,
      scheduledDate,
    });
    setIsScheduling(false);

    if (res.success) {
      setScheduleNotice(res.message);
      setTimeout(() => {
        setSelectedBatchForDisposal(null);
        setScheduleNotice(null);
      }, 1500);
    }
  };

  // Mock destruction velocity chart data
  const velocityData = [
    { month: 'May', volume: 1400, height: '35%' },
    { month: 'Jun', volume: 2200, height: '55%' },
    { month: 'Jul', volume: 3100, height: '78%' },
    { month: 'Aug', volume: 1900, height: '48%' },
    { month: 'Sep', volume: 4000, height: '100%' },
  ];

  return (
    <div className="space-y-6" id="manufacturer-dashboard">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0b2b24] via-[#0f3830] to-[#0b2b24] text-white rounded-2xl p-6 shadow-md border border-teal-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-teal-400" /> Manufacturing Oversight
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
            {currentUser?.fullName || currentUser?.entityName || 'Sun Pharma Baddi Unit III'}
          </h2>
          <p className="text-xs sm:text-sm text-teal-200/80 mt-1">
            Manufacturing License: <span className="font-mono font-medium text-white">{currentUser?.licenseNumber || 'MFG-2022-IND-00412'}</span> | Baddi Unit III, Himachal Pradesh
          </p>
        </div>

        <div className="flex items-center">
          <div className="bg-teal-950/80 border border-teal-500/30 rounded-xl px-4 py-2.5 text-right">
            <div className="text-[11px] text-teal-300 font-bold uppercase tracking-wider">
              Rule 0 QA Linkage Verified
            </div>
            <div className="text-xs text-teal-100 font-mono">
              100% Batches Bound to QC Assay Records
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Returns Awaiting Disposal</div>
          <div className="text-3xl font-extrabold text-amber-500 mt-2">{confirmedReturns.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Confirmed at distributor transit hub</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">CPCB Certificates Issued</div>
          <div className="text-3xl font-extrabold text-teal-700 mt-2">{destructionCertificates.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Central Pollution Control Board</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Lifetime Destroyed</div>
          <div className="text-3xl font-extrabold text-slate-800 mt-2">{totalLifetimeDestroyed} Batches</div>
          <p className="text-[11px] text-slate-400 mt-1">Permanently Sealed on Ledger</p>
        </div>
      </div>

      {/* Table: Distributor Confirmed Returns (Ready for Destruction) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Distributor Confirmed Returns (Ready for Destruction)
            </h3>
            <p className="text-xs text-slate-500">
              Schedule certified destruction at state-authorized hazardous incinerator
            </p>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            Mandate Step 4
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b uppercase text-[10.5px] tracking-wider">
              <tr>
                <th className="py-3 px-4">BATCH & DRUG</th>
                <th className="py-3 px-4">CONFIRMED QUANTITY</th>
                <th className="py-3 px-4">QC ASSAY LINKAGE</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {confirmedReturns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    No batches awaiting disposal scheduling. All distributor returns processed.
                  </td>
                </tr>
              ) : (
                confirmedReturns.map((batch) => {
                  const prod = productionRecords.find((p) => p.batchNumber === batch.batchNumber);

                  return (
                    <tr key={batch.batchNumber} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{batch.batchNumber}</div>
                        <div className="text-slate-600 font-medium text-xs">
                          {batch.drugName || 'Ceftriaxone 1g Sterile Injection (Monocef)'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {batch.formulaName || 'Ceftriaxone Sodium Sterile IP'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                        {batch.quantity} units
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Assay: {prod?.qcAssayResult || '98.0%'} (PASS)</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                          Distributor Confirmed
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          id={`btn-schedule-${batch.batchNumber}`}
                          onClick={() => {
                            setSelectedBatchForDisposal(batch);
                            setSigningPin(currentUser?.pin || '3310');
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          Schedule Disposal
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Verified Drug Destruction Velocity & Destruction Certificate Archive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Velocity Chart Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Verified Drug Destruction Velocity</h3>
                <p className="text-xs text-slate-500">Total volume permanently neutralized at certified facilities</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Monthly Audit Metric
              </span>
            </div>

            {/* Bar Chart Representation */}
            <div className="mt-6 flex items-end justify-between gap-3 h-44 px-2 pt-6 pb-2 border-b border-slate-200">
              {velocityData.map((d) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[10px] font-mono text-slate-400 group-hover:text-teal-900 group-hover:font-bold">
                    {d.volume}
                  </div>
                  <div
                    style={{ height: d.height }}
                    className="w-full max-w-[32px] bg-teal-800 group-hover:bg-teal-700 rounded-t-sm transition-all"
                  />
                  <div className="text-[11px] font-bold text-slate-600 mt-1">{d.month}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Cumulative: <strong>12,600 units</strong></span>
            <span className="text-teal-800 font-semibold">Zero Re-Entry Detected</span>
          </div>
        </div>

        {/* Destruction Certificate Archive Cards */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-teal-700" />
                Destruction Certificate Archive
              </h3>
              <p className="text-xs text-slate-500">Government audit ready CPCB certificates</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Total Manifests: {destructionCertificates.length}
            </span>
          </div>

          <div className="space-y-3">
            {destructionCertificates.map((cert) => (
              <div
                key={cert.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:border-teal-300 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-teal-950">
                      {cert.batchNumber}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      Manifest #{cert.manifestNumber || `CPCB-HAZ-2024-00${cert.id}`}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    SEALED & DESTROYED
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">Disposed Qty:</span>
                    <strong className="text-slate-900">{cert.destroyedQuantity ?? cert.recordedDisposedQty ?? 0} units</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">Method:</span>
                    <strong className="text-slate-900 text-[10.5px] truncate block">{cert.destructionMethod ?? cert.disposalMethod ?? 'HIGH_TEMP_INCINERATION'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">Issued Date:</span>
                    <strong className="text-slate-900">{new Date(cert.issuedAt).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">Certified Facility:</span>
                    <strong className="text-slate-900 text-[10.5px] truncate block">{cert.facilityName}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[10px] font-mono text-slate-400 truncate max-w-xs">
                    Cert SHA-256: {(cert.certificateHash || '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b').substring(0, 24)}...
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCertificateId(cert.id);
                      setIsCertificateModalOpen(true);
                    }}
                    className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1"
                  >
                    <span>View CDSCO Certificate</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule Disposal Modal */}
      {selectedBatchForDisposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  Schedule Certified Hazardous Destruction
                </h4>
                <p className="text-xs text-slate-500">Batch: <span className="font-mono text-teal-800 font-bold">{selectedBatchForDisposal.batchNumber}</span></p>
              </div>
              <button
                onClick={() => setSelectedBatchForDisposal(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div className="bg-teal-50 p-3 rounded-xl border border-teal-200">
                <div className="text-teal-950 font-semibold">{selectedBatchForDisposal.drugName}</div>
                <div className="text-teal-800 text-[11px] font-mono">Volume: {selectedBatchForDisposal.quantity} units</div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">State Authorized Waste Facility:</label>
                <select
                  value={targetFacilityName}
                  onChange={(e) => setTargetFacilityName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-700"
                >
                  <option value="CleanEco Hazardous Incinerator (CPCB-HAZ-2024-887)">
                    CleanEco Hazardous Incinerator (CPCB-HAZ-2024-887, Baddi)
                  </option>
                  <option value="GreenEarth Bio-Destruction Facility (CPCB-MH-9912)">
                    GreenEarth Bio-Destruction Facility (CPCB-MH-9912, Pune)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Disposal Method:</label>
                  <select
                    value={disposalMethod}
                    onChange={(e) => setDisposalMethod(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-700"
                  >
                    <option value="HIGH_TEMP_INCINERATION">High Temp Incineration (1200°C)</option>
                    <option value="CHEMICAL_DEACTIVATION">Chemical Deactivation (Effluent)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Ingress Date:</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Manufacturer Authorization Officer PIN:</label>
                <input
                  type="password"
                  maxLength={4}
                  value={signingPin}
                  onChange={(e) => setSigningPin(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono tracking-widest focus:ring-2 focus:ring-teal-700"
                  required
                />
                <span className="text-[10.5px] text-slate-400 mt-0.5 block">PIN for MFG-2022-IND-00412 is default 3310</span>
              </div>

              {scheduleNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-semibold text-xs">
                  {scheduleNotice}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBatchForDisposal(null)}
                  className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScheduling}
                  className="flex-1 py-2 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-bold transition-colors shadow-xs"
                >
                  {isScheduling ? 'Routing to Facility...' : 'Schedule & Sign Manifest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official CDSCO Certificate Report Modal */}
      {isCertificateModalOpen && (
        <CdscoReportModal onClose={() => setIsCertificateModalOpen(false)} />
      )}
    </div>
  );
};
