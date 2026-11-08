# IELTS Learning Hub

A personalised English and IELTS learning SaaS for individual learners: structured lessons,
grammar and vocabulary, practice for all four IELTS skills, an AI personal tutor and progress
analytics.

> **Status: P2 — content & practice engine.**
>
> - **Phase 0** (architecture, design system, app shell, tooling, tests) is complete.
> - **P1** added Supabase, email authentication and Settings.
> - **P2** adds the content catalogue, a server-side practice engine (attempts, autosave,
>   timer, scoring, explanations) and a first Reading practice flow with one local sample set.
>
> Google sign-in, Grammar, Vocabulary, Writing, Speaking and AI are not implemented yet.

## Technology stack

| Area         | Choice                                                                    |
| ------------ | ------------------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router, Turbopack, Cache Components, Partial Prefetching) |
| UI           | React 19, TypeScript (strict)                                             |
| Styling      | Tailwind CSS v4, design tokens in `src/app/globals.css`                   |
| Components   | shadcn/ui (Radix base), Lucide icons                                      |
| Forms & data | React Hook Form, Zod, TanStack Query                                      |
| Testing      | Vitest + React Testing Library (jsdom), Playwright                        |
| Quality      | ESLint 9 (flat config), Prettier (+ Tailwind plugin), Husky + lint-staged |
| Tooling      | pnpm 10, Node.js 24                                                       |

## Prerequisites

- **Node.js ≥ 22.12** — the project pins **24** in `.nvmrc`
- **pnpm 10** — version pinned via `packageManager` in `package.json` (`corepack enable` or
  `npm i -g pnpm@10`)
- Git
- Docker and the [Supabase CLI](https://supabase.com/docs/guides/local-development) for the
  local database (on Windows: inside WSL, see the [setup guide](docs/development/setup.md#local-supabase))

## Installation

```bash
nvm use 24            # or any Node >= 22.12
pnpm install          # also installs the Husky git hooks
pnpm db:start         # start the local Supabase stack (Docker)
pnpm env:local        # write .env.local from the running stack
pnpm dev              # http://localhost:3000
```

## Commands

| Command                                   | What it does                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm dev`                                | Start the development server                                                                 |
| `pnpm build`                              | Production build                                                                             |
| `pnpm start`                              | Serve the production build                                                                   |
| `pnpm lint`                               | ESLint (includes architecture import rules)                                                  |
| `pnpm typecheck`                          | Generate Next.js route types, then `tsc --noEmit`                                            |
| `pnpm format`                             | Format all files with Prettier                                                               |
| `pnpm format:check`                       | Check formatting (CI)                                                                        |
| `pnpm test`                               | Unit and integration tests (Vitest, single run)                                              |
| `pnpm test:watch`                         | Vitest in watch mode                                                                         |
| `pnpm test:e2e`                           | Playwright end-to-end tests (builds and starts the app on :3100)                             |
| `pnpm db:start` / `db:stop` / `db:status` | Start, stop or inspect the local Supabase stack                                              |
| `pnpm db:reset`                           | Recreate the local database from `supabase/migrations`                                       |
| `pnpm db:test`                            | Database tests (pgTAP, `supabase/tests/database`)                                            |
| `pnpm db:types`                           | Regenerate `src/server/database/database.types.ts`                                           |
| `pnpm env:local`                          | Write `.env.local` from the running local stack (`--force` to overwrite)                     |
| `pnpm content:seed`                       | Validate `content/practice-sets/*.json` and write `supabase/seed.sql` (then `pnpm db:reset`) |

First E2E run: `pnpm exec playwright install chromium`. E2E tests need the local Supabase stack
and `.env.local`.

## Environment configuration

Variables are validated with Zod in `src/config/env/` and documented in `.env.example`.
The Supabase URL and publishable key are required. Other integrations stay optional until
implemented. For local development, start Supabase with `pnpm db:start` and then run
`pnpm env:local` to create `.env.local` (see [setup](docs/development/setup.md#local-supabase)).

| Variable                               | Scope           | Purpose                                                        |
| -------------------------------------- | --------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                  | public          | Canonical app URL (default `http://localhost:3000`)            |
| `NEXT_PUBLIC_SUPABASE_URL`             | public          | Supabase project URL (**required**)                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public          | Supabase publishable key `sb_publishable_…` (**required**)     |
| `SUPABASE_SECRET_KEY`                  | **server only** | Supabase secret key `sb_secret_…`, bypasses RLS (not used yet) |
| `ANTHROPIC_API_KEY`                    | **server only** | Claude API (future)                                            |
| `SPEECH_TO_TEXT_API_KEY`               | **server only** | Speech recognition provider (future)                           |
| `TEXT_TO_SPEECH_API_KEY`               | **server only** | Speech synthesis provider (future)                             |
| `MAILPIT_URL`                          | tests only      | Local email inbox read by E2E tests (written by `env:local`)   |

The legacy names `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are not
supported ([ADR 0006](docs/decisions/0006-supabase-auth-platform.md)).

Server-only variables are read through `src/config/env/server.ts`, which imports
`server-only` so it can never be bundled for the browser. Never commit `.env*` files other than
`.env.example`.

## Documentation

- Architecture: [`docs/architecture/overview.md`](docs/architecture/overview.md),
  [`docs/architecture/folder-structure.md`](docs/architecture/folder-structure.md)
- Design system: [`docs/design-system/design-tokens.md`](docs/design-system/design-tokens.md),
  [`docs/design-system/components.md`](docs/design-system/components.md)
- Development: [`docs/development/setup.md`](docs/development/setup.md),
  [`docs/development/claude-code-governance.md`](docs/development/claude-code-governance.md)
- Product: [`docs/product/`](docs/product/) — requirements, information architecture, user journeys, MVP roadmap (draft)
- Decisions: [`docs/decisions/`](docs/decisions/)
- Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md)
