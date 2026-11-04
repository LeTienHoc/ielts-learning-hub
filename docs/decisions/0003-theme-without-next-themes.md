# 0003 — Own theme provider instead of next-themes

- **Status:** Accepted (2026-11-04)

## Context

shadcn/ui suggests `next-themes`. With React 19 it renders a `<script>` from a Client Component,
which React warns about in development. The Next.js 16 guide "Preventing flash before hydration"
recommends an inline script in the server-rendered document instead.

## Decision

- `ThemeScript` (server-rendered in the root `<head>`) applies the stored or system theme before
  first paint.
- `ThemeProvider` / `useTheme` (≈100 lines, `useSyncExternalStore`) manage light / dark / system,
  persist to `localStorage` (`ilh-theme`), follow OS changes and sync across tabs.
- `next-themes` is not a dependency.

## Consequences

- No hydration flash and no React script warning; one dependency fewer.
- We maintain the provider ourselves (covered by unit and E2E tests).
