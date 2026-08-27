import type {
  DraftEditCollection,
  DraftEditFindingModel,
  DraftEditItemModel,
  DraftEditModel,
  DraftEditReferenceModel,
  DraftEditRequirementModel,
} from "@/features/prequotes/prequote-draft-edit-types";
import type {
  PreQuoteDraftDetails,
  UpdatePreQuoteDraftDocumentReferenceRequest,
  UpdatePreQuoteDraftItemRequest,
  UpdatePreQuoteDraftRequest,
  UpdatePreQuoteDraftRequirementRequest,
} from "@/features/prequotes/prequote-draft-types";

function text(value: string | null): string {
  return value ?? "";
}

function nullableTrimmed(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function numberText(value: number | null): string {
  return value === null ? "" : String(value);
}

function positiveIntegerOrNull(value: string): number | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : Number(trimmed);
}

function localId(kind: string, id: string | null, sequence: number): string {
  return id ?? `${kind}-new-${sequence}-${crypto.randomUUID()}`;
}

export function createDraftEditModel(draft: PreQuoteDraftDetails): DraftEditModel {
  return {
    project: {
      projectName: text(draft.projectName),
      clientName: text(draft.clientName),
      location: text(draft.location),
    },
    items: [...draft.items]
      .sort((left, right) => left.sequence - right.sequence)
      .map((item) => ({
        localId: localId("item", item.id, item.sequence),
        draftItemId: item.id,
        sequence: item.sequence,
        isNew: false,
        reference: text(item.reference),
        description: item.description,
        elementType: item.elementType,
        rawMeasurements: text(item.rawMeasurements),
        widthMillimeters: numberText(item.widthMillimeters),
        heightMillimeters: numberText(item.heightMillimeters),
        quantity: numberText(item.quantity),
        isIncluded: item.isIncluded,
      })),
    requirements: [...draft.requirements]
      .sort((left, right) => left.sequence - right.sequence)
      .map((requirement) => ({
        localId: localId(
          "requirement",
          requirement.draftRequirementId,
          requirement.sequence,
        ),
        draftRequirementId: requirement.draftRequirementId,
        sequence: requirement.sequence,
        isNew: false,
        category: requirement.category,
        value: requirement.value,
        isIncluded: requirement.isIncluded,
      })),
    references: [...draft.documentReferences]
      .sort((left, right) => left.sequence - right.sequence)
      .map((reference) => ({
        localId: localId(
          "reference",
          reference.draftDocumentReferenceId,
          reference.sequence,
        ),
        draftDocumentReferenceId: reference.draftDocumentReferenceId,
        sequence: reference.sequence,
        isNew: false,
        reference: text(reference.reference),
        description: reference.description,
        detail: text(reference.detail),
        quantity: numberText(reference.quantity),
        isIncluded: reference.isIncluded,
      })),
    issues: [...draft.issues]
      .sort((left, right) => left.sequence - right.sequence)
      .map((issue) => ({
        id: issue.draftIssueId,
        sequence: issue.sequence,
        resolutionStatus: issue.resolutionStatus,
        resolutionNote: text(issue.resolutionNote),
      })),
    conflicts: [...draft.conflicts]
      .sort((left, right) => left.sequence - right.sequence)
      .map((conflict) => ({
        id: conflict.draftConflictId,
        sequence: conflict.sequence,
        resolutionStatus: conflict.resolutionStatus,
        resolutionNote: text(conflict.resolutionNote),
      })),
  };
}

export function createManualDraftItem(sequence: number): DraftEditItemModel {
  return {
    localId: localId("item", null, sequence),
    draftItemId: null,
    sequence,
    isNew: true,
    reference: "",
    description: "",
    elementType: "",
    rawMeasurements: "",
    widthMillimeters: "",
    heightMillimeters: "",
    quantity: "",
    isIncluded: true,
  };
}

