#!/usr/bin/env node
// SessionStart hook. Adds a short, factual snapshot of the workspace to Claude's context:
// git branch and uncommitted changes, Node version compatibility, and which quality
// scripts actually exist in package.json. Read-only and fast; never fails the session.

import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const lines = []

function git(args) {
  try {
    return execFileSync("git", args, {
      cwd: projectDir,
      encoding: "utf8",
      timeout: 5000,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
  } catch {
    return null
  }
}

const branch = git(["branch", "--show-current"])
const status = git(["status", "--porcelain"])
if (branch !== null) {
  const changed = status ? status.split("\n").filter(Boolean).length : 0
  lines.push(
    `Git: branch "${branch}", ${changed} uncommitted path(s). Do not commit or push unless asked.`,
  )
}

const [major, minor] = process.versions.node.split(".").map(Number)
if (major < 22 || (major === 22 && minor < 12)) {
  lines.push(
    `Node on PATH is v${process.versions.node}. The toolchain (Next 16, Vitest 5, jsdom) needs Node >= 22.12 (project uses Node 24). Use Node 24 before running pnpm scripts.`,
  )
}

try {
  const pkg = JSON.parse(readFileSync(path.join(projectDir, "package.json"), "utf8"))
  const wanted = ["dev", "build", "lint", "typecheck", "format:check", "test", "test:e2e"]
  const scripts = pkg.scripts ?? {}
  const missing = wanted.filter((name) => !(name in scripts))
  lines.push(`pnpm scripts available: ${Object.keys(scripts).join(", ") || "none"}.`)
  if (missing.length) {
    lines.push(
      `Quality scripts NOT yet defined: ${missing.join(", ")}. Report them as not run; do not claim they passed.`,
    )
  }
} catch {
  lines.push("package.json could not be read.")
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: lines.join("\n") },
  }),
)
