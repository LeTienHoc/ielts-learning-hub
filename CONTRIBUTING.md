# Contributing

Thanks for contributing to IELTS Learning Hub. Read
[`docs/architecture/overview.md`](docs/architecture/overview.md) before your first change.

## Coding conventions

- **TypeScript strict.** No `any`, no unchecked `as` casts, no `@ts-ignore` / `eslint-disable`
  to silence errors — fix the cause.
- **Naming.** Files and folders `kebab-case`; components `PascalCase`; hooks `useCamelCase`;
  constants `UPPER_SNAKE_CASE`; Zod schemas `somethingSchema`; types `PascalCase`.
- **Imports.** Use the `@/` alias across folders; `import type` for types; import `cn` from
  `@/lib/utils`; import other features only through `@/features/<name>`. ESLint enforces these.
- **Server first.** Server Components by default; add `"use client"` only to the leaf that needs
  state, effects or browser APIs. Code touching secrets or providers lives in `src/server/` and
  imports `server-only`.
- **Validation.** Validate all external input (forms, params, request bodies, env, provider
  responses) with Zod.
- **Design system.** Use the semantic Tailwind utilities from `src/app/globals.css`
  (`bg-surface`, `text-muted-foreground`, `text-h2`, `rounded-card` …). No raw colours or
  arbitrary values without a commented reason.
- **States.** Data-driven UI handles loading, empty and error states.
- **Formatting** is owned by Prettier; linting by ESLint. Both run on commit.

## Branch naming

`<type>/<short-kebab-description>`, branched from `main`:

| Type        | Use for                               | Example                      |
| ----------- | ------------------------------------- | ---------------------------- |
| `feat/`     | New functionality                     | `feat/vocabulary-review`     |
| `fix/`      | Bug fixes                             | `fix/sidebar-active-state`   |
| `refactor/` | Code changes without behaviour change | `refactor/navigation-config` |
| `docs/`     | Documentation only                    | `docs/design-tokens`         |
| `test/`     | Tests only                            | `test/theme-switcher`        |
| `chore/`    | Tooling, dependencies, configuration  | `chore/upgrade-next`         |

## Commit conventions

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <imperative summary, ≤ 72 chars>

<optional body: what and why>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`, `build`, `ci`.
Examples: `feat(vocabulary): add word list page`, `fix(shell): close mobile drawer on navigate`.

The pre-commit hook runs ESLint and Prettier on staged files (requires Node ≥ 22.12 on the PATH
used by Git). Do not bypass it with `--no-verify`.

## Pull request guidelines

1. Keep PRs small and focused on one concern.
2. Before opening a PR, all of these must pass locally:
   `pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build`,
   plus `pnpm test:e2e` when routes, layout or user flows change.
3. Describe **what** changed and **why**, how it was tested, and include screenshots (light and
   dark, desktop and mobile) for UI changes.
4. Add or update tests for new behaviour; never delete or skip tests to make CI pass.
5. Update documentation (and add an ADR in `docs/decisions/` for architectural decisions).
6. No secrets, real credentials or personal data in code, tests, fixtures or screenshots.
7. New dependencies need a short justification in the PR description.
