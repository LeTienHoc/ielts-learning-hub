---
name: create-component
description: Create or refactor a reusable React component (shared UI in src/components or a feature component in src/features/<feature>/components) with type-safe props, semantic accessible markup, design tokens, light/dark and responsive support, plus tests. Use when asked for a single component, widget or UI building block.
argument-hint: "<component name and purpose>"
---

# Create a component

## Workflow

1. **Check for reuse.** Search `src/components/ui`, `layout`, `shared`, `feedback` and the owning
   feature. Extend an existing component (new `cva` variant, composition) before creating one.
2. **Choose the location.**
   - Business-agnostic primitive → `src/components/ui/` (no IELTS/learning concepts).
   - App frame (sidebar, header) → `src/components/layout/`.
   - Cross-feature composite (FormField, ThemeSwitcher) → `src/components/shared/`.
   - Empty/error/loading presentation → `src/components/feedback/`.
   - Feature-specific → `src/features/<feature>/components/`.
3. **Server or client?** Server Component unless it needs state, effects, browser APIs or event
   handlers. If client, keep the `"use client"` boundary as small as possible.
4. **Define props.** Explicit TypeScript type; extend `React.ComponentProps<"element">` when
   wrapping a native element and spread the rest; accept `className` and merge with
   `cn` from `@/lib/utils`. No `any`, no boolean-prop explosions — use variants or composition.
5. **Build it.**
   - Semantic element first (`button`, `a`, `nav`, `ul`, headings). Radix primitives via
     `src/components/ui` for interactive patterns (dialog, menu, popover, tabs).
   - Tokens only: `bg-background`, `bg-surface`, `text-foreground`, `text-muted-foreground`,
     `border-border`, `text-h3`, `text-body-sm`, `rounded-card`, `shadow-subtle`…
   - Icon-only controls → `IconButton` with `label`. Decorative icons → `aria-hidden="true"`.
   - Mobile-first responsive classes; no fixed widths that overflow at 360px.
6. **Test** (when the component has behaviour): render, accessible name/role, interaction,
   variants that change behaviour. Put tests in `tests/unit/`.
7. **Verify** light and dark (no hardcoded colours) and run lint + typecheck + tests.

## Quality checklist

- [ ] Reuses existing primitives; no duplicate of an existing component.
- [ ] Props fully typed; `className` merged with `cn`; rest props forwarded where sensible.
- [ ] Semantic HTML; keyboard operable; visible focus; accessible names.
- [ ] Only design tokens; works in light and dark; responsive at 360px.
- [ ] No data fetching or business rules inside `components/ui`.
- [ ] Tests cover behaviour, not markup details.

## Expected output

- Component file path(s) and a usage example with real import paths.
- Variants/props table if the component is part of the design system (also update
  `docs/design-system/components.md`).
- Verification commands run and their results.
