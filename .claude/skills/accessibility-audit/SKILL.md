---
name: accessibility-audit
description: Audit IELTS Learning Hub UI (pages, the app shell, components or a diff) for accessibility against WCAG 2.2 AA — semantics, keyboard navigation, focus management, accessible names, colour contrast, forms, dialogs, dropdowns, screen-reader behaviour, mobile navigation and responsive layout. Report-only. Use when asked for an a11y/accessibility review or before shipping new UI.
argument-hint: "[route, component path or 'changed']"
disallowed-tools: Edit, Write, NotebookEdit
---

# Accessibility audit

Report findings; do not edit code unless asked afterwards. Base every finding on the actual
source (and on rendered behaviour when a dev server or Playwright run is available).

## Workflow

1. **Scope.** Route(s) → their `page.tsx`, layout and the components they render; or the
   given components; or changed files.
2. **Static review** of markup and styles against the checklist below. Remember Radix/shadcn
   primitives already provide roles, focus trapping and keyboard support — check they are used
   correctly (e.g. `DialogTitle` present, `asChild` targets are focusable elements).
3. **Contrast.** Resolve token values from `src/app/globals.css` for both `:root` and `.dark`
   and compute ratios for text/background pairs used. Report numbers.
4. **Dynamic check (when possible).** With a running app, use Playwright to tab through the
   page, open dialogs/menus with the keyboard, test at 360px and 1440px widths.
5. **Rank** findings: Critical (blocks a user group from a core task) / High / Medium / Low.

## Checklist

- **Semantics:** one `h1` per page, ordered headings; landmarks (`header`, `nav` with label,
  `main`); lists for lists; `button` for actions, `a` for navigation; tables have headers.
- **Keyboard:** everything operable by keyboard; logical tab order; no keyboard traps; skip link
  to `#main-content` works; shortcuts don't hijack typing in inputs.
- **Focus:** visible focus ring on all interactive elements; focus moves into dialogs/drawers
  and returns to the trigger on close; no focus loss on route change.
- **Names:** icon-only buttons have labels (`IconButton`); images have meaningful `alt` or
  `alt=""` if decorative; decorative icons `aria-hidden`.
- **Contrast:** text ≥ 4.5:1 (large ≥ 3:1); UI boundaries/focus indicators ≥ 3:1; status
  colours used as text only via `-emphasis` tokens; information not conveyed by colour alone.
- **Forms:** every control labelled; errors announced and linked (`aria-invalid`,
  `aria-describedby` — `FormField` does this); required fields indicated in text.
- **Dialogs/Sheets/Drawers:** title + description; Escape closes; background inert.
- **Dropdowns/Popovers/Tooltips:** reachable by keyboard; tooltips are not the only source of
  essential information.
- **Screen readers:** current page in nav marked `aria-current="page"`; live regions for async
  status (toasts); no redundant/duplicated announcements.
- **Mobile & responsive:** sidebar drawer usable and labelled; touch targets ≥ 24×24px (prefer
  40px); no horizontal scroll at 360px; text zoom to 200% keeps content usable.
- **Motion:** respects `prefers-reduced-motion`.

## Expected output

Findings grouped by severity: WCAG criterion (e.g. 2.4.7 Focus Visible), `file:line`, problem,
affected users, recommended fix. Then a contrast table and a short summary of what was checked
statically vs dynamically. Do not claim full WCAG conformance.
