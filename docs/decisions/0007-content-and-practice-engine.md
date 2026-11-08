# 0007 — Content catalogue and practice engine in Postgres

- **Status:** Accepted (2026-11-08)

## Context

P2 needs a content model for practice sets, an import path with review status (decision D-04),
and an attempt engine shared by Reading, Listening and Grammar. The engine must:

- start, save, submit and score attempts using server time;
- allow only one active attempt per set;
- support test-mode deadlines and resuming an attempt.

Learners must never see answer keys before they submit. Scores must not be forgeable from the
client. ADR 0006 avoids using the Supabase secret key in the app.

## Decision

**Data model** (`supabase/migrations/20261108100000_content_and_practice_engine.sql`)

| Table             | Contents                                                                          |
| ----------------- | --------------------------------------------------------------------------------- |
| `content_items`   | Catalogue entry: type, slug, level, topics, source, `review_status`, version      |
| `practice_sets`   | Module, optional test time limit, passage                                         |
| `question_groups` | IELTS question type, instructions, shared options                                 |
| `questions`       | Prompt, options, `response_kind` (`single` / `multiple` / `text`)                 |
| `question_keys`   | Accepted answers, explanation (EN + optional VI), evidence offsets in the passage |
| `attempts`        | One learner's attempt at a set                                                    |
| `attempt_answers` | One answer per question of an attempt                                             |

Three response kinds cover every Reading and Grammar question type:

- `single` — MCQ, T/F/NG, Y/N/NG, matching;
- `multiple` — "choose TWO"; each correct choice is one mark;
- `text` — completion, short answer, gap fill. Several accepted variants are allowed; case and
  extra spaces are ignored, and spelling must match.

**Security**

- Learners can read only `published` content.
- `question_keys` has RLS enabled with no policy and no grant. Keys are released only by
  `get_attempt_review()`, and only for the caller's own submitted attempt.
- Attempts and answers are readable by their owner. They are written only by security-definer
  functions:
  - `start_attempt` resumes the active attempt. If that attempt's deadline has passed, it
    submits it first, then starts a new one.
  - `save_answer` validates the answer's shape and options, and rejects answers after the
    deadline (5 s grace).
  - `submit_attempt` is idempotent. After the deadline it records `time_expired`.
  - `finalize_attempt` (internal) scores the attempt and appends an `attempt.submitted`
    activity event in the same transaction.
- Scoring runs in SQL, so the client never receives keys and cannot write scores. pgTAP tests
  cover visibility, validation, ownership, scoring and deadlines.
- Concurrency:
  - `start_attempt` takes an advisory lock per learner and set, so a double click resumes the
    same attempt.
  - `save_answer` reads the attempt `FOR SHARE`, so a save racing a submit either lands before
    scoring or is rejected. An answer never changes after it is marked.
- `attempt.*` activity events are reserved: the learner insert policy on `activity_events`
  rejects them, so only `finalize_attempt` can record attempt results.

**Content pipeline**

- Content is authored as JSON in `content/practice-sets/` and validated by
  `practiceSetSourceSchema` (`src/lib/content/practice-set-schema.ts`).
- `pnpm content:seed` (`scripts/build-content-seed.mts`, run by Node 24 without a build step):
  - generates `supabase/seed.sql`;
  - uses deterministic UUIDs;
  - converts evidence quotes to passage offsets, failing when a quote is missing or ambiguous.
- `pnpm db:reset` loads `seed.sql` into the **local** database only. A production import is not
  built yet.

**Application**

- `src/server/practice/practice-service.ts`: typed data access; Zod-validates rows; maps engine
  errors.
- `src/features/practice`: reusable engine UI.
  - `AttemptRunner`: autosave via `useAttemptAnswers`, which saves the latest answer per
    question and retries with backoff while offline.
  - Also: the server-time `AttemptTimer`, question inputs, `AttemptReview` and
    `StartAttemptButton`.
- `src/features/reading` composes these for the Reading routes:
  - `/reading` and `/reading/[setSlug]` in `(app)`;
  - the attempt page in a new `(focus)` route group (no sidebar, `FocusShell`);
  - `/review` back in `(app)`.
- If an attempt has passed its deadline when its page is opened, the server submits it and
  redirects to the results.

## Consequences

- Business rules live in SQL functions. Changing scoring means a migration plus pgTAP tests;
  TypeScript only maps errors and renders.
- Grammar (P3) and Listening (P10) reuse the tables, functions and UI. Listening will need audio
  assets and spelling-specific feedback.
- The sample set in `content/practice-sets/` is AI-assisted and marked `published` **for local
  development only**. Real content must be human-reviewed before it is published (D-04).
- With streaming, a missing set or attempt renders the not-found page with HTTP 200. Next.js
  marks such pages `noindex`.
- Keys are revealed after any submitted attempt, including an empty learn-mode one. A learner
  can therefore see the answers and then score full marks in test mode on the same set. This
  affects only their own results. Before test-mode scores feed band estimates, progress or
  anything shared, those features must account for it (e.g. count only the first test attempt
  per set).
- There is no rate limiting on starting attempts yet.
- Not built yet: per-question instant checking in learn mode (GRAM-03, P3), band conversion
  for full tests, highlighting, mobile passage/question tabs, attempt history and
  add-to-My-words (P4), and a production content import.
