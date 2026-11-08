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
Proxy (src/proxy.ts)                      session refresh + optimistic auth redirects
  │
  ▼
Next.js App Router (src/app)
  ├─ (marketing)  public pages            "/"
  ├─ (auth)       sign-in/up, reset       /sign-in … /reset-password, /auth/confirm
  ├─ (app)        app shell + routes      /dashboard … /settings (sign-in required)
  └─ api/         route handlers          /api/health
        │
        ▼
Feature modules (src/features/*)          auth, settings · planned: vocabulary, reading, …
        │
        ▼
Server adapters (src/server/*)            auth, database, activity · planned: ai, speech, storage
        │
        ▼
External providers                        Supabase (Postgres + Auth) · planned: Claude, STT/TTS
```

Phase 0 implemented the routing layer, shared UI, configuration and design system. P1 adds
Supabase, authentication and settings (see [ADR 0006](../decisions/0006-supabase-auth-platform.md)).
Feature modules and server adapters are introduced with the first feature that needs them (empty
placeholder folders are intentionally not created).

## Authentication and authorization

| Layer                                   | Role                                                                                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/proxy.ts` + `src/config/routes.ts` | Refreshes the session cookie; redirects signed-out users away from app routes (deny by default) and signed-in users away from auth pages. Optimistic only. |
| `src/server/auth/session.ts`            | Data access layer: `getCurrentUser()` / `requireUser()` verify the session per request.                                                                    |
| Postgres RLS                            | Final boundary: each user reads and writes only their own rows.                                                                                            |

Auth state changes (sign-in, sign-out, password reset, account deletion) end with a full page
load (`navigateWithFullReload`). Otherwise Cache Components would keep earlier routes mounted
in the tab.

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

- `cacheComponents` and `partialPrefetching` are enabled in `next.config.ts`. Marketing and auth
  pages prerender as static. App routes are partially prerendered: the shell is static, and
  session data (account menu, profile) streams inside `<Suspense>`. `/auth/confirm` is dynamic.
  Dynamic data (cookies, headers, uncached fetches) must sit inside `<Suspense>` or be cached
  explicitly.
- `createSupabaseServerClient` awaits `io()` after reading cookies, so Supabase work (which reads
  `Date.now()`) never runs inside a prerender.
- Client-side providers live in `src/app/providers.tsx`: theme, TanStack Query, tooltips, toasts.
- The theme is applied before first paint by an inline script (`ThemeScript`) and kept in sync
  by `ThemeProvider` (see [ADR 0003](../decisions/0003-theme-without-next-themes.md)).

## Error handling

- Route-level: `src/app/(app)/error.tsx` (recoverable, with retry), `loading.tsx` (skeleton),
  `src/app/not-found.tsx`.
- Component-level: `ErrorState` and `EmptyState` from `src/components/feedback`.
- Environment errors fail fast at startup with a list of invalid variable names (never values).
