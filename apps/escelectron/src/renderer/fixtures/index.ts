import type { ChatSessionsStore } from '@shared/chat-types';
import type { CoursesStore } from '@shared/course-types';
import type { LibraryIndexStore } from '@shared/library-types';
import type { NotesStore } from '@shared/note-types';
import type { StorageNamespace } from '@shared/storage-namespaces';
import { createCitationId, createMessageId, createSessionId } from '@renderer/chat/defaults';

const demoSessionId = createSessionId();

export const FIXTURE_CHAT_SESSIONS: ChatSessionsStore = {
  activeSessionId: demoSessionId,
  sessions: [
    {
      id: demoSessionId,
      title: 'Exam prep questions',
      createdAt: '2026-05-20T10:00:00.000Z',
      updatedAt: '2026-05-20T10:05:00.000Z',
      messages: [
        {
          id: createMessageId(),
          role: 'user',
          content: 'What should I focus on for the mathematics final?',
          createdAt: '2026-05-20T10:01:00.000Z',
        },
        {
          id: createMessageId(),
          role: 'assistant',
          content:
            'Focus on chapters 3–5, especially problem sets 3.1–3.4. Review the summary sheet in your syllabus.',
          createdAt: '2026-05-20T10:02:00.000Z',
          sourceType: 'local',
          citations: [
            {
              id: createCitationId(),
              sourceType: 'local',
              fileName: 'Syllabus.pdf',
              excerpt: 'Section 4.2: Exam covers chapters 3–5.',
            },
            {
              id: createCitationId(),
              sourceType: 'local',
              fileName: 'Notes.md',
              excerpt: 'Problem sets 3.1–3.4 are high priority.',
            },
          ],
        },
      ],
    },
  ],
};

export const FIXTURE_LIBRARY_INDEX: LibraryIndexStore = {
  files: [
    {
      id: 'lib_fixture_1',
      name: 'Syllabus.pdf',
      path: '/mock/Syllabus.pdf',
      type: 'pdf',
      sizeBytes: 245_000,
      status: 'ready',
      addedAt: '2026-05-18T09:00:00.000Z',
      chunkCount: 42,
      lastIndexedAt: '2026-05-18T09:02:00.000Z',
      previewText: '[Preview] Extracted text from "Syllabus.pdf" (42 chunks).',
    },
    {
      id: 'lib_fixture_2',
      name: 'Notes.md',
      path: '/mock/Notes.md',
      type: 'md',
      sizeBytes: 12_400,
      status: 'ready',
      addedAt: '2026-05-19T14:30:00.000Z',
      chunkCount: 18,
      lastIndexedAt: '2026-05-19T14:31:00.000Z',
      previewText: '[Preview] Extracted text from "Notes.md" (18 chunks).',
    },
  ],
};

export const FIXTURE_COURSES: CoursesStore = {
  courses: [
    {
      id: 'course_fixture_math',
      name: 'Mathematics',
      icon: '🧮',
      createdAt: '2026-05-18T09:00:00.000Z',
      updatedAt: '2026-05-20T10:00:00.000Z',
      resourceIds: ['lib_fixture_1'],
    },
    {
      id: 'course_fixture_hist',
      name: 'History',
      icon: '📕',
      createdAt: '2026-05-19T14:00:00.000Z',
      updatedAt: '2026-05-19T14:30:00.000Z',
      resourceIds: ['lib_fixture_2'],
    },
  ],
};

export const FIXTURE_NOTES: NotesStore = {
  notes: [
    {
      id: 'note_fixture_1',
      title: 'Exam prep outline',
      courseId: 'course_fixture_math',
      contentJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Chapters 3–5' }] }] },
      contentMarkdown: 'Chapters 3–5',
      outgoingLinks: [],
      outgoingResourceLinks: [],
      createdAt: '2026-05-20T09:00:00.000Z',
      updatedAt: '2026-05-20T09:00:00.000Z',
    },
  ],
};

const FIXTURES: Partial<Record<StorageNamespace, unknown>> = {
  'library.index': FIXTURE_LIBRARY_INDEX,
  'chat.sessions': FIXTURE_CHAT_SESSIONS,
  'courses.index': FIXTURE_COURSES,
  'notes.index': FIXTURE_NOTES,
  'notes.tabs': { openNoteIds: ['note_fixture_1'], activeNoteId: 'note_fixture_1' },
};

export function getFixture<T>(namespace: StorageNamespace): T | null {
  const data = FIXTURES[namespace];
  return (data ?? null) as T | null;
}
