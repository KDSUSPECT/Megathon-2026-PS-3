import React, { useEffect, useState } from 'react';
import { renderQrCodeDataUrl } from '../../services/crypto';
import { usePharmaChain } from '../../context/PharmaChainContext';
import { X, Check, Copy, ShieldCheck, Download, ExternalLink } from 'lucide-react';

interface QrDisplayModalProps {
  batchNumber: string;
  onClose: () => void;
}

export const QrDisplayModal: React.FC<QrDisplayModalProps> = ({ batchNumber, onClose }) => {
  const { generateBatchQrPayload, batches } = usePharmaChain();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const batch = batches.find((b) => b.batchNumber === batchNumber);
  const payload = generateBatchQrPayload(batchNumber);

  useEffect(() => {
    let isMounted = true;
    renderQrCodeDataUrl(payload)
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => console.error('Failed to render QR', err));
    return () => {
      isMounted = false;
    };
  }, [payload]);

  const handleCopy = () => {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Signed CDSCO QR Code</h3>
              <p className="text-xs text-slate-400 font-mono">{batchNumber}</p>
            </div>
          </div>
          <button
            id="close-qr-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-white border-2 border-slate-100 rounded-xl shadow-inner">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${batchNumber}`}
                className="w-56 h-56 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                Generating signed QR...
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">
              {batch?.drugName || 'Pharmaceutical Product'}
            </h4>
            <div className="text-xs text-slate-500 flex items-center justify-center gap-2">
              <span>Status: <strong className="text-blue-700">{batch?.currentStatus}</strong></span>
              <span>•</span>
              <span>Expires: <strong className="text-slate-700">{batch?.expiryDate}</strong></span>
            </div>
          </div>

          {/* Cryptographic Details Card */}
          <div className="w-full text-left bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                HMAC-SHA256 Digital Signature
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                Valid
              </span>
            </div>

            <div className="bg-slate-900 text-emerald-400 p-2 rounded font-mono text-[11px] break-all leading-tight">
              {payload}
            </div>

            <p className="text-[11px] text-slate-500">
              Payload includes batch ID, expiry timestamp, and a cryptographic MAC generated with the regulatory private seed. Any tampering will be immediately rejected at scan verification.
            </p>
          </div>

          {/* Actions */}
          <div className="w-full flex items-center gap-2 pt-2">
            <button
              id="copy-qr-payload-btn"
              onClick={handleCopy}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied Payload</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Payload</span>
                </>
              )}
            </button>

            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`PHARMACHAIN-QR-${batchNumber}.png`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-blue-700 text-white font-medium text-xs hover:bg-blue-800 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
