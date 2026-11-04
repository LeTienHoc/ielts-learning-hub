# Claude Code development governance

This repository ships a project-level Claude Code configuration so that every session
understands the product, follows the architecture and verifies its own work. It is built on
Claude Code's documented mechanisms (memory, rules, skills, subagents, hooks, permissions —
see <https://code.claude.com/docs/en/>). Everything here is committed and shared by the team,
except `.claude/settings.local.json` (personal, git-ignored).

```
CLAUDE.md                      # always-loaded project brief (imports AGENTS.md)
AGENTS.md                      # Next.js agent rules, generated/maintained by `next dev`
.claude/
  settings.json                # permissions + hooks (shared)
  rules/*.md                   # coding rules, some path-scoped
  skills/<name>/SKILL.md       # reusable workflows, invoked as /<name>
  agents/<name>.md             # specialised subagents
  hooks/*.mjs                  # hook scripts (Node, no dependencies)
```

## The building blocks

| Mechanism                                         | What it is for                                                                                                                                                      | Loaded when                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **CLAUDE.md**                                     | The short project brief: product, stack, structure, boundaries, commands, Definition of Done. Kept < 200 lines.                                                     | Every session.                                                       |
| **Rules** (`.claude/rules/`)                      | Standards Claude must follow while editing. Files with `paths:` frontmatter load only when Claude reads/edits a matching file; files without it load every session. | Session start, or on first touch of a matching file.                 |
| **Skills** (`.claude/skills/`)                    | Step-by-step workflows with checklists and an expected output (implement a feature, review, verify…). Only the name + description sit in context until invoked.     | On `/name`, or when Claude decides the description matches the task. |
| **Agents** (`.claude/agents/`)                    | Specialised subagents with their own context window and a restricted tool set, for independent reviews or test work.                                                | When Claude delegates to them or you ask for them.                   |
| **Hooks** (`settings.json` → `hooks`)             | Deterministic scripts the harness runs at lifecycle events. They enforce guardrails that must not depend on the model remembering a rule.                           | On the configured events.                                            |
| **Permissions** (`settings.json` → `permissions`) | Allow / ask / deny rules for tools. Evaluated deny → ask → allow; first match wins.                                                                                 | Every tool call.                                                     |

### Rules

| File                  | Scope (`paths`)                                                                              | Covers                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `architecture.md`     | `src/**`, `tests/**`                                                                         | Modular monolith, layers, dependency direction, feature boundaries, server/client boundary, provider adapters |
| `coding-standards.md` | `**/*.{ts,tsx,mts,mjs,js}`                                                                   | TS strictness, naming, imports, error handling, no suppressions                                               |
| `frontend.md`         | `src/app/**`, `src/components/**`, feature components/hooks, `src/hooks/**`, `src/stores/**` | Server/Client Components, state, composition, performance, responsive, loading/empty/error states             |
| `design-system.md`    | `src/app/**/*.{tsx,css}`, `src/components/**`, feature components                            | Single token source, colour/typography/spacing/radius/shadow tokens, variants, accessibility                  |
| `security.md`         | _(always loaded)_                                                                            | Secrets, env vars, untrusted input, authorization, unsafe HTML, logging, AI data, uploads                     |
| `testing.md`          | `tests/**`, test files, test configs, `src/**`                                               | Test levels, what/how to test, integrity                                                                      |
| `documentation.md`    | `**/*.md`, `docs/**`                                                                         | Docs match implementation, ADRs, runnable examples                                                            |

### Skills

| Skill                                              | Use it when                                              | Edits code?          |
| -------------------------------------------------- | -------------------------------------------------------- | -------------------- |
| `/implement-feature <description>`                 | Building a new capability end to end                     | Yes                  |
| `/create-component <name + purpose>`               | Creating/refactoring one reusable component              | Yes                  |
| `/design-system <token/component/variant>`         | Adding or changing tokens, shadcn components or variants | Yes                  |
| `/test-and-verify [changed\|full\|e2e]`            | Before saying "done"; after significant changes          | Only to fix failures |
| `/project-code-review [scope]`                     | Reviewing a diff/branch/feature before completion        | No (report only)     |
| `/accessibility-audit [route\|component\|changed]` | Checking UI against WCAG 2.2 AA                          | No (report only)     |
| `/project-security-review [scope]`                 | Code touching auth, data, uploads, AI or providers       | No (report only)     |
| `/architecture-review [module\|whole project]`     | Before large refactors or new modules                    | No (report only)     |

The two review skills are prefixed `project-` on purpose: a project skill with the same name as a
built-in or bundled command replaces it (`/security-review` is built in, `/code-review` is
bundled), and a personal skill in `~/.claude/skills/` with the same name would override a project
skill. Distinct names keep both available.

Report-only skills declare `disallowed-tools: Edit, Write, NotebookEdit`.

### Agents

| Agent                   | Tools                               | Purpose                                                                                               |
| ----------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `frontend-reviewer`     | Read, Grep, Glob                    | React/Next.js/TS, UI architecture, performance, a11y, responsive review                               |
| `architecture-reviewer` | Read, Grep, Glob                    | Module boundaries, dependency direction, maintainability, tech debt                                   |
| `security-reviewer`     | Read, Grep, Glob                    | Secrets, validation, API security, authorization, AI integration risks                                |
| `test-engineer`         | Read, Grep, Glob, Bash, Edit, Write | Coverage gaps and test plans; writes/runs tests **only when explicitly asked**, never production code |

Reviewers are strictly read-only (no Bash, so they cannot run commands that write). Give them the
file list or diff to review. Use agents for independent, larger reviews — not for trivial tasks.

