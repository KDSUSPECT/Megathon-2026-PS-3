import {
  User,
  Retailer,
  Distributor,
  Manufacturer,
  WasteFacility,
  Regulator,
  ProductionRecord,
  Batch,
  ReturnRequest,
  PickupConfirmation,
  Dispute,
  DestructionCertificate,
  ReEntryAlert,
  LedgerEntry,
} from '../types/pharmachain';
import { buildLedgerEntry, GENESIS_HASH } from '../services/crypto';

// The 5 Sample Users corresponding to the 5 system roles
export const SEEDED_USERS: User[] = [
  {
    id: 1,
    username: 'apollo_pharmacy',
    role: 'RETAILER',
    linkedEntityId: 1,
    fullName: 'Retailer (Apollo Pharmacy)',
    entityName: 'Apollo Medicos #402',
    licenseNumber: 'DL-2024-RET-88129',
    pin: '8812',
    email: 'apollo402@pharmachain.in',
  },
  {
    id: 2,
    username: 'medilogix_logistics',
    role: 'DISTRIBUTOR',
    linkedEntityId: 1,
    fullName: 'Distributor (Medilogix Logistics)',
    entityName: 'Medilogix Logistics Hub',
    licenseNumber: 'DL-2023-DIS-33014',
    pin: '3301',
    email: 'dock@medilogix.in',
  },
  {
    id: 3,
    username: 'sun_pharma',
    role: 'MANUFACTURER',
    linkedEntityId: 1,
    fullName: 'Manufacturer (Sun Pharma)',
    entityName: 'Sun Pharma Baddi Unit III',
    licenseNumber: 'MFG-2022-IND-00412',
    pin: '0041',
    email: 'compliance@sunpharma-baddi.in',
  },
  {
    id: 4,
    username: 'cleaneco_waste',
    role: 'WASTE_FACILITY',
    linkedEntityId: 1,
    fullName: 'Waste Facility (CleanEco Waste)',
    entityName: 'CleanEco Hazardous Incinerator',
    licenseNumber: 'CPCB-HAZ-2024-887',
    pin: '2024',
    email: 'operations@cleaneco.in',
  },
  {
    id: 5,
    username: 'dr_verma_cdsco',
    role: 'REGULATOR',
    linkedEntityId: 1,
    fullName: 'Regulator (Dr. Verma CDSCO)',
    entityName: 'Dr. R.K. Verma (CDSCO Enforcement)',
    licenseNumber: 'CDSCO-WZ-REG-01',
    pin: '9999',
    email: 'rk.verma@cdsco.gov.in',
  },
  // Aliases for backwards compatibility
  {
    id: 6,
    username: 'retailer.apollo',
    role: 'RETAILER',
    linkedEntityId: 1,
    fullName: 'Retailer (Apollo Pharmacy)',
    entityName: 'Apollo Medicos #402',
    licenseNumber: 'DL-2024-RET-88129',
    pin: '8812',
    email: 'apollo402@pharmachain.in',
  },
  {
    id: 7,
    username: 'distributor.medlink',
    role: 'DISTRIBUTOR',
    linkedEntityId: 1,
    fullName: 'Distributor (Medilogix Logistics)',
    entityName: 'Medilogix Logistics Hub',
    licenseNumber: 'DL-2023-DIS-33014',
    pin: '3301',
    email: 'dock@medilogix.in',
  },
  {
    id: 8,
    username: 'mfr.cipla',
    role: 'MANUFACTURER',
    linkedEntityId: 1,
    fullName: 'Manufacturer (Sun Pharma)',
    entityName: 'Sun Pharma Baddi Unit III',
    licenseNumber: 'MFG-2022-IND-00412',
    pin: '0041',
    email: 'compliance@sunpharma-baddi.in',
  },
  {
    id: 9,
    username: 'waste.greenearth',
    role: 'WASTE_FACILITY',
    linkedEntityId: 1,
    fullName: 'Waste Facility (CleanEco Waste)',
    entityName: 'CleanEco Hazardous Incinerator',
    licenseNumber: 'CPCB-HAZ-2024-887',
    pin: '2024',
    email: 'operations@cleaneco.in',
  },
  {
    id: 10,
    username: 'regulator.cdsco',
    role: 'REGULATOR',
    linkedEntityId: 1,
    fullName: 'Regulator (Dr. Verma CDSCO)',
    entityName: 'Dr. R.K. Verma (CDSCO Enforcement)',
    licenseNumber: 'CDSCO-WZ-REG-01',
    pin: '9999',
    email: 'rk.verma@cdsco.gov.in',
  },
];

