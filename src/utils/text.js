export function normalizeText(value) {
  return (value || '').toString().toLowerCase().trim();
}

export function matches(text, term) {
  return normalizeText(text).includes(normalizeText(term));
}

export function matchesAny(text, terms = []) {
  const n = normalizeText(text);
  return terms.some(t => n.includes(normalizeText(t)));
}


