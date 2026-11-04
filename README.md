# IELTS Learning Hub

A personalised English and IELTS learning SaaS for individual learners: structured lessons,
grammar and vocabulary, practice for all four IELTS skills, an AI personal tutor and progress
analytics.

> **Status: Phase 0 — foundation.** This repository currently contains the application
> foundation only: architecture, design system, responsive app shell, route placeholders,
> environment validation, tooling and tests. No learning features, AI, database or
> authentication are implemented yet.

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

## Installation

```bash
nvm use 24            # or any Node >= 22.12
pnpm install          # also installs the Husky git hooks
cp .env.example .env.local   # optional: no variables are required to run Phase 0
pnpm dev              # http://localhost:3000
```

## Commands

| Command             | What it does                                                     |
| ------------------- | ---------------------------------------------------------------- |
| `pnpm dev`          | Start the development server                                     |
| `pnpm build`        | Production build                                                 |
| `pnpm start`        | Serve the production build                                       |
| `pnpm lint`         | ESLint (includes architecture import rules)                      |
| `pnpm typecheck`    | Generate Next.js route types, then `tsc --noEmit`                |
| `pnpm format`       | Format all files with Prettier                                   |
| `pnpm format:check` | Check formatting (CI)                                            |
| `pnpm test`         | Unit and integration tests (Vitest, single run)                  |
| `pnpm test:watch`   | Vitest in watch mode                                             |
| `pnpm test:e2e`     | Playwright end-to-end tests (builds and starts the app on :3100) |

First E2E run: `pnpm exec playwright install chromium`.

## Environment configuration

Variables are validated with Zod in `src/config/env/` and documented in `.env.example`.
None are required for Phase 0; integrations are optional until implemented.

| Variable                        | Scope           | Purpose                                             |
| ------------------------------- | --------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`           | public          | Canonical app URL (default `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL`      | public          | Supabase project URL (future)                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public          | Supabase anonymous key (future)                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | **server only** | Supabase admin access (future)                      |
| `ANTHROPIC_API_KEY`             | **server only** | Claude API (future)                                 |
| `SPEECH_TO_TEXT_API_KEY`        | **server only** | Speech recognition provider (future)                |
| `TEXT_TO_SPEECH_API_KEY`        | **server only** | Speech synthesis provider (future)                  |

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
- Decisions: [`docs/decisions/`](docs/decisions/)
- Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md)
