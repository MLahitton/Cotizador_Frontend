export const diagnosisSections = [
  "general", "priorities", "preferences", "livingContext", "needs", "decision", "supplementalNotes",
] as const;

export type DiagnosisSection = (typeof diagnosisSections)[number];
export type DiagnosisAvailability = "AVAILABLE" | "NOT_PROVIDED" | "NOT_APPLICABLE" | "UNKNOWN_CODE" | "INVALID_VALUE";
export type DiagnosisStatus = "AVAILABLE" | "NO_PUBLIC_EXPERIENCE" | "AMBIGUOUS_PUBLIC_EXPERIENCE" | "UNSUPPORTED_SCHEMA" | "INVALID_SOURCE_DATA";

export interface ProjectDiagnosisEntry {
  questionId: string;
  displayLabel: string;
  availability: DiagnosisAvailability;
  code: string | null;
  codes: string[] | null;
  numericValue: number | null;
  textValue: string | null;
  displayValue: string | null;
  displayValues: string[] | null;
}

export type ProjectDiagnosis = {
  source: string;
  submissionId: string;
  schemaVersion: string;
  interpretationVersion: string;
} & Record<DiagnosisSection, ProjectDiagnosisEntry[]>;

export type ProjectDiagnosisResponse =
  | { status: "AVAILABLE"; diagnosis: ProjectDiagnosis }
  | { status: Exclude<DiagnosisStatus, "AVAILABLE">; diagnosis: null };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function nullableText(value: unknown): boolean {
  return value === null || typeof value === "string";
}
function nullableTexts(value: unknown): value is string[] | null {
  return value === null || (Array.isArray(value) && value.every((item) => typeof item === "string"));
}
function isEntry(value: unknown): value is ProjectDiagnosisEntry {
  if (!record(value)) return false;
  return text(value.questionId) && text(value.displayLabel)
    && typeof value.availability === "string"
    && ["AVAILABLE", "NOT_PROVIDED", "NOT_APPLICABLE", "UNKNOWN_CODE", "INVALID_VALUE"].includes(value.availability)
    && nullableText(value.code) && nullableTexts(value.codes)
    && (value.numericValue === null || (typeof value.numericValue === "number" && Number.isFinite(value.numericValue)))
    && nullableText(value.textValue) && nullableText(value.displayValue) && nullableTexts(value.displayValues)
    && (value.availability !== "AVAILABLE" || text(value.displayValue)
      || (Array.isArray(value.displayValues) && value.displayValues.length > 0 && value.displayValues.every(text)));
}
function isDiagnosis(value: unknown): value is ProjectDiagnosis {
  return record(value)
    && text(value.source) && text(value.submissionId) && text(value.schemaVersion) && text(value.interpretationVersion)
    && diagnosisSections.every((section) => {
      const entries = value[section];
      return Array.isArray(entries) && entries.every(isEntry)
        && new Set(entries.map((entry) => entry.questionId)).size === entries.length;
    });
}
export function isProjectDiagnosisResponse(value: unknown): value is ProjectDiagnosisResponse {
  if (!record(value)) return false;
  if (value.status === "AVAILABLE") return isDiagnosis(value.diagnosis);
  return typeof value.status === "string"
    && ["NO_PUBLIC_EXPERIENCE", "AMBIGUOUS_PUBLIC_EXPERIENCE", "UNSUPPORTED_SCHEMA", "INVALID_SOURCE_DATA"].includes(value.status)
    && value.diagnosis === null;
}
