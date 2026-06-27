# Phase 4 — Study Planner UI

## Goal

Let users **enter study profile data** and **view/edit** daily and weekly plans, using fixtures or a mock API until Phase 9.

## Depends on

[Phase 2](./phase-02-design-system-i18n.md), [Phase 3](./phase-03-data-layer-ipc.md)

## In scope

### Profile setup

- Subjects / courses list (add, edit, remove)
- Exams: name + date per subject
- Available study hours (per day / per week)
- Difficulty per subject (enum or 1–5)
- Optional: “busy week” / workload slider

### Plan views

- **Day view** — time blocks, subject labels, duration
- **Week view** — grid or list by day
- Inline edit: change duration, move block, delete block
- “Regenerate plan” action (calls mock → later real gateway)

### States

- Loading skeleton while “generating”
- Empty: prompt to complete profile
- Error: retry with message

## Out of scope

- Real Gemini planning logic (Phase 9)
- Automatic task board sync (Phase 5 hook only)

## Components

- `PlannerProfileForm`, `SubjectRow`, `ExamDatePicker`
- `DayPlanTimeline`, `WeekPlanGrid`
- `PlanBlockCard` (editable)
- `GeneratePlanButton`

## Mock contract (renderer)

```ts
// Request shape sent to gateway later
interface PlanGenerateRequest {
  profile: PlannerProfile;
  scope: 'day' | 'week';
  anchorDate: string; // ISO date
}

// Response
interface StudyPlan {
  id: string;
  scope: 'day' | 'week';
  blocks: PlanBlock[];
}
```

## Acceptance criteria

- [ ] Profile saves to `planner.profile` via IPC
- [ ] User can generate and see a day plan from fixture/mock
- [ ] User can edit blocks and saved plan persists locally
- [ ] Week view toggles without losing profile data
- [ ] All labels via i18n keys

## Reference

[Study planner feature](../../features/study-planner.md)

## Next phase

[Phase 5 — Task board UI](./phase-05-task-board.md)
