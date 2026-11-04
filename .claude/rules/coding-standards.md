---
paths:
  - "**/*.{ts,tsx,mts,mjs,js}"
---

# Coding standards

## TypeScript

- `strict` is on and stays on. No implicit `any`; use `unknown` and narrow.
- No `as` casts to silence the compiler. Allowed only for well-understood cases (e.g. `as const`,
  CSS custom properties in `style`) — narrow with type guards or Zod instead.
- No non-null assertions (`!`) unless the invariant is guaranteed and commented.
- Never add `@ts-ignore`, `@ts-expect-error`, `eslint-disable` or loosen `tsconfig`/ESLint config
  to make a check pass. Fix the cause. If a suppression is genuinely unavoidable, scope it to one
  line and explain why in the same comment.
- Prefer `type` aliases; derive types from Zod schemas with `z.infer` instead of duplicating them.
- Export explicit return types for public service functions.

## Naming

| Thing                               | Convention                 | Example                            |
| ----------------------------------- | -------------------------- | ---------------------------------- |
| Files & folders                     | kebab-case                 | `app-sidebar.tsx`, `use-mobile.ts` |
| React components                    | PascalCase                 | `AppSidebar`                       |
| Hooks                               | `use` + camelCase          | `useTheme`                         |
| Functions, variables                | camelCase                  | `getBreadcrumbs`                   |
| Constants (module-level, immutable) | UPPER_SNAKE_CASE           | `NAV_SECTIONS`                     |
| Types                               | PascalCase, no `I` prefix  | `NavItem`                          |
| Zod schemas                         | camelCase + `Schema`       | `writingSubmissionSchema`          |
| Booleans                            | `is/has/should/can` prefix | `isActive`                         |

## Imports

- Use the `@/` alias for anything outside the current folder; relative imports only for siblings.
- Order: external packages → `@/` aliases → relative. Separate groups with a blank line.
- Import `cn` from `@/lib/utils` (token-aware), never directly from the `cn` package.
- Import a feature through its public `index.ts`, not its internals.
- Use `import type` for type-only imports.

## Functions and components

- One responsibility per function/component. Split when a component mixes data fetching,
  state orchestration and presentation.
- Keep functions small and pure where possible; isolate side effects.
- No dead code, commented-out code, unused exports or speculative parameters.
- Do not duplicate logic — search (`Grep`) for an existing helper before writing a new one.

## Error handling

- Validate all external input (request bodies, search params, form data, env vars, provider
  responses) with Zod at the boundary.
- Throw `Error` subclasses with clear messages; never throw strings.
- Do not swallow errors. A `catch` must handle, translate or re-throw — and comment why if it
  intentionally ignores.
- User-facing errors: show `ErrorState` / route `error.tsx`; never render stack traces or raw
  provider messages to users.

## Formatting

Prettier + ESLint are the source of truth. Do not hand-format against them.
