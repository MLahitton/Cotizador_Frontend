export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/\bpoket\b/g, "pocket")
    .trim()
    .replace(/\s+/g, " ");
}

export function matchesSearchText(searchText: string, candidate: string): boolean {
  const query = normalizeSearchText(searchText);
  return query.length === 0 || normalizeSearchText(candidate).includes(query);
}
