import QRCode from 'qrcode';
import { LedgerEntry } from '../types/pharmachain';

const HMAC_SECRET = 'PHARMACHAIN_REGULATORY_HMAC_KEY_V2_2026';
export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

// Pure JavaScript SHA-256 implementation ensuring synchronous and cross-platform reliability
function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let compositeClearHex = '';
  for (let idx = 0; idx < ascii.length; idx++) {
    compositeClearHex += ascii.charCodeAt(idx).toString(16);
  }

  /* Padding */
  for (i = 0; i < ascii[lengthProperty]; i++) {
    words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words[lengthProperty]; i += 16) {
    const w: number[] = [];
    for (j = 0; j < 16; j++) {
      w[j] = words[i + j] || 0;
    }
    for (j = 16; j < 64; j++) {
      const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;

    for (j = 0; j < 64; j++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Computes SHA-256 hash of a string
 */
export function computeHash(data: string): string {
  return sha256Sync(data);
}

/**
 * Computes HMAC-SHA256 signature for payload validation
 */
export function computeHmac(data: string, secret: string = HMAC_SECRET): string {
  return sha256Sync(`${secret}::${data}::${secret}`);
}

/**
 * HashChainService: creates a cryptographic ledger entry
 * currentHash = SHA256(eventData + previousHash + timestamp)
 */
export function buildLedgerEntry(
  id: number,
  batchNumber: string,
  eventType: LedgerEntry['eventType'],
  eventData: Record<string, unknown> | string,
  previousHash: string = GENESIS_HASH,
  overrideTimestamp?: string
): LedgerEntry {
  const timestamp = overrideTimestamp || new Date().toISOString();
  const eventDataString = typeof eventData === 'string' ? eventData : JSON.stringify(eventData);
  const hashInput = `${eventDataString}|${previousHash}|${timestamp}`;
  const currentHash = computeHash(hashInput);

  return {
    id,
    batchNumber,
    eventType,
    eventData: eventDataString,
    previousHash,
    currentHash,
    timestamp,
  };
}

/**
 * Verify integrity of a batch's hash chain
 * Returns true if every link is mathematically valid and unmodified
 */
export interface VerificationResult {
  isValid: boolean;
  totalEntries: number;
  brokenIndex?: number;
  expectedHash?: string;
  actualHash?: string;
  errorMessage?: string;
}

export function verifyChainIntegrity(entries: LedgerEntry[]): VerificationResult {
  if (!entries || entries.length === 0) {
    return { isValid: true, totalEntries: 0 };
  }

  // Sort chronological
  const sorted = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];

    // Check link to previous
    if (i === 0) {
      if (entry.previousHash !== GENESIS_HASH) {
        return {
          isValid: false,
          totalEntries: sorted.length,
          brokenIndex: 0,
          expectedHash: GENESIS_HASH,
          actualHash: entry.previousHash,
          errorMessage: `Genesis block does not link to GENESIS_HASH. Found: ${entry.previousHash}`,
        };
      }
    } else {
      const prev = sorted[i - 1];
      if (entry.previousHash !== prev.currentHash) {
        return {
          isValid: false,
          totalEntries: sorted.length,
          brokenIndex: i,
          expectedHash: prev.currentHash,
          actualHash: entry.previousHash,
          errorMessage: `Block #${entry.id} previousHash does not match Block #${prev.id} currentHash. Chain severed!`,
        };
      }
    }

    // Check self hash computation
    const recalculated = computeHash(`${entry.eventData}|${entry.previousHash}|${entry.timestamp}`);
    if (recalculated !== entry.currentHash) {
      return {
        isValid: false,
        totalEntries: sorted.length,
        brokenIndex: i,
        expectedHash: recalculated,
        actualHash: entry.currentHash,
        errorMessage: `Block #${entry.id} hash mismatch! Computed: ${recalculated.slice(0, 12)}... Stored: ${entry.currentHash.slice(0, 12)}... (Data was altered)`,
      };
    }
  }

  return { isValid: true, totalEntries: sorted.length };
}

/**
 * QR Code Service:
 * Builds HMAC-signed QR payload: "PHARMACHAIN:v1:batchNumber:expiryDate:signature"
 */
export function generateSignedQrPayload(batchNumber: string, expiryDate: string): string {
  const message = `${batchNumber}:${expiryDate}`;
  const signature = computeHmac(message);
  return `PHARMACHAIN:v1:${batchNumber}:${expiryDate}:${signature}`;
}

export interface QrVerificationResult {
  isValid: boolean;
  batchNumber?: string;
  expiryDate?: string;
  reason?: string;
}

/**
 * Verifies HMAC signed QR payload
 */
export function verifyQrPayload(payload: string): QrVerificationResult {
  if (!payload || !payload.startsWith('PHARMACHAIN:v1:')) {
    // Check if it's just raw batch number
    if (payload && payload.length > 3) {
      return {
        isValid: false,
        batchNumber: payload.trim(),
        reason: 'Unsigned or legacy barcode format. Missing cryptographic CDSCO HMAC signature.',
      };
    }
    return { isValid: false, reason: 'Invalid payload structure' };
  }

  const parts = payload.split(':');
  if (parts.length !== 5) {
    return { isValid: false, reason: 'Malformed QR signature payload' };
  }

  const [, , batchNumber, expiryDate, signature] = parts;
  const expectedSig = computeHmac(`${batchNumber}:${expiryDate}`);

  if (signature !== expectedSig) {
    return {
      isValid: false,
      batchNumber,
      expiryDate,
      reason: 'Cryptographic HMAC mismatch! QR code is forged, copied, or tampered with.',
    };
  }

  return {
    isValid: true,
    batchNumber,
    expiryDate,
  };
}

/**
 * Generate QR code data URL (Base64 PNG) for rendering
 */
export async function renderQrCodeDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 280,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}
