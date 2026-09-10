export type Role = 'RETAILER' | 'DISTRIBUTOR' | 'MANUFACTURER' | 'WASTE_FACILITY' | 'REGULATOR';

export type BatchStatus = 
  | 'MANUFACTURED' 
  | 'ACTIVE' 
  | 'RETURN_INITIATED' 
  | 'DISTRIBUTOR_CONFIRMED' 
  | 'DISPUTED' 
  | 'RECEIVED_AT_MANUFACTURER'
  | 'SCHEDULED_FOR_DESTRUCTION' 
  | 'DESTROYED' 
  | 'RE_ENTRY_FLAGGED';

export type ReturnRequestStatus = 'PENDING' | 'CONFIRMED' | 'DISPUTED';

export type DisputeStatus = 'OPEN' | 'RESOLVED';

export type ReEntryAlertStatus = 'NEW' | 'UNDER_REVIEW' | 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE';

export type EventType = 
  | 'BATCH_CREATED' 
  | 'STATUS_TRANSITION' 
  | 'RETURN_REQUESTED' 
  | 'PICKUP_CONFIRMED' 
  | 'DISPUTE_RAISED' 
  | 'RECEIVED_AT_PLANT'
  | 'DISPOSAL_SCHEDULED' 
  | 'CERTIFICATE_ISSUED' 
  | 'FRAUD_ALERT_TRIGGERED' 
  | 'RECONCILIATION_FAILED' 
  | 'DISPUTE_RESOLVED';

export interface User {
  id: number;
  username: string;
  role: Role;
  linkedEntityId: number;
  fullName: string;
  email: string;
  licenseNumber?: string;
  pin?: string;
  entityName?: string;
}

export interface Retailer {
  id: number;
  name: string;
  licenseNumber: string;
  contactEmail: string;
  location: string;
  createdAt: string;
}

export interface Distributor {
  id: number;
  name: string;
  licenseNumber: string;
  contactEmail: string;
  mappedRetailerIds: number[];
  createdAt: string;
}

export interface Manufacturer {
  id: number;
  name: string;
  licenseNumber: string;
  contactEmail: string;
  createdAt: string;
}

export interface WasteFacility {
  id: number;
  name: string;
  licenseNumber: string;
  contactEmail: string;
  authorizationCertNumber: string;
  createdAt: string;
}

export interface Regulator {
  id: number;
  name: string;
  licenseNumber: string;
  contactEmail: string;
  createdAt: string;
}

export interface ProductionRecord {
  id: number;
  batchNumber: string;
  drugName: string;
  dosageForm: string;
  unitDose: string;
  quantityProduced: number;
  manufacturingDate: string;
  expiryDate: string;
  manufacturerLicense: string;
}

export interface Batch {
  id: number;
  batchNumber: string;
  drugName: string;
  formulaName?: string;
  manufacturingDate: string;
  expiryDate: string;
  currentStatus: BatchStatus;
  currentHolderRole: Role;
  currentHolderName: string;
  unitsCount: number;
  unitPrice: number;
  productionRecordId: number;
  qcAssayResult?: string;
}

export interface ReturnRequest {
  id: number;
  batchNumber: string;
  retailerId: number;
  retailerName: string;
  originPharmacyLicense?: string;
  claimedQuantity: number;
  conditionNotes: string;
  photoUrl?: string;
  status: ReturnRequestStatus;
  initiatedAt: string;
}

export interface PickupConfirmation {
  id: number;
  returnRequestId: number;
  distributorId: number;
  distributorName: string;
  distributorLicense?: string;
  confirmedQuantity: number;
  confirmedWeightKg: number;
  batchNumberScanned: string;
  photos?: string[]; // Agent uploaded photos of expired medicine/tablets (max 5)
  agentNotes?: string;
  signingPinUsed?: string;
  certificateReference?: string;
  certificateHash?: string;
  sealAuthorized?: boolean;
  confirmedAt: string;
}

export interface DistributorDisposalCertificate {
  id: number;
  certificateNumber: string;
  batchNumber: string;
  drugName: string;
  formulaName?: string;
  pharmacyName: string;
  pharmacyLicense: string;
  distributorName: string;
  distributorLicense: string;
  pickupDate: string;
  claimedQuantity: number;
  disposedTabletsCount: number;
  confirmedWeightKg: number;
  conditionSummary: string;
  photos: string[];
  officerName: string;
  signingPin: string;
  certificateHash: string;
  distributorSeal: {
    licenseNumber: string;
    sealTitle: string;
    authorizedBody: string;
    timestamp: string;
    cryptographicProof: string;
  };
  status: 'CERTIFIED_FOR_HAZARDOUS_DISPOSAL' | 'IN_TRANSIT_TO_INCINERATOR' | 'SEALED_ON_LEDGER';
  issuedAt: string;
}

export interface Dispute {
  id: number;
  batchNumber: string;
  retailerClaimedQty: number;
  distributorConfirmedQty: number;
  status: DisputeStatus;
  resolutionNotes?: string;
  raisedAt: string;
  resolvedAt?: string;
  disputeType: 'QUANTITY_MISMATCH' | 'RECONCILIATION_MISMATCH' | 'TAMPERING';
  originPharmacy?: string;
  originPharmacyLicense?: string;
}

export interface DestructionCertificate {
  id: number;
  batchNumber: string;
  manifestNumber?: string;
  wasteFacilityId: number;
  facilityName: string;
  facilityLicense?: string;
  disposalDate: string;
  certificateFileUrl: string;
  certificateHash?: string;
  disposalMethod: string;
  destructionMethod?: string;
  recordedDisposedQty: number;
  destroyedQuantity?: number;
  issuedAt: string;
}

export interface ReEntryAlert {
  id: number;
  batchNumber: string;
  scannedAtRetailerId: number;
  scannedAtRetailerName: string;
  scannedAt: string;
  alertStatus: ReEntryAlertStatus;
  notes: string;
}

export interface LedgerEntry {
  id: number;
  batchNumber: string;
  eventType: EventType;
  eventData: string; // JSON string
  previousHash: string;
  currentHash: string;
  timestamp: string;
}

export interface RiskScore {
  entityId: number;
  entityName: string;
  entityType: 'RETAILER' | 'DISTRIBUTOR';
  disputeCount: number;
  lateConfirmationCount: number;
  totalTransactions: number;
  disputedRatio: number;
  calculatedScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface NotificationItem {
  id: string;
  batchNumber: string;
  title: string;
  message: string;
  type: 'EXPIRY_WARNING' | 'CRITICAL_EXPIRY' | 'FRAUD_ALERT' | 'DISPUTE_RAISED';
  timestamp: string;
  read: boolean;
}

export interface PickupReminder {
  id: number;
  batchNumber: string;
  drugName: string;
  retailerName: string;
  retailerLocation: string;
  quarantinedUnits: number;
  reminderSentAt: string;
  status: 'SENT' | 'ACKNOWLEDGED' | 'DISPATCHED';
}

export interface FlaggedSealAlert {
  id: number;
  sealNumber: string;
  associatedBatchNumber?: string;
  flaggedReason: string;
  flaggedAt: string;
  attemptedAction: string;
  reportedBy: string;
}
