# Packaging & distribution

## Build installers

From `apps/desktop`:

```bash
npm install
npm run dist        # current OS
npm run dist:linux  # AppImage
npm run dist:win    # NSIS installer
```

Artifacts land in `apps/desktop/release/`.

## App icon

Place a **512×512 PNG** at `apps/desktop/build/icon.png` (and `.ico` for Windows). Then add to `package.json` → `build.icon`:

```json
"icon": "build/icon.png"
```

Without a custom icon, electron-builder uses the default Electron icon.

## Code signing (document before release)

| Platform | Notes |
|----------|--------|
| **Windows** | Authenticode certificate; sign NSIS output |
| **Linux** | AppImage optional GPG signature; distro-specific packages later |

Signing credentials must never be committed to the repo.

## Auto-updates

Not bundled in v1.0. Options for a future release:

1. **[electron-updater](https://www.electron.build/auto-update)** with a release feed (GitHub Releases or your CDN)
2. **Manual** — users download installers from your site

Document the chosen channel in release notes when enabled.

## Clean VM smoke test

1. Install build on a VM without Node.js
2. Launch app → complete or skip onboarding
3. Start dev/production gateway
4. Add a `.md` file → index → ask in chat
5. Generate a day plan

## Privacy copy

First-run onboarding summarizes local vs gateway data flow. Keep aligned with [architecture/data-flow.md](../architecture/data-flow.md).
