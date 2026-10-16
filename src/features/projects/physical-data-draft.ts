export type PhysicalDataDraft = {
  quantity: string;
  widthMm: string;
  heightMm: string;
};

type PhysicalDataValues = Record<keyof PhysicalDataDraft, number | null>;

export function reconcilePhysicalDataDraft(
  submitted: PhysicalDataDraft,
  current: PhysicalDataDraft,
  response: PhysicalDataValues,
  requestId: number,
  latestRequestId: number,
) {
  if (requestId !== latestRequestId) return null;

  const baseline: PhysicalDataDraft = {
    quantity: response.quantity?.toString() ?? "",
    widthMm: response.widthMm?.toString() ?? "",
    heightMm: response.heightMm?.toString() ?? "",
  };
  const draft = { ...current };
  let dirty = false;
  for (const field of ["quantity", "widthMm", "heightMm"] as const) {
    if (current[field] === submitted[field]) draft[field] = baseline[field];
    const value = draft[field].trim();
    const matchesBaseline = value === ""
      ? response[field] === null
      : Number(value) === response[field];
    if (!matchesBaseline) dirty = true;
  }
  return { draft, baseline, dirty };
}
