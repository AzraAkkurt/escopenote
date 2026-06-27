import { z } from 'zod';

const chunkSchema = z.object({
  chunkId: z.string().min(1).max(128),
  fileName: z.string().min(1).max(512),
  text: z.string().max(8000),
});

const historyMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(8000),
});

export const chatStreamBodySchema = z
  .object({
    message: z.string().min(1).max(32_000),
    relevant_chunks: z.array(chunkSchema).max(24).optional(),
    history: z.array(historyMessageSchema).max(24).optional(),
    session_id: z.string().max(128).optional(),
    sessionId: z.string().max(128).optional(),
    course_id: z.string().max(128).nullable().optional(),
    courseId: z.string().max(128).nullable().optional(),
    locale: z.string().max(16).optional(),
    feature: z.enum(['chat', 'note_agent', 'planner', 'workflow']).optional(),
  })
  .transform((body) => ({
    message: body.message,
    relevant_chunks: body.relevant_chunks ?? [],
    history: body.history ?? [],
    session_id: body.session_id ?? body.sessionId,
    course_id: body.course_id ?? body.courseId ?? null,
    locale: body.locale,
    feature: body.feature,
  }));

const subjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

export const plannerBodySchema = z.object({
  profile: z.object({
    subjects: z.array(subjectSchema).default([]),
    hoursPerDay: z.number().min(0).max(24),
    hoursPerWeek: z.number().min(0).max(168),
    busyWeek: z.boolean().optional(),
  }),
  scope: z.enum(['day', 'week']),
  anchorDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  locale: z.string().max(16).optional(),
});
