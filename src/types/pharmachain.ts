export type Role = 'RETAILER' | 'DISTRIBUTOR' | 'MANUFACTURER' | 'WASTE_FACILITY' | 'REGULATOR';

export type BatchStatus = 
  | 'MANUFACTURED' 
  | 'ACTIVE' 
  | 'RETURN_INITIATED' 
  | 'DISTRIBUTOR_CONFIRMED' 
  | 'DISPUTED' 
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
  confirmedQuantity: number;
  confirmedWeightKg: number;
  batchNumberScanned: string;
  confirmedAt: string;
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
