#!/usr/bin/env node
// PreToolUse hook (matcher: Edit|Write|MultiEdit|NotebookEdit). Protects files that
// must not be changed by hand. Complements the Edit(...) permission rules in
// settings.json. Never modifies files. Fails open on malformed input.

import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

function respond(decision, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
        permissionDecisionReason: `[guard-files] ${reason}`,
      },
    }),
  )
  process.exit(0)
}

let filePath = ""
try {
  const input = JSON.parse(readFileSync(0, "utf8"))
  filePath = String(input?.tool_input?.file_path ?? input?.tool_input?.notebook_path ?? "")
} catch {
  process.exit(0)
}
if (!filePath) process.exit(0)

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const relative = path
  .relative(projectDir, path.resolve(projectDir, filePath))
  .split(path.sep)
  .join("/")
const base = path.posix.basename(relative)

if (/^\.env(\..+)?$/.test(base) && base !== ".env.example") {
  respond("deny", `${relative} is a real environment file. Only .env.example may be edited.`)
}
if (base === "pnpm-lock.yaml") {
  respond("deny", "pnpm-lock.yaml is generated. Change dependencies with pnpm instead.")
}
if (relative.startsWith(".git/")) {
  respond("deny", "Files inside .git must not be edited directly.")
}
if (relative.startsWith("supabase/migrations/") && existsSync(path.resolve(projectDir, relative))) {
  respond(
    "ask",
    `Editing an existing migration (${relative}). Applied migrations should not change; add a new migration instead.`,
  )
}
if (relative.startsWith(".claude/") || relative === "CLAUDE.md") {
  respond("ask", `${relative} is part of the Claude Code governance configuration.`)
}
process.exit(0)
