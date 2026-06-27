export type PlannerScope = 'day' | 'week';

export type SubjectDifficulty = 'easy' | 'medium' | 'hard';

export interface PlannerSubject {
  id: string;
  name: string;
  difficulty?: SubjectDifficulty;
}

export interface PlannerProfile {
  subjects: PlannerSubject[];
  hoursPerDay: number;
  hoursPerWeek: number;
  busyWeek?: boolean;
}

export interface PlannerGenerateRequest {
  profile: PlannerProfile;
  scope: PlannerScope;
  anchorDate: string;
  locale?: string;
}

export interface PlanBlock {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  startTime?: string;
  durationMinutes: number;
  date: string;
  dayIndex?: number;
}

export interface StudyPlan {
  id: string;
  scope: PlannerScope;
  anchorDate: string;
  blocks: PlanBlock[];
  generatedAt: string;
}

export interface PlannerGenerateResponse {
  plan: StudyPlan;
  usage?: {
    provider_cost_usd: number;
    app_tokens_charged: number;
    balance_remaining?: number;
  };
}
