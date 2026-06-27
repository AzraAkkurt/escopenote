# Product Overview

## Vision

Escopenote is a **desktop Electron app** that helps students organize course materials, take linked notes, and chat with an AI grounded in their own knowledge — while keeping sensitive data **on the device**.

## Core capabilities

### 1. Course library (Kütüphane)

- Create **courses** as cards with optional icons
- Attach **files**, **web links** (fetched and indexed), and **notes** as RAG sources
- All sources are chunked and indexed locally for retrieval

### 2. Notes (Notlarım)

- TipTap markdown-style editor with **wikilinks** (`[[Note Title]]`)
- Tabbed editing, backlinks panel, MD export
- Notes can belong to a course or stand alone; all are indexed for chat

### 3. RAG knowledge chat

- Answers from local chunked index; optional **course filter**
- When local context is insufficient, **web research** (gateway) with visible thinking/research steps
- Save web results or chat insights as notes or library sources

### 4. Overview home

- Recent courses and notes with quick actions

### 5. Theming and localization

- Light/dark theme, English and Turkish UI

## Target architecture

> Server-side AI orchestration + client-side private vector storage.

Gemini and orchestration live on your backend; embeddings, files, and the vector index live on the user's machine. The server receives queries and **transient context**, not the full private corpus.

## Removed in v2 redesign

- AI study planner
- Task board (Kanban)

These were replaced by the course-centric library and linked notes workflow.
