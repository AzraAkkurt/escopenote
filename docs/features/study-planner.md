# Study Planner

## Purpose

Turn structured user inputs into **actionable daily and weekly study schedules** using Gemini, respecting exams, difficulty, and available time.

## User inputs

- Subjects / courses
- Exam names and dates
- How many hours per day or week the user can study
- Difficulty per subject (e.g. easy / medium / hard or numeric scale)
- Optional: current stress or “busy week” flag for intensity tuning

## AI behavior

- Propose **time blocks** per subject before each exam
- Increase weight on harder or nearer-deadline topics
- Suggest lighter days or catch-up blocks when workload is high
- Output should be **human-editable** (not a one-shot immutable plan)

## UI expectations

- Clear **day** and **week** views
- Sync with the task board where tasks represent concrete study actions
- English labels in the default locale; strings ready for i18n

## Backend role

- Aggregate user profile + calendar constraints
- Call Gemini with structured prompts (and optional tools for date math)
- Return plan JSON the desktop app renders and stores locally

## Data locality

Study metadata (grades, schedules) should follow the same privacy tier as the rest of the app: **store on device**, send only what is needed per planning request unless the user opts into cloud backup later.
