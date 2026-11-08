# 0008 — Vocabulary SRS, grammar practice and learning through play

- **Status:** Accepted (2026-11-09)
- **Spec:** [P3 design](../superpowers/specs/2026-11-08-p3-vocabulary-grammar-design.md)

## Context

Learners give up on vocabulary and grammar when they cram too much, when it feels like a
textbook, or after a few days. P3 aims at a 15–20 minute daily habit:

- a few new words plus reviews;
- bilingual, example-rich explanations;
- short grammar lessons with instant feedback;
- a "learning while playing" feel without pressure.

It builds on the P2 engine ([ADR 0007](0007-content-and-practice-engine.md)).

## Decision

**Spaced repetition in Postgres**
(`supabase/migrations/20261109110000_vocabulary_srs.sql`)

- Content tables `words`, `vocabulary_sets`, `vocabulary_set_words`:
  - A word is visible only if it belongs to a published set.
  - Words are shared across sets.
- Learner tables `user_words` (one SRS record per learner and word) and append-only
  `review_logs`:
  - Learners can read only their own rows.
  - Rows are written only by security-definer functions.
- New words:
  - `add_set_to_my_words` / `add_word_to_my_words` queue words as `new`, in add order
    (`queue_order`).
  - `introduce_new_words` introduces up to `profiles.daily_new_words` (5, 10 or 15, default 10)
    per local calendar day of `profiles.timezone`. The limit applies when words are introduced,
    and an advisory lock stops two tabs from exceeding it.
- `review_word` applies SM-2 style rules on server time:
  - Again → 10 minutes. Hard → interval × 1.2.
  - Good → 1, 3, then interval × ease. Easy → interval × ease × 1.3.
  - A word counts as mastered at 21 days or more.
  - It needs the `expected_review_count` token, so a double grade is rejected (`stale_review`).
- `finish_review_session` writes one server-side `vocabulary.review_session` event, counted from
  the review log.
- `weekly_review_days` counts distinct local days with at least one review this week.

**Grammar on the P2 engine** (`supabase/migrations/20261109100000_grammar_engine.sql`)

- `grammar_topics` stores a bilingual lesson (JSON blocks) and links to a `grammar` practice set.
- Two new question types:
  - `error_correction` ("Spot the mistake"): the sentence's words are the options;
  - `sentence_transformation`: text answers with accepted variants.
- `check_answer` is learn mode only. It saves, scores and locks one answer, and returns that
  question's key, explanation and correction. Checked answers cannot be changed. Scoring is
  shared through `score_answer`.
- Mastery uses the latest submitted attempt: 80% or more is mastered.
- `attempt.*`, `vocabulary.*` and `grammar.*` events are reserved for definer functions.

**Content**

- JSON in `content/vocabulary-sets/` and `content/grammar-topics/`, validated by Zod
  (`src/lib/content/{vocabulary,grammar}-schema.ts`) and seeded by `pnpm content:seed`.
- The starter content was drafted by Claude (`ai_assisted`). It is published **only in the local
  seed** until the user reviews it (D-04).

**Learning through play** (user request: "vừa học vừa chơi")

- Reviews are mini-games, and each due word gets exactly one graded game per session:
  - Match pairs;
  - Save the sentence (cloze);
  - Perfect pair (complete a collocation);
  - recall, as the fallback.
- Grammar adds Spot the mistake.
- During a session: a combo counter, the original mascot "Pip" (inline SVG), short Web Audio tones
  with a remembered mute, and an end-of-session celebration. Confetti is skipped when the person
  prefers reduced motion.
- A word garden grows from SRS state (seed, sprout, plant, bloom) and plants never wilt.
- A weekly goal of 5 days never resets anything.
- No leaderboards, no countdown timers in games, no guilt copy.
- Pronunciation uses the browser's speech synthesis ("device voice") until a TTS provider is
  chosen (D-08).

## Consequences

- Combo, garden and goal add no stored game state, so they cannot drift from real learning.
  The trade-off is that they can never show anything SRS does not know.
- Grammar mastery can be reached by retaking right after seeing the answers. This is acceptable
  for practice. Revisit before mastery feeds the roadmap (P8), e.g. require mastery on two days.
- Browser speech quality varies by device, and some browsers have none: the Listen button is
  hidden there.
- The daily limit uses the learner's time zone, so changing it mid-day can shift "today".
- Starter content must be reviewed before any production use, and there is still no production
  content import.
