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
│  └─ development/              setup, Claude Code governance
├─ public/                      static assets
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/page.tsx   public landing page "/"
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
│  │  ├─ layout/                AppShell, AppSidebar, AppHeader, AppBreadcrumb, PageHeader,
│  │  │                         RoutePage, SearchDialog, NotificationsMenu, UserMenu
│  │  ├─ shared/                ThemeProvider, ThemeScript, ThemeSwitcher, FormField
│  │  └─ feedback/              EmptyState, ErrorState
│  ├─ config/
│  │  ├─ env/                   schema.ts (Zod), client.ts (public), server.ts (server-only)
│  │  ├─ navigation.ts          sidebar sections, routes, breadcrumbs
│  │  ├─ site.ts                app name and description
│  │  └─ theme.ts               theme names and storage key
│  ├─ hooks/use-mobile.ts       viewport breakpoint hook (used by the sidebar)
│  ├─ lib/
│  │  ├─ utils/                 cn (token-aware class merging)
│  │  └─ query-client.ts        TanStack Query defaults
│  ├─ features/                 planned: one folder per feature module
│  ├─ server/                   planned: ai, speech, database, storage, auth adapters
│  ├─ stores/                   planned: Zustand stores, only if needed
│  └─ types/                    planned: shared types
├─ supabase/migrations/         planned: created with the Supabase integration
└─ tests/
   ├─ setup.ts                  Vitest setup (jest-dom, browser API stubs)
   ├─ unit/                     Vitest + RTL tests (config, lib, components, pages)
   ├─ integration/              planned
   └─ e2e/                      Playwright specs
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
