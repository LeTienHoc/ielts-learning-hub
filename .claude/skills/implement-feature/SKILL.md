---
name: implement-feature
description: Implement a new feature or user-facing capability in IELTS Learning Hub end to end — analyse the request, place it in the right feature module, plan, implement with validation and error handling, write tests, run quality checks and update docs. Use when asked to build, add or implement functionality (not for a single isolated UI component — use create-component).
argument-hint: "<feature description or ticket>"
---

# Implement a feature

Deliver exactly the requested scope, following `CLAUDE.md` and `.claude/rules/`. Do not add
"nice to have" extras, speculative abstractions or future-phase functionality.

## Workflow

1. **Analyse the request.** Restate the goal, acceptance criteria and what is out of scope.
   If a requirement is ambiguous _and_ the answer changes the design, ask before coding.
2. **Inspect the architecture.** Read `.claude/rules/architecture.md` and the relevant existing
   code (`src/features/<feature>/`, `src/config/navigation.ts`, `src/components/**`). Search for
   existing helpers/components before writing new ones.
3. **Decide ownership.** Which feature module owns this? Shared UI → `src/components/`;
   provider/secret/DB access → `src/server/<area>/`; route wiring only → `src/app/`.
4. **List files** to create or modify, with one line on why each is needed. Create only folders
   the feature actually uses.
5. **Plan.** Short ordered plan: data/contracts (Zod schemas, types) → services → UI → route →
   tests → docs. For non-trivial work, share the plan before implementing.
6. **Validation & errors.** Define Zod schemas for every external input; decide server-side
   checks (auth/ownership when auth exists); define loading, empty and error states.
7. **Implement** following conventions: Server Components by default, thin pages, design tokens
   only, accessible markup, no secrets in client code.
8. **Test.** Unit tests for logic and schemas (incl. edge cases), component behaviour tests, E2E
   for new user flows. See `.claude/rules/testing.md`.
9. **Verify.** Run the `test-and-verify` skill. Fix failures; never weaken tests to pass.
10. **Document.** Update docs/ADRs if architecture, routes, env vars, tokens or workflows changed.

## Quality checklist

- [ ] Scope matches the request; nothing extra.
- [ ] Code lives in the owning module; no cross-feature internal imports; no cycles.
- [ ] Inputs validated with Zod at the boundary; errors handled, not swallowed.
- [ ] Server-only code imports `server-only`; no secrets reach the client.
- [ ] Loading / empty / error states present; responsive at 360px; light + dark verified.
- [ ] No hardcoded colours/sizes where a token exists; accessible names on controls.
- [ ] Tests added and passing; lint, typecheck and build run (or reported as unavailable).
- [ ] Docs updated where behaviour or structure changed.

## Expected output

1. Summary of what was built and where (file list with one-line purpose each).
2. Key decisions and trade-offs.
3. Verification results: each command run and its actual outcome.
4. Remaining limitations or follow-ups (clearly marked, not implemented).
