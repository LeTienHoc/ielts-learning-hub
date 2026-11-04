---
paths:
  - "src/app/**"
  - "src/components/**"
  - "src/features/**/components/**"
  - "src/features/**/hooks/**"
  - "src/hooks/**"
  - "src/stores/**"
---

# Frontend rules (React 19 + Next.js 16 App Router)

Next.js 16 differs from older versions (Cache Components, Partial Prefetching, async request
APIs). Before using an unfamiliar Next.js API, read the bundled docs in
`node_modules/next/dist/docs/` (see `AGENTS.md`). Do not rely on memory of older versions.

## Server vs Client Components

- Server Components by default. Add `"use client"` only for state, effects, refs to DOM,
  browser APIs or event handlers — and push it to the smallest leaf component.
- Pages (`page.tsx`) and layouts stay thin and server-rendered: compose, don't compute.
- `cacheComponents` is enabled: dynamic data (`cookies()`, `headers()`, uncached fetches) must sit
  inside a `<Suspense>` boundary or be explicitly cached. Check `next build` output.
- Never import `src/server/**` from a Client Component.

## State management

1. Server data → fetch in Server Components, or TanStack Query in Client Components.
2. URL-shareable state (filters, tabs, pagination) → search params.
3. Local UI state → `useState` / `useReducer`.
4. Cross-tree client state → React context; Zustand only when context is genuinely insufficient
   (and add the dependency deliberately, with justification).
5. Forms → React Hook Form + Zod via `FormField` (`@/components/shared/form-field`).

Do not mirror server data into global stores. Do not derive state with `useEffect` when it can
be computed during render.

## Composition

- Prefer composition (children, slots, `asChild`) over boolean-prop explosions.
- Reuse `src/components/ui/*` before building new primitives; extend with `cva` variants.
- Feature components live in `src/features/<feature>/components/`, not in `components/ui`.

## Performance

- Use `next/link` for internal navigation, `next/image` for images, `next/font` for fonts.
- Lazy-load heavy client-only widgets (`next/dynamic`) — e.g. audio recorders, charts.
- Stable keys from data, never array indexes for dynamic lists.
- Memoise only after identifying a real cost.

## Responsive behaviour

- Mobile-first. Must work at 360px wide with no horizontal page scroll.
- Breakpoints: Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536).
  Sidebar becomes a drawer below `md`.
- Tables: wrap in a horizontally scrollable container or switch to a stacked layout on mobile.

## Loading, error and empty states

Every data-driven view must handle all of them:

- Loading → `Skeleton` or route `loading.tsx`.
- Error → `ErrorState` (`@/components/feedback/error-state`) or route `error.tsx` with retry.
- Empty → `EmptyState` (`@/components/feedback/empty-state`).

Never show fake statistics, scores or placeholder learning data as if they were real.
