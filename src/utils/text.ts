export function normalizeText(
  value: string | number | null | undefined
): string {
  return (value ?? '').toString().toLowerCase().trim();
}

export function matches(
  text: string | number | null | undefined,
  term: string | number | null | undefined
): boolean {
  return normalizeText(text).includes(normalizeText(term));
}

export function matchesAny(
  text: string | number | null | undefined,
  terms: (string | number | null | undefined)[] = []
): boolean {
  const n = normalizeText(text);
  return terms.some(t => n.includes(normalizeText(t)));
}
