---
name: design-system
description: Build or extend the IELTS Learning Hub design system — add or change design tokens (colour, typography, spacing, radius, shadow, layout) in src/app/globals.css, add shadcn/ui components, or add component variants, verifying light/dark, responsiveness, contrast and docs. Use for token or design-system-level work, not for one-off feature UI.
argument-hint: "<token, component or variant to add/change>"
---

# Extend the design system

There is exactly **one** token system: CSS variables in `src/app/globals.css` (`:root` for light,
`.dark` for dark) mapped to Tailwind utilities in `@theme inline`. Never create a second one
(JS token objects, `tailwind.config` theme, per-feature colour variables).

## Workflow

1. **Inventory existing tokens.** Read `src/app/globals.css` and `docs/design-system/` (if
   present). Most needs are already covered — prefer reuse.
2. **Inventory the component foundation.** `src/components/ui/*` (shadcn/ui, Radix base,
   style `radix-nova`, see `components.json`), plus `IconButton`, `EmptyState`, `ErrorState`,
   `FormField`, `PageHeader`.
3. **Analyse the design need.** What semantic role does the value play (e.g. "tinted success
   background"), not what hex it is.
4. **Reuse or add tokens.**
   - New colour → add the raw variable in **both** `:root` and `.dark`, then map it in
     `@theme inline` as `--color-<name>`. Name by role, never by hue.
   - New text style → `--text-<name>` with `--line-height` / `--font-weight` sub-properties,
     **and** register the name in `src/lib/utils/cn.ts` (`TYPOGRAPHY_TOKENS`) so class merging
     doesn't drop it. Same for new shadow/radius names.
5. **Implement variants** with `cva` inside the component; keep size scale consistent
   (`h-9` default, `h-8` sm, `h-10` lg). Adding a shadcn component:
   `pnpm dlx shadcn@<version in package.json> add <name>` (requires approval), then switch its
   `cn` import to `@/lib/utils` and map colours/radius to tokens.
6. **Check light and dark.** Every new token has a dark value; no component uses raw colours.
7. **Check responsiveness** at 360, 768, 1024 and 1440px.
8. **Check accessibility.** Compute contrast for every new foreground/background pair
   (≥ 4.5:1 text, ≥ 3:1 large text/UI boundaries) — show the numbers. Focus states visible.
9. **Document** in `docs/design-system/design-tokens.md` / `components.md`; ADR in
   `docs/decisions/` for structural changes (e.g. new token category).

## Quality checklist

- [ ] No duplicate or near-duplicate token; semantic names.
- [ ] Light and dark values defined; contrast ratios reported.
- [ ] `cn.ts` updated for new text/shadow/radius names.
- [ ] Variants use tokens only; consistent sizing.
- [ ] `components/ui` stays business-agnostic.
- [ ] Docs updated; lint/typecheck/tests run.

## Expected output

- Tokens/variants added or changed (name → light value / dark value → purpose).
- Contrast results table for new colour pairs.
- Files changed and docs updated; verification results.
