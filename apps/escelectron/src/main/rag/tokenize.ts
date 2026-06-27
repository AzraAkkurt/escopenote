const TOKEN_RE = /[a-z0-9\u00c0-\u024f]+/gi;

export function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(TOKEN_RE);
  return matches ?? [];
}
