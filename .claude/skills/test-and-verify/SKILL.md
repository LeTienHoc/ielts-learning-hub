---
name: test-and-verify
description: Run the IELTS Learning Hub quality gates for the current change — lint, typecheck, format check, unit/integration tests, E2E when relevant, and production build — and report real results. Use before declaring any task done, after significant changes, or when asked to verify, check or test the project.
argument-hint: "[scope: changed | full | e2e]"
---

# Test and verify

Never state that a check passed unless it was executed in this session and exited successfully.
Report failures verbatim (trimmed to the relevant lines). Do not skip, delete or weaken tests
or config to obtain a pass.

## Workflow

1. **Scope the change.** `git status` / `git diff --stat`. Decide which checks are relevant
   (docs-only changes may need only format check; UI/route changes need E2E).
2. **Check the environment.** Node must be ≥ 22.12 (project uses Node 24; `node -v`). Read
   `package.json` `scripts` — only run scripts that exist. A missing script is reported as
   **"not available"**, never as passed.
3. **Run checks in order** (stop and fix on failure, then re-run from that step):
   1. `pnpm lint`
   2. `pnpm typecheck`
   3. `pnpm format:check`
   4. `pnpm test` (Vitest unit + integration; use the non-watch form, e.g. `pnpm test --run` if
      the script starts watch mode)
   5. `pnpm test:e2e` — when routes, navigation, layout or user flows changed, or scope is
      `full`/`e2e`. Requires Playwright browsers (`pnpm exec playwright install chromium`).
   6. `pnpm build`
4. **Diagnose failures** at the root cause (use systematic debugging). A test failure caused by
   the change is fixed in the code, not by editing the expectation — unless the expectation
   itself was wrong, which must be explained.
5. **Summarise.**

## Quality checklist

- [ ] Every reported result comes from an actual command run in this session.
- [ ] Missing scripts/tools are reported as not run, with the reason.
- [ ] No `.skip`/`.only`, disabled rules or loosened config introduced.
- [ ] Warnings worth attention are listed, not hidden.

## Expected output

| Check | Command     | Result                              | Notes |
| ----- | ----------- | ----------------------------------- | ----- |
| Lint  | `pnpm lint` | ✅ pass / ❌ fail / ⏭ not available | …     |

Followed by: failures with relevant output, fixes applied (if any), and remaining issues.
