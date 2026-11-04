---
name: project-security-review
description: Security review of IELTS Learning Hub code or changes against the project's security rules — secret exposure, environment variables, API/route-handler and Server Action security, authentication and authorization, input validation, XSS, CSRF, file uploads, logging of sensitive data, AI prompt data handling and external provider integrations. Report-only. Use when asked for a security review or before shipping code that touches auth, data, uploads, AI or providers.
argument-hint: "[files, feature or 'changed']"
disallowed-tools: Edit, Write, NotebookEdit
---

# Project security review

Report findings; do not edit code unless asked afterwards. Named `project-security-review` so it
does not shadow Claude Code's built-in `/security-review`. Never print secret values you
encounter — refer to them by variable name and location only.

## Workflow

1. **Scope** the files/feature (or `git diff` for changes) and map the trust boundaries: browser
   → route handlers / Server Actions → `src/server/**` → providers (Supabase, Anthropic,
   speech services).
2. **Read** `.claude/rules/security.md` and the env module(s) under `src/config/`.
3. **Check each area:**
   - **Secrets & env:** no secrets in client code, `NEXT_PUBLIC_*` only for public values,
     server env module imports `server-only`, `.env*` (except `.env.example`) ignored by git,
     no secrets in docs, tests or fixtures.
   - **API security:** route handlers and Server Actions validate input with Zod, return
     generic errors, set appropriate methods; no open redirects or SSRF via user-controlled URLs.
   - **AuthN/AuthZ:** protected operations check the session **and** resource ownership on the
     server; no reliance on client checks or hidden UI; RLS planned/enabled for Supabase tables.
   - **Input validation:** all untrusted input parsed server-side; size/length limits.
   - **XSS:** no `dangerouslySetInnerHTML` with dynamic or model-generated content; safe
     Markdown rendering; no `javascript:` URLs from user data.
   - **CSRF:** Server Actions rely on Next.js origin checks — flag custom cookie-auth route
     handlers that mutate state without origin/CSRF protection.
   - **File uploads (if present):** server-side MIME/size validation, private storage, signed
     URLs, generated file names.
   - **Logging:** no tokens, secrets, essays, audio, emails or other PII in logs or error
     messages returned to clients.
   - **AI data handling:** prompts contain only necessary data, no secrets, no other users'
     data; model output treated as untrusted (validated, never executed or rendered as HTML);
     prompt-injection impact considered for tools/actions the model can trigger.
   - **Providers:** calls only from `src/server/**` adapters, with timeouts, error handling and
     Zod-validated responses.
   - **Dependencies:** `pnpm audit --prod` may be run (read-only) and summarised.
4. **Verify** each finding by following the actual data flow; mark uncertain ones
   "Needs confirmation".
5. **Rank:** Critical / High / Medium / Low.

## Expected output

For each finding: severity, title, `file:line`, attack scenario (who, how, impact), fix.
Then: areas reviewed with no findings, areas **not** reviewed, and residual risks.
Never conclude that the application is "secure" or "compliant" — state what was checked.
