---
name: project-code-review
description: Review IELTS Learning Hub code changes against this project's rules before a feature is considered done — correctness, architecture, type safety, performance, security, accessibility, maintainability, duplication, tests and design-system compliance — and report findings ranked Critical/High/Medium/Low with file, line, reason and fix. Report-only; does not edit code. Use when asked to review a diff, branch, file set or finished feature.
argument-hint: "[files, branch or 'staged' — defaults to uncommitted changes]"
disallowed-tools: Edit, Write, NotebookEdit
---

# Project code review

Review only — **do not modify code** unless the user explicitly asks for fixes afterwards.
Named `project-code-review` so it does not shadow Claude Code's bundled `/code-review`.

## Workflow

1. **Determine scope.** Use the argument if given; otherwise uncommitted changes
   (`git status`, `git diff`, `git diff --staged`). For untracked files, read them fully.
2. **Load context.** `CLAUDE.md`, the relevant `.claude/rules/*.md`, and surrounding code each
   changed file interacts with (callers, imports). Do not review lines in isolation.
3. **Check each dimension:**
   - **Correctness** — logic errors, edge cases, null/undefined, async races, wrong assumptions
     about Next.js 16 APIs (verify against `node_modules/next/dist/docs/`).
   - **Architecture** — right module, dependency direction, thin routes, no cross-feature
     internals, no cycles, server/client boundary respected.
   - **Type safety** — `any`, unsafe `as`, `!`, suppressions, types duplicated instead of inferred.
   - **Performance** — unnecessary client components, large client bundles, missing `next/image`
     /`next/dynamic`, render waterfalls, unstable keys.
   - **Security** — secrets, unvalidated input, missing server-side checks, unsafe HTML, PII in
     logs/prompts (escalate to `project-security-review` if substantial).
   - **Accessibility** — semantics, names, keyboard, focus, contrast.
   - **Maintainability & duplication** — unclear names, oversized components, reimplemented
     helpers (search for existing ones).
   - **Testing** — missing tests for new logic/flows, brittle or meaningless assertions,
     skipped tests.
   - **Design system** — raw colours/sizes, arbitrary values, wrong token usage, new tokens
     without dark values or docs.
4. **Verify each finding** by reading the code path; drop anything speculative. Mark uncertain
   items as "Needs confirmation" rather than asserting them.
5. **Rank** by severity:
   - **Critical** — security hole, data loss, broken build/route, crash in the main path.
   - **High** — incorrect behaviour, architecture violation that will spread, missing auth or
     validation, a11y blocker.
   - **Medium** — maintainability, missing tests, design-system deviations, perf issues with
     real impact.
   - **Low** — naming, small simplifications, nits.

## Expected output

```
## Review scope
<files / diff reviewed>

## Findings
### [Critical] <short title>
- Location: `path/to/file.tsx:42`
- Problem: <what is wrong and why it matters>
- Fix: <concrete change>
...(High, Medium, Low)

## Positive notes (optional, brief)
## Summary
<counts per severity; merge recommendation: ready / ready after fixes / not ready>
```

If there are no findings at a level, omit that level. If nothing is wrong, say so plainly.