export const SEEDED_RETAILER: Retailer = {
  id: 1,
  name: 'Apollo Medicos #402',
  licenseNumber: 'DL-2024-RET-88129',
  contactEmail: 'apollo402@pharmachain.in',
  location: 'Connaught Place & South Ext, New Delhi DL 110001',
  createdAt: '2025-01-10T09:00:00Z',
};

export const SEEDED_DISTRIBUTOR: Distributor = {
  id: 1,
  name: 'Medilogix Logistics Hub',
  licenseNumber: 'DL-2023-DIS-33014',
  contactEmail: 'dock@medilogix.in',
  mappedRetailerIds: [1],
  createdAt: '2024-11-15T11:30:00Z',
};

export const SEEDED_MANUFACTURER: Manufacturer = {
  id: 1,
  name: 'Sun Pharma Baddi Unit III',
  licenseNumber: 'MFG-2022-IND-00412',
  contactEmail: 'compliance@sunpharma-baddi.in',
  createdAt: '2023-04-01T08:00:00Z',
};

export const SEEDED_WASTE_FACILITY: WasteFacility = {
  id: 1,
  name: 'CleanEco Hazardous Incinerator',
  licenseNumber: 'CPCB-HAZ-2024-887',
  contactEmail: 'operations@cleaneco.in',
  authorizationCertNumber: 'CPCB-HAZ-2024-887',
  createdAt: '2024-02-18T10:00:00Z',
};

export const SEEDED_REGULATOR: Regulator = {
  id: 1,
  name: 'CDSCO Western Zone Drug Regulatory Directorate',
  licenseNumber: 'CDSCO-WZ-REG-01',
  contactEmail: 'rk.verma@cdsco.gov.in',
  createdAt: '2022-01-01T00:00:00Z',
};

// Known demo batch that is officially DESTROYED.
// In the presentation, scanning this batch tests and proves Re-Entry Fraud detection!
export const DEMO_KNOWN_DESTROYED_BATCH = 'PHARMA-DEST-8891';

export const SEEDED_PRODUCTION_RECORDS: ProductionRecord[] = [
  {
    id: 1,
    batchNumber: 'BATCH-2024-RET-204',
    drugName: 'Pantoprazole Gastro-Resistant 40mg',
    dosageForm: 'Enteric Coated Tablet',
    unitDose: '40 mg',
    quantityProduced: 25000,
    manufacturingDate: '2024-05-10',
    expiryDate: '2026-05-10',
    manufacturerLicense: 'MFG-2022-IND-00412',
  },
  {
    id: 2,
    batchNumber: 'BATCH-2024-DISP-305',
    drugName: 'Insulin Glargine 100 IU/ml Cartridge',
    dosageForm: 'Subcutaneous Solution',
    unitDose: '100 IU/ml',
    quantityProduced: 10000,
    manufacturingDate: '2024-03-15',
    expiryDate: '2025-09-15',
    manufacturerLicense: 'MFG-2022-IND-00412',
  },
  {
    id: 3,
    batchNumber: 'BATCH-2024-CONF-406',
    drugName: 'Ceftriaxone 1g Injection (Monocef)',
    dosageForm: 'Ceftriaxone Sodium Sterile IP',
    unitDose: '1000 mg',
    quantityProduced: 20000,
    manufacturingDate: '2024-06-20',
    expiryDate: '2026-06-20',
    manufacturerLicense: 'MFG-2022-IND-00412',
  },
  {
    id: 4,
    batchNumber: 'BATCH-2024-DEST-881',
    drugName: 'Amoxicillin + Potassium Clavulanate 625mg',
    dosageForm: 'Strip of 10 Tablets',
    unitDose: '625 mg',
    quantityProduced: 15000,
    manufacturingDate: '2024-01-10',
    expiryDate: '2025-07-10',
    manufacturerLicense: 'MFG-2022-IND-00412',
  },
  {
    id: 5,
    batchNumber: 'BATCH-CDSCO-2024-9981',
    drugName: 'Meropenem 1g IV Infusion Vials',
    dosageForm: 'Sterile Powder for Injection',
    unitDose: '1000 mg',
    quantityProduced: 8000,
    manufacturingDate: '2023-11-05',
    expiryDate: '2025-05-05',
    manufacturerLicense: 'MFG-2022-IND-00412',
  },
  {
    id: 6,
    batchNumber: 'AZI-500-2026A',
    drugName: 'Azithromycin 500mg Tablets',
    dosageForm: 'Oral Tablet',
    unitDose: '500 mg',
    quantityProduced: 50000,
    manufacturingDate: '2026-01-15',
    expiryDate: '2027-01-15', // > 60 days
    manufacturerLicense: 'MFG-2022-IND-00412',
  },
  {
    id: 7,
    batchNumber: 'MET-850-2026B',
    drugName: 'Metformin Hydrochloride 850mg',
    dosageForm: 'Extended Release Tablet',
    unitDose: '850 mg',
    quantityProduced: 40000,
    manufacturingDate: '2025-06-10',
    expiryDate: '2026-10-05', // ~25 days (Yellow warning: 3-60 days)
    manufacturerLicense: 'MFG-2022-IND-00412',
  },
  {
    id: 8,
    batchNumber: 'PAR-650-2026C',
    drugName: 'Paracetamol 650mg Fast-Action',
    dosageForm: 'Film Coated Tablet',
    unitDose: '650 mg',
    quantityProduced: 60000,
    manufacturingDate: '2025-03-01',
    expiryDate: '2026-09-12', // < 3 days critical! (Red alert)
    manufacturerLicense: 'MFG-2022-IND-00412',
  },
  {
    id: 9,
    batchNumber: DEMO_KNOWN_DESTROYED_BATCH,
    drugName: 'Amoxicillin + Potassium Clavulanate 625mg',
    dosageForm: 'Strip of 10 Tablets',
    unitDose: '625 mg',
    quantityProduced: 15000,
    manufacturingDate: '2024-02-01',
    expiryDate: '2025-08-01', // Expired & Destroyed
    manufacturerLicense: 'MFG-2022-IND-00412',
  },
];

