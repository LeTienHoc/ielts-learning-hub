---
paths:
  - "tests/**"
  - "**/*.test.{ts,tsx}"
  - "**/*.spec.{ts,tsx}"
  - "vitest.config.*"
  - "playwright.config.*"
  - "src/**"
---

# Testing rules

## Tools and locations

| Level       | Tool                                                                  | Location               |
| ----------- | --------------------------------------------------------------------- | ---------------------- |
| Unit        | Vitest + React Testing Library (jsdom)                                | `tests/unit/**`        |
| Integration | Vitest (several modules together, real Zod schemas, mocked providers) | `tests/integration/**` |
| End-to-end  | Playwright                                                            | `tests/e2e/**`         |

Vitest cannot render `async` Server Components — cover those with Playwright.

## What to test

- New logic (services, schemas, helpers, hooks) → unit tests, including edge cases: empty
  input, boundaries, invalid data, error paths.
- New or changed components → behaviour tests (render, interaction, accessible names), not
  implementation details.
- User-visible flows and routing → E2E (navigation, responsive drawer, theme switching).
- Bug fixes → a regression test that fails before the fix.

## How to write tests

- Query by role/label/text (`getByRole`, `getByLabelText`) — not CSS classes or test IDs unless
  there is no accessible alternative.
- Assert outcomes the user or caller cares about; avoid snapshot-only tests.
- Use `@testing-library/user-event` for interaction. Avoid arbitrary `sleep`/timeouts.
- Mock only external boundaries (providers, network, time). Never call real Anthropic, speech or
  Supabase services in tests; never use real credentials.
- Tests must be deterministic and independent of execution order.

## Integrity

- Never delete, skip (`.skip`, `.only`), weaken assertions or loosen config to make CI pass.
  Fix the code or the test, and explain the change.
- Never claim tests pass without running them in this session. Report the command and the actual
  result, including failures.
