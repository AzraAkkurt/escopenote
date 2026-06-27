import { randomUUID } from 'node:crypto';
import type {
  PlannerGenerateRequest,
  PlannerGenerateResponse,
  PlannerSubject,
  StudyPlan,
} from '@escopenote/contracts';

const DIFFICULTY_WEIGHT: Record<string, number> = { easy: 1, medium: 2, hard: 3 };

function weightedSubjects(subjects: PlannerSubject[]): PlannerSubject[] {
  const named = subjects.filter((s) => s.name?.trim());
  const expanded: PlannerSubject[] = [];
  for (const s of named) {
    const w = DIFFICULTY_WEIGHT[s.difficulty ?? 'medium'] ?? 2;
    for (let i = 0; i < w; i++) {
      expanded.push(s);
    }
  }
  return expanded;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function generatePlanMock(body: PlannerGenerateRequest): PlannerGenerateResponse {
  const pool = weightedSubjects(body.profile.subjects ?? []);
  const blocks: StudyPlan['blocks'] = [];
  const { scope, anchorDate } = body;
  const busyWeek = body.profile.busyWeek ?? false;

  if (scope === 'day') {
    const blockCount = busyWeek
      ? Math.min(4, pool.length || 2)
      : Math.min(6, pool.length || 3);
    const perBlock = Math.floor(Math.min(body.profile.hoursPerDay * 60, 480) / blockCount);
    for (let i = 0; i < blockCount; i++) {
      const subject = pool[i % pool.length] ?? { id: 's0', name: 'Study' };
      const hour = 9 + Math.floor((i * perBlock) / 60);
      const minute = (i * perBlock) % 60;
      blocks.push({
        id: `blk_${randomUUID().slice(0, 8)}`,
        subjectId: subject.id,
        subjectName: subject.name,
        title: `${subject.name} — Session ${i + 1}`,
        startTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        durationMinutes: perBlock,
        date: anchorDate,
      });
    }
  } else {
    const days = busyWeek ? 5 : 7;
    const minutesPerDay = Math.floor((body.profile.hoursPerWeek * 60) / days);
    const blocksPerDay = busyWeek ? 1 : 2;
    const perBlock = Math.floor(minutesPerDay / blocksPerDay);
    for (let day = 0; day < days; day++) {
      const date = addDays(anchorDate, day);
      for (let b = 0; b < blocksPerDay; b++) {
        const subject = pool[(day * blocksPerDay + b) % pool.length] ?? {
          id: 's0',
          name: 'Study',
        };
        blocks.push({
          id: `blk_${randomUUID().slice(0, 8)}`,
          subjectId: subject.id,
          subjectName: subject.name,
          title: `${subject.name} — Day ${day + 1}`,
          durationMinutes: perBlock,
          dayIndex: day,
          date,
        });
      }
    }
  }

  const plan: StudyPlan = {
    id: `plan_${randomUUID().slice(0, 8)}`,
    scope,
    anchorDate,
    blocks,
    generatedAt: new Date().toISOString(),
  };

  return { plan };
}
