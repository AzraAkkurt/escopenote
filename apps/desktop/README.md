# Escopenote Desktop

Cross-platform Electron app (**Linux** and **Windows**) — v1.0.0. See [platform support](../../docs/frontend/platform-support.md) and [packaging](../../docs/frontend/packaging.md).

## Theming & i18n

- **Themes:** Light, dark, or system — persisted via IPC (`settings.json` in user data)
- **Languages:** English (`en`), Turkish (`tr`) — same settings store
- **Fixture mode:** `VITE_USE_FIXTURES=true` in `.env` for mock storage reads

## Structure

```txt
apps/desktop/
  src/main/       # Electron main process + platform window options
  src/preload/    # contextBridge API
  src/renderer/   # React UI (Vite, HashRouter)
  shared/         # Types shared main ↔ renderer
  out/            # Build output (gitignored)
```

## Prerequisites

| OS | Requirements |
|----|----------------|
| Linux | Node 20+, display server (X11 or Wayland) |
| Windows | Node 20+ |

### Linux sandbox (dev)

If Electron exits with `setuid_sandbox_host` / `chrome-sandbox` errors, `npm run dev` already sets:

- `ELECTRON_DISABLE_SANDBOX=1`
- `electron . --no-sandbox`
- main process flags in `src/main/platform.ts` (dev only)

Optional system fix (requires sudo, survives until `npm install` refreshes Electron):

```bash
bash scripts/fix-chrome-sandbox.sh
```

## Setup

```bash
cd apps/desktop
cp .env.example .env
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev gateway + Vite HMR + Electron |
| `npm run dev:gateway` | AI gateway only (`http://127.0.0.1:3000`) |
| `npm run build` | Compile main, preload, and renderer |
| `npm run dist` | Build + package for current OS |
| `npm run dist:linux` | AppImage (Linux) |
| `npm run dist:win` | NSIS installer (Windows) |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |

## Routes (HashRouter)

| Path | Screen |
|------|--------|
| `#/` | Dashboard |
| `#/planner` | Study planner |
| `#/board` | Task board |
| `#/chat` | Chat |
| `#/library` | Knowledge library |
| `#/settings` | Settings |

## Window chrome

- **Linux / Windows**: frameless window + custom title bar (minimize, maximize, close via IPC)
- Drag region on title bar (`-webkit-app-region: drag`)

## Security

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- Preload exposes whitelisted `window.escopenote` (health, platform, window controls)

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/⌘ + 1–6 | Dashboard, Planner, Board, Chat, Library, Settings |
| Ctrl/⌘ + N | New chat |
| ? | Show shortcuts |

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_GATEWAY_URL` | Default gateway URL until Settings saves a value |
| `VITE_USE_FIXTURES` | `true` = in-memory fixtures, no disk writes |
| `ESCOPENOTE_GATEWAY_PORT` | Dev gateway port (default `3000`) |

## Data backup

Settings → System → **Export backup** / **Import backup** (JSON). Includes settings and app storage namespaces; re-index library files after import if needed.

## Security

- API keys only on your **gateway server**, never in the desktop app
- Local documents and RAG index stay on disk under Electron `userData`
- Outbound AI requests send **chunk excerpts only** (see dev gateway logs)

## Release

See [CHANGELOG.md](./CHANGELOG.md) and [packaging.md](../../docs/frontend/packaging.md).
