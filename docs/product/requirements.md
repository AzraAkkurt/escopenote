# Requirements

## User-provided data

| Input | Used for |
|-------|----------|
| Courses / subjects | Plan structure and time allocation |
| Exams and dates | Deadlines and prioritization |
| Study time windows | Realistic daily/weekly schedules |
| Subject difficulty | Weighting effort per topic |
| Workload / busyness | Intensity and break suggestions |

## System outputs

### Study planning

- **Daily plan** — What to study today, in what order, for how long
- **Weekly plan** — Broader view aligned with exam dates
- **Workload-aware suggestions** — Adjust when the user is overloaded or has slack

### Task board

- Tasks with name, priority, status (done / not done)
- AI-generated layouts compatible with human editing
- Separate **daily** and **weekly** views

### Chat (RAG)

- Answers grounded in user-ingested documents
- Streaming or “typing” style UX where appropriate
- Web research when local retrieval is insufficient
- Optional write-back of new knowledge into the local index

## Non-functional requirements

| Area | Requirement |
|------|-------------|
| Privacy | User files and embeddings default to **local only** |
| Compliance | Design supports GDPR-friendly “data stays on device” positioning |
| Backend | Gemini API used via your orchestration layer, not exposed raw to clients |
| Internationalization | UI strings externalized; English as primary content language |
| Platform | Desktop (Electron primary candidate; Tauri noted as lighter alternative) |

## Out of scope (for initial docs)

- Mobile clients
- Multi-user collaboration on one vector store
- Server-persisted full user corpora (explicitly avoided by architecture)
