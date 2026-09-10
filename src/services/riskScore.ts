import { Dispute, ReturnRequest, PickupConfirmation, RiskScore } from '../types/pharmachain';

/**
 * Calculates risk score (0 - 100) based on:
 * - Number of past disputes (weight 40%)
 * - Number of late confirmations (weight 25%)
 * - Ratio of disputed-to-total transactions (weight 35%)
 */
export function calculateRiskScore(
  entityId: number,
  entityName: string,
  entityType: 'RETAILER' | 'DISTRIBUTOR',
  disputes: Dispute[],
  returnRequests: ReturnRequest[],
  pickupConfirmations: PickupConfirmation[]
): RiskScore {
  let relevantDisputesCount = 0;
  let totalTransactions = 0;
  let lateConfirmations = 0;

  if (entityType === 'RETAILER') {
    const retailerReturns = returnRequests.filter((r) => r.retailerId === entityId);
    totalTransactions = Math.max(retailerReturns.length, 1);

    const retailerBatches = new Set(retailerReturns.map((r) => r.batchNumber));
    relevantDisputesCount = disputes.filter((d) => retailerBatches.has(d.batchNumber)).length;
  } else {
    const distPickups = pickupConfirmations.filter((p) => p.distributorId === entityId);
    totalTransactions = Math.max(distPickups.length, 1);

    const distBatches = new Set(distPickups.map((p) => p.batchNumberScanned));
    relevantDisputesCount = disputes.filter((d) => distBatches.has(d.batchNumber)).length;
    
    // Simulate late confirmations check (confirmation > 48 hours after request)
    lateConfirmations = distPickups.filter((p) => {
      const relatedReq = returnRequests.find((r) => r.id === p.returnRequestId);
      if (!relatedReq) return false;
      const diffHours = (new Date(p.confirmedAt).getTime() - new Date(relatedReq.initiatedAt).getTime()) / (1000 * 60 * 60);
      return diffHours > 48;
    }).length;
  }

  const disputeRatio = Math.min(relevantDisputesCount / totalTransactions, 1);

  // Formula calculation (scale 0 - 100)
  // Dispute volume penalty: up to 40 pts
  const disputeVolumeScore = Math.min(relevantDisputesCount * 15, 40);
  // Late confirmation penalty: up to 25 pts
  const lateScore = Math.min(lateConfirmations * 12.5, 25);
  // Disputed ratio penalty: up to 35 pts
  const ratioScore = disputeRatio * 35;

  const rawScore = Math.round(disputeVolumeScore + lateScore + ratioScore);
  const calculatedScore = Math.min(Math.max(rawScore, 5), 100); // minimum 5 baseline

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (calculatedScore >= 60) {
    riskLevel = 'HIGH';
  } else if (calculatedScore >= 30) {
    riskLevel = 'MEDIUM';
  }

  return {
    entityId,
    entityName,
    entityType,
    disputeCount: relevantDisputesCount,
    lateConfirmationCount: lateConfirmations,
    totalTransactions,
    disputedRatio: parseFloat((disputeRatio * 100).toFixed(1)),
    calculatedScore,
    riskLevel,
  };
}