export const SEEDED_BATCHES: Batch[] = [
  {
    id: 1,
    batchNumber: 'BATCH-2024-RET-204',
    drugName: 'Pantoprazole 40mg (Pan-D Gastro)',
    formulaName: 'Pantoprazole Gastro-Resistant 40mg',
    manufacturingDate: '2024-05-10',
    expiryDate: '2026-05-10',
    currentStatus: 'RETURN_INITIATED',
    currentHolderRole: 'DISTRIBUTOR',
    currentHolderName: 'Medilogix Logistics Hub',
    unitsCount: 500,
    unitPrice: 95.0,
    productionRecordId: 1,
  },
  {
    id: 2,
    batchNumber: 'BATCH-2024-DISP-305',
    drugName: 'Insulin Glargine 100 IU/ml (Lantus Cartridges)',
    formulaName: 'Insulin Glargine 100 IU/ml Solution',
    manufacturingDate: '2024-03-15',
    expiryDate: '2025-09-15',
    currentStatus: 'DISPUTED',
    currentHolderRole: 'DISTRIBUTOR',
    currentHolderName: 'Medilogix Logistics Hub',
    unitsCount: 1000,
    unitPrice: 650.0,
    productionRecordId: 2,
  },
  {
    id: 3,
    batchNumber: 'BATCH-2024-CONF-406',
    drugName: 'Ceftriaxone 1g Injection (Monocef)',
    formulaName: 'Ceftriaxone Sodium Sterile IP',
    manufacturingDate: '2024-06-20',
    expiryDate: '2026-06-20',
    currentStatus: 'DISTRIBUTOR_CONFIRMED',
    currentHolderRole: 'DISTRIBUTOR',
    currentHolderName: 'Medilogix Logistics Hub',
    unitsCount: 800,
    unitPrice: 120.0,
    productionRecordId: 3,
    qcAssayResult: 'Assay: 98.0% (PASS)',
  },
  {
    id: 4,
    batchNumber: 'BATCH-2024-DEST-881',
    drugName: 'Amoxicillin + Clavulanate 625mg (Augmentin)',
    formulaName: 'Amoxicillin Trihydrate & Potassium Clavulanate',
    manufacturingDate: '2024-01-10',
    expiryDate: '2025-07-10',
    currentStatus: 'DESTROYED',
    currentHolderRole: 'WASTE_FACILITY',
    currentHolderName: 'CleanEco Hazardous Incinerator',
    unitsCount: 1500,
    unitPrice: 185.0,
    productionRecordId: 4,
  },
  {
    id: 5,
    batchNumber: 'BATCH-CDSCO-2024-9981',
    drugName: 'Meropenem 1g IV Infusion Vials',
    formulaName: 'Meropenem Sterile USP',
    manufacturingDate: '2023-11-05',
    expiryDate: '2025-05-05',
    currentStatus: 'DESTROYED',
    currentHolderRole: 'WASTE_FACILITY',
    currentHolderName: 'CleanEco Hazardous Incinerator',
    unitsCount: 300,
    unitPrice: 850.0,
    productionRecordId: 5,
  },
  {
    id: 6,
    batchNumber: 'AZI-500-2026A',
    drugName: 'Azithromycin 500mg Tablets',
    formulaName: 'Azithromycin Dihydrate IP',
    manufacturingDate: '2026-01-15',
    expiryDate: '2027-01-15',
    currentStatus: 'ACTIVE',
    currentHolderRole: 'RETAILER',
    currentHolderName: 'Apollo Medicos #402',
    unitsCount: 1200,
    unitPrice: 145.0,
    productionRecordId: 6,
  },
  {
    id: 7,
    batchNumber: 'MET-850-2026B',
    drugName: 'Metformin Hydrochloride 850mg',
    formulaName: 'Metformin HCl Prolonged Release',
    manufacturingDate: '2025-06-10',
    expiryDate: '2026-10-05',
    currentStatus: 'ACTIVE',
    currentHolderRole: 'RETAILER',
    currentHolderName: 'Apollo Medicos #402',
    unitsCount: 850,
    unitPrice: 62.5,
    productionRecordId: 7,
  },
  {
    id: 8,
    batchNumber: 'PAR-650-2026C',
    drugName: 'Paracetamol 650mg Fast-Action',
    formulaName: 'Paracetamol Fast-Release IP',
    manufacturingDate: '2025-03-01',
    expiryDate: '2026-09-12', // Urgent: ≤3d expiry!
    currentStatus: 'ACTIVE',
    currentHolderRole: 'RETAILER',
    currentHolderName: 'Apollo Medicos #402',
    unitsCount: 600,
    unitPrice: 32.0,
    productionRecordId: 8,
  },
  {
    id: 9,
    batchNumber: DEMO_KNOWN_DESTROYED_BATCH,
    drugName: 'Amoxicillin + Potassium Clavulanate 625mg',
    formulaName: 'Amox-Clav 625mg Oral Formulation',
    manufacturingDate: '2024-02-01',
    expiryDate: '2025-08-01',
    currentStatus: 'DESTROYED',
    currentHolderRole: 'WASTE_FACILITY',
    currentHolderName: 'CleanEco Hazardous Incinerator',
    unitsCount: 1000,
    unitPrice: 220.0,
    productionRecordId: 9,
  },
];

