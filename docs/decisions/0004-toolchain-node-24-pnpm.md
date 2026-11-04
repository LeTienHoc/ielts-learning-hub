# 0004 — Node 24, pnpm and the Next.js 16 defaults

- **Status:** Accepted (2026-11-04)

## Context

Current stable tooling requires modern Node: Next.js 16 (≥ 20.9), Vitest 5 and jsdom 30
(≥ 22.12), lint-staged 17 (≥ 22.22). `create-next-app` 16.4 enables Cache Components, Partial
Prefetching and a Turbopack-native Tailwind loader.

## Decision

- Node 24 (`.nvmrc`), `engines.node >= 22.12.0`.
- pnpm 10, pinned through `packageManager`; other package managers are not used.
- Keep the Next.js 16 defaults: `cacheComponents`, `partialPrefetching`, `@tailwindcss/turbopack`
  (no PostCSS config).
- TypeScript 5.9 and ESLint 9 (the versions `create-next-app` and `eslint-config-next` target).

## Consequences

- Developers on older Node must switch versions (documented in `docs/development/setup.md`).
- Dynamic data must respect Cache Components rules (Suspense or explicit caching).
- Upgrading to TypeScript 7 / ESLint 10 is a separate, deliberate change.
