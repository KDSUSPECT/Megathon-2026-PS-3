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
  PickupReminder,
  FlaggedSealAlert,
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
import { api } from '../services/api';

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
  loginWithCredentials: (usernameOrLicense: string, pinOrPassword?: string) => Promise<boolean>;
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
    photos?: string[];
    agentNotes?: string;
    signingPin?: string;
  }) => Promise<TransitionResult & { confirmation?: PickupConfirmation }>;
  
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

  // Manufacturer extended actions
  pickupReminders: PickupReminder[];
  sendPickupReminder: (batchNumber: string) => { success: boolean; message: string };
  receiveMedicineAtFactory: (batchNumber: string) => Promise<TransitionResult>;
  dispatchToDisposer: (params: {
    batchNumber: string;
    targetFacilityName?: string;
    manifestNumber?: string;
    sealNumber?: string;
  }) => Promise<TransitionResult>;

  // Seal Re-entry & Flagged Security
  flaggedSealAlerts: FlaggedSealAlert[];
  checkSealNumber: (sealNumber: string, attemptedAction?: string) => {
    isFlagged: boolean;
    sealNumber: string;
    message: string;
    reason?: string;
    alertCreated?: boolean;
  };

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
  // Default to null so user lands on statutory login/role selection first
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  // Reverse logistics pickup reminders from Retailers to Manufacturer & Logistics
  const [pickupReminders, setPickupReminders] = useState<PickupReminder[]>([
    {
      id: 1,
      batchNumber: 'MET-850-2026B',
      drugName: 'Metformin HCl 850mg (Glyciphage)',
      retailerName: 'Apollo Pharmacy #402',
      retailerLocation: 'Bandra West, Mumbai',
      quarantinedUnits: 120,
      reminderSentAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      status: 'SENT',
    },
    {
      id: 2,
      batchNumber: 'TEL-40-2026C',
      drugName: 'Telmisartan 40mg (Telma)',
      retailerName: 'Apollo Pharmacy #402',
      retailerLocation: 'Bandra West, Mumbai',
      quarantinedUnits: 85,
      reminderSentAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      status: 'ACKNOWLEDGED',
    },
  ]);

  // Flagged seal detection database
  const [flaggedSealAlerts, setFlaggedSealAlerts] = useState<FlaggedSealAlert[]>([
    {
      id: 1,
      sealNumber: 'CPCB-HAZ-2025-SEAL-8849',
      associatedBatchNumber: 'AZI-500-2026A',
      flaggedReason: 'Seal tied to incinerated batch AZI-500-2026A. Detected attempted re-entry into supply chain.',
      flaggedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      attemptedAction: 'Barcode verification at retail intake',
      reportedBy: 'CDSCO Automated Ledger Integrity Watchdog',
    },
  ]);

  const currentRole = currentUser?.role || 'RETAILER';

  // Load authoritative state from the Spring Boot + MySQL backend.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [serverBatches, serverReturns, serverDisputes, serverCertificates, serverAlerts] = await Promise.all([
          api.batches(), api.returns(), api.disputes(), api.certificates(), api.alerts()
        ]);
        if (cancelled) return;
        setBatches(serverBatches as Batch[]);
        setReturnRequests(serverReturns as ReturnRequest[]);
        setDisputes(serverDisputes as Dispute[]);
        setDestructionCertificates(serverCertificates as DestructionCertificate[]);
        setReEntryAlerts(serverAlerts as ReEntryAlert[]);
      } catch (error) {
        console.warn('PharmaChain backend unavailable; using demo seed data.', error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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

  const loginWithCredentials = async (usernameOrLicense: string, pinOrPassword?: string) => {
    try {
      const response = await api.login(usernameOrLicense.trim(), (pinOrPassword || '').trim());
      const seeded = SEEDED_USERS.find((u) => u.username.toLowerCase() === String(response.username).toLowerCase());
      const user: User = {
        id: Number(response.userId),
        username: response.username,
        role: response.role as Role,
        linkedEntityId: Number(response.linkedEntityId),
        fullName: response.fullName,
        entityName: response.entityName,
        email: seeded?.email || `${response.username}@pharmachain.in`,
        licenseNumber: seeded?.licenseNumber,
        pin: pinOrPassword,
      };
      setCurrentUser(user);
      return true;
    } catch (error) {
      console.warn('Backend login failed:', error);
      return false;
    }
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
    try {
      const response = await api.switchPersona(role);
      const matched = SEEDED_USERS.find((u) => u.role === role) || usersList.find((u) => u.role === role);
      if (matched) setCurrentUser(matched);
      return {
        success: true,
        role: (response.role || role) as Role,
        entityName: matched?.entityName || matched?.fullName || '',
        licenseNumber: matched?.licenseNumber || '',
      };
    } catch (error) {
      console.warn('Persona switch failed:', error);
      const matched = usersList.find((u) => u.role === role) || SEEDED_USERS.find((u) => u.role === role) || SEEDED_USERS[0];
      setCurrentUser(matched);
      return { success: true, role: matched.role, entityName: matched.entityName || matched.fullName, licenseNumber: matched.licenseNumber || '' };
    }
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
    // Reject any transition if neither a ProductionRecord nor registered inventory batch exists
    const targetBatch = batches.find((b) => b.batchNumber === batchNumber);
    const prodRecord = productionRecords.find((p) => p.batchNumber === batchNumber);
    if (!prodRecord && !targetBatch) {
      return {
        success: false,
        message: `Manufacturer Batch Registry Validation Failed: Batch '${batchNumber}' does not exist in the official production ledger! Counterfeit or unauthorized batch blocked.`,
        error: 'REGISTRY_VALIDATION_ERROR',
      };
    }

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
    batchNumber: string; claimedQuantity: number; conditionNotes: string; photoUrl?: string;
  }): Promise<TransitionResult> => {
    try {
      const request = await api.createReturn({
        batchNumber: params.batchNumber,
        retailerId: currentUser?.linkedEntityId || 1,
        originPharmacyLicense: currentUser?.licenseNumber || '',
        claimedQuantity: params.claimedQuantity,
        conditionNotes: params.conditionNotes,
        photoUrl: params.photoUrl || '',
      });
      setReturnRequests(prev => [request as ReturnRequest, ...prev.filter(r => r.id !== request.id)]);
      const updated = await api.batches();
      setBatches(updated as Batch[]);
      return { success: true, message: `Return request #${request.id} submitted for batch ${params.batchNumber}.`, batch: (updated as Batch[]).find(b => b.batchNumber === params.batchNumber) };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to create return request.', error: 'API_ERROR' };
    }
  };

  // DistributorController: POST /api/distributor/confirm-pickup
  const confirmPickup = async (params: {
    returnRequestId: number; confirmedQuantity: number; confirmedWeightKg: number; batchNumberScanned: string; photos?: string[]; agentNotes?: string; signingPin?: string;
  }): Promise<TransitionResult & { confirmation?: PickupConfirmation }> => {
    try {
      const response = await api.confirmPickup(params.returnRequestId, {
        distributorId: currentUser?.linkedEntityId || 1,
        distributorLicense: currentUser?.licenseNumber || 'DL-2023-DIS-33014',
        confirmedQuantity: params.confirmedQuantity,
        confirmedWeightKg: params.confirmedWeightKg,
        batchNumberScanned: params.batchNumberScanned,
        photos: (params.photos || []).slice(0, 5),
        agentNotes: params.agentNotes || '',
        signingPinUsed: params.signingPin || currentUser?.pin || '1234',
      });
      const [serverReturns, serverBatches, serverDisputes] = await Promise.all([api.returns(), api.batches(), api.disputes()]);
      setReturnRequests(serverReturns as ReturnRequest[]);
      setBatches(serverBatches as Batch[]);
      setDisputes(serverDisputes as Dispute[]);
      return { success: response.success !== false, message: response.message || 'Pickup confirmed.', batch: (serverBatches as Batch[]).find(b => b.batchNumber === params.batchNumberScanned) };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to confirm pickup.', error: 'API_ERROR' };
    }
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
    batchNumber: string; disposalDate: string; disposalMethod: string; recordedDisposedQty: number; certificateFileUrl?: string;
  }): Promise<TransitionResult> => {
    try {
      const response = await api.issueCertificate({
        batchNumber: params.batchNumber,
        wasteFacilityId: currentUser?.linkedEntityId || 1,
        manifestNumber: '',
        disposalDate: params.disposalDate.length === 10 ? `${params.disposalDate}T00:00:00` : params.disposalDate,
        disposalMethod: params.disposalMethod,
        destructionMethod: params.disposalMethod,
        recordedDisposedQty: params.recordedDisposedQty,
        certificateFileUrl: params.certificateFileUrl || '',
      });
      const [serverCertificates, serverBatches] = await Promise.all([api.certificates(), api.batches()]);
      setDestructionCertificates(serverCertificates as DestructionCertificate[]);
      setBatches(serverBatches as Batch[]);
      return { success: true, message: response.message || 'Destruction certificate issued.', batch: (serverBatches as Batch[]).find(b => b.batchNumber === params.batchNumber) };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to issue destruction certificate.', error: 'API_ERROR' };
    }
  };

  // Manufacturer Action: Send Pickup Reminder to Retailer / Logistics
  const sendPickupReminder = (batchNumber: string) => {
    const batch = batches.find((b) => b.batchNumber === batchNumber);
    const drugName = batch?.drugName || 'Pharmaceutical Product';
    const newReminder: PickupReminder = {
      id: pickupReminders.length + 1,
      batchNumber,
      drugName,
      retailerName: 'Apollo Pharmacy #402',
      retailerLocation: 'Bandra West, Mumbai',
      quarantinedUnits: batch?.unitsCount || 100,
      reminderSentAt: new Date().toISOString(),
      status: 'SENT',
    };
    setPickupReminders((prev) => [newReminder, ...prev]);

    setNotifications((prev) => [
      {
        id: `reminder-${Date.now()}`,
        batchNumber,
        title: 'Reverse Logistics Pickup Reminder Dispatched',
        message: `Manufacturer issued formal pickup directive to Medilogix Logistics for expired batch ${batchNumber} (${drugName}) at Apollo Pharmacy.`,
        type: 'EXPIRY_WARNING',
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);

    return {
      success: true,
      message: `Statutory pickup reminder dispatched to logistics and pharmacy for batch ${batchNumber}.`,
    };
  };

  // Manufacturer Action: Acknowledge Receiving Medicine at Factory Dock
  const receiveMedicineAtFactory = async (batchNumber: string): Promise<TransitionResult> => {
    const targetBatch = batches.find((b) => b.batchNumber === batchNumber);
    if (!targetBatch) {
      return { success: false, message: 'Batch not found in ledger.', error: 'NOT_FOUND' };
    }

    const res = transitionBatchStatus(
      batchNumber,
      'RECEIVED_AT_MANUFACTURER',
      'RECEIVED_AT_PLANT',
      {
        receivedBy: currentUser?.fullName || 'Sun Pharma QA Intake Inspector',
        plantWarehouse: 'Sun Pharma Baddi Unit III - Hazardous Staging Bay 4',
        receivedUnits: targetBatch.unitsCount,
        qcSealIntact: true,
        inspectionPassed: true,
      },
      currentUser
    );

    if (res.success) {
      setNotifications((prev) => [
        {
          id: `factory-recv-${Date.now()}`,
          batchNumber,
          title: 'Batch Received at Manufacturing Plant',
          message: `Batch ${batchNumber} logged at factory intake dock. Ready for hazardous disposal transfer.`,
          type: 'EXPIRY_WARNING',
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
    }

    return res;
  };

  // Manufacturer Action: Dispatch Received Medicines to Authorized Waste Disposer
  const dispatchToDisposer = async (params: {
    batchNumber: string;
    targetFacilityName?: string;
    manifestNumber?: string;
    sealNumber?: string;
  }): Promise<TransitionResult> => {
    const {
      batchNumber,
      targetFacilityName = 'CleanEco Hazardous Incinerator (CPCB-HAZ-2024-887)',
      manifestNumber = `CPCB-HAZ-DISP-${Date.now().toString().slice(-6)}`,
      sealNumber = `DISP-SEAL-${Math.floor(1000 + Math.random() * 9000)}`,
    } = params;

    const res = transitionBatchStatus(
      batchNumber,
      'SCHEDULED_FOR_DESTRUCTION',
      'DISPOSAL_SCHEDULED',
      {
        targetFacilityName,
        manifestNumber,
        sealNumber,
        dispatchedFrom: currentUser?.entityName || 'Sun Pharma Baddi Unit III',
        dispatchedAt: new Date().toISOString(),
      },
      currentUser
    );

    if (res.success) {
      setNotifications((prev) => [
        {
          id: `dispatched-${Date.now()}`,
          batchNumber,
          title: 'Batch Dispatched to Hazardous Waste Incinerator',
          message: `Batch ${batchNumber} dispatched under Gate Pass #${manifestNumber} (Seal #${sealNumber}) to ${targetFacilityName}.`,
          type: 'EXPIRY_WARNING',
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
    }

    return res;
  };

  // Seal Re-Entry & Tamper Flag Check
  const checkSealNumber = (sealNumber: string, attemptedAction: string = 'Manifest verification') => {
    const clean = sealNumber.trim().toUpperCase();
    const FLAGGED_SEAL_LIST = [
      'CPCB-HAZ-2025-SEAL-8849',
      'CDSCO-FLAGGED-SEAL-991',
      'DISP-SEAL-COMPROMISED-442',
      'MFR-DISP-SEAL-0077',
    ];

    const isFlagged = FLAGGED_SEAL_LIST.includes(clean) || clean.includes('FLAGGED') || clean.includes('COMPROMISED');

    if (isFlagged) {
      const newAlert: FlaggedSealAlert = {
        id: flaggedSealAlerts.length + 1,
        sealNumber: clean,
        flaggedReason: 'Seal has previously been revoked, marked compromised, or linked to destroyed medicine packaging!',
        flaggedAt: new Date().toISOString(),
        attemptedAction,
        reportedBy: currentUser?.fullName || 'Statutory Enforcement Watchdog',
      };
      setFlaggedSealAlerts((prev) => [newAlert, ...prev]);

      // Push high-priority fraud notification
      setNotifications((prev) => [
        {
          id: `seal-alert-${newAlert.id}`,
          batchNumber: clean,
          title: '🚨 FLAGGED SEAL RE-ENTRY DETECTED!',
          message: `Unauthorized attempt to enter decommissioned seal #${clean} during ${attemptedAction}. Immediate CDSCO freeze activated!`,
          type: 'FRAUD_ALERT',
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);

      return {
        isFlagged: true,
        sealNumber: clean,
        message: `🚨 CRITICAL RE-ENTRY ALERT: Seal #${clean} is FLAGGED! This seal was decommissioned or reported compromised. Re-circulation attempt blocked under Rule 65!`,
        reason: 'Previously retired or compromised statutory seal number.',
        alertCreated: true,
      };
    }

    return {
      isFlagged: false,
      sealNumber: clean,
      message: `✅ Seal #${clean} is valid, authenticated, and authorized in CPCB registry.`,
      alertCreated: false,
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
    api.resolveDispute(disputeId, resolutionNotes).then((updated) => {
      setDisputes(prev => prev.map(d => d.id === disputeId ? updated as Dispute : d));
    }).catch((error) => console.warn('Backend dispute resolution failed:', error));
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
    api.updateAlert(alertId, status).then((updated) => {
      setReEntryAlerts(prev => prev.map(a => a.id === alertId ? updated as ReEntryAlert : a));
    }).catch((error) => console.warn('Backend alert update failed:', error));
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
        pickupReminders,
        sendPickupReminder,
        receiveMedicineAtFactory,
        dispatchToDisposer,
        flaggedSealAlerts,
        checkSealNumber,
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
