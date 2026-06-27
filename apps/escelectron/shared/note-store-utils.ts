import type { Note, NotesStore, NotesTabsStore } from './note-types';

export const EMPTY_NOTES: NotesStore = { notes: [] };

export const EMPTY_NOTES_TABS: NotesTabsStore = { openNoteIds: [], activeNoteId: null };

export function normalizeNotesStore(data: unknown): NotesStore {
  if (!data || typeof data !== 'object') {
    return EMPTY_NOTES;
  }
  const raw = data as Partial<NotesStore>;
  if (!Array.isArray(raw.notes)) {
    return EMPTY_NOTES;
  }
  return {
    notes: raw.notes
      .filter(
        (n): n is Note =>
          !!n &&
          typeof n === 'object' &&
          typeof n.id === 'string' &&
          typeof n.title === 'string',
      )
      .map((n) => ({
        ...n,
        outgoingLinks: Array.isArray(n.outgoingLinks) ? n.outgoingLinks : [],
        outgoingResourceLinks: Array.isArray(n.outgoingResourceLinks)
          ? n.outgoingResourceLinks
          : [],
        contentJson: n.contentJson ?? { type: 'doc', content: [{ type: 'paragraph' }] },
        contentMarkdown: typeof n.contentMarkdown === 'string' ? n.contentMarkdown : '',
        courseId: n.courseId ?? null,
      })),
  };
}

export function normalizeNotesTabsStore(data: unknown): NotesTabsStore {
  if (!data || typeof data !== 'object') {
    return EMPTY_NOTES_TABS;
  }
  const raw = data as Partial<NotesTabsStore>;
  return {
    openNoteIds: Array.isArray(raw.openNoteIds)
      ? raw.openNoteIds.filter((id): id is string => typeof id === 'string')
      : [],
    activeNoteId: typeof raw.activeNoteId === 'string' ? raw.activeNoteId : null,
  };
}
