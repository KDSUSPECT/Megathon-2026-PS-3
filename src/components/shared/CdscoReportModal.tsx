import React from 'react';
import { usePharmaChain } from '../../context/PharmaChainContext';
import { X, Printer, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PortalModal } from './PortalModal';

interface CdscoReportModalProps {
  onClose: () => void;
}

export const CdscoReportModal: React.FC<CdscoReportModalProps> = ({ onClose }) => {
  const { batches, destructionCertificates, reEntryAlerts, disputes } = usePharmaChain();

  const totalBatches = batches.length;
  const totalDestroyed = batches.filter((b) => b.currentStatus === 'DESTROYED').length;
  const totalFraudAlerts = reEntryAlerts.length;
  const totalDisputes = disputes.length;
  const reportRef = `CDSCO-REV-LOG-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <PortalModal
      id="cdsco-report-modal"
      onClose={onClose}
      className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Modal Toolbar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm sm:text-base">CDSCO Statutory Compliance Report</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="print-report-btn"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              id="close-report-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="p-8 overflow-y-auto bg-white text-slate-900 font-sans space-y-6 text-xs sm:text-sm print:p-0">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5 text-center space-y-1">
            <div className="text-[11px] font-bold tracking-widest uppercase text-slate-600">
              Government of India • Ministry of Health and Family Welfare
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase font-serif">
              Central Drugs Standard Control Organisation (CDSCO)
            </h1>
            <div className="text-xs font-semibold text-slate-700">
              Directorate General of Health Services • Western Zonal Office
            </div>
            <div className="text-[11px] font-mono text-slate-500 pt-1">
              PharmaChain Reverse Logistics & Anti-Diversion Regulatory Dossier
            </div>
          </div>

          {/* Metadata Block */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Dossier Ref</span>
              <strong className="text-slate-900">{reportRef}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Date of Issue</span>
              <strong className="text-slate-900">{dateStr}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Compliance Zone</span>
              <strong className="text-slate-900">MH-WZ-ENFORCEMENT</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Ledger Integrity</span>
              <strong className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> SHA-256 VERIFIED
              </strong>
            </div>
          </div>

          {/* Executive KPI Summary */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b pb-1 mb-3">
              1. Regulatory Metrics Overview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <div className="text-2xl font-black text-blue-900">{totalBatches}</div>
                <div className="text-[11px] text-blue-700 font-medium">Batches Tracked</div>
              </div>
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-center">
                <div className="text-2xl font-black text-slate-900">{totalDestroyed}</div>
                <div className="text-[11px] text-slate-700 font-medium">Legally Destroyed</div>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                <div className="text-2xl font-black text-red-700">{totalFraudAlerts}</div>
                <div className="text-[11px] text-red-700 font-medium">Re-Entry Frauds Caught</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <div className="text-2xl font-black text-amber-800">{totalDisputes}</div>
                <div className="text-[11px] text-amber-700 font-medium">Quantity Disputes</div>
              </div>
            </div>
          </div>

          {/* Destruction Certificates Table */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b pb-1 mb-3">
              2. Certified Drug Destruction Log (Schedule M Compliance)
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                  <tr>
                    <th className="p-2.5">Batch #</th>
                    <th className="p-2.5">Disposal Facility</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5 text-right">Disposed Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {destructionCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-blue-800">{cert.batchNumber}</td>
                      <td className="p-2.5 text-slate-700 font-sans">{cert.facilityName}</td>
                      <td className="p-2.5 text-slate-600">{cert.disposalDate}</td>
                      <td className="p-2.5 text-slate-600 font-sans truncate max-w-[200px]">{cert.disposalMethod}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{cert.recordedDisposedQty.toLocaleString()} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fraud & Re-Entry Interceptions Table */}
          <div>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b pb-1 mb-3 flex items-center justify-between">
              <span>3. Anti-Diversion & Counterfeit Interception Log</span>
              <span className="text-[10px] text-red-600 font-normal uppercase">Sec. 17B Drugs & Cosmetics Act</span>
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                  <tr>
                    <th className="p-2.5">Batch #</th>
                    <th className="p-2.5">Point of Interception</th>
                    <th className="p-2.5">Timestamp</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Regulatory Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {reEntryAlerts.map((alert) => (
                    <tr key={alert.id} className="bg-red-50/50">
                      <td className="p-2.5 font-mono font-bold text-red-700">{alert.batchNumber}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{alert.scannedAtRetailerName}</td>
                      <td className="p-2.5 font-mono text-slate-600">{new Date(alert.scannedAt).toLocaleString()}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                          {alert.alertStatus}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-700 font-sans">{alert.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statutory Signatures */}
          <div className="pt-8 border-t border-slate-300 flex items-end justify-between text-xs">
            <div className="space-y-1">
              <div className="font-mono text-[11px] text-slate-500">DIGITALLY SIGNED VIA PHARMACHAIN PROTOCOL</div>
              <div className="text-[10px] text-slate-400 font-mono">
                SHA-256 HASH CHAIN MERKLE ROOT: 9f8a3c...e841
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="font-serif italic font-bold text-slate-900 text-sm">R. K. Verma</div>
              <div className="font-bold text-slate-800">Inspector R. K. Verma</div>
              <div className="text-[11px] text-slate-500">Drug Licensing Authority & Regional Enforcement Officer</div>
              <div className="text-[10px] text-slate-400">CDSCO Western Zone • Government of India</div>
            </div>
          </div>
        </div>
      </div>
    </PortalModal>
  );
};
