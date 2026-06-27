# Courses (Kütüphane)

## Purpose

Organize study materials by **course** instead of a flat file list. Each course groups files, indexed links, and notes for scoped RAG chat.

## Data model

- `Course`: id, name, icon, resourceIds[]
- `Resource`: polymorphic — `file` | `link` | `note`

## User flows

### Create course

1. Library page → **Add course** (top right)
2. Enter name, optional emoji icon
3. Course appears in card grid

### Add sources

From course detail:

| Action | Behavior |
|--------|----------|
| Add file | Dialog → parse → chunk → index |
| Add link | Fetch URL → HTML strip → `.md` snapshot → index |
| Add note | Opens Notlarım with `courseId`; saved note becomes a source |

### Edit course

- Update name/icon
- Remove individual resources (chunks deleted from RAG index)

## Migration

Existing flat `library.index` files migrate into a **Genel** course on first launch (v2 migration).

## IPC

- `courses:*` — CRUD
- `resources:*` — add files/links, reindex, progress events
