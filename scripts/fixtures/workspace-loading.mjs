// Synthetic GET responses only. No captured customer/provider payloads.
export const id = '11111111-1111-4111-8111-111111111111';
export const rid = '22222222-2222-4222-8222-222222222222';
export const qid = '33333333-3333-4333-8333-333333333333';
export const cid = '44444444-4444-4444-8444-444444444444';
export const stamp = '2026-10-29T12:00:00Z';
export const user = { id, email: 'fixture@example.test', firstName: 'Comercial', lastName: null, profilePictureUrl: null, isActive: true, role: 'USER' };
export const project = { id, clientId: cid, code: 'IV-PRUEBA', name: 'Proyecto de prueba', location: 'Bogota', isActive: true, createdAtUtc: stamp, updatedAtUtc: stamp };
export const client = { id: cid, clientType: 'Person', legalName: 'Cliente de prueba', tradeName: null, email: null, phone: null, city: null };
const item = {
  itemId: 'item-1', reference: 'V-01', sequence: 1, description: 'Ventana de prueba',
  isIncluded: true, source: 'AI_EXTRACTED', effectiveWidthMm: 1200, effectiveHeightMm: 1500,
  effectiveQuantity: 2, areaM2: 1.8, quantitySource: 'EXTRACTED', quantityExtractionStatus: null,
  quantityExtractionConfidence: null, effectiveLocation: 'Sala de prueba',
  extractedItemId: 'extracted-1', elementId: null, elementType: 'Ventana', quantity: 2, widthMm: 1200, heightMm: 1500,
  manualQuantityOverride: null, manualWidthMmOverride: null, manualHeightMmOverride: null,
  excludedAtUtc: null, excludedByUserId: null, exclusionReason: null, extractionConfidence: null, extractionStatus: null,
  manualNote: null, manualObservation: null, suggested: { system: null, glass: null, finish: null }, selected: null,
  selectionState: 'UNCONFIRMED', alternatives: { systems: [], glass: [], finishes: [] },
  confidence: { overall: 0, system: 0, glass: 0, finish: 0 }, requiresReview: false, reviewReasons: [],
  systemResolutionReasons: [], glassResolutionReasons: [], finishResolutionReasons: [], isTechnicallyComplete: true, isPriceable: true,
  readiness: { state: 'READY', blockingCount: 0, warningCount: 0, pendingDefinitions: [] },
  historicalEvidence: { status: 'NO_COMPARABLES', supportCount: 0, bestSimilarity: null, averageSimilarity: null, examples: [] },
  visualModel: null, trace: { functionalType: 'Ventana', requestedSystemRaw: null, requestedProfileRaw: null, operation: null,
    glassRawSpecification: null, glassTypeRaw: null, glassTypeNormalized: null, glassThicknessMm: null,
    finishRawDescription: null, finishNormalizedType: null, finishColorRaw: null, finishColorNormalized: null,
    specialFeatures: [], geometryType: null },
  dataCompleteness: { state: 'COMPLETE', isComplete: true, missingFields: [] }, evidence: [],
  occurrenceContext: null, extractedLocation: null, manualLocationOverride: null,
};
export const catalog = { version: '1', spaces: [], questions: [{ benefitCode: 'benefit', label: 'Prioridad', question: 'Prioridad', options: [
  { optionCode: 'LOW', optionLabel: 'Baja', shortLabel: null, conditions: [] },
  { optionCode: 'MEDIUM', optionLabel: 'Media', shortLabel: null, conditions: [] },
  { optionCode: 'HIGH', optionLabel: 'Alta', shortLabel: null, conditions: [] },
] }] };
export const proposal = {
  requirementId: rid, technicalProposalId: cid, processingAttemptId: qid, extractionResultId: cid,
  status: 'RequiresReview', createdAtUtc: stamp, commercialLine: 'ESSENTIAL',
  commercialConfirmation: { state: 'PENDING_CONFIRMATION', confirmedAtUtc: null, confirmedByUserId: null },
  itemCount: 1, detectedItemCount: 1, manualItemCount: 0, totalProposalItemCount: 1, itemsRequiringReview: 1,
  technicallyCompleteItems: 1, priceableItems: 0,
  readiness: { state: 'REVIEW_REQUIRED', isReadyForConfirmation: false, isReadyForPricing: false, blockingItems: 0,
    warningItems: 1, blockingDefinitions: 0, warningDefinitions: 1, pricingBlockingItems: 0, pricingBlockingDefinitions: 0, categories: {} },
  items: [item],
};
export function workspace(state) {
  return { project, client, publicContext: null, workflow: {
    resolutionState: 'RESOLVED', preQuoteId: qid, requirementId: rid,
    requirementStatus: state === 'Succeeded' ? 'PROCESSED' : 'PROCESSING',
    hasTechnicalProposal: state === 'Succeeded', technicalProposalId: state === 'Succeeded' ? cid : null,
    extraction: { state, canAnalyze: false, refreshRecommended: ['Running', 'Waiting', 'Admitted'].includes(state) },
  } };
}
