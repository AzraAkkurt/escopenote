# Phase 2 — Design System & i18n

## Goal

Establish **visual consistency** and **localization plumbing** before feature UIs grow.

## Depends on

[Phase 1 — Shell & navigation](./phase-01-shell-navigation.md)

## In scope

- Design tokens: color, spacing, radius, typography, shadows
- Light and dark themes (CSS variables or theme provider)
- Base components: `Button`, `Input`, `Select`, `Card`, `Modal`, `Toast`, `Badge`, `Spinner`, `Tabs`
- i18n setup (e.g. `i18next` or `react-intl`) with `en` as default locale
- String files: `locales/en/*.json` — no user-facing literals in JSX
- OS theme detection on first launch (optional default)
- Settings UI stubs: theme toggle, language selector (can persist in memory until Phase 3)

## Out of scope

- Full translation for all languages (add `tr` or others incrementally)
- Custom icon set illustration work (use Lucide/Heroicons/etc.)

## Deliverables

| Asset | Location (example) |
|-------|-------------------|
| Token file | `renderer/styles/tokens.css` |
| Theme switch | Settings + persisted hook (Phase 3 wires storage) |
| Component library folder | `renderer/components/ui/` |
| English strings | `renderer/locales/en/common.json`, `navigation.json`, … |

## Acceptance criteria

- [ ] Entire shell switches light/dark without broken contrast
- [ ] All Phase 1 screens use shared components (no one-off raw `<button>` styles)
- [ ] Changing language updates nav labels (at least `en` + one second locale for proof)
- [ ] Chat and board placeholders use tokens only (no `#fff` in feature code)

## Reference

[i18n & theming](../../features/i18n-theming.md)

## Next phase

[Phase 3 — Data layer & IPC](./phase-03-data-layer-ipc.md)
