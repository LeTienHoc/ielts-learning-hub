---
name: architecture-review
description: Review the actual source structure of IELTS Learning Hub against its modular-monolith, feature-based architecture — feature boundaries, dependency direction, separation of concerns, abstraction quality, coupling, circular dependencies, server/client boundaries, scalability and unnecessary complexity — with evidence-based recommendations. Report-only. Use when asked to assess architecture, before large refactors, or when adding a new feature module.
argument-hint: "[module/path or 'whole project']"
disallowed-tools: Edit, Write, NotebookEdit
---

# Architecture review

Base every statement on code you have read (cite paths). Do not recommend patterns because they
are common elsewhere; recommend them only when the current code shows the need. Do not edit code.

## Workflow

1. **Map the structure.** List `src/` top-level modules and feature folders (`Glob`). Read
   `.claude/rules/architecture.md` and `docs/architecture/` for the intended design.
2. **Build the dependency picture.** `Grep` imports per layer, for example:
   - `from "@/features/` inside `src/components/**` or `src/lib/**` (forbidden direction)
   - `from "@/features/<a>/` (deep import) inside `src/features/<b>/**` (boundary breach)
   - `from "@/server/` in files containing `"use client"` (server/client breach)
   - `process.env.` outside the env config module
   - SDK imports (`@anthropic-ai`, `@supabase`) outside `src/server/**`
3. **Look for cycles** by following imports between modules that reference each other.
4. **Assess:**
   - Separation of concerns: thin `app/` routes; logic in feature services; UI free of data access.
   - Abstraction quality: abstractions with a single implementation and no test seam are
     candidates for removal; duplicated logic is a candidate for extraction.
   - Coupling and cohesion of each feature; shared code living in the right layer.
   - Scalability: will the structure hold for the planned modules (vocabulary, grammar, reading,
     listening, writing, speaking, AI tutor, progress) without restructuring?
   - Unnecessary complexity or infrastructure (anything resembling microservices/monorepo).
5. **Prioritise** recommendations by impact and cost; note which need an ADR.

## Expected output

```
## Current architecture (as implemented)
<short description + module map>

## Findings
[High|Medium|Low] <title> — evidence: `path:line` … — impact — recommendation

## Dependency violations
<table: from → to → rule broken> (or "none found" + the searches performed)

## Recommendations
<ordered list; mark "ADR needed" where applicable>
```
