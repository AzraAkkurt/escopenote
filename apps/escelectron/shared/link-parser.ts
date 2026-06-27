import type { Note } from './note-types';
import type { Resource } from './resource-types';
import type { LinkTarget, LinkTargetKind, ResolvedLinkTarget } from './link-types';
import { formatWikilink } from './link-types';

const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

function parseTargetToken(
  token: string,
  allNotes: Note[],
  allResources: Resource[],
): LinkTarget | null {
  const trimmed = token.trim();
  if (!trimmed) {
    return null;
  }

  const prefixed = trimmed.match(/^(note|resource):(.+)$/i);
  if (prefixed) {
    const kind = prefixed[1].toLowerCase() as LinkTargetKind;
    const id = prefixed[2].trim();
    if (kind === 'note' && allNotes.some((n) => n.id === id)) {
      return { kind: 'note', id };
    }
    if (kind === 'resource' && allResources.some((r) => r.id === id)) {
      return { kind: 'resource', id };
    }
    return { kind, id };
  }

  const noteById = allNotes.find((n) => n.id === trimmed);
  if (noteById) {
    return { kind: 'note', id: noteById.id };
  }

  const resourceById = allResources.find((r) => r.id === trimmed);
  if (resourceById) {
    return { kind: 'resource', id: resourceById.id };
  }

  if (trimmed.startsWith('note_')) {
    return { kind: 'note', id: trimmed };
  }
  if (trimmed.startsWith('res_')) {
    return { kind: 'resource', id: trimmed };
  }

  const noteByTitle = allNotes.find((n) => n.title.toLowerCase() === trimmed.toLowerCase());
  if (noteByTitle) {
    return { kind: 'note', id: noteByTitle.id };
  }

  return null;
}

export function extractWikilinkMatches(markdown: string): Array<{ token: string; label?: string }> {
  const matches: Array<{ token: string; label?: string }> = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(WIKILINK_REGEX.source, 'g');
  while ((match = re.exec(markdown)) !== null) {
    matches.push({
      token: match[1],
      label: match[2]?.trim(),
    });
  }
  return matches;
}

export function parseNoteLinks(
  markdown: string,
  allNotes: Note[],
  allResources: Resource[] = [],
): string[] {
  const ids: string[] = [];
  for (const { token } of extractWikilinkMatches(markdown)) {
    const target = parseTargetToken(token, allNotes, allResources);
    if (target?.kind === 'note' && !ids.includes(target.id)) {
      ids.push(target.id);
    }
  }
  return ids;
}

export function parseResourceLinks(
  markdown: string,
  allResources: Resource[],
  allNotes: Note[] = [],
): string[] {
  const ids: string[] = [];
  for (const { token } of extractWikilinkMatches(markdown)) {
    const target = parseTargetToken(token, allNotes, allResources);
    if (target?.kind === 'resource' && !ids.includes(target.id)) {
      ids.push(target.id);
    }
  }
  return ids;
}

export function parseAllWikilinkTargets(
  markdown: string,
  allNotes: Note[],
  allResources: Resource[],
): LinkTarget[] {
  const seen = new Set<string>();
  const targets: LinkTarget[] = [];
  for (const { token } of extractWikilinkMatches(markdown)) {
    const target = parseTargetToken(token, allNotes, allResources);
    if (!target) {
      continue;
    }
    const key = `${target.kind}:${target.id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    targets.push(target);
  }
  return targets;
}

/** @deprecated use parseNoteLinks */
export function parseWikilinks(markdown: string, allNotes: Note[]): string[] {
  return parseNoteLinks(markdown, allNotes);
}

export function resolveLinkTarget(
  query: string,
  allNotes: Note[],
  allResources: Resource[],
): ResolvedLinkTarget | null {
  const target = parseTargetToken(query, allNotes, allResources);
  if (!target) {
    return null;
  }

  if (target.kind === 'note') {
    const note = allNotes.find((n) => n.id === target.id);
    return {
      kind: 'note',
      id: target.id,
      label: note?.title ?? query,
      exists: !!note,
    };
  }

  const resource = allResources.find((r) => r.id === target.id);
  return {
    kind: 'resource',
    id: target.id,
    label: resource?.name ?? query,
    exists: !!resource,
  };
}

export { formatWikilink };