export const SEEDED_RETURN_REQUESTS: ReturnRequest[] = [
  {
    id: 1,
    batchNumber: 'BATCH-2024-RET-204',
    retailerId: 1,
    retailerName: 'Apollo Medicos #402',
    originPharmacyLicense: 'DL-2024-RET-88129',
    claimedQuantity: 500,
    conditionNotes: 'All 500 strips intact in tamper-evident sealed crate. Original carton barcodes verified.',
    photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    status: 'PENDING',
    initiatedAt: '2026-09-08T14:30:00Z',
  },
  {
    id: 2,
    batchNumber: 'BATCH-2024-DISP-305',
    retailerId: 1,
    retailerName: 'Apollo Medicos #402',
    originPharmacyLicense: 'DL-2024-RET-88129',
    claimedQuantity: 1000,
    conditionNotes: 'Cold-chain expired insulin cartridges. Packed in thermal dry-ice shipper.',
    status: 'DISPUTED',
    initiatedAt: '2026-08-25T16:00:00Z',
  },
  {
    id: 3,
    batchNumber: 'BATCH-2024-CONF-406',
    retailerId: 1,
    retailerName: 'Apollo Medicos #402',
    originPharmacyLicense: 'DL-2024-RET-88129',
    claimedQuantity: 800,
    conditionNotes: 'Standard expired cartons, unblemished outer packaging.',
    status: 'CONFIRMED',
    initiatedAt: '2026-09-01T10:15:00Z',
  },
  {
    id: 4,
    batchNumber: 'BATCH-2024-DEST-881',
    retailerId: 1,
    retailerName: 'Apollo Medicos #402',
    originPharmacyLicense: 'DL-2024-RET-88129',
    claimedQuantity: 1500,
    conditionNotes: 'Bulk tablets expired, returned in original manufacturer outer shipper.',
    status: 'CONFIRMED',
    initiatedAt: '2026-08-10T11:00:00Z',
  },
  {
    id: 5,
    batchNumber: 'BATCH-CDSCO-2024-9981',
    retailerId: 1,
    retailerName: 'Apollo Medicos #402',
    originPharmacyLicense: 'DL-2024-RET-88129',
    claimedQuantity: 300,
    conditionNotes: 'Expired hospital supply vials. Returned for safe destruction.',
    status: 'CONFIRMED',
    initiatedAt: '2026-08-01T09:30:00Z',
  },
];

