# Desktop Platform Support

Escopenote targets **Linux** and **Windows** as first-class desktop platforms. macOS may run via Electron defaults but is not a primary release target yet.

## Runtime matrix

| Platform | Dev (`npm run dev`) | Packaged (`npm run dist`) |
|----------|---------------------|---------------------------|
| Linux | AppImage | `npm run dist:linux` |
| Windows | Native window | `npm run dist:win` (NSIS installer) |

## Window chrome

| OS | Chrome |
|----|--------|
| Linux | Frameless window + in-app title bar (min / max / close via IPC) |
| Windows | Frameless window + in-app title bar |
| macOS | Native frame (if run on darwin) |

Drag region uses `-webkit-app-region: drag` on the title bar (Electron standard on both Linux and Windows).

## Paths and storage (later phases)

- Use `app.getPath('userData')` in **main** only — OS-specific, no hard-coded `/home` or `C:\`.
- Use `path.join()` for all file paths.
- Preload exposes paths via IPC; renderer never builds absolute paths from strings.

## CI

GitHub Actions runs `typecheck`, `lint`, and `build` on **ubuntu-latest** and **windows-latest**.

## Local prerequisites

| OS | Notes |
|----|--------|
| Linux | Node 20+, display server; dev disables Chromium sandbox (`ELECTRON_DISABLE_SANDBOX`, `--no-sandbox`) — see [desktop README](../../apps/desktop/README.md) |
| Windows | Node 20+, Visual Studio Build Tools only if you add native modules later |

See [apps/desktop/README.md](../../apps/desktop/README.md) for commands.
