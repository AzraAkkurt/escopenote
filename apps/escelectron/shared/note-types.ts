export interface Note {
  id: string;
  title: string;
  courseId: string | null;
  contentJson: Record<string, unknown>;
  contentMarkdown: string;
  outgoingLinks: string[];
  /** Resource IDs linked via [[resource:...]] in content */
  outgoingResourceLinks: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NotesStore {
  notes: Note[];
}

export interface NotesTabsStore {
  openNoteIds: string[];
  activeNoteId: string | null;
}

export interface NoteCreateInput {
  title: string;
  courseId?: string | null;
}

export interface NoteUpdateInput {
  id: string;
  title?: string;
  contentJson?: Record<string, unknown>;
  contentMarkdown?: string;
}
