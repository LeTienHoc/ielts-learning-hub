# 0005 — TanStack Query now, Zustand only when needed

- **Status:** Accepted (2026-11-04)

## Context

The stack lists TanStack Query and Zustand. Phase 0 has no server data and no cross-tree client
state.

## Decision

- TanStack Query is installed and provided (`src/app/providers.tsx`, defaults in
  `src/lib/query-client.ts`) for client-side server state.
- Zustand is **not installed**. It is added only when a concrete feature needs shared client state
  that URL state, React state or context cannot handle cleanly (e.g. a live voice session).
- Order of preference: Server Components → TanStack Query → URL search params → local state →
  context → Zustand.

## Consequences

- No unused dependency; adding Zustand later requires a short justification in the PR.