export const SEEDED_PICKUP_CONFIRMATIONS: PickupConfirmation[] = [
  {
    id: 1,
    returnRequestId: 2,
    distributorId: 1,
    distributorName: 'Medilogix Logistics Hub',
    confirmedQuantity: 850, // Claimed was 1000! Created 150 discrepancy dispute
    confirmedWeightKg: 18.2,
    batchNumberScanned: 'BATCH-2024-DISP-305',
    confirmedAt: '2026-08-27T11:10:00Z',
  },
  {
    id: 2,
    returnRequestId: 3,
    distributorId: 1,
    distributorName: 'Medilogix Logistics Hub',
    confirmedQuantity: 800,
    confirmedWeightKg: 16.0,
    batchNumberScanned: 'BATCH-2024-CONF-406',
    confirmedAt: '2026-09-02T13:45:00Z',
  },
  {
    id: 3,
    returnRequestId: 4,
    distributorId: 1,
    distributorName: 'Medilogix Logistics Hub',
    confirmedQuantity: 1500,
    confirmedWeightKg: 35.0,
    batchNumberScanned: 'BATCH-2024-DEST-881',
    confirmedAt: '2026-08-15T15:20:00Z',
  },
  {
    id: 4,
    returnRequestId: 5,
    distributorId: 1,
    distributorName: 'Medilogix Logistics Hub',
    confirmedQuantity: 300,
    confirmedWeightKg: 8.5,
    batchNumberScanned: 'BATCH-CDSCO-2024-9981',
    confirmedAt: '2026-08-05T14:10:00Z',
  },
];

export const SEEDED_DISPUTES: Dispute[] = [
  {
    id: 1,
    batchNumber: 'BATCH-2024-DISP-305',
    originPharmacy: 'Apollo Medicos #402',
    originPharmacyLicense: 'DL-2024-RET-88129',
    retailerClaimedQty: 1000,
    distributorConfirmedQty: 850,
    status: 'OPEN',
    disputeType: 'QUANTITY_MISMATCH',
    resolutionNotes: 'Under joint investigation: 150 vials missing between Apollo dispatch and Medilogix cold warehouse receipt.',
    raisedAt: '2026-08-27T11:10:00Z',
  },
  {
    id: 2,
    batchNumber: 'INS-GLAR-2025H',
    originPharmacy: 'Apollo Medicos #402',
    originPharmacyLicense: 'DL-2024-RET-88129',
    retailerClaimedQty: 500,
    distributorConfirmedQty: 420,
    status: 'RESOLVED',
    disputeType: 'RECONCILIATION_MISMATCH',
    resolutionNotes: 'Resolved by CDSCO Regional Officer: 80 units were verified broken in transit and incinerated at intermediate depot with photo evidence.',
    raisedAt: '2025-09-20T09:00:00Z',
    resolvedAt: '2025-09-22T17:00:00Z',
  },
];

