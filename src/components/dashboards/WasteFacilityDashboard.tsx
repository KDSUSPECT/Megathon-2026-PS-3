import React, { useState } from 'react';
import { usePharmaChain } from '../../context/PharmaChainContext';
import {
  Flame,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Calendar,
  Building2,
  FileText,
} from 'lucide-react';
import { Batch } from '../../types/pharmachain';

const DISPOSAL_METHODS = [
  'High-Temperature Hazardous Incineration (1200°C) with Flue Gas Scrubbing',
  'Autoclave Chemical Denaturing followed by Deep Solidification',
  'Plasma Arc Gasification & Molecular Disassociation',
  'Secure Engineered Hazardous Landfill Encapsulation (Class 1)',
];

export const WasteFacilityDashboard: React.FC = () => {
  const {
    batches,
    destructionCertificates,
    issueDestructionCertificate,
    currentUser,
  } = usePharmaChain();

  // Selected batch for issuing certificate
  const [selectedBatchNumber, setSelectedBatchNumber] = useState('');
  const [disposalDate, setDisposalDate] = useState(new Date().toISOString().split('T')[0]);
  const [disposalMethod, setDisposalMethod] = useState(DISPOSAL_METHODS[0]);
  const [recordedDisposedQty, setRecordedDisposedQty] = useState<number>(500);
  const [certUrlInput, setCertUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Batches waiting for destruction
  const incomingDestructionQueue = batches.filter(
    (b) =>
      b.currentStatus === 'SCHEDULED_FOR_DESTRUCTION' ||
      b.currentStatus === 'DISTRIBUTOR_CONFIRMED'
  );

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchNumber || recordedDisposedQty <= 0) {
      setNotice({ type: 'error', text: 'Please select a batch and enter the verified destroyed quantity.' });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    const res = await issueDestructionCertificate({
      batchNumber: selectedBatchNumber,
      disposalDate,
      disposalMethod,
      recordedDisposedQty,
      certificateFileUrl: certUrlInput || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setNotice({ type: 'success', text: res.message });
      setSelectedBatchNumber('');
      setRecordedDisposedQty(500);
    } else {
      setNotice({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Flame className="w-4 h-4 text-orange-400" /> Bio-Hazardous Waste Facility Portal
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {currentUser?.fullName || 'GreenEarth Bio-Destruction Pvt Ltd'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            CPCB HazMat Authorization: <span className="font-mono font-medium text-white">CPCB-HAZ-2024-9901-MUM</span> • Irreversible Pharmaceutical Incineration & Certification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/10">
            <div className="text-xs text-teal-200">Scheduled Queue</div>
            <div className="text-xl font-bold text-orange-300">{incomingDestructionQueue.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/10">
            <div className="text-xs text-teal-200">Certificates Issued</div>
            <div className="text-xl font-bold text-emerald-400">{destructionCertificates.length}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Queue & Issue Certificate Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Incoming Queue Table */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Batches Scheduled for Destruction</h3>
                <p className="text-xs text-slate-500">Awaiting certified thermal destruction or chemical denaturing</p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">
                {incomingDestructionQueue.length} In Yard
              </span>
            </div>

            {incomingDestructionQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl bg-slate-50">
                No batches currently waiting in yard. All incoming batches have been destroyed.
              </div>
            ) : (
              <div className="space-y-3">
                {incomingDestructionQueue.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-teal-300 transition-all bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                          {b.batchNumber}
                        </span>
                        <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                          {b.currentStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 text-sm">{b.drugName}</div>
                      <div className="text-xs text-slate-500">
                        Units in Stock: <strong>{b.unitsCount}</strong> • Expiry Date: {b.expiryDate}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedBatchNumber(b.batchNumber);
                        setRecordedDisposedQty(b.unitsCount);
                      }}
                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm self-end sm:self-center"
                    >
                      <Flame className="w-3.5 h-3.5 text-orange-300" />
                      <span>Issue Certificate</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Issue Destruction Certificate Form */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600" />
                Issue Statutory Destruction Certificate
              </h3>
              <p className="text-xs text-slate-500">
                Permanently transitions batch to <strong className="text-slate-900 font-bold">DESTROYED</strong> and seals the cryptographic hash chain.
              </p>
            </div>

            <form onSubmit={handleIssueCertificate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Batch Number:</label>
                <select
                  value={selectedBatchNumber}
                  onChange={(e) => {
                    setSelectedBatchNumber(e.target.value);
                    const match = batches.find((b) => b.batchNumber === e.target.value);
                    if (match) setRecordedDisposedQty(match.unitsCount);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-teal-600 bg-white"
                  required
                >
                  <option value="">-- Select batch scheduled for destruction --</option>
                  {incomingDestructionQueue.map((b) => (
                    <option key={b.id} value={b.batchNumber}>
                      {b.batchNumber} - {b.drugName} ({b.unitsCount} units) [{b.currentStatus}]
                    </option>
                  ))}
                  {/* Option for demo flexibility */}
                  <option value="AML-05-2026E">AML-05-2026E (Amlodipine 5mg - Confirmed)</option>
                  <option value="TEL-40-2026G">TEL-40-2026G (Telmisartan 40mg - Scheduled)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Actual Incineration Date:</label>
                  <input
                    type="date"
                    value={disposalDate}
                    onChange={(e) => setDisposalDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-teal-600"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Certified Disposed Qty (Units):</label>
                  <input
                    type="number"
                    min={1}
                    value={recordedDisposedQty}
                    onChange={(e) => setRecordedDisposedQty(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-teal-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Approved CPCB Destruction Methodology:</label>
                <select
                  value={disposalMethod}
                  onChange={(e) => setDisposalMethod(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 bg-white"
                >
                  {DISPOSAL_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scanned Certificate File URL / Manifest Ref:</label>
                <input
                  type="text"
                  value={certUrlInput}
                  onChange={(e) => setCertUrlInput(e.target.value)}
                  placeholder="https://pharmachain.in/certificates/CERT-2026-WST-XXXX.pdf (optional)"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 font-mono"
                />
              </div>

              {notice && (
                <div
                  className={`p-2.5 rounded-lg font-semibold text-xs ${
                    notice.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {notice.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !selectedBatchNumber}
                className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-lg font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Flame className="w-4 h-4 text-orange-400" />
                <span>{isSubmitting ? 'Recording Irreversible Destruction...' : 'Certify Destruction & Seal Ledger'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Completed Certificates Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Permanent Destruction Audit Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
              <tr>
                <th className="p-3">Cert ID</th>
                <th className="p-3">Batch Number</th>
                <th className="p-3">Disposal Date</th>
                <th className="p-3">Methodology</th>
                <th className="p-3 text-right">Disposed Quantity</th>
                <th className="p-3 text-right">Certificate PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {destructionCertificates.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 font-mono text-[11px]">
                  <td className="p-3 font-semibold text-slate-600">#{c.id}</td>
                  <td className="p-3 font-bold text-blue-900">{c.batchNumber}</td>
                  <td className="p-3 text-slate-600">{c.disposalDate}</td>
                  <td className="p-3 text-slate-600 font-sans max-w-xs truncate">{c.disposalMethod}</td>
                  <td className="p-3 text-right font-bold text-slate-900">{c.recordedDisposedQty.toLocaleString()} units</td>
                  <td className="p-3 text-right font-sans">
                    <a
                      href={c.certificateFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 font-semibold hover:underline"
                    >
                      Download Cert
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
