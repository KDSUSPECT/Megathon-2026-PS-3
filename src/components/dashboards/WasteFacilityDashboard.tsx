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
  Award,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Batch } from '../../types/pharmachain';
import { DestructionCertificateModal } from '../shared/DestructionCertificateModal';
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
  const [viewingCertificate, setViewingCertificate] = useState<any | null>(null);

  // Batches waiting for destruction
  const incomingDestructionQueue = batches.filter(
    (b) =>
      b.currentStatus === 'SCHEDULED_FOR_DESTRUCTION' ||
      b.currentStatus === 'DISTRIBUTOR_CONFIRMED' ||
      b.currentStatus === 'RECEIVED_AT_MANUFACTURER'
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
      // Find the newly issued certificate to preview immediately
      const newlyCreatedCert = destructionCertificates.find((c) => c.batchNumber === selectedBatchNumber) || {
        id: destructionCertificates.length + 1,
        batchNumber: selectedBatchNumber,
        disposalDate,
        disposalMethod,
        recordedDisposedQty,
        facilityName: currentUser?.fullName || 'CleanEco Hazardous Incinerator',
        issuedAt: new Date().toISOString(),
        manifestNumber: `CPCB-HAZ-${Date.now().toString().slice(-6)}`,
      };
      setViewingCertificate(newlyCreatedCert);
      setSelectedBatchNumber('');
      setRecordedDisposedQty(500);
    } else {
      setNotice({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100" id="waste-facility-dashboard">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/50 to-slate-50 dark:from-[#0b2b24] dark:via-[#0f3830] dark:to-[#0b2b24] text-slate-900 dark:text-white rounded-2xl p-6 shadow-xs dark:shadow-md border border-teal-200 dark:border-teal-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" /> Bio-Hazardous Waste & Incineration Facility
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
            {currentUser?.fullName || currentUser?.entityName || 'GreenEarth Bio-Destruction Pvt Ltd'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-teal-200/80 mt-1">
            CPCB HazMat Authorization:{' '}
            <span className="font-mono font-bold text-teal-900 dark:text-white bg-teal-100 dark:bg-teal-900/80 px-2 py-0.5 rounded border border-teal-300 dark:border-teal-500/40">
              {currentUser?.licenseNumber || 'CPCB-HAZ-2024-9901-MUM'}
            </span>{' '}
            | Irreversible Thermal Destruction & Hash Proof Sealing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/90 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-500/30 rounded-xl px-4 py-2.5 text-right shadow-xs">
            <div className="text-[11px] text-teal-800 dark:text-teal-300 font-bold uppercase tracking-wider flex items-center justify-end gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> CPCB EPA Compliance
            </div>
            <div className="text-xs text-slate-700 dark:text-teal-100 font-mono">
              Final Lifecycle Terminal Node (Status: DESTROYED)
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Queue in Yard */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80 uppercase tracking-wider">
              Pending Destruction In Yard
            </div>
            <div className="text-3xl font-extrabold text-orange-600 dark:text-orange-400 mt-1 font-mono">
              {incomingDestructionQueue.length}
            </div>
            <div className="text-[11.5px] text-slate-500 dark:text-teal-200/70 mt-1 flex items-center gap-1">
              <span className="text-orange-600 dark:text-orange-400 font-bold">● Awaiting Incinerator Charge</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-800/60">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Certificates Sealed */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80 uppercase tracking-wider">
              Permanent Certificates Issued
            </div>
            <div className="text-3xl font-extrabold text-teal-700 dark:text-teal-300 mt-1 font-mono">
              {destructionCertificates.length}
            </div>
            <div className="text-[11.5px] text-slate-500 dark:text-teal-200/70 mt-1 flex items-center gap-1">
              <span className="text-teal-700 dark:text-teal-400 font-bold">100% Irreversibly Disposed</span> on ledger
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center border border-teal-200 dark:border-teal-800/60">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Tablets Demolished */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-teal-300/80 uppercase tracking-wider">
              Total Units Incinerated
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
              {destructionCertificates.reduce((acc, c) => acc + c.recordedDisposedQty, 0).toLocaleString()}
            </div>
            <div className="text-[11.5px] text-slate-500 dark:text-teal-200/70 mt-1 flex items-center gap-1">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">Zero Re-Entry Guarantee</span> enforced
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* DISPOSER RECHARTS GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Graph 1: Kiln Furnace Temp & Destruction Velocity */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-teal-200">
                Incineration Kiln Continuous Temperature & Burn Throughput
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-teal-300/70">
                Mandatory CPCB thermal threshold &gt; 1100°C for complete API pyrolysis
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
              1210°C REALTIME
            </span>
          </div>

          <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { time: '08:00', temp: 1180, unitsDestroyed: 80 },
                  { time: '10:00', temp: 1210, unitsDestroyed: 150 },
                  { time: '12:00', temp: 1225, unitsDestroyed: 240 },
                  { time: '14:00', temp: 1205, unitsDestroyed: 290 },
                  { time: '16:00', temp: 1215, unitsDestroyed: 210 },
                  { time: '18:00', temp: 1195, unitsDestroyed: 110 },
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="time" interval={0} tick={{ fontSize: 10, fill: '#64748b' }} />
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
                  dataKey="temp"
                  stroke="#ea580c"
                  fill="#ffedd5"
                  name="Furnace Temp (°C)"
                />
                <Area
                  type="monotone"
                  dataKey="unitsDestroyed"
                  stroke="#0d9488"
                  fill="#ccfbf1"
                  name="Units Disposed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Destruction Methodology Distribution */}
        <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-teal-200">
                Disposal Methodology Distribution
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-teal-300/70">
                Share of verified waste processing techniques
              </p>
            </div>
          </div>

          <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Thermal Incineration (1200°C)', value: 65, color: '#e11d48' },
                    { name: 'Autoclave Denaturing', value: 20, color: '#0284c7' },
                    { name: 'Plasma Arc Gasification', value: 10, color: '#8b5cf6' },
                    { name: 'Encapsulation Landfill', value: 5, color: '#f59e0b' },
                  ]}
                  innerRadius={36}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill="#e11d48" />
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
                <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Grid: Queue & Issue Certificate Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Incoming Queue Table */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-teal-900/40 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Batches Scheduled for Destruction</h3>
                <p className="text-xs text-slate-500 dark:text-teal-300/70">Awaiting certified thermal destruction or chemical denaturing</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                {incomingDestructionQueue.length} In Yard
              </span>
            </div>

            {incomingDestructionQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-teal-400/50 border border-dashed rounded-xl bg-slate-50 dark:bg-[#071914] border-slate-200 dark:border-teal-900/50">
                No batches currently waiting in yard. All incoming batches have been destroyed.
              </div>
            ) : (
              <div className="space-y-3">
                {incomingDestructionQueue.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-teal-900/50 hover:border-teal-500/50 transition-all bg-slate-50/60 dark:bg-[#081f19] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white bg-slate-200 dark:bg-teal-950 px-2 py-0.5 rounded border border-slate-300 dark:border-teal-800">
                          {b.batchNumber}
                        </span>
                        <span className="text-xs font-bold text-orange-800 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/80 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                          {b.currentStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">{b.drugName}</div>
                      <div className="text-xs text-slate-500 dark:text-teal-300/70">
                        Units in Stock: <strong className="text-slate-800 dark:text-white">{b.unitsCount}</strong> • Expiry Date: {b.expiryDate}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedBatchNumber(b.batchNumber);
                        setRecordedDisposedQty(b.unitsCount);
                      }}
                      className="px-3 py-1.5 bg-teal-800 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs self-end sm:self-center"
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
          <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 shadow-xs p-5 space-y-4">
            <div className="border-b border-slate-200 dark:border-teal-900/40 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                Issue Statutory Destruction Certificate
              </h3>
              <p className="text-xs text-slate-500 dark:text-teal-300/70">
                Permanently transitions batch to <strong className="text-slate-900 dark:text-white font-bold">DESTROYED</strong> and seals cryptographic hash chain.
              </p>
            </div>

            <form onSubmit={handleIssueCertificate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Target Batch Number:</label>
                <select
                  value={selectedBatchNumber}
                  onChange={(e) => {
                    setSelectedBatchNumber(e.target.value);
                    const match = batches.find((b) => b.batchNumber === e.target.value);
                    if (match) setRecordedDisposedQty(match.unitsCount);
                  }}
                  className="w-full p-2.5 border border-slate-300 dark:border-teal-700 rounded-lg font-mono bg-white dark:bg-[#061813] text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-700"
                  required
                >
                  <option value="">-- Select batch scheduled for destruction --</option>
                  {incomingDestructionQueue.map((b) => (
                    <option key={b.id} value={b.batchNumber}>
                      {b.batchNumber} - {b.drugName} ({b.unitsCount} units) [{b.currentStatus}]
                    </option>
                  ))}
                  <option value="AML-05-2026E">AML-05-2026E (Amlodipine 5mg - Confirmed)</option>
                  <option value="TEL-40-2026G">TEL-40-2026G (Telmisartan 40mg - Scheduled)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Actual Incineration Date:</label>
                  <input
                    type="date"
                    value={disposalDate}
                    onChange={(e) => setDisposalDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-teal-700 rounded-lg font-mono bg-white dark:bg-[#061813] text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-700"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Certified Disposed Qty (Units):</label>
                  <input
                    type="number"
                    min={1}
                    value={recordedDisposedQty}
                    onChange={(e) => setRecordedDisposedQty(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-300 dark:border-teal-700 rounded-lg font-mono bg-white dark:bg-[#061813] text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Approved CPCB Destruction Methodology:</label>
                <select
                  value={disposalMethod}
                  onChange={(e) => setDisposalMethod(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-teal-700 rounded-lg bg-white dark:bg-[#061813] text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-700"
                >
                  {DISPOSAL_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Scanned Certificate File URL / Manifest Ref:</label>
                <input
                  type="text"
                  value={certUrlInput}
                  onChange={(e) => setCertUrlInput(e.target.value)}
                  placeholder="https://pharmachain.in/certificates/CERT-2026-WST-XXXX.pdf (optional)"
                  className="w-full p-2.5 border border-slate-300 dark:border-teal-700 rounded-lg bg-white dark:bg-[#061813] text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-700 font-mono"
                />
              </div>

              {notice && (
                <div
                  className={`p-2.5 rounded-lg font-semibold text-xs ${
                    notice.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300'
                      : 'bg-red-50 dark:bg-rose-950/60 text-red-900 dark:text-rose-200 border border-red-300'
                  }`}
                >
                  {notice.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !selectedBatchNumber}
                className="w-full py-2.5 bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg font-bold transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <Flame className="w-4 h-4 text-orange-400" />
                <span>{isSubmitting ? 'Recording Irreversible Destruction...' : 'Certify Destruction & Seal Ledger'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Completed Certificates Log */}
      <div className="bg-white dark:bg-[#0a231d] rounded-2xl border border-slate-200 dark:border-teal-900/50 shadow-xs p-5 space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base">Permanent Destruction Audit Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-[#081b16] text-slate-500 dark:text-teal-300/80 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-teal-900/40">
              <tr>
                <th className="p-3">CERT ID</th>
                <th className="p-3">BATCH NUMBER</th>
                <th className="p-3">DISPOSAL DATE</th>
                <th className="p-3">METHODOLOGY</th>
                <th className="p-3 text-right">DISPOSED QUANTITY</th>
                <th className="p-3 text-right">CERTIFICATE PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-teal-900/30 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
              {destructionCertificates.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-teal-950/30 transition-colors">
                  <td className="p-3 font-semibold text-slate-600 dark:text-teal-300/80">#{c.id}</td>
                  <td className="p-3 font-bold text-teal-800 dark:text-teal-300">{c.batchNumber}</td>
                  <td className="p-3 text-slate-600 dark:text-teal-200/70">{c.disposalDate}</td>
                  <td className="p-3 text-slate-600 dark:text-teal-200/70 font-sans max-w-xs truncate">{c.disposalMethod}</td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{c.recordedDisposedQty.toLocaleString()} units</td>
                  <td className="p-3 text-right font-sans">
                    <button
                      type="button"
                      onClick={() => setViewingCertificate(c)}
                      className="text-teal-700 dark:text-teal-300 font-bold hover:underline inline-flex items-center gap-1 text-xs"
                    >
                      <Award className="w-3.5 h-3.5 text-teal-600" />
                      <span>View Seal & Medicines</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Destruction Certificate Modal with Authorized Seal & Itemized Disposed Medicines */}
      {viewingCertificate && (
        <DestructionCertificateModal
          certificate={viewingCertificate}
          onClose={() => setViewingCertificate(null)}
        />
      )}
    </div>
  );
};
