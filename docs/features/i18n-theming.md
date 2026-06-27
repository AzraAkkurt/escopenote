# Internationalization and Theming

## Language

- **Primary content language: English** — default UI copy, AI system prompts, and documentation
- **UI localization** — support multiple display languages via string tables (e.g. JSON or i18n library)
- User-generated content (notes, task titles) stays in whatever language the user types

## Theming

- At least one light and one dark theme
- Central design tokens (colors, spacing, typography) for Electron renderer
- Persist theme choice in local user settings

## Implementation hints (desktop)

- Keep strings out of components; use a single `en` fallback locale
- Respect OS dark mode as optional default
- Ensure chat and board components use theme tokens, not hard-coded colors

## AI prompts

- Base orchestration prompts in English for consistency with Gemini
- Optionally pass `user_locale` so answers can match UI language without mixing doc languages
