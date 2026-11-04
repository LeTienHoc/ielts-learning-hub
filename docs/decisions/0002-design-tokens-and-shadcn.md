# 0002 — CSS-variable design tokens with shadcn/ui

- **Status:** Accepted (2026-11-04)

## Context

We need a premium, consistent UI with light and dark themes, accessible contrast and fast
component development, without maintaining a component library from scratch.

## Decision

- Tokens are CSS variables in `src/app/globals.css` (`:root` light, `.dark` dark), mapped to
  Tailwind v4 utilities via `@theme inline`. This is the only token source.
- Brand/neutral values follow the product palette (primary `#635BDB`). Semantic status colours
  have base / subtle / emphasis tokens because the base colours fail WCAG AA as text.
- Components come from shadcn/ui (Radix base, `radix-nova` style) as owned source files, adapted
  to the tokens (control height 36px, `rounded-card`, `shadow-subtle`).
- shadcn's `cn` package is wrapped in `@/lib/utils` with our typography/radius/shadow token names
  so class merging does not drop them.

## Consequences

- Theme customisation means editing variables only.
- shadcn updates are applied by re-adding components and re-applying token mappings manually.
- New text/shadow/radius tokens must also be registered in `src/lib/utils/cn.ts`.
