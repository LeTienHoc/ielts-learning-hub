#!/usr/bin/env node
// PreToolUse hook (matcher: Bash). Second safety layer behind permission rules, which
// can be bypassed by alternate invocations (e.g. `git -C . push`). It inspects the
// command text and either blocks it (deny) or forces a user confirmation (ask).
// Patterns match within a single line (heredoc bodies and prose on other lines are not
// treated as commands). Never modifies files. Fails open (exit 0) on malformed input.

import { readFileSync } from "node:fs"

/** Any characters on the same line that do not start a new pipeline/command. */
const SAME_CMD = String.raw`[^|;&\n]*`

const re = (source, flags = "m") => new RegExp(source, flags)

/** Patterns that are never allowed, regardless of confirmation. */
const DENY = [
  {
    re: /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|--recursive\s+--force|--force\s+--recursive)[a-z-]*\s+(\/|~|\.|\*|\$HOME|[A-Za-z]:[\\/]?)(\s|$)/im,
    why: "Recursive force-delete of the root, home or whole working directory.",
  },
  {
    re: re(
      String.raw`\bgit\b${SAME_CMD}\bpush\b${SAME_CMD}(--force\b|--force-with-lease\b|\s-f\b|\s\+\S)`,
    ),
    why: "Force push rewrites remote history.",
  },
  {
    re: /(^|[\s;&|(])(npm|yarn|bun)\s+(i|install|add|ci)\b/m,
    why: "This project uses pnpm only (see packageManager in package.json). Use pnpm.",
  },
  {
    re: /(^|[^<])>{1,2}\s*["']?\.env(?!\.example)(\.[\w.-]+)?["']?(\s|$)/m,
    why: "Writing to a real environment file is not allowed. Only .env.example may be edited.",
  },
  {
    // A read command whose file argument is a real .env file, on the same line, not a write (`cat > x`).
    re: re(
      String.raw`(^|[;&|(])\s*(sudo\s+)?(cat|bat|less|head|tail|Get-Content)\b(?!${SAME_CMD}>)${SAME_CMD}?[\s"'/\\]\.env(?!\.example)(\.[\w.-]+)?(?=\s|$|["'])`,
    ),
    why: "Reading a real environment file could expose secrets.",
  },
  {
    re: /(^|\s)--no-verify\b/m,
    why: "Skipping git hooks (--no-verify) bypasses project quality gates.",
  },
]

/** Patterns that need explicit user approval in this session. */
const ASK = [
  {
    re: re(String.raw`\bgit\b${SAME_CMD}\bpush\b`),
    why: "Pushing to a remote is an external action.",
  },
  {
    re: re(String.raw`\bgit\b${SAME_CMD}\bcommit\b`),
    why: "Commits should only be made when the user asked for one.",
  },
  {
    re: re(
      String.raw`\bgit\b${SAME_CMD}\b(reset\s+--hard|clean\s+-[a-z]*f|checkout\s+(--\s|\.\s*$)|restore\b|stash\s+(drop|clear)|branch\s+-D|rebase\b)`,
    ),
    why: "This git command can discard local changes or rewrite history.",
  },
  { re: /(^|[\s;&|(])rm\s+(-[a-z]*r|--recursive)/im, why: "Recursive delete." },
  {
    re: re(String.raw`\b(rm|del|Remove-Item|mv|move)\b${SAME_CMD}supabase[\\/]+migrations`, "im"),
    why: "Deleting or moving database migrations.",
  },
  { re: /\bpnpm\s+(add|remove|rm|uninstall|update|up)\b/m, why: "Changing project dependencies." },
  {
    re: /\bpnpm\s+(dlx|exec\s+shadcn)\b|(^|[\s;&|(])npx\s/m,
    why: "Downloads and runs a package from the registry.",
  },
  { re: /\bsupabase\s+(db\s+(reset|push)|migration\s+repair)\b/m, why: "Changes a database." },
  {
    re: /\bgh\s+(pr|issue|release|repo)\s+(create|merge|close|delete|edit|comment)\b/m,
    why: "Writes to GitHub.",
  },
  {
    re: re(String.raw`\b(vercel|netlify)\b${SAME_CMD}\b(deploy|--prod)\b`),
    why: "Deploys the application.",
  },
]

function respond(decision, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
        permissionDecisionReason: `[guard-bash] ${reason}`,
      },
    }),
  )
  process.exit(0)
}

let command = ""
try {
  const input = JSON.parse(readFileSync(0, "utf8"))
  command = String(input?.tool_input?.command ?? "")
} catch {
  process.exit(0)
}

for (const rule of DENY) {
  if (rule.re.test(command)) respond("deny", rule.why)
}
for (const rule of ASK) {
  if (rule.re.test(command)) respond("ask", rule.why)
}
process.exit(0)
