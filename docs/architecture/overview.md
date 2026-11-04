# Architecture overview

IELTS Learning Hub is a **single Next.js application** organised as a **modular monolith** with
**feature-based modules** (see [ADR 0001](../decisions/0001-modular-monolith.md)). One
deployable, one codebase, clear internal boundaries — so features can grow independently without
the cost of a monorepo or microservices.

## System view

```
Browser
  │  React Server Components payload + client islands
  ▼
Next.js App Router (src/app)
  ├─ (marketing)  public pages            "/"
  ├─ (app)        app shell + routes      /dashboard … /settings
  └─ api/         route handlers          /api/health
        │
        ▼
Feature modules (src/features/*)          ← planned: vocabulary, grammar, reading, …
        │
        ▼
Server adapters (src/server/*)            ← planned: ai, speech, database, storage, auth
        │
        ▼
External providers                        ← planned: Supabase, Anthropic Claude, STT/TTS
```

Phase 0 implements the routing layer, shared UI, configuration and design system. Feature
modules and server adapters are introduced with the first feature that needs them (empty
placeholder folders are intentionally not created).

## Layer responsibilities

| Layer         | Location                                     | Responsibility                                                                                                       |
| ------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Routing       | `src/app`                                    | Route segments, layouts, metadata, `loading`/`error`/`not-found`, route handlers. Thin: composes, no business logic. |
| Features      | `src/features/<feature>`                     | Feature UI, hooks, services, schemas, types. Exposes a public `index.ts`.                                            |
| Shared UI     | `src/components/{ui,layout,shared,feedback}` | Business-agnostic components: design-system primitives, app shell, cross-feature composites, feedback states.        |
| Server        | `src/server/<area>`                          | Server-only infrastructure and provider adapters behind typed service functions. Imports `server-only`.              |
| Configuration | `src/config`                                 | Navigation, site metadata, theme constants, validated environment.                                                   |
| Library       | `src/lib`                                    | Pure helpers (`cn`, query client factory).                                                                           |
| Cross-cutting | `src/hooks`, `src/stores`, `src/types`       | Shared hooks; Zustand stores only when shared client state is necessary; shared types.                               |

## Feature boundaries

- A feature owns its UI, data access orchestration, validation schemas and types.
- Other code imports a feature only via `@/features/<name>` (its `index.ts`). Deep imports such
  as `@/features/reading/components/x` are rejected by ESLint.
- Code needed by two features moves down a layer (`components/`, `lib/`, `server/`) instead of
  one feature importing the other's internals.

## Dependency rules

```
app ──► features ──► components ──► lib, config, types
 │         │
 └─────────┴──► server ──► lib, config, types
```

| Rule                                                                               | Enforcement                          |
| ---------------------------------------------------------------------------------- | ------------------------------------ |
| `components`, `lib`, `hooks`, `config` must not import `features`, `app`, `server` | ESLint `no-restricted-imports`       |
| Features import each other only through their public index                         | ESLint `no-restricted-imports`       |
| `cn` is imported from `@/lib/utils` (token-aware), not the raw package             | ESLint `no-restricted-imports`       |
| No circular dependencies                                                           | ESLint `import/no-cycle`             |
| Server-only modules never reach the client bundle                                  | `import "server-only"` (build error) |
| External input validated at the boundary                                           | Zod schemas (review)                 |

## Rendering model

- `cacheComponents` and `partialPrefetching` are enabled in `next.config.ts`. All current routes
  prerender as static (`next build` output). Future dynamic data (cookies, headers, uncached
  fetches) must sit inside `<Suspense>` or be cached explicitly.
- Client-side providers live in `src/app/providers.tsx`: theme, TanStack Query, tooltips, toasts.
- The theme is applied before first paint by an inline script (`ThemeScript`) and kept in sync
  by `ThemeProvider` (see [ADR 0003](../decisions/0003-theme-without-next-themes.md)).

## Error handling

- Route-level: `src/app/(app)/error.tsx` (recoverable, with retry), `loading.tsx` (skeleton),
  `src/app/not-found.tsx`.
- Component-level: `ErrorState` and `EmptyState` from `src/components/feedback`.
- Environment errors fail fast at startup with a list of invalid variable names (never values).
