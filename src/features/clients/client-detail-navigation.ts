export interface ClientDetailBackNavigation {
  href: string;
  label: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

export const DEFAULT_CLIENT_DETAIL_BACK_NAVIGATION: ClientDetailBackNavigation =
  {
    href: "/clients",
    label: "Volver a clientes",
  };

function isValidContextProjectId(value: string): boolean {
  const normalizedValue = value.trim();
  return UUID_PATTERN.test(normalizedValue) && normalizedValue !== EMPTY_UUID;
}

export function getClientDetailBackNavigation(
  fromProjectIdValues: string[],
): ClientDetailBackNavigation {
  if (fromProjectIdValues.length !== 1) {
    return DEFAULT_CLIENT_DETAIL_BACK_NAVIGATION;
  }

  const [fromProjectId] = fromProjectIdValues;
  if (!isValidContextProjectId(fromProjectId)) {
    return DEFAULT_CLIENT_DETAIL_BACK_NAVIGATION;
  }

  return {
    href: `/projects/${encodeURIComponent(fromProjectId.trim())}`,
    label: "Volver al proyecto",
  };
}
