# 0001 — Single Next.js app as a feature-based modular monolith

- **Status:** Accepted (2026-11-04)

## Context

The product will grow many capabilities (vocabulary, grammar, four IELTS skills, AI tutor, voice,
analytics) built by a small team. We need independent evolution of features without the
operational cost of multiple services or a monorepo.

## Decision

- One Next.js App Router application, one deployable.
- Code organised by feature in `src/features/<feature>` with a public `index.ts`; shared UI in
  `src/components`; server-only provider adapters in `src/server`; thin routes in `src/app`.
- Dependency direction `app → features → components → lib/config`, enforced with ESLint
  (`no-restricted-imports`, `import/no-cycle`) and `server-only`.
- No Turborepo/Nx, no microservices, no separate backend.

## Consequences

- Simple deployment and refactoring; boundaries rely on lint rules and review.
- If a module ever needs independent scaling (e.g. real-time voice), it can be extracted behind
  its existing server adapter interface — that will require a new ADR.
