# 0006 — Supabase platform and email authentication

- **Status:** Accepted (2026-11-08)

## Context

P1 needs a database, authentication, a user profile and an activity log. ADR 0001 fixes a single
Next.js app, and the stack lists Supabase. Next.js 16 runs with `cacheComponents` and
`partialPrefetching`. That changes two things that matter for auth:

- Earlier routes stay mounted but hidden (React Activity, up to three routes) after a client-side
  navigation, including their rendered data and form inputs.
- A session-aware App Shell can be prerendered with the request's cookies. Code that reads
  `Date.now()` there is rejected.

Supabase also replaced the legacy `anon` / `service_role` keys with publishable (`sb_publishable_…`)
and secret (`sb_secret_…`) keys.

## Decision

**Platform**

- Supabase (Postgres, Auth) with `@supabase/ssr` cookie sessions. Local development uses the
  Supabase CLI stack (`pnpm db:*`). On Windows the CLI runs inside WSL through
  `scripts/supabase.mjs`.
- Schema changes are SQL migrations in `supabase/migrations/`. Every table has Row Level Security.
  Each migration ships with pgTAP tests in `supabase/tests/database/` (`pnpm db:test`).
- P1 tables: `profiles` (created by a trigger on sign-up) and append-only `activity_events`.
  Account deletion goes through the `delete_current_user()` function, so the app needs no secret
  key. Profile and activity rows cascade.

**Environment variables**

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are required. They are
  public: data is protected by RLS.
- `SUPABASE_SECRET_KEY` is server-only and optional. It is not used yet. It may only be used in
  `src/server/**` for work that must bypass RLS.
- The legacy names `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` are not
  supported.
- `pnpm env:local` writes `.env.local` from the running local stack.

**Auth flow**

- `src/proxy.ts` refreshes the session on every request and applies optimistic redirects
  (`decideRoute` in `src/config/routes.ts`). Routes are protected by default; only listed public
  routes are open.
- The proxy is not the authorization boundary. The data access layer (`getCurrentUser` /
  `requireUser` in `src/server/auth/session.ts`) verifies the session for each request, and RLS
  enforces ownership.
- Email sign-up requires confirmation. Email links use the token-hash flow handled by
  `/auth/confirm`. `?next=` targets go through `safeRedirectPath`.
- **Every auth state change is followed by a full page load:** sign-in, sign-out, password reset
  and account deletion.
  - The Server Action returns `redirectTo` instead of calling `redirect()`.
  - The client calls `navigateWithFullReload` (`src/lib/helpers/full-page-navigation.ts`).
  - This discards routes that Activity kept mounted, so no signed-in content or typed password
    survives in the tab after the change.
- `createSupabaseServerClient` awaits `io()` after reading cookies. Supabase work, including the
  `Date.now()` token-expiry check, then stays out of prerenders and streams at request time.
- Google OAuth (AUTH-03) is deferred until a Google OAuth client is available.

## Consequences

- Auth transitions cost one full document load. This is acceptable because they are rare and
  they also clear client caches.
- Header and profile data that depend on the session are not part of the prefetched App Shell.
  They render inside `<Suspense>` on navigation. Caching them with `"use cache: private"` is
  possible later, but it needs explicit invalidation after profile changes.
- Contributors need Docker and the Supabase CLI (in WSL on Windows) to run the app and the E2E
  tests locally.
- New tables must ship with RLS policies and pgTAP tests.
