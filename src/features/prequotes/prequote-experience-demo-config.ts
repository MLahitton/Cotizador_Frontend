import type { TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";
import type {
  ItemExperienceDraft,
  RequirementExperienceCatalog,
  RequirementExperienceItemDraft,
} from "@/features/prequotes/prequote-experience-types";

export function createEmptyExperienceDraft(item: TechnicalProposalItem): ItemExperienceDraft {
  return {
    itemId: item.itemId,
    catalogVersion: null,
    spaceTypeCode: null,
    resolutionState: "PENDING",
    revision: 0,
    updatedAtUtc: null,
    updatedByUserId: null,
    answers: {},
    hasServerDraft: false,
  };
}

export function itemDraftFromServer(draft: RequirementExperienceItemDraft): ItemExperienceDraft {
  return {
    itemId: draft.technicalProposalItemId,
    catalogVersion: draft.catalogVersion,
    spaceTypeCode: draft.spaceTypeCode,
    resolutionState: draft.resolutionState,
    revision: draft.revision,
    updatedAtUtc: draft.updatedAtUtc,
    updatedByUserId: draft.updatedByUserId,
    answers: Object.fromEntries(draft.answers.map((answer) => [answer.benefitCode, answer.optionCode])),
    hasServerDraft: draft.catalogVersion !== null || draft.revision > 0 || draft.answers.length > 0,
  };
}

export function mergeExperienceDraftWithItem(
  item: TechnicalProposalItem,
  existing: ItemExperienceDraft | undefined,
): ItemExperienceDraft {
  return existing ?? createEmptyExperienceDraft(item);
}

export function formatExperienceSpaceType(catalog: RequirementExperienceCatalog | null, spaceTypeCode: string | null): string {
  if (!spaceTypeCode) return "Espacio pendiente";
  return catalog?.spaces.find((space) => space.code === spaceTypeCode)?.label ?? spaceTypeCode;
}

export function getExperienceSelectionsSummary(
  draft: ItemExperienceDraft,
  catalog: RequirementExperienceCatalog | null,
  limit = 4,
): string[] {
  if (!catalog) return [];
  return Object.entries(draft.answers)
    .map(([benefitCode, optionCode]) => {
      const question = catalog.questions.find((item) => item.benefitCode === benefitCode);
      const option = question?.options.find((item) => item.optionCode === optionCode);
      return option?.shortLabel?.trim() || option?.optionLabel?.trim() || null;
    })
    .filter((value): value is string => Boolean(value))
    .slice(0, limit);
}

export function getExperienceTrendCounts(
  drafts: ItemExperienceDraft[],
  catalog: RequirementExperienceCatalog | null,
): Array<{ benefitCode: string; optionCode: string; value: string; count: number }> {
  if (!catalog) return [];
  const counts = new Map<string, { benefitCode: string; optionCode: string; value: string; count: number }>();

  drafts.forEach((draft) => {
    Object.entries(draft.answers).forEach(([benefitCode, optionCode]) => {
      const question = catalog.questions.find((item) => item.benefitCode === benefitCode);
      const option = question?.options.find((item) => item.optionCode === optionCode);
      const label = option?.shortLabel?.trim() || option?.optionLabel?.trim();
      if (!question || !option || !label) return;
      const key = `${benefitCode}:${optionCode}`;
      const current = counts.get(key);
      counts.set(key, {
        benefitCode,
        optionCode,
        value: `${question.label}: ${label}`,
        count: (current?.count ?? 0) + 1,
      });
    });
  });

  return [...counts.values()]
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value, "es"));
}