export function createManualDraftRequirement(
  sequence: number,
): DraftEditRequirementModel {
  return {
    localId: localId("requirement", null, sequence),
    draftRequirementId: null,
    sequence,
    isNew: true,
    category: "",
    value: "",
    isIncluded: true,
  };
}

export function createManualDraftReference(
  sequence: number,
): DraftEditReferenceModel {
  return {
    localId: localId("reference", null, sequence),
    draftDocumentReferenceId: null,
    sequence,
    isNew: true,
    reference: "",
    description: "",
    detail: "",
    quantity: "",
    isIncluded: true,
  };
}

export function resequenceDraftEditModel(
  model: DraftEditModel,
  collection: DraftEditCollection,
): DraftEditModel {
  return {
    ...model,
    [collection]: model[collection].map((item, index) => ({
      ...item,
      sequence: index + 1,
    })),
  };
}

function mapItems(items: DraftEditItemModel[]): UpdatePreQuoteDraftItemRequest[] {
  return items.map((item, index) => ({
    draftItemId: item.draftItemId,
    sequence: index + 1,
    reference: nullableTrimmed(item.reference),
    description: item.description.trim(),
    elementType: item.elementType || "OTHER",
    rawMeasurements: nullableTrimmed(item.rawMeasurements),
    widthMillimeters: positiveIntegerOrNull(item.widthMillimeters),
    heightMillimeters: positiveIntegerOrNull(item.heightMillimeters),
    quantity: positiveIntegerOrNull(item.quantity),
    isIncluded: item.isIncluded,
  }));
}

function mapRequirements(
  requirements: DraftEditRequirementModel[],
): UpdatePreQuoteDraftRequirementRequest[] {
  return requirements.map((requirement, index) => ({
    draftRequirementId: requirement.draftRequirementId,
    sequence: index + 1,
    category: requirement.category || "GENERAL_NOTE",
    value: requirement.value.trim(),
    isIncluded: requirement.isIncluded,
  }));
}

function mapReferences(
  references: DraftEditReferenceModel[],
): UpdatePreQuoteDraftDocumentReferenceRequest[] {
  return references.map((reference, index) => ({
    draftDocumentReferenceId: reference.draftDocumentReferenceId,
    sequence: index + 1,
    reference: nullableTrimmed(reference.reference),
    description: reference.description.trim(),
    detail: nullableTrimmed(reference.detail),
    quantity: positiveIntegerOrNull(reference.quantity),
    isIncluded: reference.isIncluded,
  }));
}

function mapFindings(findings: DraftEditFindingModel[]) {
  return findings.map((finding) => ({
    resolutionStatus: finding.resolutionStatus,
    resolutionNote:
      finding.resolutionStatus === "PENDING"
        ? null
        : nullableTrimmed(finding.resolutionNote),
  }));
}

export function buildUpdateDraftRequest(
  model: DraftEditModel,
  authoritativeDraft: PreQuoteDraftDetails,
): UpdatePreQuoteDraftRequest {
  const issueResolutions = mapFindings(model.issues);
  const conflictResolutions = mapFindings(model.conflicts);

  return {
    expectedVersion: authoritativeDraft.version,
    project: {
      name: nullableTrimmed(model.project.projectName),
      clientName: nullableTrimmed(model.project.clientName),
      location: nullableTrimmed(model.project.location),
    },
    items: mapItems(model.items),
    requirements: mapRequirements(model.requirements),
    documentReferences: mapReferences(model.references),
    issues: model.issues.map((issue, index) => ({
      draftIssueId: issue.id,
      ...issueResolutions[index],
    })),
    conflicts: model.conflicts.map((conflict, index) => ({
      draftConflictId: conflict.id,
      ...conflictResolutions[index],
    })),
  };
}

export function hasDraftChanges(
  model: DraftEditModel,
  initialModel: DraftEditModel,
): boolean {
  return JSON.stringify(model) !== JSON.stringify(initialModel);
}
