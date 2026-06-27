# Task Board

## Purpose

Give users a **Trello-like** surface for tasks that ties into AI-generated study and productivity plans.

## Task model (minimum)

| Field | Description |
|-------|-------------|
| Title | Short description of the task |
| Priority | e.g. low / medium / high or numeric |
| Status | Done / not done (extend to columns later) |
| Time scope | Daily or weekly board membership |
| Optional link | Related subject or exam |

## Views

- **Daily board** — Today’s actionable items
- **Weekly board** — Broader goals and milestones

## AI integration

- Gemini (via backend) can propose tasks, reorder by priority, and split study goals into cards
- Presentation should mirror familiar kanban/Trello patterns so users trust and edit the layout
- **Human edits win** — AI suggestions are drafts until accepted or edited

## Interaction with study planner

- Planner output can spawn cards automatically (e.g. “Chapter 3 — 45 min”)
- Completing a card may feed back into the next planning cycle (optional future feature)

## Storage

- Board state stored **locally** with the rest of the app profile
- Sync only task titles/status to the server if needed for AI replanning—not full document store
