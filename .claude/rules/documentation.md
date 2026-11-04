---
paths:
  - "**/*.md"
  - "docs/**"
---

# Documentation rules

- Documentation must describe what the code **actually does now**. Verify against the source
  before writing; do not document planned or imagined functionality as if it exists. Mark future
  work explicitly as "Planned".
- When a change alters architecture, folder structure, tokens, components, scripts, env vars or
  workflows, update the matching doc in the same change:
  - Architecture → `docs/architecture/`
  - Tokens / components → `docs/design-system/`
  - Setup, commands, tooling, Claude Code governance → `docs/development/`, `README.md`,
    `CLAUDE.md`
- Record significant technical decisions as an ADR in `docs/decisions/NNNN-short-title.md`
  (Context → Decision → Consequences → Status). Never rewrite an accepted ADR; supersede it.
- Code examples must be copy-paste runnable against the current code (real import paths, real
  prop names, real scripts).
- Keep `CLAUDE.md` under ~200 lines; detailed procedures belong in `.claude/rules/` or
  `.claude/skills/`.
- No secrets, real credentials or personal data in docs.
