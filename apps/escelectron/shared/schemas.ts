import { z } from 'zod';
import { STORAGE_NAMESPACES } from './storage-namespaces';

export const themePreferenceSchema = z.enum(['light', 'dark', 'system']);
export const localeCodeSchema = z.enum(['en', 'tr']);

export const windowBoundsSchema = z.object({
  width: z.number().int().positive().max(7680),
  height: z.number().int().positive().max(4320),
  x: z.number().int().optional(),
  y: z.number().int().optional(),
});

export const appSettingsSchema = z.object({
  theme: themePreferenceSchema,
  locale: localeCodeSchema,
  gatewayUrl: z.string().url().max(2048),
  preferencesInitialized: z.boolean(),
  windowBounds: windowBoundsSchema.optional(),
  ragTopK: z.number().int().min(1).max(20),
  confirmBeforeSavingWebResults: z.boolean(),
  onboardingCompleted: z.boolean().optional(),
  privacyAcknowledged: z.boolean().optional(),
});

export const appSettingsPatchSchema = appSettingsSchema.partial();

export const storageNamespaceSchema = z.enum(STORAGE_NAMESPACES);

export const storageWriteSchema = z.object({
  namespace: storageNamespaceSchema,
  data: z.unknown(),
});

export const storageReadSchema = z.object({
  namespace: storageNamespaceSchema,
});

export const openFileOptionsSchema = z
  .object({
    title: z.string().max(200).optional(),
    multiple: z.boolean().optional(),
    filters: z
      .array(
        z.object({
          name: z.string().max(100),
          extensions: z.array(z.string().max(20)).max(20),
        }),
      )
      .max(10)
      .optional(),
  })
  .optional();

export const libraryAddFilesSchema = z.object({
  paths: z.array(z.string().min(1).max(4096)).min(1).max(50),
});

export const libraryIdSchema = z.object({
  id: z.string().min(1).max(80),
});

export const ragSearchSchema = z.object({
  query: z.string().min(1).max(8000),
  topK: z.number().int().min(1).max(20).optional(),
  courseId: z.string().min(1).max(80).nullable().optional(),
});

export const ragChunkIdSchema = z.object({
  chunkId: z.string().min(1).max(80),
});

export const chatFeatureSchema = z.enum(['chat', 'note_agent', 'planner', 'workflow']);

export const chatSendSchema = z.object({
  requestId: z.string().min(1).max(80),
  message: z.string().min(1).max(32000),
  sessionId: z.string().min(1).max(80).optional(),
  courseId: z.string().min(1).max(80).nullable().optional(),
  feature: chatFeatureSchema.optional(),
  locale: z.string().max(16).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(8000),
      }),
    )
    .max(24)
    .optional(),
});

export const chatSaveWebSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(50000),
  courseId: z.string().min(1).max(80).nullable().optional(),
});

export const courseIdSchema = z.object({
  id: z.string().min(1).max(80),
});

export const courseCreateSchema = z.object({
  name: z.string().min(1).max(200),
  icon: z.string().max(20).optional(),
});

export const courseUpdateSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(200).optional(),
  icon: z.string().max(20).optional(),
});

export const resourcesAddFilesSchema = z.object({
  courseId: z.string().min(1).max(80),
  paths: z.array(z.string().min(1).max(4096)).min(1).max(50),
});

export const resourcesAddLinkSchema = z.object({
  courseId: z.string().min(1).max(80),
  url: z.string().url().max(2048),
});

export const resourceIdSchema = z.object({
  id: z.string().min(1).max(80),
});

export const notesListSchema = z
  .object({
    courseId: z.string().min(1).max(80).nullable().optional(),
  })
  .optional();

export const noteCreateSchema = z.object({
  title: z.string().min(1).max(200),
  courseId: z.string().min(1).max(80).nullable().optional(),
});

export const noteUpdateSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(200).optional(),
  contentJson: z.record(z.string(), z.unknown()).optional(),
  contentMarkdown: z.string().max(500_000).optional(),
});

export const noteIdSchema = z.object({
  id: z.string().min(1).max(80),
});

export const noteResolveLinkSchema = z.object({
  query: z.string().min(1).max(200),
});

export const shellOpenResourceSchema = z.object({
  resourceId: z.string().min(1).max(80),
});

export const noteCreateFromChatSchema = z.object({
  title: z.string().min(1).max(200),
  markdown: z.string().min(1).max(100_000),
  courseId: z.string().min(1).max(80).nullable().optional(),
});

export const chatRecordOutboundSchema = z.object({
  message: z.string().min(1).max(32000),
  chunks: z.array(
    z.object({
      chunkId: z.string(),
      fileId: z.string(),
      resourceId: z.string().optional(),
      fileName: z.string(),
      text: z.string(),
      score: z.number(),
    }),
  ),
});

export const saveFileDialogSchema = z
  .object({
    title: z.string().max(200).optional(),
    defaultPath: z.string().max(4096).optional(),
  })
  .optional();
