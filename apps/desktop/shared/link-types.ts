export type LinkTargetKind = 'note' | 'resource';

export interface LinkTarget {
  kind: LinkTargetKind;
  id: string;
}

export interface ResolvedLinkTarget {
  kind: LinkTargetKind;
  id: string;
  label: string;
  exists: boolean;
}

export function formatWikilink(kind: LinkTargetKind, id: string, label: string): string {
  const safeLabel = label.replace(/\]\]/g, '');
  return `[[${kind}:${id}|${safeLabel}]]`;
}
