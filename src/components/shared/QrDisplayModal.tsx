import React, { useEffect, useState } from 'react';
import { renderQrCodeDataUrl } from '../../services/crypto';
import { usePharmaChain } from '../../context/PharmaChainContext';
import { X, Check, Copy, ShieldCheck, Download, ExternalLink } from 'lucide-react';
import { PortalModal } from './PortalModal';

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
    <PortalModal
      id="qr-display-modal"
      onClose={onClose}
      className="bg-white dark:bg-[#071914] rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-teal-900/60 overflow-hidden text-slate-900 dark:text-white"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#071d18] text-white p-5 flex items-center justify-between border-b border-teal-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Signed CDSCO QR Code</h3>
              <p className="text-xs text-teal-300/80 font-mono">{batchNumber}</p>
            </div>
          </div>
          <button
            id="close-qr-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-teal-300 hover:text-white hover:bg-teal-900/60 transition-colors"
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
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              {batch?.drugName || 'Pharmaceutical Product'}
            </h4>
            <div className="text-xs text-slate-500 dark:text-teal-300/70 flex items-center justify-center gap-2">
              <span>Status: <strong className="text-teal-700 dark:text-teal-300">{batch?.currentStatus}</strong></span>
              <span>•</span>
              <span>Expires: <strong className="text-slate-700 dark:text-slate-200">{batch?.expiryDate}</strong></span>
            </div>
          </div>

          {/* Cryptographic Details Card */}
          <div className="w-full text-left bg-slate-50 dark:bg-teal-950/40 border border-slate-200 dark:border-teal-900/60 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-teal-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                HMAC-SHA256 Digital Signature
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
                Valid
              </span>
            </div>

            <div className="bg-slate-900 dark:bg-black/70 text-emerald-400 p-2 rounded font-mono text-[11px] break-all leading-tight border border-emerald-900/40">
              {payload}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-teal-300/70">
              Payload includes batch ID, expiry timestamp, and a cryptographic MAC generated with the regulatory private seed. Any tampering will be immediately rejected at scan verification.
            </p>
          </div>

          {/* Actions */}
          <div className="w-full flex items-center gap-2 pt-2">
            <button
              id="copy-qr-payload-btn"
              onClick={handleCopy}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-slate-300 dark:border-teal-800 text-slate-700 dark:text-teal-200 font-medium text-xs hover:bg-slate-50 dark:hover:bg-teal-950/60 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-medium text-xs transition-colors shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </PortalModal>
  );
};
