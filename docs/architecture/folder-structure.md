# Folder structure

Only folders with a current purpose exist. Folders marked _planned_ are created by the first
change that needs them.

```
.
├─ .claude/                     Claude Code governance (rules, skills, agents, hooks, settings)
├─ .husky/pre-commit            runs lint-staged (ESLint + Prettier on staged files)
├─ docs/
│  ├─ architecture/             this document, overview
│  ├─ decisions/                Architecture Decision Records (NNNN-title.md)
│  ├─ design-system/            tokens and component inventory
│  ├─ development/              setup, Claude Code governance
│  └─ product/                  requirements, IA, user journeys, MVP roadmap
├─ content/                     practice-sets/, vocabulary-sets/, grammar-topics/ as JSON (validated, then seeded)
├─ public/                      static assets
├─ scripts/
│  ├─ supabase.mjs              runs the Supabase CLI (inside WSL on Windows); used by pnpm db:*
│  ├─ write-local-env.mjs       pnpm env:local — writes .env.local from the local stack
│  ├─ build-content-seed.mts    pnpm content:seed — content/**/*.json → supabase/seed.sql
│  └─ content-seed.mts          pure SQL generation used by the seed script (unit tested)
├─ src/
│  ├─ proxy.ts                  session refresh + optimistic auth redirects (every request)
│  ├─ app/
│  │  ├─ (marketing)/page.tsx   public landing page "/"
│  │  ├─ (auth)/                sign-in, sign-up, forgot-password, reset-password,
│  │  │                         auth/confirm (email-link route handler)
│  │  ├─ (focus)/               focus-mode pages without the app shell (no sidebar):
│  │  │                         reading/…/attempt/[attemptId], grammar/…/practice/[attemptId],
│  │  │                         vocabulary/review, loading, error
│  │  ├─ (app)/                 authenticated-area routes sharing the app shell
│  │  │  ├─ layout.tsx          wraps pages in <AppShell>
│  │  │  ├─ loading.tsx         route skeleton
│  │  │  ├─ error.tsx           route error boundary
│  │  │  └─ <route>/page.tsx    dashboard, learning, vocabulary, grammar, reading, listening,
│  │  │                         writing, speaking, ai-tutor, progress, settings
│  │  ├─ api/health/route.ts    liveness endpoint
│  │  ├─ layout.tsx             root layout: font, metadata, theme script, providers
│  │  ├─ providers.tsx          client providers
│  │  ├─ not-found.tsx
│  │  └─ globals.css            design tokens (single source)
│  ├─ components/
│  │  ├─ ui/                    shadcn/ui primitives + IconButton (business-agnostic)
│  │  ├─ layout/                AppShell, FocusShell, AppSidebar, AppHeader, AppBreadcrumb, PageHeader,
│  │  │                         RoutePage, SearchDialog, NotificationsMenu, UserMenu
│  │  ├─ shared/                ThemeProvider, ThemeScript, ThemeSwitcher, FormField, BrandMark, Mascot
│  │  └─ feedback/              EmptyState, ErrorState
│  ├─ config/
│  │  ├─ env/                   schema.ts (Zod), client.ts (public), server.ts (server-only)
│  │  ├─ navigation.ts          sidebar sections, routes, breadcrumbs
│  │  ├─ routes.ts              public / auth-only routes and the proxy's redirect decision
│  │  ├─ site.ts                app name and description
│  │  └─ theme.ts               theme names and storage key
│  ├─ features/
│  │  ├─ auth/                  sign-in/up/reset forms, AccountMenu, auth Server Actions
│  │  ├─ settings/              profile form (incl. daily new words), account deletion, actions
│  │  ├─ practice/              practice engine UI: AttemptRunner, question inputs, timer,
│  │  │                         autosave hook, AttemptReview, engine Server Actions
│  │  ├─ reading/               Reading library, set intro, attempt and results (uses practice)
│  │  ├─ grammar/               topic catalogue + mastery, bilingual lessons, practice and results
│  │  └─ vocabulary/            sets, word cards, My words, daily review session, games, word garden
│  ├─ hooks/                    use-mobile (sidebar breakpoint), use-reduced-motion
│  ├─ lib/
│  │  ├─ utils/                 cn (token-aware class merging)
│  │  ├─ helpers/               safe-redirect, full-page-navigation
│  │  ├─ validators/            activity-event (Zod)
│  │  ├─ content/               authoring schemas: practice sets, vocabulary sets, grammar topics
│  │  ├─ learning/              mastery + garden stages, engine error codes (pure)
│  │  └─ query-client.ts        TanStack Query defaults
│  ├─ server/                   server-only (`import "server-only"`)
│  │  ├─ auth/                  session DAL (getCurrentUser, requireUser), proxy session refresh
│  │  ├─ database/              Supabase server client, generated database.types.ts
│  │  ├─ activity/              recordActivityEvent
│  │  ├─ practice/              practice-service: sets, attempts, engine RPCs, answer keys, check
│  │  ├─ vocabulary/            vocabulary-service: sets, words, SRS session, garden, weekly goal
│  │  └─ grammar/               grammar-service: topics, lessons, mastery
│  ├─ stores/                   planned: Zustand stores, only if needed
│  └─ types/                    planned: shared types
├─ supabase/
│  ├─ config.toml               local stack config (auth, email confirmation, redirect URLs)
│  ├─ migrations/               SQL migrations (tables, RLS, engine functions)
│  ├─ seed.sql                  GENERATED local content (pnpm content:seed)
│  ├─ templates/                auth email templates (token-hash links to /auth/confirm)
│  └─ tests/database/           pgTAP tests (pnpm db:test)
└─ tests/
   ├─ setup.ts                  Vitest setup (jest-dom, browser API stubs)
   ├─ unit/                     Vitest + RTL tests (config, lib, components, features, pages, scripts)
   ├─ integration/              planned
   └─ e2e/                      Playwright specs; support/ has auth + Mailpit helpers
```

## Feature module convention

```
src/features/<feature>/
  components/   feature UI
  hooks/        feature hooks (client)
  services/     orchestration; calls server adapters or route handlers
  schemas/      Zod schemas (types inferred with z.infer)
  types/        types not derived from schemas
  utils/        pure helpers
  index.ts      public API — the only import path for other modules
```

Create only the subfolders a feature uses. Routes in `src/app/(app)/<feature>/page.tsx` import
from the feature's `index.ts`.

## File conventions

- `kebab-case` file names; one main component per file, named export (pages and layouts use
  the default export Next.js requires).
- Tests mirror the source area under `tests/unit/<area>/` and end in `.test.ts(x)`; E2E specs end
  in `.spec.ts`.
- Colocate nothing test-related inside `src/`.
- Route metadata comes from `routeMetadata(href)` so titles live only in `src/config/navigation.ts`.
