const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

export function isValidProjectId(value: string): boolean {
  const normalizedValue = value.trim();
  return UUID_PATTERN.test(normalizedValue) && normalizedValue !== EMPTY_UUID;
}