export const SEEDED_DESTRUCTION_CERTIFICATES: DestructionCertificate[] = [
  {
    id: 1,
    batchNumber: 'BATCH-2024-DEST-881',
    manifestNumber: '#CPCB-HAZ-2024-0012',
    wasteFacilityId: 1,
    facilityName: 'CleanEco Hazardous Incinerator',
    facilityLicense: 'CPCB-HAZ-2024-887',
    disposalDate: '2026-09-01',
    certificateFileUrl: 'https://pharmachain.in/certificates/CERT-2026-CPCB-0012.pdf',
    certificateHash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    disposalMethod: 'HIGH_TEMP_INCINERATION',
    destructionMethod: 'HIGH_TEMP_INCINERATION',
    recordedDisposedQty: 1500,
    destroyedQuantity: 1500,
    issuedAt: '2026-09-01T17:30:00Z',
  },
  {
    id: 2,
    batchNumber: 'BATCH-CDSCO-2024-9981',
    manifestNumber: '#CPCB-HAZ-2024-0089',
    wasteFacilityId: 1,
    facilityName: 'CleanEco Hazardous Incinerator',
    facilityLicense: 'CPCB-HAZ-2024-887',
    disposalDate: '2026-08-15',
    certificateFileUrl: 'https://pharmachain.in/certificates/CERT-2026-CPCB-0089.pdf',
    certificateHash: '1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e',
    disposalMethod: 'HIGH_TEMP_INCINERATION',
    destructionMethod: 'HIGH_TEMP_INCINERATION',
    recordedDisposedQty: 300,
    destroyedQuantity: 300,
    issuedAt: '2026-08-15T16:45:00Z',
  },
  {
    id: 3,
    batchNumber: DEMO_KNOWN_DESTROYED_BATCH,
    manifestNumber: '#CPCB-HAZ-2025-8891',
    wasteFacilityId: 1,
    facilityName: 'CleanEco Hazardous Incinerator',
    facilityLicense: 'CPCB-HAZ-2024-887',
    disposalDate: '2025-08-25',
    certificateFileUrl: 'https://pharmachain.in/certificates/CERT-2025-WST-8891.pdf',
    certificateHash: '4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
    disposalMethod: 'High-Temperature Hazardous Incineration (1200°C) with Flue Gas Scrubbing',
    destructionMethod: 'HIGH_TEMP_INCINERATION',
    recordedDisposedQty: 1000,
    destroyedQuantity: 1000,
    issuedAt: '2025-08-25T17:30:00Z',
  },
];

export const SEEDED_REENTRY_ALERTS: ReEntryAlert[] = [
  {
    id: 1,
    batchNumber: 'INS-GLAR-2025H',
    scannedAtRetailerId: 1,
    scannedAtRetailerName: 'Apollo Pharmacy #402',
    scannedAt: '2025-10-04T12:14:22Z',
    alertStatus: 'CONFIRMED_FRAUD',
    notes: 'Retailer attempted to scan destroyed batch for inventory replenishment. Stock confiscated by CDSCO Flying Squad.',
  },
];

