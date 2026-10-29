export type ConfigurationDraftStatus = "idle" | "dirty" | "saving" | "saved" | "error" | "conflict";

export function hasPendingConfigurationChanges(statuses: Record<string, ConfigurationDraftStatus>): boolean {
  return Object.values(statuses).some((status) =>
    status === "dirty" || status === "saving" || status === "error" || status === "conflict",
  );
}

export function canConfirmConfiguration({
  readOnly, confirming, hasPendingChanges, inclusionBusy, dataReady, canConfirm,
}: {
  readOnly: boolean;
  confirming: boolean;
  hasPendingChanges: boolean;
  inclusionBusy: boolean;
  dataReady: boolean;
  canConfirm: boolean;
}): boolean {
  return !readOnly && !confirming && !hasPendingChanges && !inclusionBusy && dataReady && canConfirm;
}
