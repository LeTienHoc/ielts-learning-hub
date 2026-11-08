# Development setup

## Environment

| Tool         | Version                                 | Notes                                                     |
| ------------ | --------------------------------------- | --------------------------------------------------------- |
| Node.js      | ≥ 22.12 (project uses **24**, `.nvmrc`) | Required by Next.js 16, Vitest 5, jsdom, lint-staged      |
| pnpm         | 10 (pinned in `packageManager`)         | Only supported package manager                            |
| Git          | any recent version                      | Husky installs the pre-commit hook                        |
| Editor       | VS Code recommended                     | EditorConfig, ESLint, Prettier, Tailwind CSS IntelliSense |
| Docker       | Docker Engine or Docker Desktop         | Runs the local Supabase stack                             |
| Supabase CLI | recent version                          | `pnpm db:*` wraps it; on Windows install it inside WSL    |

## Installation

```bash
nvm install 24 && nvm use 24     # nvm-windows: run `nvm use 24` in an elevated terminal
corepack enable                  # or: npm i -g pnpm@10
pnpm install
pnpm db:start                    # local Supabase stack (see below)
pnpm env:local                   # writes .env.local from the running stack
pnpm dev
```

Open <http://localhost:3000> (landing page). App routes such as `/dashboard` require you to sign
in. Sign up at `/sign-up`; the confirmation email arrives in the local Mailpit inbox (URL shown
by `pnpm db:status`).

Before the first E2E run: `pnpm exec playwright install chromium`.

## Local Supabase

The app needs a Supabase project. For development, use the local stack from the Supabase CLI
(Docker). The scripts run the CLI from the project root:

| Command                     | Purpose                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm db:start` / `db:stop` | Start or stop the stack (first start downloads images)                                          |
| `pnpm db:status`            | URLs of the API, Studio and Mailpit inbox                                                       |
| `pnpm db:reset`             | Recreate the database from `supabase/migrations`                                                |
| `pnpm db:test`              | Run the pgTAP tests in `supabase/tests/database`                                                |
| `pnpm db:types`             | Regenerate `src/server/database/database.types.ts`                                              |
| `pnpm env:local`            | Write `.env.local` (URL, publishable key, Mailpit URL); never prints keys. `--force` overwrites |
| `pnpm content:seed`         | Validate `content/practice-sets/*.json` and regenerate `supabase/seed.sql`                      |

### Learning content

Content is JSON in three folders, each validated by a Zod schema in `src/lib/content/`:

| Folder                     | Schema                      | Notes                                                                                                                                                                                                                                         |
| -------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content/practice-sets/`   | `practiceSetSourceSchema`   | `evidence` must be an exact quote that appears once in its group's passage (`passage`, default 1); `kind: "full_test"` needs 3 passages, 40 marks and 60 minutes; passage `keyWords` must appear in the passage and use full word definitions |
| `content/vocabulary-sets/` | `vocabularySetSourceSchema` | each example's `cloze` must appear once in its sentence; a word shared by sets must be defined identically                                                                                                                                    |
| `content/grammar-topics/`  | `grammarTopicSourceSchema`  | `practice` lists only question groups; for Spot the mistake, `accepted` is the one wrong word and a `correction` is required                                                                                                                  |

After adding or editing a file:

1. Run `pnpm content:seed`. The script reports invalid fields per file.
2. Run `pnpm db:reset`.

Other rules:

- Only content with `"reviewStatus": "published"` is visible to learners.
- Real content must be reviewed by a person before it is published (decision D-04).
- The starter content is AI-drafted (`"source": "ai_assisted"`) and local only.
- `supabase/seed.sql` is generated; do not edit it by hand.

Schema changes go in a new migration (`pnpm supabase migration new <name>`), with RLS
policies and pgTAP tests. Then run `pnpm db:reset`, `pnpm db:test` and `pnpm db:types`.

### Windows: Supabase CLI inside WSL

If Docker runs only inside WSL (no Docker Desktop), install the Linux Supabase CLI in the WSL
distro. `scripts/supabase.mjs` then runs it there automatically:

- Distro: the default WSL distro, or set `SUPABASE_WSL_DISTRO`.
- Binary: `supabase` on the WSL `PATH`, otherwise `~/.local/bin/supabase`.
- To use a Windows `supabase` binary instead (e.g. with Docker Desktop), set `SUPABASE_NATIVE=1`.

When WSL does not forward `127.0.0.1` to Windows (some VPN or firewall software blocks it),
`pnpm env:local` detects this and writes the WSL IP into `.env.local` instead. That IP changes
when WSL restarts; re-run `pnpm env:local --force`.

## Daily workflow

```bash
pnpm dev                 # develop
pnpm lint                # ESLint incl. architecture rules
pnpm typecheck           # route types + tsc
pnpm test                # unit tests (pnpm test:watch while developing)
pnpm test:e2e            # E2E against a production build on port 3100
pnpm build               # production build
```

On commit, Husky runs lint-staged (ESLint `--fix` + Prettier) on staged files.

## Troubleshooting

| Symptom                                                                                            | Cause / fix                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Unsupported engine` warnings, or Vitest / lint-staged crash with `util.styleText` / syntax errors | Node is older than 22.12. Run `node -v`; switch with `nvm use 24`. On nvm-windows the switch is global and needs an elevated terminal.                                                                                       |
| Pre-commit hook fails although `pnpm lint` works in your terminal                                  | Git runs the hook with the Node on its own PATH (e.g. a GUI client or another shell). Make Node 24 the default (`nvm use 24`) or add it to PATH in `~/.config/husky/init.sh`.                                                |
| `Invalid environment variables:` on start                                                          | A value in `.env.local` fails validation (the message names the variable). Fix it or remove the line; empty values count as unset.                                                                                           |
| `pnpm env:local`: "Could not read local Supabase status"                                           | The stack is not running or is still starting (e.g. WSL just restarted and the containers are booting). Check `pnpm db:status`, wait until it succeeds, then retry. WSL stops an idle distro, so the stack may restart cold. |
| On Windows, requests to Supabase time out or fail                                                  | The WSL IP changed after a restart. Run `pnpm env:local --force` and restart the dev server.                                                                                                                                 |
| Sign-up email never arrives                                                                        | Local email goes to Mailpit, not a real inbox. Open the Mailpit URL from `pnpm db:status`.                                                                                                                                   |
| `pnpm test:e2e` reuses an old build                                                                | Locally Playwright reuses a server already on port 3100. Stop it, or run `pnpm build` first.                                                                                                                                 |
| Playwright: `Executable doesn't exist`                                                             | `pnpm exec playwright install chromium`.                                                                                                                                                                                     |
| Fonts fail to load during `pnpm build`                                                             | `next/font/google` downloads Inter at build time; the build machine needs internet access.                                                                                                                                   |
| Theme flashes on load                                                                              | `ThemeScript` must stay in the root layout `<head>`.                                                                                                                                                                         |
| Class like `text-h1` disappears when combined with another class                                   | The token is not registered in `src/lib/utils/cn.ts`.                                                                                                                                                                        |
| ESLint: `'cn' import from 'cn' is restricted`                                                      | Newly added shadcn component — import `cn` from `@/lib/utils`.                                                                                                                                                               |