// Pre-build verified cryptographic hash chain entries for batches
export function generateInitialLedger(): LedgerEntry[] {
  const ledger: LedgerEntry[] = [];
  let idCounter = 1;

  // Batch 1: AZI-500-2026A
  const b1_1 = buildLedgerEntry(
    idCounter++,
    'AZI-500-2026A',
    'BATCH_CREATED',
    { mfr: 'Cipla Therapeutics', license: 'MH-MFG-2021-009', qty: 50000, drug: 'Azithromycin 500mg' },
    GENESIS_HASH,
    '2026-01-15T08:00:00Z'
  );
  ledger.push(b1_1);

  const b1_2 = buildLedgerEntry(
    idCounter++,
    'AZI-500-2026A',
    'STATUS_TRANSITION',
    { from: 'MANUFACTURED', to: 'ACTIVE', holder: 'Apollo Pharmacy #402', unitsAllocated: 1200 },
    b1_1.currentHash,
    '2026-01-18T10:00:00Z'
  );
  ledger.push(b1_2);

  // Batch 4: PNT-40-2026D
  const b4_1 = buildLedgerEntry(
    idCounter++,
    'PNT-40-2026D',
    'BATCH_CREATED',
    { mfr: 'Cipla Therapeutics', qty: 25000, drug: 'Pantoprazole 40mg' },
    GENESIS_HASH,
    '2025-08-20T08:00:00Z'
  );
  ledger.push(b4_1);

  const b4_2 = buildLedgerEntry(
    idCounter++,
    'PNT-40-2026D',
    'RETURN_REQUESTED',
    { retailer: 'Apollo Pharmacy #402', claimedQty: 450, reason: 'Approaching expiry' },
    b4_1.currentHash,
    '2026-09-08T14:30:00Z'
  );
  ledger.push(b4_2);

  // Batch 6: ATOR-20-2026F (Disputed)
  const b6_1 = buildLedgerEntry(
    idCounter++,
    'ATOR-20-2026F',
    'BATCH_CREATED',
    { mfr: 'Cipla Therapeutics', qty: 35000, drug: 'Atorvastatin 20mg' },
    GENESIS_HASH,
    '2025-02-12T09:00:00Z'
  );
  ledger.push(b6_1);

  const b6_2 = buildLedgerEntry(
    idCounter++,
    'ATOR-20-2026F',
    'RETURN_REQUESTED',
    { retailer: 'Apollo Pharmacy #402', claimedQty: 500 },
    b6_1.currentHash,
    '2026-08-25T16:00:00Z'
  );
  ledger.push(b6_2);

  const b6_3 = buildLedgerEntry(
    idCounter++,
    'ATOR-20-2026F',
    'DISPUTE_RAISED',
    { claimedQty: 500, confirmedQty: 420, deficit: 80, distributor: 'MedLink Logistics' },
    b6_2.currentHash,
    '2026-08-27T11:10:00Z'
  );
  ledger.push(b6_3);

  // Batch 8: PHARMA-DEST-8891 (Fully Destroyed lifecycle)
  const b8_1 = buildLedgerEntry(
    idCounter++,
    DEMO_KNOWN_DESTROYED_BATCH,
    'BATCH_CREATED',
    { mfr: 'Cipla Therapeutics', qty: 15000, drug: 'Amoxicillin + Clavulanate 625mg' },
    GENESIS_HASH,
    '2024-02-01T08:00:00Z'
  );
  ledger.push(b8_1);

  const b8_2 = buildLedgerEntry(
    idCounter++,
    DEMO_KNOWN_DESTROYED_BATCH,
    'RETURN_REQUESTED',
    { retailer: 'Apollo Pharmacy #402', claimedQty: 1000 },
    b8_1.currentHash,
    '2025-08-10T11:00:00Z'
  );
  ledger.push(b8_2);

  const b8_3 = buildLedgerEntry(
    idCounter++,
    DEMO_KNOWN_DESTROYED_BATCH,
    'PICKUP_CONFIRMED',
    { distributor: 'MedLink Logistics', confirmedQty: 1000, weightKg: 28.0 },
    b8_2.currentHash,
    '2025-08-12T15:20:00Z'
  );
  ledger.push(b8_3);

  const b8_4 = buildLedgerEntry(
    idCounter++,
    DEMO_KNOWN_DESTROYED_BATCH,
    'DISPOSAL_SCHEDULED',
    { targetFacility: 'GreenEarth Bio-Destruction', scheduledDate: '2025-08-25' },
    b8_3.currentHash,
    '2025-08-15T09:00:00Z'
  );
  ledger.push(b8_4);

  const b8_5 = buildLedgerEntry(
    idCounter++,
    DEMO_KNOWN_DESTROYED_BATCH,
    'CERTIFICATE_ISSUED',
    {
      facility: 'GreenEarth Bio-Destruction',
      certId: 'CERT-2025-WST-8891',
      method: 'High-Temperature Hazardous Incineration (1200°C)',
      disposedQty: 1000,
    },
    b8_4.currentHash,
    '2025-08-25T17:30:00Z'
  );
  ledger.push(b8_5);

  // Batch BATCH-2024-RET-204
  const ret_1 = buildLedgerEntry(
    idCounter++,
    'BATCH-2024-RET-204',
    'BATCH_CREATED',
    { mfr: 'Sun Pharma Baddi Unit III', license: 'MFG-2022-IND-00412', qty: 25000, drug: 'Pantoprazole 40mg (Pan-D Gastro)' },
    GENESIS_HASH,
    '2024-05-10T08:00:00Z'
  );
  ledger.push(ret_1);

  const ret_2 = buildLedgerEntry(
    idCounter++,
    'BATCH-2024-RET-204',
    'RETURN_REQUESTED',
    { retailer: 'Apollo Medicos #402', claimedQty: 500, notes: 'Tamper-evident sealed crate' },
    ret_1.currentHash,
    '2026-09-08T14:30:00Z'
  );
  ledger.push(ret_2);

  // Batch BATCH-2024-DISP-305 (Disputed)
  const disp_1 = buildLedgerEntry(
    idCounter++,
    'BATCH-2024-DISP-305',
    'BATCH_CREATED',
    { mfr: 'Sun Pharma Baddi Unit III', qty: 10000, drug: 'Insulin Glargine 100 IU/ml' },
    GENESIS_HASH,
    '2024-03-15T08:00:00Z'
  );
  ledger.push(disp_1);

  const disp_2 = buildLedgerEntry(
    idCounter++,
    'BATCH-2024-DISP-305',
    'RETURN_REQUESTED',
    { retailer: 'Apollo Medicos #402', claimedQty: 1000 },
    disp_1.currentHash,
    '2026-08-25T16:00:00Z'
  );
  ledger.push(disp_2);

  const disp_3 = buildLedgerEntry(
    idCounter++,
    'BATCH-2024-DISP-305',
    'DISPUTE_RAISED',
    { claimedQty: 1000, confirmedQty: 850, deficit: 150, distributor: 'Medilogix Logistics Hub' },
    disp_2.currentHash,
    '2026-08-27T11:10:00Z'
  );
  ledger.push(disp_3);

  // Batch BATCH-2024-CONF-406 (Distributor Confirmed)
  const conf_1 = buildLedgerEntry(
    idCounter++,
    'BATCH-2024-CONF-406',
    'BATCH_CREATED',
    { mfr: 'Sun Pharma Baddi Unit III', qty: 20000, drug: 'Ceftriaxone 1g Injection (Monocef)', assayPass: true },
    GENESIS_HASH,
    '2024-06-20T08:00:00Z'
  );
  ledger.push(conf_1);

  const conf_2 = buildLedgerEntry(
    idCounter++,
    'BATCH-2024-CONF-406',
    'RETURN_REQUESTED',
    { retailer: 'Apollo Medicos #402', claimedQty: 800 },
    conf_1.currentHash,
    '2026-09-01T10:15:00Z'
  );
  ledger.push(conf_2);

  const conf_3 = buildLedgerEntry(
    idCounter++,
    'BATCH-2024-CONF-406',
    'PICKUP_CONFIRMED',
    { distributor: 'Medilogix Logistics Hub', confirmedQty: 800, weightKg: 16.0 },
    conf_2.currentHash,
    '2026-09-02T13:45:00Z'
  );
  ledger.push(conf_3);

  // Batch BATCH-2024-DEST-881 (Destroyed)
  const dest_1 = buildLedgerEntry(
    idCounter++,
    'BATCH-2024-DEST-881',
    'BATCH_CREATED',
    { mfr: 'Sun Pharma Baddi Unit III', qty: 15000, drug: 'Amoxicillin + Clavulanate 625mg' },
    GENESIS_HASH,
    '2024-01-10T08:00:00Z'
  );
  ledger.push(dest_1);

  const dest_2 = buildLedgerEntry(
    idCounter++,
    'BATCH-2024-DEST-881',
    'CERTIFICATE_ISSUED',
    {
      facility: 'CleanEco Hazardous Incinerator',
      manifest: '#CPCB-HAZ-2024-0012',
      method: 'HIGH_TEMP_INCINERATION',
      disposedQty: 1500,
    },
    dest_1.currentHash,
    '2026-09-01T17:30:00Z'
  );
  ledger.push(dest_2);

  // Batch BATCH-CDSCO-2024-9981 (Destroyed)
  const cdsco_1 = buildLedgerEntry(
    idCounter++,
    'BATCH-CDSCO-2024-9981',
    'BATCH_CREATED',
    { mfr: 'Sun Pharma Baddi Unit III', qty: 8000, drug: 'Meropenem 1g IV Infusion Vials' },
    GENESIS_HASH,
    '2023-11-05T08:00:00Z'
  );
  ledger.push(cdsco_1);

  const cdsco_2 = buildLedgerEntry(
    idCounter++,
    'BATCH-CDSCO-2024-9981',
    'CERTIFICATE_ISSUED',
    {
      facility: 'CleanEco Hazardous Incinerator',
      manifest: '#CPCB-HAZ-2024-0089',
      method: 'HIGH_TEMP_INCINERATION',
      disposedQty: 300,
    },
    cdsco_1.currentHash,
    '2026-08-15T16:45:00Z'
  );
  ledger.push(cdsco_2);

  return ledger;
}
