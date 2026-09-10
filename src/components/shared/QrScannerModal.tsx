import React, { useState, useRef, useEffect } from 'react';
import { usePharmaChain } from '../../context/PharmaChainContext';
import {
  X,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ScanLine,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Camera,
  VideoOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DEMO_KNOWN_DESTROYED_BATCH } from '../../data/seedData';
import { PortalModal } from './PortalModal';

interface QrScannerModalProps {
  onClose: () => void;
  onBatchVerified?: (batchNumber: string) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ onClose, onBatchVerified }) => {
  const { verifyBatchScan, verifyScannedQr, generateBatchQrPayload } = usePharmaChain();

  const [inputVal, setInputVal] = useState('');
  const [scanResult, setScanResult] = useState<{
    tested: boolean;
    batchNumber: string;
    isAuthentic: boolean;
    isFraud: boolean;
    qrVerified?: boolean;
    qrReason?: string;
    status: string;
    message: string;
    drugName?: string;
    expiryDate?: string;
  } | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Manage real camera stream
  useEffect(() => {
    if (cameraActive) {
      setCameraError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera API (getUserMedia) not supported in this browser environment.');
        return;
      }

      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
          audio: false,
        })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((err) => console.warn('Video play error:', err));
          }
        })
        .catch((err) => {
          console.warn('Camera stream error in QR scanner:', err);
          setCameraError('Unable to access camera. Please check camera permissions.');
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraActive]);

  const handleProcessScan = (payloadOrBatch: string) => {
    const raw = payloadOrBatch.trim();
    if (!raw) return;

    let targetBatch = raw;
    let qrVerified = false;
    let qrReason = '';

    // Check if it's a signed QR payload
    if (raw.startsWith('PHARMACHAIN:v1:')) {
      const qrRes = verifyScannedQr(raw);
      qrVerified = qrRes.isValid;
      targetBatch = qrRes.batchNumber || raw;
      qrReason = qrRes.reason || '';
    }

    // Call the core Re-Entry detection & verification service
    const verifyRes = verifyBatchScan(targetBatch, 'Mobile Optical Scanner');

    if (verifyRes.isAuthentic && !verifyRes.isFraud) {
      // Fire celebratory confetti for genuine batch
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    }

    setScanResult({
      tested: true,
      batchNumber: targetBatch,
      isAuthentic: verifyRes.isAuthentic,
      isFraud: verifyRes.isFraud,
      qrVerified: raw.startsWith('PHARMACHAIN:v1:') ? qrVerified : undefined,
      qrReason,
      status: verifyRes.status,
      message: verifyRes.message,
      drugName: verifyRes.batch?.drugName,
      expiryDate: verifyRes.batch?.expiryDate,
    });

    if (onBatchVerified) {
      onBatchVerified(targetBatch);
    }
  };

  return (
    <PortalModal
      id="qr-scanner-modal"
      onClose={onClose}
      className="bg-white dark:bg-[#071914] rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-teal-900/50 overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-white"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-[#030e0c] text-white p-5 flex items-center justify-between border-b border-slate-800 dark:border-teal-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-800 flex items-center justify-center text-white">
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base">Batch Scanner & Re-Entry Detection</h3>
              <p className="text-xs text-slate-400 dark:text-teal-300/70">CDSCO Verification Endpoint</p>
            </div>
          </div>
          <button
            id="close-scanner-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-teal-900/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Real Live Camera Viewfinder */}
          <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border-2 border-slate-800 dark:border-teal-900/60 flex flex-col items-center justify-center text-white">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-4 border-2 border-dashed border-teal-400/70 rounded-lg pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.8)] animate-pulse"></div>
                </div>
              </>
            ) : (
              <>
                <QrCode className="w-12 h-12 text-slate-600 mb-2 opacity-60" />
                <span className="text-xs text-slate-400 z-10 text-center font-mono px-4">
                  Point camera at barcode, cryptographic QR code, or medicine pack
                </span>
              </>
            )}

            {cameraError && (
              <div className="absolute bottom-10 left-3 right-3 p-2 rounded bg-rose-950/90 border border-rose-500 text-rose-200 text-xs text-center">
                {cameraError}
              </div>
            )}

            <button
              onClick={() => setCameraActive(!cameraActive)}
              className="absolute bottom-2 text-[11px] px-3 py-1.5 rounded-lg bg-teal-900/90 hover:bg-teal-800 text-teal-100 flex items-center gap-1.5 transition-colors z-20 shadow-md backdrop-blur-xs font-semibold"
            >
              {cameraActive ? (
                <>
                  <VideoOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Stop Live Camera</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-teal-400" />
                  <span>Start Live Camera Stream</span>
                </>
              )}
            </button>
          </div>

          {/* Manual / Scanner Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-teal-200 block">
              Scan Barcode / Enter Batch Number / Paste Signed QR Payload:
            </label>
            <div className="flex gap-2">
              <input
                id="batch-scan-input"
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleProcessScan(inputVal)}
                placeholder="e.g. AZI-500-2026A or PHARMACHAIN:v1:..."
                className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-teal-700 bg-white dark:bg-[#061813] text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
              />
              <button
                id="execute-scan-btn"
                onClick={() => handleProcessScan(inputVal)}
                className="px-4 py-2 bg-teal-800 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs"
              >
                Scan & Verify
              </button>
            </div>
          </div>

          {/* 1-Click Quick Demo Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-teal-400/80 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              1-Click Live Test Scenarios:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                id="test-genuine-batch-btn"
                onClick={() => {
                  setInputVal('AZI-500-2026A');
                  handleProcessScan('AZI-500-2026A');
                }}
                className="p-2 text-left rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 transition-colors"
              >
                <div className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Test Genuine Batch
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">AZI-500-2026A (Active)</div>
              </button>

              <button
                id="test-reentry-fraud-btn"
                onClick={() => {
                  setInputVal(DEMO_KNOWN_DESTROYED_BATCH);
                  handleProcessScan(DEMO_KNOWN_DESTROYED_BATCH);
                }}
                className="p-2 text-left rounded-lg border border-rose-300 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 transition-colors shadow-xs"
              >
                <div className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  Test Re-Entry Fraud
                </div>
                <div className="text-[10px] text-rose-700 dark:text-rose-400 font-mono mt-0.5">
                  {DEMO_KNOWN_DESTROYED_BATCH} (Destroyed)
                </div>
              </button>

              <button
                id="test-counterfeit-btn"
                onClick={() => {
                  setInputVal('FAK-COUNTERFEIT-999');
                  handleProcessScan('FAK-COUNTERFEIT-999');
                }}
                className="p-2 text-left rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/70 transition-colors"
              >
                <div className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-amber-600" />
                  Test Counterfeit Batch
                </div>
                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-mono mt-0.5">FAK-COUNTERFEIT-999 (Unregistered)</div>
              </button>

              <button
                id="test-tampered-qr-btn"
                onClick={() => {
                  const payload = generateBatchQrPayload('AZI-500-2026A');
                  // Alter expiry or signature
                  const tampered = payload.replace('2027-01-15', '2029-99-99');
                  setInputVal(tampered);
                  handleProcessScan(tampered);
                }}
                className="p-2 text-left rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-950/70 transition-colors"
              >
                <div className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
                  Test Tampered QR HMAC
                </div>
                <div className="text-[10px] text-purple-700 dark:text-purple-400 font-mono mt-0.5">Modified signature payload</div>
              </button>
            </div>
          </div>

          {/* Scan Results Display */}
          {scanResult && (
            <div
              id="scan-result-card"
              className={`p-4 rounded-xl border transition-all ${
                scanResult.isFraud
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-200 ring-2 ring-rose-400'
                  : scanResult.isAuthentic
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {scanResult.isFraud ? (
                    <ShieldAlert className="w-6 h-6 text-rose-600 animate-bounce" />
                  ) : scanResult.isAuthentic ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm font-mono">{scanResult.batchNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        scanResult.isFraud
                          ? 'bg-rose-600 text-white'
                          : scanResult.isAuthentic
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {scanResult.status}
                    </span>
                  </div>

                  <p className="leading-relaxed font-medium">{scanResult.message}</p>

                  {scanResult.drugName && (
                    <div className="pt-1 text-[11px] opacity-80 border-t border-black/10 dark:border-white/10">
                      Product: <strong>{scanResult.drugName}</strong>
                      {scanResult.expiryDate && <span> | Expiry: <strong>{scanResult.expiryDate}</strong></span>}
                    </div>
                  )}

                  {scanResult.qrVerified !== undefined && (
                    <div className="pt-1 text-[11px] font-mono">
                      HMAC Signature:{' '}
                      <strong className={scanResult.qrVerified ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
                        {scanResult.qrVerified ? '✅ Mathematically Valid' : `❌ ${scanResult.qrReason}`}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PortalModal>
  );
};
