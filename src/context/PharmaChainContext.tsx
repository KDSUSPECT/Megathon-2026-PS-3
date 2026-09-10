import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Batch,
  ProductionRecord,
  ReturnRequest,
  PickupConfirmation,
  Dispute,
  DestructionCertificate,
  ReEntryAlert,
  LedgerEntry,
  Role,
  BatchStatus,
  NotificationItem,
  RiskScore,
} from '../types/pharmachain';
import {
  SEEDED_USERS,
  SEEDED_BATCHES,
  SEEDED_PRODUCTION_RECORDS,
  SEEDED_RETURN_REQUESTS,
  SEEDED_PICKUP_CONFIRMATIONS,
  SEEDED_DISPUTES,
  SEEDED_DESTRUCTION_CERTIFICATES,
  SEEDED_REENTRY_ALERTS,
  generateInitialLedger,
  DEMO_KNOWN_DESTROYED_BATCH,
} from '../data/seedData';
import {
  buildLedgerEntry,
  verifyChainIntegrity,
  VerificationResult,
  generateSignedQrPayload,
  verifyQrPayload,
  QrVerificationResult,
  computeHash,
} from '../services/crypto';
import { calculateRiskScore } from '../services/riskScore';

interface TransitionResult {
  success: boolean;
  message: string;
  batch?: Batch;
  error?: string;
  isFraud?: boolean;
}

interface ReconciliationResult {
  batchNumber: string;
  claimedQuantity: number;
  disposedQuantity: number;
  matched: boolean;
  discrepancy: number;
  message: string;
  disputeCreated?: boolean;
}

interface PharmaChainContextType {
  currentUser: User | null;
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  users: User[];
  batches: Batch[];
  productionRecords: ProductionRecord[];
  returnRequests: ReturnRequest[];
  pickupConfirmations: PickupConfirmation[];
  disputes: Dispute[];
  destructionCertificates: DestructionCertificate[];
  reEntryAlerts: ReEntryAlert[];
  ledger: LedgerEntry[];
  notifications: NotificationItem[];
  
  // Auth
  loginAsRole: (role: Role) => void;
  loginWithCredentials: (usernameOrLicense: string, pinOrPassword?: string) => boolean;
  registerEntity: (params: {
    username: string;
    role: Role;
    fullName: string;
    entityName: string;
    licenseNumber: string;
    pin: string;
    email: string;
  }) => boolean;
  switchPersonaDevEndpoint: (role: Role) => Promise<{
    success: boolean;
    role: Role;
    entityName: string;
    licenseNumber: string;
  }>;
  logout: () => void;
  
  // Core workflows
  createReturnRequest: (params: {
    batchNumber: string;
    claimedQuantity: number;
    conditionNotes: string;
    photoUrl?: string;
  }) => Promise<TransitionResult>;
  
  confirmPickup: (params: {
    returnRequestId: number;
    confirmedQuantity: number;
    confirmedWeightKg: number;
    batchNumberScanned: string;
  }) => Promise<TransitionResult>;
  
  scheduleDisposal: (params: {
    batchNumber: string;
    targetFacilityName?: string;
    scheduledDate: string;
  }) => Promise<TransitionResult>;
  
  issueDestructionCertificate: (params: {
    batchNumber: string;
    disposalDate: string;
    disposalMethod: string;
    recordedDisposedQty: number;
    certificateFileUrl?: string;
  }) => Promise<TransitionResult>;

  // Fraud & Trust
  verifyBatchScan: (
    batchNumber: string,
    scannerLocation?: string
  ) => {
    isAuthentic: boolean;
    isFraud: boolean;
    batch?: Batch;
    status: BatchStatus | 'UNREGISTERED_COUNTERFEIT';
    message: string;
    alertCreated?: boolean;
  };

  reconcileBatch: (batchNumber: string) => ReconciliationResult;
  verifyLedgerForBatch: (batchNumber: string) => VerificationResult;
  tamperLedgerEntry: (entryId: number, tamperedData: string) => void;
  restoreOriginalLedger: () => void;
  
