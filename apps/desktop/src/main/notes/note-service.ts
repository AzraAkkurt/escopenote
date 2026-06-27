import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Note, NoteCreateInput, NoteUpdateInput, NotesStore } from '../../../shared/note-types';
import type { ResolvedLinkTarget } from '../../../shared/link-types';
import { parseNoteLinks, parseResourceLinks, resolveLinkTarget } from '../../../shared/link-parser';
import { IpcError } from '../../../shared/ipc-errors';
import { normalizeNotesStore } from '../../../shared/note-store-utils';
import { markdownToTiptapDoc } from '../../../shared/markdown-to-tiptap.js';
import { readNamespace, writeNamespace } from '../storage/file-store';
import {
  createNoteResource,
  listAllResources,
  removeResource,
  updateNoteResourceTitle,
} from '../resources/resource-service';
import { cancelScheduledNoteIndex, scheduleNoteIndex } from './note-index-scheduler';

const NAMESPACE = 'notes.index' as const;

const EMPTY_DOC = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

async function readStore(): Promise<NotesStore> {
  const data = await readNamespace<unknown>(NAMESPACE);
  return normalizeNotesStore(data);
}

async function writeStore(store: NotesStore): Promise<void> {
  await writeNamespace(NAMESPACE, store);
}

function notesDir(): string {
  return path.join(app.getPath('userData'), 'knowledge-notes');
}

async function writeNoteMirror(note: Note): Promise<string> {
  const dir = notesDir();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${note.id}.md`);
  const body = `# ${note.title}\n\n${note.contentMarkdown}\n`;
  await fs.writeFile(filePath, body, 'utf8');
  return filePath;
}

export { parseNoteLinks, parseResourceLinks } from '../../../shared/link-parser';

export async function listNotes(filter?: { courseId?: string | null }): Promise<Note[]> {
  const store = await readStore();
  if (filter === undefined) {
    return store.notes;
  }
  if (filter.courseId === null) {
    return store.notes.filter((n) => n.courseId === null);
  }
  if (filter.courseId) {
    return store.notes.filter((n) => n.courseId === filter.courseId);
  }
  return store.notes;
}

export async function getNote(id: string): Promise<Note> {
  const store = await readStore();
  const note = store.notes.find((n) => n.id === id);
  if (!note) {
    throw new IpcError('NOT_FOUND', 'Note not found');
  }
  return note;
}

export async function createNote(input: NoteCreateInput): Promise<Note> {
  const title = input.title.trim() || 'Untitled';
  const now = new Date().toISOString();
  const note: Note = {
    id: `note_${randomUUID().slice(0, 12)}`,
    title,
    courseId: input.courseId ?? null,
    contentJson: EMPTY_DOC,
    contentMarkdown: '',
    outgoingLinks: [],
    outgoingResourceLinks: [],
    createdAt: now,
    updatedAt: now,
  };

  const store = await readStore();
  store.notes.push(note);
  await writeStore(store);

  const snapshotPath = await writeNoteMirror(note);
  await createNoteResource(note.courseId, note.id, note.title, snapshotPath);

  return note;
}

export async function updateNote(input: NoteUpdateInput): Promise<Note> {
  const store = await readStore();
  const index = store.notes.findIndex((n) => n.id === input.id);
  if (index < 0) {
    throw new IpcError('NOT_FOUND', 'Note not found');
  }

  const allResources = await listAllResources();
  const current = store.notes[index];
  const contentMarkdown =
    input.contentMarkdown !== undefined ? input.contentMarkdown : current.contentMarkdown;
  const next: Note = {
    ...current,
    title: input.title?.trim() ? input.title.trim() : current.title,
    contentJson: input.contentJson ?? current.contentJson,
    contentMarkdown,
    updatedAt: new Date().toISOString(),
    outgoingLinks: parseNoteLinks(contentMarkdown, store.notes, allResources),
    outgoingResourceLinks: parseResourceLinks(contentMarkdown, allResources, store.notes),
  };

  store.notes[index] = next;
  await writeStore(store);

  await writeNoteMirror(next);
  await updateNoteResourceTitle(next.id, next.title);

  const noteResource = allResources.find((r) => r.kind === 'note' && r.noteId === next.id);
  if (!noteResource) {
    const snapshotPath = path.join(notesDir(), `${next.id}.md`);
    await createNoteResource(next.courseId, next.id, next.title, snapshotPath);
  }

  scheduleNoteIndex(next.id);

  return next;
}

export async function deleteNote(id: string): Promise<void> {
  cancelScheduledNoteIndex(id);

  const store = await readStore();
  const note = store.notes.find((n) => n.id === id);
  if (!note) {
    throw new IpcError('NOT_FOUND', 'Note not found');
  }

  const resources = await listAllResources();
  const noteResource = resources.find((r) => r.kind === 'note' && r.noteId === id);
  if (noteResource) {
    await removeResource(noteResource.id);
  }

  try {
    await fs.unlink(path.join(notesDir(), `${id}.md`));
  } catch {
    // ignore missing file
  }

  store.notes = store.notes.filter((n) => n.id !== id);
  await writeStore(store);
}

export async function resolveNoteLink(query: string): Promise<string | null> {
  const target = await resolveNoteLinkTarget(query);
  return target?.kind === 'note' ? target.id : null;
}

export async function resolveNoteLinkTarget(query: string): Promise<ResolvedLinkTarget | null> {
  const store = await readStore();
  const allResources = await listAllResources();
  return resolveLinkTarget(query, store.notes, allResources);
}

export async function exportNoteMarkdown(id: string): Promise<string> {
  const note = await getNote(id);
  return `# ${note.title}\n\n${note.contentMarkdown}\n`;
}

export async function getBacklinks(noteId: string): Promise<Note[]> {
  const store = await readStore();
  return store.notes.filter((n) => n.outgoingLinks.includes(noteId));
}

export async function createNoteFromChatContent(
  title: string,
  markdown: string,
  courseId?: string | null,
): Promise<Note> {
  const note = await createNote({ title, courseId });
  const contentJson = markdownToTiptapDoc(markdown);
  return updateNote({
    id: note.id,
    contentMarkdown: markdown,
    contentJson,
  });
}
