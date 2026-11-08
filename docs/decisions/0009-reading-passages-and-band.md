# 0009 — Reading: multi-passage tests, band estimate, highlights and key words

- **Status:** Accepted (2026-11-09)
- **Spec:** [P4 design](../superpowers/specs/2026-11-09-p4-reading-design.md)

## Context

P2 shipped a minimal Reading flow: one passage per set, a library without filters and raw scores
only ([ADR 0007](0007-content-and-practice-engine.md)). P4 completes READ-01..07:

- library filters;
- a split view with highlighting and mobile tabs;
- evidence in explanations;
- a band estimate for full 40-question tests;
- adding passage words to My words ([ADR 0008](0008-vocabulary-srs-and-grammar.md));
- attempt history.

## Decision

**Passages and set kind** (`supabase/migrations/20261110100000_reading_passages.sql`)

- `practice_set_passages` (up to three per set, ordered by `position`) replaces the passage
  columns on `practice_sets`. Existing passages were migrated to position 1.
- `question_groups.passage_id` links each group to its passage. Evidence offsets in
  `question_keys` are relative to that passage.
- `practice_sets.kind` is `practice` or `full_test`. The content schema requires a full test to
  have 3 passages, 40 marks and a 60-minute test mode.
- `practice_set_words` links a set's passage key words to the shared `words` table. A word is
  visible when a published vocabulary set or a published practice set uses it
  (`is_published_word`). RLS covers both new tables (pgTAP: `reading_passages.test.sql`).

**Counting questions the IELTS way**

- A "choose TWO" question is one engine question that occupies two numbers (e.g. 23–24) and
  carries two marks.
- Question counts, "x of N answered" and section labels count marks, so a full test always
  shows 40 questions.

**Band estimate**

- `src/lib/learning/reading-band.ts` holds the commonly published Academic Reading conversion
  (39–40 → 9 … 1 → 1, 0 → 0).
- A band is shown only for `full_test` sets scored out of 40, with the note "Estimate based on
  the commonly published IELTS Academic Reading conversion — not an official score."
- Practice sets show `score / max` only.

**Attempt UI** (`src/features/practice`)

- `PassagePanel` provides:
  - passage tabs for multi-passage sets;
  - key words as buttons that open their meaning (in the learner's language first);
  - in review, the evidence mark ("Show in passage").
- "Add to My words" buttons are rendered by the server page and passed in as a prop, because
  the vocabulary feature's public entry also exports server-only components.
- Highlights (READ-03) are kept per attempt on the device only, in
  `localStorage["ielts-hub:highlights:<attemptId>"]`. They are not synced, and they still work
  for the visit when storage is blocked.
- Offline buffer:
  - Unsaved answers are mirrored, with the time they were given, to
    `localStorage["ielts-hub:pending-answers:<attemptId>"]`.
  - On the next visit, a stored answer is restored and sent only if it is newer than the
    server's copy (`attempt_answers.updated_at`, exposed as `answersSavedAt`). A newer answer
    saved from another device wins.
  - Entries are removed once the server confirms them or closes the attempt. Highlights are
    removed after a successful submit.
- Below `lg`, the attempt shows Passage / Questions tabs:
  - The tab bar is sticky under the header.
  - Both panels stay mounted, so typed answers survive switching.
  - Each panel's scroll position is restored when the learner switches back.

**Library and history** (`src/features/reading`)

- Filters live in the URL (`/reading?type=&level=`). Unknown values are ignored.
- `/reading/history` lists submitted attempts, newest first, with the band or score. The set
  intro shows the 3 most recent.
- Dates use the viewer's locale and time zone through the `LocalDateTime` client leaf.

**Content**

- `content/practice-sets/reading-full-test-1.json`: three original passages (about 700–750
  words each), 40 marks across 9 question types, evidence for every answer except NOT GIVEN,
  and 5 key words per passage.
- The rooftop set gained 5 key words.
- Key words never include an answer or its deciding evidence.
- All of this content is `ai_assisted` and published only in the local seed until the user
  reviews it (D-04).

## Consequences

- Highlights do not follow the learner to another device. A synced version would need a table
  and an RLS policy.
- The band is an estimate from a fixed table, not calibrated per test. That is acceptable only
  with the note, and should be revisited if real IELTS-calibrated material is licensed.
- The offline buffer compares the device clock with the server clock, so a device clock that is
  far ahead could still let an older copy win.
- An attempt submitted on another device leaves a small stale storage entry on the first device,
  because its attempt page never opens again.
- Counting marks changes the rooftop set to number its last question 11, because question 9 is a
  "choose TWO" question.