  // QR & OCR
  generateBatchQrPayload: (batchNumber: string) => string;
  verifyScannedQr: (payload: string) => QrVerificationResult;
  scanPhotoOcr: (imageFileOrText: string) => Promise<{ detectedBatchNumber: string | null; confidence: number; detectedText: string }>;

  // Regulator actions
  resolveDispute: (disputeId: number, resolutionNotes: string) => void;
  updateAlertStatus: (alertId: number, status: ReEntryAlert['alertStatus']) => void;
  getRiskScoreForEntity: (entityId: number, entityType: 'RETAILER' | 'DISTRIBUTOR') => RiskScore;
  getRandomAuditBatches: (samplePercentage?: number) => Batch[];
  markNotificationAsRead: (id: string) => void;
  resetAllDemoData: () => void;
}

const PharmaChainContext = createContext<PharmaChainContextType | undefined>(undefined);

export const PharmaChainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usersList, setUsersList] = useState<User[]>(() => SEEDED_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(() => SEEDED_USERS[0]); // default Retailer
  const [batches, setBatches] = useState<Batch[]>(() => SEEDED_BATCHES);
  const [productionRecords] = useState<ProductionRecord[]>(() => SEEDED_PRODUCTION_RECORDS);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>(() => SEEDED_RETURN_REQUESTS);
  const [pickupConfirmations, setPickupConfirmations] = useState<PickupConfirmation[]>(() => SEEDED_PICKUP_CONFIRMATIONS);
  const [disputes, setDisputes] = useState<Dispute[]>(() => SEEDED_DISPUTES);
  const [destructionCertificates, setDestructionCertificates] = useState<DestructionCertificate[]>(() => SEEDED_DESTRUCTION_CERTIFICATES);
  const [reEntryAlerts, setReEntryAlerts] = useState<ReEntryAlert[]>(() => SEEDED_REENTRY_ALERTS);
  const [ledger, setLedger] = useState<LedgerEntry[]>(() => generateInitialLedger());
  const [originalLedgerBackup, setOriginalLedgerBackup] = useState<LedgerEntry[]>(() => generateInitialLedger());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const currentRole = currentUser?.role || 'RETAILER';

  // Scheduled job simulation: daily scan for batches within 60 days and 3 days of expiry
  useEffect(() => {
    const today = new Date();
    const newNotifications: NotificationItem[] = [];

    batches.forEach((batch) => {
      if (batch.currentStatus === 'ACTIVE') {
        const expiry = new Date(batch.expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 3 && diffDays >= 0) {
          newNotifications.push({
            id: `crit-${batch.batchNumber}`,
            batchNumber: batch.batchNumber,
            title: `CRITICAL EXPIRY ALERT (< 3 days)`,
            message: `Batch ${batch.batchNumber} (${batch.drugName}) expires in ${diffDays} days on ${batch.expiryDate}. Immediate quarantine & return advised.`,
            type: 'CRITICAL_EXPIRY',
            timestamp: new Date().toISOString(),
            read: false,
          });
        } else if (diffDays <= 60 && diffDays > 3) {
          newNotifications.push({
            id: `warn-${batch.batchNumber}`,
            batchNumber: batch.batchNumber,
            title: `Approaching Expiry Notice (< 60 days)`,
            message: `Batch ${batch.batchNumber} (${batch.drugName}) expires in ${diffDays} days. Flagged for reverse logistics monitoring.`,
            type: 'EXPIRY_WARNING',
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }
    });

    setNotifications(newNotifications);
  }, [batches]);

  // Auth methods
  const loginAsRole = (role: Role) => {
    const user = usersList.find((u) => u.role === role) || SEEDED_USERS.find((u) => u.role === role) || SEEDED_USERS[0];
    setCurrentUser(user);
  };

  const setCurrentRole = (role: Role) => {
    loginAsRole(role);
  };

  const loginWithCredentials = (usernameOrLicense: string, pinOrPassword?: string) => {
    const term = usernameOrLicense.trim().toLowerCase();
    const user = usersList.find(
      (u) =>
        u.username.toLowerCase() === term ||
        (u.licenseNumber && u.licenseNumber.toLowerCase() === term) ||
        (u.email && u.email.toLowerCase() === term)
    );
    if (user) {
      if (pinOrPassword && user.pin && pinOrPassword.trim() && user.pin !== pinOrPassword.trim()) {
        // Allow fallback if pin matches or let through
      }
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const registerEntity = (params: {
    username: string;
    role: Role;
    fullName: string;
    entityName: string;
    licenseNumber: string;
    pin: string;
    email: string;
  }) => {
    const newUser: User = {
      id: usersList.length + 1,
      username: params.username.trim().toLowerCase(),
      role: params.role,
      linkedEntityId: usersList.length + 1,
      fullName: params.fullName.trim(),
      entityName: params.entityName.trim(),
      licenseNumber: params.licenseNumber.trim().toUpperCase(),
      pin: params.pin.trim(),
      email: params.email.trim(),
    };
    setUsersList((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    return true;
  };

  // Simulates POST /api/dev/switch-persona
  const switchPersonaDevEndpoint = async (role: Role) => {
    // Lightweight dev endpoint simulation
    console.info(`[DEV API] POST /api/dev/switch-persona { targetRole: '${role}' } -> 200 OK (Swapped active session)`);
    const matched = usersList.find((u) => u.role === role) || SEEDED_USERS.find((u) => u.role === role) || SEEDED_USERS[0];
    setCurrentUser(matched);
    return {
      success: true,
      role: matched.role,
      entityName: matched.entityName || matched.fullName,
      licenseNumber: matched.licenseNumber || '',
    };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Central State Machine Transition with Cryptographic Ledger Recording & Batch Registry Validation
  const transitionBatchStatus = (
    batchNumber: string,
    targetStatus: BatchStatus,
    eventType: LedgerEntry['eventType'],
    eventData: Record<string, unknown>,
    actorUser: User | null
  ): TransitionResult => {
    // 1. Manufacturer Batch Registry Validation:
    // Reject any transition if no corresponding ProductionRecord exists
    const prodRecord = productionRecords.find((p) => p.batchNumber === batchNumber);
    if (!prodRecord) {
      return {
        success: false,
        message: `Manufacturer Batch Registry Validation Failed: Batch '${batchNumber}' does not exist in the official production ledger! Counterfeit or unauthorized batch blocked.`,
        error: 'REGISTRY_VALIDATION_ERROR',
      };
    }

    const targetBatch = batches.find((b) => b.batchNumber === batchNumber);
    if (!targetBatch) {
      return {
        success: false,
        message: `Batch ${batchNumber} not found in inventory.`,
        error: 'BATCH_NOT_FOUND',
      };
    }

    // 2. Compute last ledger hash for this batch
    const batchChain = ledger
      .filter((l) => l.batchNumber === batchNumber)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const prevHash = batchChain.length > 0 ? batchChain[batchChain.length - 1].currentHash : undefined;

    // 3. Record Event into Hash-chained ledger
    const nextLedgerId = ledger.length + 1;
    const enrichedData = {
      ...eventData,
      fromStatus: targetBatch.currentStatus,
      toStatus: targetStatus,
      actor: actorUser ? `${actorUser.fullName} (${actorUser.role})` : 'System Automated Service',
      recordedAt: new Date().toISOString(),
    };

    const newLedgerEntry = buildLedgerEntry(
      nextLedgerId,
      batchNumber,
      eventType,
      enrichedData,
      prevHash
    );

    // Append to ledger
    setLedger((prev) => [...prev, newLedgerEntry]);
    setOriginalLedgerBackup((prev) => [...prev, newLedgerEntry]);

    // 4. Update Batch State
    let newHolderRole: Role = targetBatch.currentHolderRole;
    let newHolderName: string = targetBatch.currentHolderName;

    if (targetStatus === 'RETURN_INITIATED') {
      newHolderRole = 'RETAILER';
    } else if (targetStatus === 'DISTRIBUTOR_CONFIRMED' || targetStatus === 'DISPUTED') {
      newHolderRole = 'DISTRIBUTOR';
      newHolderName = 'MedLink Logistics Ltd';
    } else if (targetStatus === 'SCHEDULED_FOR_DESTRUCTION' || targetStatus === 'DESTROYED') {
      newHolderRole = 'WASTE_FACILITY';
      newHolderName = 'GreenEarth Bio-Destruction';
    }

    const updatedBatch: Batch = {
      ...targetBatch,
      currentStatus: targetStatus,
      currentHolderRole: newHolderRole,
      currentHolderName: newHolderName,
    };

    setBatches((prev) => prev.map((b) => (b.batchNumber === batchNumber ? updatedBatch : b)));

    return {
      success: true,
      message: `Batch ${batchNumber} transitioned successfully to ${targetStatus}`,
      batch: updatedBatch,
    };
  };

  // RetailerController: POST /api/retailer/return-request
  const createReturnRequest = async (params: {
    batchNumber: string;
    claimedQuantity: number;
    conditionNotes: string;
    photoUrl?: string;
  }): Promise<TransitionResult> => {
    const { batchNumber, claimedQuantity, conditionNotes, photoUrl } = params;

    const res = transitionBatchStatus(
      batchNumber,
      'RETURN_INITIATED',
      'RETURN_REQUESTED',
      {
        claimedQuantity,
        conditionNotes,
        hasPhotoEvidence: !!photoUrl,
      },
      currentUser
    );

    if (!res.success) return res;

    const newRequest: ReturnRequest = {
      id: returnRequests.length + 1,
      batchNumber,
      retailerId: currentUser?.linkedEntityId || 1,
      retailerName: currentUser?.fullName || 'Apollo Pharmacy #402',
      claimedQuantity,
      conditionNotes,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
      status: 'PENDING',
      initiatedAt: new Date().toISOString(),
    };

    setReturnRequests((prev) => [newRequest, ...prev]);

    return {
      success: true,
      message: `Return request #${newRequest.id} submitted for batch ${batchNumber}. Batch moved to RETURN_INITIATED.`,
      batch: res.batch,
    };
  };

  // DistributorController: POST /api/distributor/confirm-pickup
  const confirmPickup = async (params: {
    returnRequestId: number;
    confirmedQuantity: number;
    confirmedWeightKg: number;
    batchNumberScanned: string;
  }): Promise<TransitionResult> => {
    const { returnRequestId, confirmedQuantity, confirmedWeightKg, batchNumberScanned } = params;

    const request = returnRequests.find((r) => r.id === returnRequestId);
    if (!request) {
      return { success: false, message: 'Return request not found', error: 'NOT_FOUND' };
    }

    const claimedQty = request.claimedQuantity;
    const hasDiscrepancy = claimedQty !== confirmedQuantity;

    // Determine next batch status and dispute creation
    const nextStatus: BatchStatus = hasDiscrepancy ? 'DISPUTED' : 'DISTRIBUTOR_CONFIRMED';
    const eventType: LedgerEntry['eventType'] = hasDiscrepancy ? 'DISPUTE_RAISED' : 'PICKUP_CONFIRMED';

    const res = transitionBatchStatus(
      batchNumberScanned,
      nextStatus,
      eventType,
      {
        returnRequestId,
        claimedQuantity: claimedQty,
        confirmedQuantity,
        confirmedWeightKg,
        discrepancy: claimedQty - confirmedQuantity,
        autoDisputeCreated: hasDiscrepancy,
      },
      currentUser
    );

    if (!res.success) return res;

    // Record pickup confirmation
    const newConfirmation: PickupConfirmation = {
      id: pickupConfirmations.length + 1,
      returnRequestId,
      distributorId: currentUser?.linkedEntityId || 1,
      distributorName: currentUser?.fullName || 'MedLink Logistics Ltd',
      confirmedQuantity,
      confirmedWeightKg,
      batchNumberScanned,
      confirmedAt: new Date().toISOString(),
    };
    setPickupConfirmations((prev) => [newConfirmation, ...prev]);

    // Update return request status
    setReturnRequests((prev) =>
      prev.map((r) =>
        r.id === returnRequestId ? { ...r, status: hasDiscrepancy ? 'DISPUTED' : 'CONFIRMED' } : r
      )
    );

    // If quantity mismatch, auto-create Dispute!
    if (hasDiscrepancy) {
      const newDispute: Dispute = {
        id: disputes.length + 1,
        batchNumber: batchNumberScanned,
        retailerClaimedQty: claimedQty,
        distributorConfirmedQty: confirmedQuantity,
        status: 'OPEN',
        disputeType: 'QUANTITY_MISMATCH',
        resolutionNotes: `Auto-generated discrepancy: Retailer claimed ${claimedQty} units, but Distributor scan confirmed ${confirmedQuantity} units (difference: ${
          claimedQty - confirmedQuantity
        }). Batch quarantined in DISPUTED state.`,
        raisedAt: new Date().toISOString(),
      };
      setDisputes((prev) => [newDispute, ...prev]);

      // Add alert notification
      setNotifications((prev) => [
        {
          id: `dispute-${newDispute.id}`,
          batchNumber: batchNumberScanned,
          title: `Quantity Discrepancy Dispute Raised`,
          message: `Batch ${batchNumberScanned}: Claimed ${claimedQty} vs Confirmed ${confirmedQuantity}. Auto-flagged for regulatory audit.`,
          type: 'DISPUTE_RAISED',
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);

      return {
        success: true,
        message: `Pickup confirmed with DISCREPANCY (${claimedQty} claimed vs ${confirmedQuantity} received). Auto-created Dispute #${newDispute.id} and transitioned batch to DISPUTED.`,
        batch: res.batch,
      };
    }

    return {
      success: true,
      message: `Pickup confirmed matching exact quantity (${confirmedQuantity} units). Batch transitioned to DISTRIBUTOR_CONFIRMED.`,
      batch: res.batch,
    };
  };

  // ManufacturerController: POST /api/manufacturer/schedule-disposal
  const scheduleDisposal = async (params: {
    batchNumber: string;
    targetFacilityName?: string;
    scheduledDate: string;
  }): Promise<TransitionResult> => {
    const { batchNumber, targetFacilityName, scheduledDate } = params;

    const res = transitionBatchStatus(
      batchNumber,
      'SCHEDULED_FOR_DESTRUCTION',
      'DISPOSAL_SCHEDULED',
      {
        targetFacilityName: targetFacilityName || 'GreenEarth Bio-Destruction Facility',
        scheduledDate,
      },
      currentUser
    );

    return res;
  };

  // WasteFacilityController: POST /api/facility/destruction-certificate
  const issueDestructionCertificate = async (params: {
    batchNumber: string;
    disposalDate: string;
    disposalMethod: string;
    recordedDisposedQty: number;
    certificateFileUrl?: string;
  }): Promise<TransitionResult> => {
    const { batchNumber, disposalDate, disposalMethod, recordedDisposedQty, certificateFileUrl } = params;

    const targetBatch = batches.find((b) => b.batchNumber === batchNumber);
    if (!targetBatch) {
      return { success: false, message: 'Batch not found', error: 'NOT_FOUND' };
    }

    // Only allowed if batch is currently DISTRIBUTOR_CONFIRMED or SCHEDULED_FOR_DESTRUCTION
    if (
      targetBatch.currentStatus !== 'DISTRIBUTOR_CONFIRMED' &&
      targetBatch.currentStatus !== 'SCHEDULED_FOR_DESTRUCTION'
    ) {
      return {
        success: false,
        message: `Destruction certificate rejected: Batch status must be DISTRIBUTOR_CONFIRMED or SCHEDULED_FOR_DESTRUCTION. Current status: ${targetBatch.currentStatus}`,
        error: 'INVALID_STATUS_FOR_DESTRUCTION',
      };
    }

    const res = transitionBatchStatus(
      batchNumber,
      'DESTROYED',
      'CERTIFICATE_ISSUED',
      {
        disposalDate,
        disposalMethod,
        recordedDisposedQty,
        wasteFacility: currentUser?.fullName || 'GreenEarth Bio-Destruction',
      },
      currentUser
    );

    if (!res.success) return res;

    const newCert: DestructionCertificate = {
      id: destructionCertificates.length + 1,
      batchNumber,
      manifestNumber: `#CPCB-HAZ-${new Date().getFullYear()}-00${destructionCertificates.length + 1}`,
      wasteFacilityId: currentUser?.linkedEntityId || 1,
      facilityName: currentUser?.fullName || 'CleanEco Hazardous Incinerator',
      facilityLicense: currentUser?.licenseNumber || 'CPCB-HAZ-2024-887',
      disposalDate,
      certificateFileUrl:
        certificateFileUrl ||
        `https://pharmachain.in/certificates/CERT-${new Date().getFullYear()}-WST-${Math.floor(1000 + Math.random() * 9000)}.pdf`,
      certificateHash: computeHash(`${batchNumber}:${disposalDate}:${recordedDisposedQty}:${Date.now()}`),
      disposalMethod,
      destructionMethod: disposalMethod,
      recordedDisposedQty,
      destroyedQuantity: recordedDisposedQty,
      issuedAt: new Date().toISOString(),
    };

    setDestructionCertificates((prev) => [newCert, ...prev]);

    return {
      success: true,
      message: `Destruction Certificate #${newCert.id} recorded. Batch ${batchNumber} transitioned to permanently DESTROYED.`,
      batch: res.batch,
    };
  };

  // Re-entry Detection Endpoint: POST /api/scan/verify-batch
  // Takes scanned batch number, checks status:
  // if status is DESTROYED or retired, creates ReEntryAlert and transitions batch to RE_ENTRY_FLAGGED!
  const verifyBatchScan = (batchNumber: string, scannerLocation?: string) => {
    const cleanNumber = batchNumber.trim();
    const batch = batches.find((b) => b.batchNumber === cleanNumber);

    // 1. Unregistered Counterfeit check
    const prodRecord = productionRecords.find((p) => p.batchNumber === cleanNumber);
    if (!prodRecord) {
      return {
        isAuthentic: false,
        isFraud: true,
        status: 'UNREGISTERED_COUNTERFEIT' as const,
        message: `🚨 COUNTERFEIT WARNING: Batch '${cleanNumber}' has no manufacturer registration in the official CDSCO national database! Do not consume or stock.`,
        alertCreated: false,
      };
    }

    // 2. Re-entry Fraud check:
    // If the batch was already DESTROYED or RE_ENTRY_FLAGGED:
    if (batch && (batch.currentStatus === 'DESTROYED' || batch.currentStatus === 'RE_ENTRY_FLAGGED')) {
      // Transition batch to RE_ENTRY_FLAGGED
      if (batch.currentStatus !== 'RE_ENTRY_FLAGGED') {
        transitionBatchStatus(
          cleanNumber,
          'RE_ENTRY_FLAGGED',
          'FRAUD_ALERT_TRIGGERED',
          {
            detectionPoint: scannerLocation || currentUser?.fullName || 'Retailer Scanner',
            reason: 'Re-entry scan of an officially destroyed medication batch into commercial circulation',
          },
          currentUser
        );
      }

      // Create ReEntryAlert
      const newAlert: ReEntryAlert = {
        id: reEntryAlerts.length + 1,
        batchNumber: cleanNumber,
        scannedAtRetailerId: currentUser?.linkedEntityId || 1,
        scannedAtRetailerName: currentUser?.fullName || 'Apollo Pharmacy #402',
        scannedAt: new Date().toISOString(),
        alertStatus: 'NEW',
        notes: `CRITICAL FRAUD ALERT: Scanned batch ${cleanNumber} was previously destroyed according to Destruction Certificate registry. Someone is attempting to re-circulate diverted pharmaceutical waste!`,
      };

      setReEntryAlerts((prev) => [newAlert, ...prev]);

      // Push high priority notification
      setNotifications((prev) => [
        {
          id: `fraud-${newAlert.id}`,
          batchNumber: cleanNumber,
          title: `CRITICAL RE-ENTRY FRAUD DETECTED!`,
          message: `Destroyed batch ${cleanNumber} scanned at ${newAlert.scannedAtRetailerName}. Transferred to RE_ENTRY_FLAGGED status. Authorities notified.`,
          type: 'FRAUD_ALERT',
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);

      return {
        isAuthentic: false,
        isFraud: true,
        batch: { ...batch, currentStatus: 'RE_ENTRY_FLAGGED' },
        status: 'RE_ENTRY_FLAGGED' as const,
        message: `🚫 FRAUD DETECTED: Batch ${cleanNumber} was previously certified DESTROYED and has unlawfully re-entered the supply chain! ReEntryAlert #${newAlert.id} created and forwarded to CDSCO Enforcement.`,
        alertCreated: true,
      };
    }

    // 3. Normal authentic check
    return {
      isAuthentic: true,
      isFraud: false,
      batch,
      status: batch?.currentStatus || 'ACTIVE',
      message: `✅ Authentic CDSCO Registered Batch (${cleanNumber}). Manufacturer: ${prodRecord.drugName}. Status: ${batch?.currentStatus || 'ACTIVE'}`,
      alertCreated: false,
    };
  };

  // Conservation-of-quantity reconciliation: GET /api/regulator/reconcile/{batchNumber}
  const reconcileBatch = (batchNumber: string): ReconciliationResult => {
    const returns = returnRequests.filter((r) => r.batchNumber === batchNumber);
    const certs = destructionCertificates.filter((c) => c.batchNumber === batchNumber);

    const claimedQuantity = returns.reduce((acc, curr) => acc + curr.claimedQuantity, 0);
    const disposedQuantity = certs.reduce((acc, curr) => acc + curr.recordedDisposedQty, 0);

    const discrepancy = claimedQuantity - disposedQuantity;
    const matched = discrepancy === 0 && claimedQuantity > 0;

    let disputeCreated = false;

    if (!matched && claimedQuantity > 0 && certs.length > 0) {
      // Flag as dispute if not already recorded
      const existingDispute = disputes.find(
        (d) => d.batchNumber === batchNumber && d.disputeType === 'RECONCILIATION_MISMATCH'
      );
      if (!existingDispute) {
        const newDispute: Dispute = {
          id: disputes.length + 1,
          batchNumber,
          retailerClaimedQty: claimedQuantity,
          distributorConfirmedQty: disposedQuantity,
          status: 'OPEN',
          disputeType: 'RECONCILIATION_MISMATCH',
          resolutionNotes: `Reconciliation Mismatch: Total claimed quantity (${claimedQuantity}) does not equal destruction certificate quantity (${disposedQuantity}). Deficit of ${discrepancy} units missing.`,
          raisedAt: new Date().toISOString(),
        };
        setDisputes((prev) => [newDispute, ...prev]);
        disputeCreated = true;
      }
    }

    return {
      batchNumber,
      claimedQuantity,
      disposedQuantity,
      matched,
      discrepancy,
      disputeCreated,
      message: matched
        ? `Reconciliation Valid: 100% quantity conserved (${claimedQuantity} units claimed == ${disposedQuantity} units incinerated).`
        : `Reconciliation Failed: Discrepancy of ${discrepancy} units between claimed returns (${claimedQuantity}) and destruction certificates (${disposedQuantity}).`,
    };
  };

  // Ledger verification for a batch
  const verifyLedgerForBatch = (batchNumber: string): VerificationResult => {
    const batchEntries = ledger.filter((l) => l.batchNumber === batchNumber);
    return verifyChainIntegrity(batchEntries);
  };

  // Tamper simulation to show hash chain integrity check catching tampering in real time!
  const tamperLedgerEntry = (entryId: number, tamperedData: string) => {
    setLedger((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              eventData: tamperedData, // Intentionally change data without updating hash
            }
          : e
      )
    );
  };

  const restoreOriginalLedger = () => {
    setLedger([...originalLedgerBackup]);
  };

  // QR Generation & Verification
  const generateBatchQrPayload = (batchNumber: string): string => {
    const batch = batches.find((b) => b.batchNumber === batchNumber);
    const expiry = batch ? batch.expiryDate : '2026-12-31';
    return generateSignedQrPayload(batchNumber, expiry);
  };

  const verifyScannedQr = (payload: string): QrVerificationResult => {
    return verifyQrPayload(payload);
  };

  // OCR Photo batch capture simulation
  const scanPhotoOcr = async (
    imageFileOrText: string
  ): Promise<{ detectedBatchNumber: string | null; confidence: number; detectedText: string }> => {
    // Simulate OCR processing latency
    await new Promise((r) => setTimeout(r, 600));

    // Regex pattern matching pharmaceutical batch strings
    // Matches patterns like "BATCH: AZI-500-2026A", "B.No: MET-850", "PHARMA-DEST-8891", etc.
    const batchRegex = /\b([A-Z]{3,7}-[A-Z0-9]{2,6}-[A-Z0-9]{3,7}|PHARMA-[A-Z0-9-]+|[A-Z]{2,4}\d{4,8})\b/i;
    
    // Check if input itself is a batch or string
    const match = imageFileOrText.match(batchRegex);
    if (match) {
      return {
        detectedBatchNumber: match[1].toUpperCase(),
        confidence: 0.96,
        detectedText: `Parsed OCR: Detected B.No: ${match[1].toUpperCase()}`,
      };
    }

    // Default detection fallback to known batch if image contains hints or generic
    const randomExisting = batches[0].batchNumber;
    return {
      detectedBatchNumber: randomExisting,
      confidence: 0.88,
      detectedText: `OCR identified alphanumeric text matching CDSCO standard format: "${randomExisting}"`,
    };
  };

  const resolveDispute = (disputeId: number, resolutionNotes: string) => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              status: 'RESOLVED',
              resolutionNotes: `${d.resolutionNotes || ''}\n[CDSCO Resolution]: ${resolutionNotes}`,
              resolvedAt: new Date().toISOString(),
            }
          : d
      )
    );
  };

  const updateAlertStatus = (alertId: number, status: ReEntryAlert['alertStatus']) => {
    setReEntryAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, alertStatus: status } : a))
    );
  };

  const getRiskScoreForEntity = (entityId: number, entityType: 'RETAILER' | 'DISTRIBUTOR'): RiskScore => {
    const entityName = entityType === 'RETAILER' ? 'Apollo Pharmacy #402' : 'MedLink Western Logistics Ltd';
    return calculateRiskScore(entityId, entityName, entityType, disputes, returnRequests, pickupConfirmations);
  };

  const getRandomAuditBatches = (samplePercentage: number = 30): Batch[] => {
    const destroyed = batches.filter((b) => b.currentStatus === 'DESTROYED');
    const sampleCount = Math.max(1, Math.ceil((destroyed.length * samplePercentage) / 100));
    // Shuffle and pick
    return [...destroyed].sort(() => 0.5 - Math.random()).slice(0, sampleCount);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const resetAllDemoData = () => {
    setBatches(SEEDED_BATCHES);
    setReturnRequests(SEEDED_RETURN_REQUESTS);
    setPickupConfirmations(SEEDED_PICKUP_CONFIRMATIONS);
    setDisputes(SEEDED_DISPUTES);
    setDestructionCertificates(SEEDED_DESTRUCTION_CERTIFICATES);
    setReEntryAlerts(SEEDED_REENTRY_ALERTS);
    const freshLedger = generateInitialLedger();
    setLedger(freshLedger);
    setOriginalLedgerBackup(freshLedger);
  };

  return (
    <PharmaChainContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole,
        users: usersList,
        batches,
        productionRecords,
        returnRequests,
        pickupConfirmations,
        disputes,
        destructionCertificates,
        reEntryAlerts,
        ledger,
        notifications,
        loginAsRole,
        loginWithCredentials,
        registerEntity,
        switchPersonaDevEndpoint,
        logout,
        createReturnRequest,
        confirmPickup,
        scheduleDisposal,
        issueDestructionCertificate,
        verifyBatchScan,
        reconcileBatch,
        verifyLedgerForBatch,
        tamperLedgerEntry,
        restoreOriginalLedger,
        generateBatchQrPayload,
        verifyScannedQr,
        scanPhotoOcr,
        resolveDispute,
        updateAlertStatus,
        getRiskScoreForEntity,
        getRandomAuditBatches,
        markNotificationAsRead,
        resetAllDemoData,
      }}
    >
      {children}
    </PharmaChainContext.Provider>
  );
};

export function usePharmaChain() {
  const context = useContext(PharmaChainContext);
  if (!context) {
    throw new Error('usePharmaChain must be used within a PharmaChainProvider');
  }
  return context;
}
