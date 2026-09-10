import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Server,
  Database,
  ShieldCheck,
  Code2,
  Cpu,
  Layers,
  FileCode,
  ExternalLink,
} from 'lucide-react';
import { PortalModal } from './PortalModal';

interface SpringBootSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpringBootSpecModal: React.FC<SpringBootSpecModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ENDPOINTS' | 'LEDGER_SPEC' | 'SECURITY'>('ENDPOINTS');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const ENDPOINTS_CODE = `// Spring Boot 3.x REST API Specification for CDSCO Reverse Logistics
@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
public class PharmaChainController {

    @Autowired
    private LedgerService ledgerService;
    @Autowired
    private BatchVerificationService verifyService;

    // 1. Dev & Testing Persona Switcher
    @PostMapping("/dev/switch-persona")
    public ResponseEntity<PersonaResponse> switchPersona(@RequestBody SwitchPersonaRequest request) {
        // Simulates seamless CDSCO role identity swap
        return ResponseEntity.ok(ledgerService.switchSessionPersona(request.getTargetRole()));
    }

    // 2. Scan & Verification with Anti-Reentry Detection
    @GetMapping("/batches/{batchNumber}/verify")
    public ResponseEntity<BatchVerifyResult> verifyBatch(
            @PathVariable String batchNumber,
            @RequestParam String scannerLicense,
            @RequestParam(required = false) Double geoLat,
            @RequestParam(required = false) Double geoLng) {
        return ResponseEntity.ok(verifyService.auditBatch(batchNumber, scannerLicense, geoLat, geoLng));
    }

    // 3. Reverse Pickup Handover with Weight Reconciliation
    @PostMapping("/returns/{returnId}/confirm-pickup")
    public ResponseEntity<TransitProof> confirmPickup(
            @PathVariable Long returnId,
            @Valid @RequestBody PickupConfirmationDTO dto) {
        return ResponseEntity.ok(ledgerService.recordDistributorPickup(returnId, dto));
    }

    // 4. Hazardous Incineration Manifest & Certificate
    @PostMapping("/disposal/certificates")
    public ResponseEntity<CertificateRecord> issueDestructionCertificate(
            @Valid @RequestBody DestructionCertDTO dto) {
        return ResponseEntity.ok(ledgerService.recordDestruction(dto));
    }
}`;

  return (
    <PortalModal
      id="spring-boot-spec-modal"
      onClose={onClose}
      className="bg-white dark:bg-[#071914] rounded-2xl shadow-2xl border border-slate-200 dark:border-teal-900/60 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-slate-100"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#071d18] text-white px-6 py-4 flex items-center justify-between border-b border-teal-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 font-mono text-xs">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Spring Boot 3.x Backend Architecture Spec
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  CDSCO Standard API v2025.1
                </span>
              </div>
              <p className="text-[11.5px] text-teal-200/70">
                Enterprise microservices contract for reverse logistics, SHA-256 ledger & collusion detection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-teal-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ENDPOINTS')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'ENDPOINTS'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Controller Endpoints</span>
          </button>
          <button
            onClick={() => setActiveTab('LEDGER_SPEC')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'LEDGER_SPEC'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>SHA-256 Ledger Structure</span>
          </button>
          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'SECURITY'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security & Collusion Proofs</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700">
          {activeTab === 'ENDPOINTS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Java Spring Boot Controller Contract:</span>
                <button
                  onClick={() => copyToClipboard(ENDPOINTS_CODE, 'endpoints')}
                  className="flex items-center gap-1 text-[11px] font-semibold text-teal-800 hover:text-teal-950 px-2 py-1 rounded bg-teal-50 border border-teal-200"
                >
                  {copied === 'endpoints' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied === 'endpoints' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-teal-200 font-mono text-[11.5px] overflow-x-auto leading-relaxed border border-slate-800">
                {ENDPOINTS_CODE}
              </pre>
            </div>
          )}

          {activeTab === 'LEDGER_SPEC' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 space-y-1.5">
                <div className="font-bold text-sm text-teal-900">Cryptographic Reverse-Supply Ledger (Block Spec)</div>
                <p className="text-[12px] text-teal-800 leading-relaxed">
                  Every transition generates an immutable block:
                  <code className="bg-white/80 px-1 py-0.5 rounded text-teal-900 mx-1 font-mono">
                    currentHash = SHA256(previousHash + eventType + payloadJson + timestamp)
                  </code>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-800">
                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                  <div className="font-bold text-slate-900">1. Production Ingress (Rule 0)</div>
                  <p className="text-[11px] text-slate-500">
                    Manufacturer registers batch with QC assay passing score and production quantity.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                  <div className="font-bold text-slate-900">2. Reverse Return Intent</div>
                  <p className="text-[11px] text-slate-500">
                    Pharmacy initiates return with claimed count, condition notes, and photo audit URL.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                  <div className="font-bold text-slate-900">3. Dock Tare & Gross Reconciliation</div>
                  <p className="text-[11px] text-slate-500">
                    Distributor verifies barcode and weigh-in. Any mismatch triggers automated dispute.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                  <div className="font-bold text-slate-900">4. High-Temp Incineration</div>
                  <p className="text-[11px] text-slate-500">
                    CPCB licensed facility issues digital manifest number sealing the batch permanently.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SECURITY' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5">
                <div className="font-bold text-sm text-amber-900">Zero Re-Entry Guarantee (Anti-Repackaging)</div>
                <p className="text-[12px] text-amber-800 leading-relaxed">
                  If any retailer or dispensary scans a batch number that has previously received a
                  <code className="bg-white/80 px-1 py-0.5 rounded text-amber-900 mx-1 font-mono">CERTIFICATE_ISSUED</code>
                  or <code className="bg-white/80 px-1 py-0.5 rounded text-amber-900 mx-1 font-mono">DESTROYED</code> block, the server immediately triggers a red statutory CDSCO alert and locks custody.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">Digital Signing PIN Verification</div>
                <p className="text-[11px] text-slate-600">
                  Every custody handover requires the authorized officer to enter their 4-digit signing PIN, preventing unauthorized barcode spoofing or courier dock bypass.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#061612] border-t border-slate-200 dark:border-teal-900/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-teal-300/70">
          <span>Compliant with CDSCO 2025 Digital Mandate & Schedule M</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-teal-800 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
          >
            Close Spec
          </button>
        </div>
      </div>
    </PortalModal>
  );
};
