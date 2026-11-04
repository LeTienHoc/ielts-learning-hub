---
paths:
  - "src/app/**/*.{tsx,css}"
  - "src/components/**"
  - "src/features/**/components/**"
---

# Design system rules

The **only** token source is `src/app/globals.css` (CSS variables in `:root` / `.dark`, mapped to
Tailwind utilities in `@theme inline`). Do not create a second token system (no JS token objects,
no `tailwind.config` theme, no per-feature CSS variables for colours).

## Colour

- Use semantic utilities only: `bg-background`, `bg-surface`, `text-foreground`,
  `text-muted-foreground`, `border-border`, `bg-primary`, `hover:bg-primary-hover`,
  `bg-primary-subtle`, `text-primary-subtle-foreground`, and status families
  `success|warning|error|info` with `-subtle` (tinted background) and `-emphasis` (AA text).
- Status base colours (`text-success`, `text-warning`, …) are for icons, borders and fills — **not
  for body text** (they fail WCAG AA on white). Use `-emphasis` for text.
- No hex/rgb/hsl/oklch literals or Tailwind palette colours (`bg-blue-500`, `text-gray-600`) in
  components. Every colour must work in light **and** dark themes.

## Typography (Inter)

Use the scale: `text-display`, `text-h1`…`text-h4`, `text-body-lg`, `text-body`, `text-body-sm`,
`text-caption`, `text-label`. Each sets size, line height and weight together. Use `text-body-lg`
for long-form lesson content. Avoid ad-hoc `text-[17px]`, `leading-[…]`.

## Spacing, radius, elevation, layout

- Spacing: Tailwind 4px scale (`p-4` = 16px). No arbitrary values like `p-[13px]`.
- Radius: `rounded-sm|md|lg|xl|2xl`, plus semantic `rounded-card` and `rounded-modal`.
- Shadows: `shadow-subtle`, `shadow-elevated` only. Prefer borders over shadows.
- Layout: `h-header` (64px), `max-w-content` (1440px); sidebar widths come from
  `--layout-sidebar-width` (248px) / `--layout-sidebar-width-collapsed` (72px).

An arbitrary value (`[...]`) is allowed only when no token fits **and** the reason is commented.
If a value is needed repeatedly, add a token (and document it) instead.

## Components and variants

- Build on `src/components/ui/*` (shadcn/ui, Radix base, `radix-nova` style). Add variants with
  `cva`; keep sizes consistent (control height 36px = `h-9` default, `h-8` sm, `h-10` lg).
- Icon-only buttons use `IconButton` (mandatory accessible `label`).
- New shadcn components: `pnpm dlx shadcn@<pinned> add <name>`, then change
  `import { cn } from "cn"` to `import { cn } from "@/lib/utils"` and map colours/radius to tokens.
- `components/ui` must stay business-agnostic — no IELTS/learning concepts there.

## Accessibility (WCAG 2.2 AA target)

- Text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI boundaries). Verify new colour pairs.
- Visible focus (`focus-visible:ring-*`) on every interactive element; never remove outlines
  without a replacement.
- Semantic elements first (`button`, `a`, `nav`, `main`, headings in order); ARIA only to fill gaps.
- Every input has a label; errors are linked via `aria-describedby` (`FormField` does this).
- Respect `prefers-reduced-motion` (handled globally — do not override).

Update `docs/design-system/*.md` whenever tokens or component variants change.