### Hooks

| Event                                                 | Script                | Behaviour                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SessionStart`                                        | `session-context.mjs` | Adds a factual snapshot: git branch + number of uncommitted paths, a warning if Node < 22.12, which pnpm scripts exist and which quality scripts are missing. Read-only.                                                                                                                                                                                          |
| `PreToolUse` (`Bash`)                                 | `guard-bash.mjs`      | **Denies**: `rm -rf` of `/`, `~`, `.` or `*`; force push; `npm`/`yarn`/`bun` installs; shell writes/reads of real `.env*` files; `--no-verify`. **Asks**: push, commit, history-rewriting or change-discarding git commands, recursive `rm`, deleting/moving migrations, `pnpm add/remove/update`, `pnpm dlx`/`npx`, Supabase DB changes, GitHub writes, deploys. |
| `PreToolUse` (`Edit\|Write\|MultiEdit\|NotebookEdit`) | `guard-files.mjs`     | **Denies** edits to real `.env*` files, `pnpm-lock.yaml`, `.git/**`. **Asks** before editing an existing file in `supabase/migrations/` and before changing `.claude/**` or `CLAUDE.md`.                                                                                                                                                                          |

Design constraints: hooks never modify files, never run lint/build (to keep editing fast), never
loop, and fail open on malformed input. They run with Node (available because the project needs
it; scripts are compatible with Node 18+). On Windows, Claude Code runs hook commands through Git
Bash, or PowerShell if Git Bash is absent — `node "<path>"` works in both.

The Bash guard is pattern-based. It is a second layer behind permissions, not a sandbox: an
unusual command form can slip past a regex. Keep reviewing prompts that ask for approval.

### Permissions

- **allow** — read-only git (`status`, `diff`, `log`, `show`) and the project quality scripts
  (`pnpm lint|typecheck|format|format:check|test|test:e2e|build|dev`, `tsc --noEmit`, vitest,
  playwright, `pnpm list|why|audit`).
- **ask** — `git push/commit/reset/clean/rebase/restore`, `git stash drop`, `git branch -D`,
  `pnpm add/remove/update/dlx`, `rm -r(f)`, `supabase`, `gh pr create/merge`, `vercel`.
- **deny** — reading or editing real env files (`.env`, `.env.local`, `.env.*.local`,
  `.env.development|production|test`; `.env.example` stays editable), editing
  `pnpm-lock.yaml` and `.git/**`, `npm`/`yarn`/`bun` installs, force pushes.

`allow` rules take effect only after you trust the folder; `deny` and `ask` apply immediately.
Personal additions belong in `.claude/settings.local.json` (git-ignored).

## Usage examples

```text
/implement-feature Add a vocabulary list page with empty state, backed by a typed service stub
/create-component StatCard for the dashboard: label, value, optional trend, light/dark
/design-system Add a "highlight" token for marking vocabulary in reading passages
/test-and-verify full
/project-code-review staged
/accessibility-audit /dashboard
/project-security-review src/server/ai
/architecture-review whole project
Use the frontend-reviewer agent to review the files changed on this branch.
Use the test-engineer agent to list coverage gaps in src/config/navigation.ts.
```

A typical feature flow: `/implement-feature` → `/test-and-verify` → `/project-code-review`
(plus `/accessibility-audit` or `/project-security-review` when relevant) → fix → re-verify.

## Extending the system

**Add a rule:** create `.claude/rules/<topic>.md`. Add `paths:` frontmatter (YAML list of globs
relative to the project root; brace expansion allowed) if it applies only to some files; omit it
for always-on rules. `paths` is the only frontmatter field read for rules. Keep rules
declarative ("do / don't"); put procedures in skills. Update the tables above.

**Add a skill:** create `.claude/skills/<kebab-name>/SKILL.md` with frontmatter `name`
(= directory name) and a specific `description` saying _what_ it does and _when_ to use it
(combined description text is truncated at 1,536 characters in the listing). Add
`argument-hint`, and `disallowed-tools` for report-only skills. Body: workflow, quality
checklist, expected output. Check that the name does not collide with a built-in command or a
skill in `~/.claude/skills/`. Update the tables above.

**Add an agent:** create `.claude/agents/<name>.md` with `name`, `description` and the
narrowest `tools` list that works (`Read, Grep, Glob` for reviewers). Unknown frontmatter fields
are ignored silently — double-check spelling (`disallowedTools`, `permissionMode` are camelCase
for agents).

**Change hooks/permissions:** edit `.claude/settings.json` (the `$schema` gives editor
validation). Test hook scripts by piping sample JSON, e.g.
`echo '{"tool_input":{"command":"git push"}}' | node .claude/hooks/guard-bash.mjs`.

## Checking the configuration

| Check                             | How                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------- |
| Settings valid / rejected entries | `/doctor` in a session, or `claude doctor`                                      |
| Hooks registered                  | `/hooks`                                                                        |
| Permission rules by scope         | `/permissions`                                                                  |
| Skills detected                   | `/skills` (or `/reload-skills` after adding one)                                |
| Rules & CLAUDE.md loaded          | `/context` (path-scoped rules appear after touching a matching file), `/memory` |
| Agents available                  | `/agents`                                                                       |
| Frontmatter parse errors          | `claude --debug`                                                                |

Validation performed when this system was created: every rule/skill/agent file has parseable
YAML frontmatter; skill names match their directories; `settings.json` is valid JSON with
documented keys; hook scripts were exercised with 55 allow/ask/deny cases (including heredoc false-positive cases) plus malformed input. Bash patterns match within a single command line, so text inside heredocs on later lines is not treated as a command.
