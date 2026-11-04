# Development setup

## Environment

| Tool    | Version                                 | Notes                                                     |
| ------- | --------------------------------------- | --------------------------------------------------------- |
| Node.js | ≥ 22.12 (project uses **24**, `.nvmrc`) | Required by Next.js 16, Vitest 5, jsdom, lint-staged      |
| pnpm    | 10 (pinned in `packageManager`)         | Only supported package manager                            |
| Git     | any recent version                      | Husky installs the pre-commit hook                        |
| Editor  | VS Code recommended                     | EditorConfig, ESLint, Prettier, Tailwind CSS IntelliSense |

## Installation

```bash
nvm install 24 && nvm use 24     # nvm-windows: run `nvm use 24` in an elevated terminal
corepack enable                  # or: npm i -g pnpm@10
pnpm install
cp .env.example .env.local       # optional in Phase 0
pnpm dev
```

Open <http://localhost:3000> (landing page) or <http://localhost:3000/dashboard> (app shell).

Before the first E2E run: `pnpm exec playwright install chromium`.

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

| Symptom                                                                                            | Cause / fix                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Unsupported engine` warnings, or Vitest / lint-staged crash with `util.styleText` / syntax errors | Node is older than 22.12. Run `node -v`; switch with `nvm use 24`. On nvm-windows the switch is global and needs an elevated terminal.                                        |
| Pre-commit hook fails although `pnpm lint` works in your terminal                                  | Git runs the hook with the Node on its own PATH (e.g. a GUI client or another shell). Make Node 24 the default (`nvm use 24`) or add it to PATH in `~/.config/husky/init.sh`. |
| `Invalid environment variables:` on start                                                          | A value in `.env.local` fails validation (the message names the variable). Fix it or remove the line; empty values count as unset.                                            |
| `pnpm test:e2e` reuses an old build                                                                | Locally Playwright reuses a server already on port 3100. Stop it, or run `pnpm build` first.                                                                                  |
| Playwright: `Executable doesn't exist`                                                             | `pnpm exec playwright install chromium`.                                                                                                                                      |
| Fonts fail to load during `pnpm build`                                                             | `next/font/google` downloads Inter at build time; the build machine needs internet access.                                                                                    |
| Theme flashes on load                                                                              | `ThemeScript` must stay in the root layout `<head>`.                                                                                                                          |
| Class like `text-h1` disappears when combined with another class                                   | The token is not registered in `src/lib/utils/cn.ts`.                                                                                                                         |
| ESLint: `'cn' import from 'cn' is restricted`                                                      | Newly added shadcn component — import `cn` from `@/lib/utils`.                                                                                                                |
