import { randomUUID } from 'node:crypto';
import type { PlannerGenerateRequest, PlannerGenerateResponse, StudyPlan } from '@escopenote/contracts';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { generatePlanMock } from './planner-mock.js';

const PLANNER_PROMPT = `You are a study planner. Output ONLY valid JSON matching this shape (no markdown):
{
  "blocks": [
    {
      "id": "blk_xxx",
      "subjectId": "string",
      "subjectName": "string",
      "title": "string",
      "startTime": "HH:MM",
      "durationMinutes": number,
      "date": "YYYY-MM-DD",
      "dayIndex": number (week scope only, optional)
    }
  ]
}
Rules:
- Respect scope (day or week), anchorDate, hoursPerDay/hoursPerWeek, busyWeek.
- Use subject ids and names from the profile.
- Realistic session lengths (30-120 min).
- For scope "day", all blocks on anchorDate with startTime.
- For scope "week", spread across days starting anchorDate.`;

export async function generatePlanGemini(
  body: PlannerGenerateRequest,
): Promise<PlannerGenerateResponse> {
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: config.geminiModel,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  });

  const userText = JSON.stringify({
    profile: body.profile,
    scope: body.scope,
    anchorDate: body.anchorDate,
    locale: body.locale ?? 'en',
  });

  try {
    const result = await model.generateContent([PLANNER_PROMPT, userText]);
    const raw = result.response.text();
    const parsed = JSON.parse(raw) as { blocks?: StudyPlan['blocks'] };
    if (!Array.isArray(parsed.blocks) || parsed.blocks.length === 0) {
      throw new Error('Empty plan from model');
    }

    const plan: StudyPlan = {
      id: `plan_${randomUUID().slice(0, 8)}`,
      scope: body.scope,
      anchorDate: body.anchorDate,
      blocks: parsed.blocks.map((b) => ({
        ...b,
        id: b.id || `blk_${randomUUID().slice(0, 8)}`,
      })),
      generatedAt: new Date().toISOString(),
    };

    return { plan };
  } catch {
    return generatePlanMock(body);
  }
}
