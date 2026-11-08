# P3 Vocabulary & Grammar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a fun, low-pressure 15–20 minute daily vocabulary habit ("vừa học vừa chơi": mini-games, combo, mascot, word garden, weekly goal) on top of honest SRS review, plus short friendly grammar lessons with instantly-checked practice.
bilingual, example-rich cards) and short, friendly grammar lessons with instantly-checked practice.

**Architecture:** Same pattern as P2 ([ADR 0007](../../decisions/0007-content-and-practice-engine.md)):
content tables readable only when published; per-user tables with owner-only RLS; every write that
carries a business rule (SRS scheduling, new-word limit, instant check, events) is a
security-definer Postgres function using server time, covered by pgTAP. Grammar practice reuses
the P2 practice engine with a new learn-mode `check_answer`. UI lives in `src/features/vocabulary`
and `src/features/grammar`; focus-mode pages in the `(focus)` route group.

**Tech Stack:** Next.js 16 App Router (Cache Components), React 19, TypeScript strict, Supabase
Postgres + RLS + pgTAP, Zod, Vitest + RTL, Playwright, Tailwind v4 tokens, shadcn/ui.

**Spec:** [docs/superpowers/specs/2026-11-08-p3-vocabulary-grammar-design.md](../specs/2026-11-08-p3-vocabulary-grammar-design.md)

## Global Constraints

- Work on branch `feat/p3-vocabulary-grammar` from `main`; commit per task; do not push or merge unasked.
- Run every pnpm command with Node 24 on PATH: `export PATH="/c/Users/ADMIN/AppData/Local/nvm/v24.22.2:$PATH"`.
- No new npm dependencies.
- New words per day: learner chooses **5, 10 or 15**, default **10**; enforced when words are **introduced**, never when added.
- A review session takes at most **30** due reviews; extra due reviews are offered as optional "Review N more".
- "Today" = learner's **local calendar day** from `profiles.timezone`; a review is due when `due_at <= now()`.
- A word is **mastered** when `interval_days >= 21`.
- Grammar mastery: latest submitted grammar attempt — none → _Not started_, < 80% → _Practising_, ≥ 80% → _Mastered_.
- Grammar practice is **learn mode only**; unanswered/unchecked items count as wrong on submit.
- Words are unique by slug (`lemma` or `lemma-pos`); shared across sets; one SRS record per learner per word.
- Event types `vocabulary.*` and `grammar.*` (like `attempt.*`) are reserved: only definer functions write them.
- Content is `source: ai_assisted`, published for the **local** seed only; the user reviews before real learners (D-04).
- Play layer (spec §5.5): mini-games, session combo, mascot, end-of-session celebration, word garden (plants never die), weekly goal (default 5 days, never resets). No leaderboards, no countdown timers in games, no resetting daily streaks, no guilt or urgency copy. Correct answers and rules always stated plainly. Sound on by default with a remembered mute toggle; animations respect `prefers-reduced-motion`.
- Every page: loading, empty, error states; 360px wide; light + dark; accessible names.
- Explanations show Vietnamese and English; `profiles.explanation_language` decides which is first/expanded.

## Review Focus

1. **Double grade (double click / two tabs) on a review card** — must advance the schedule once. Pinned in Task 2 (`stale_review` test).
2. **Learner's local midnight** — words introduced at 23:50 local count for that day, not the next. Pinned in Task 2 (timezone boundary test).
3. **Session abandoned after new words were introduced** — those words still count against today's limit and come back as due next time. Pinned in Task 2.
4. **Cloze answer with different case / extra spaces** (" Sustainable ") — accepted. Pinned in Task 7 (`checkCloze` tests).
5. **Browser without speech synthesis** — Listen button is not rendered, nothing throws. Pinned in Task 7 (`ListenButton` test).

---

### Task 1: Grammar engine extension (migration + pgTAP)

**Files:**

- Create: `supabase/migrations/20261109100000_grammar_engine.sql`
- Create: `supabase/tests/database/grammar_engine.test.sql`
- Modify: `src/server/database/database.types.ts` (regenerate with `pnpm db:types`)

**Interfaces:**

- Produces (SQL):
  - `content_items.type` check adds `'vocabulary_set'`, `'grammar_topic'`.
  - `question_groups.question_type` check adds `'error_correction'` (response kind `single`: options are the sentence's word tokens, the accepted id is the wrong token — "Spot the mistake") and `'sentence_transformation'` (response kind `text`).
  - `attempt_answers.checked_at timestamptz` (null until instant-checked); `question_keys.correction text` (nullable; the corrected sentence for `error_correction`, returned by `check_answer` and `get_attempt_review`).
  - `public.score_answer(target_question_id uuid, answer jsonb) returns integer` — points for one answer; `finalize_attempt` is rewritten to use it (no behaviour change; P2 pgTAP must still pass). Not granted to learners.
  - `public.check_answer(target_attempt_id uuid, target_question_id uuid, answer jsonb) returns table (is_correct boolean, points integer, accepted jsonb, explanation text, explanation_vi text)` — owner only, attempt `in_progress` and `mode = 'learn'`, saves the answer (same validation as `save_answer`), sets `points`, `is_correct`, `checked_at`, returns the key for **that question only**. Errors (P0001): `attempt_not_found`, `attempt_submitted`, `check_unavailable` (test mode), `answer_locked` (already checked), plus `save_answer`'s.
  - `save_answer` raises `answer_locked` when the row has `checked_at`.
  - `finalize_attempt` keeps `points/is_correct` of checked rows consistent (rescoring gives the same values).
  - Table `public.grammar_topics (id uuid pk references content_items on delete cascade, position int, lesson jsonb not null, practice_set_id uuid references practice_sets)`; RLS: published content readable via `content_items`.
  - Insert policy on `activity_events` rejects `type like 'attempt.%' or 'vocabulary.%' or 'grammar.%'`.

- [ ] **Step 1: Create branch** `git checkout -b feat/p3-vocabulary-grammar`
- [ ] **Step 2: Write failing pgTAP `grammar_engine.test.sql`** (fixtures like `practice_engine.test.sql`: one published grammar set with 3 text/choice questions, one learner A, one B). Assertions:
  - `check_answer` on a correct answer returns `(true, 1)` and that question's `accepted`/`explanation`.
  - after it, `save_answer` on the same question throws `answer_locked`; `check_answer` again throws `answer_locked`.
  - `check_answer` in a **test**-mode attempt throws `check_unavailable`; learner B on A's attempt throws `attempt_not_found`.
  - submitting scores checked + unchecked rows; `score` equals sum of `score_answer` results; unanswered = 0.
  - `sentence_transformation` text answer `"  If I Had  more time, I would travel. "` matches accepted `"If I had more time, I would travel."`.
  - learner cannot call `score_answer` (42501); learner insert of `vocabulary.reviewed` / `grammar.x` events throws 42501.
  - a `grammar_topics` row of a draft content item is invisible to learners.
- [ ] **Step 3: Run** `pnpm db:reset && pnpm db:test` → Expected: grammar_engine FAIL (functions missing), P1/P2 files ok.
- [ ] **Step 4: Write the migration** (drop/recreate the two check constraints by name from `\d`; add column; functions with `security definer set search_path = ''`, grants as in P2).
- [ ] **Step 5: Run** `pnpm db:reset && pnpm db:test` → Expected: `All tests successful`.
- [ ] **Step 6: Regenerate types** `pnpm db:types && pnpm exec prettier --write src/server/database/database.types.ts && pnpm typecheck` → PASS.
- [ ] **Step 7: Commit** (include `docs/superpowers/specs/2026-11-08-p3-vocabulary-grammar-design.md` and this plan) `feat(db): add grammar topics and learn-mode instant check to the practice engine`

### Task 2: Vocabulary & SRS schema (migration + pgTAP)

**Files:**

- Create: `supabase/migrations/20261109110000_vocabulary_srs.sql`
- Create: `supabase/tests/database/vocabulary_srs.test.sql`
- Modify: `src/server/database/database.types.ts` (regenerate)

**Interfaces:**

- Produces (SQL):
  - `public.words (id uuid pk, slug text unique, lemma text, part_of_speech text, ipa text, meaning_en text, meaning_vi text, examples jsonb, collocations jsonb, common_mistakes jsonb, level text, topics text[])` — readable by learners only if the word belongs to at least one published set.
  - `public.vocabulary_sets (id uuid pk references content_items on delete cascade)`; `public.vocabulary_set_words (set_id, word_id, position, primary key (set_id, word_id))`.
  - `profiles.daily_new_words integer not null default 10 check (daily_new_words in (5, 10, 15))`, added to the column-level update grant.
  - `public.user_words (user_id, word_id, status text check in ('new','learning'), ease numeric(4,2) default 2.50, interval_days integer default 0, repetitions integer default 0, lapses integer default 0, review_count integer default 0, due_at timestamptz, added_at, introduced_at, primary key (user_id, word_id))` — owner read only.
  - `public.review_logs (id bigint identity, user_id, word_id, grade text check in ('again','hard','good','easy'), exercise text check in ('intro','recall','cloze','collocation'), interval_before int, interval_after int, reviewed_at timestamptz default now())` — owner read only, append-only.
  - `add_set_to_my_words(target_set_id uuid) returns integer` (rows added; skips existing), `add_word_to_my_words(target_word_id uuid) returns boolean`.
  - `introduce_new_words() returns setof uuid` — learner's remaining allowance for **today in `profiles.timezone`** = `daily_new_words` − words with `introduced_at` today; marks that many oldest `new` rows (by `added_at`, then set position) `learning`, `introduced_at = now()`, `due_at = now()`; returns their word ids. Takes a per-user advisory lock.
  - `review_word(target_word_id uuid, grade text, exercise text, expected_review_count integer) returns timestamptz` (new `due_at`). Raises `word_not_found`, `word_not_introduced`, `stale_review` (when `review_count <> expected_review_count`), `invalid_response`. Applies the SM-2 rules below, increments `review_count`, appends `review_logs`.
  - `finish_review_session(session_started_at timestamptz) returns void` — requires `session_started_at` within the last 6 hours and ≤ now(); if ≥ 1 review log since then, inserts one `vocabulary.review_session` event with metadata `{reviews, new_words, again}`; idempotent per `session_started_at` (no second event).
  - `weekly_review_days() returns integer` — distinct local days in the current local week (Monday start, `profiles.timezone`) with at least one review log.
  - SM-2 rules (exact):

    | grade | ease                   | interval_days                                     | repetitions | lapses | due_at                |
    | ----- | ---------------------- | ------------------------------------------------- | ----------- | ------ | --------------------- |
    | again | max(1.30, ease − 0.20) | 0                                                 | 0           | +1     | now() + 10 minutes    |
    | hard  | max(1.30, ease − 0.15) | max(1, round(interval × 1.2))                     | +1          | —      | now() + interval days |
    | good  | —                      | rep 0 → 1, rep 1 → 3, else round(interval × ease) | +1          | —      | now() + interval days |
    | easy  | ease + 0.15            | rep 0 → 4, else round(interval × ease × 1.3)      | +1          | —      | now() + interval days |

- [ ] **Step 1: Write failing pgTAP `vocabulary_srs.test.sql`.** Assertions:
  - draft-set words invisible; published-set words visible; `review_logs`/`user_words` of B invisible to A; direct insert/update on `user_words` → 42501.
  - `add_set_to_my_words` returns 10 then 0 (already added); a word shared by two sets yields one `user_words` row.
  - with `daily_new_words = 5`: `introduce_new_words()` returns 5 ids, a second call the same day returns 0.
  - **local midnight:** timezone `Asia/Ho_Chi_Minh`; set `introduced_at` of 5 rows to `2026-11-08 16:50 UTC` (23:50 local) and freeze comparisons by calling an internal helper with an explicit `now`: implement `introduce_new_words` on top of `public.new_word_allowance(user_id uuid, at timestamptz) returns integer` (private, testable as owner) and assert allowance at `2026-11-08 16:55 UTC` = 0 and at `2026-11-08 17:05 UTC` (00:05 local next day) = 5.
  - **abandoned intro:** introduced words have `due_at <= now()` and are returned by a due query without any review.
  - `review_word` grades follow the table (good from rep 0 → interval 1; good again → 3; easy at rep 2 interval 3 ease 2.5 → round(3×2.5×1.3)=10; again → interval 0, lapses 1, ease 2.3).
  - **double grade:** two calls with the same `expected_review_count` → second throws `stale_review`, one log row.
  - `review_word` on a `new` word throws `word_not_introduced`.
  - `finish_review_session` writes exactly one event, a second call with the same start writes none; with no reviews writes none.
  - learner cannot call `new_word_allowance` (42501).
  - `weekly_review_days()` (security invoker, own `review_logs`, Monday-start week in `profiles.timezone`) returns 0 with no reviews, 2 after reviews on two different local days, and does not count a review from last Sunday 23:30 local.
- [ ] **Step 2: Run** `pnpm db:reset && pnpm db:test` → Expected: vocabulary_srs FAIL.
- [ ] **Step 3: Write the migration.**
- [ ] **Step 4: Run** `pnpm db:reset && pnpm db:test` → Expected: `All tests successful`.
- [ ] **Step 5: Regenerate types**, `pnpm typecheck` → PASS.
- [ ] **Step 6: Commit** `feat(db): add vocabulary sets, words and SRS review functions`

### Task 3: Content schemas and seed generator

**Files:**

- Create: `src/lib/content/vocabulary-schema.ts`, `src/lib/content/grammar-schema.ts` (import only `zod` and, with `.ts` extension, `./practice-set-schema.ts`)
- Modify: `src/lib/content/practice-set-schema.ts` (add `error_correction: "single"` and `sentence_transformation: "text"` to `QUESTION_TYPE_RESPONSE_KIND`; labels "Spot the mistake", "Sentence transformation"; an `error_correction` question gives `prompt` (the sentence), `accepted: [wrong word or phrase]` and `correction` (the fixed sentence) and **no options** — the seed tokenises the prompt into options `t1..tn` and maps `accepted` to the matching token id, failing unless the wrong part is exactly one word that occurs once in the sentence; allow `module: "grammar"` sets without passage)
- Modify: `scripts/content-seed.mts`, `scripts/build-content-seed.mts`
- Test: `tests/unit/lib/vocabulary-schema.test.ts`, `tests/unit/lib/grammar-schema.test.ts`, `tests/unit/scripts/content-seed.test.ts`

**Interfaces:**

- Produces:
  - `vocabularySetSourceSchema` → `VocabularySetSource = { slug, title, summary?, level, topics, source, reviewStatus, version, words: WordSource[] }`; `WordSource = { slug, lemma, partOfSpeech, ipa, meaningEn, meaningVi, examples: { en, vi, cloze }[] (1–3; `cloze`must occur exactly once in`en`), collocations: string[] (0–6), commonMistakes: { wrong, right, whyVi, whyEn }[] (0–3), level, topics }`.
  - `grammarTopicSourceSchema` → `GrammarTopicSource = { slug, title, summary, level, source, reviewStatus, version, position, lesson: GrammarLesson, practice: PracticeSetSource (module "grammar", no testTimeLimitMinutes) }`; `GrammarLesson = { introEn, introVi, sections: { heading, bodyEn, bodyVi, examples: { en, vi?, note? }[] }[] (1–5), commonMistakes: { wrong, right, whyEn, whyVi }[] (1–5), ieltsTipEn, ieltsTipVi }`.
  - `buildVocabularySetSql(set: VocabularySetSource): string`, `buildGrammarTopicSql(topic: GrammarTopicSource): string`, `buildSeedSql(input: { practiceSets, vocabularySets, grammarTopics }): string` (words de-duplicated by slug across sets — identical definitions required, else throw `Conflicting definitions for word "<slug>"`).
  - Content dirs: `content/practice-sets/`, `content/vocabulary-sets/`, `content/grammar-topics/`.

- [ ] **Step 1: Write failing unit tests:** schema accepts a valid set/topic; rejects a cloze not in its sentence (`Example 1 of "<slug>": cloze must appear once in the sentence`), duplicate word slugs within a set, a grammar practice with `testTimeLimitMinutes`; seed: shared word emitted once with two `vocabulary_set_words` rows; conflicting word definitions throw; grammar topic emits `content_items`, `practice_sets` (module grammar), `grammar_topics` with lesson JSON.
- [ ] **Step 2: Run** `pnpm exec vitest run tests/unit/lib tests/unit/scripts` → FAIL.
- [ ] **Step 3: Implement** schemas and generator (deterministic ids via `contentUuid("word:<slug>")`, `contentUuid("vocabulary-set:<slug>")`, `contentUuid("grammar-topic:<slug>")`; grammar practice set id `contentUuid("practice-set:<topic slug>-practice")`).
- [ ] **Step 4: Run** tests → PASS; `pnpm content:seed` still writes the P2 set unchanged (`git diff supabase/seed.sql` empty apart from new sections).
- [ ] **Step 5: Commit** `feat(content): add vocabulary and grammar content schemas and seed generation`

### Task 4: Starter content (Claude-drafted, local-only)

**Files:**

- Create: `content/vocabulary-sets/{education,environment,technology,health}.json` (10 words each, B1–B2)
- Create: `content/grammar-topics/{articles,present-perfect-vs-past-simple,conditionals,relative-clauses}.json` (lesson + ~8 practice items; mix of `multiple_choice`, `gap_fill`, `error_correction`, `sentence_transformation`)
- Modify: `supabase/seed.sql` (generated)

All `source: "ai_assisted"`, `reviewStatus: "published"`. Style (spec §6): short sentences, one idea per paragraph, IELTS-topic examples, Vietnamese that sounds like a friendly Vietnamese teacher, light humour in examples and "why" text, rule always stated plainly. Each word: 2 examples with `cloze`, 2–4 collocations, ≥1 common mistake typical for Vietnamese learners.

- [ ] **Step 1: Draft the 8 files.**
- [ ] **Step 2: Run** `pnpm content:seed` → `Wrote supabase/seed.sql with 1 practice set(s), 4 vocabulary set(s), 4 grammar topic(s)`.
- [ ] **Step 3: Run** `pnpm db:reset && pnpm db:test` → PASS (seed loads; tests unaffected).
- [ ] **Step 4: Commit** `content: draft starter vocabulary sets and grammar topics (AI-assisted, local only)`

### Task 5: Server services

**Files:**

- Create: `src/server/vocabulary/vocabulary-service.ts`, `src/server/grammar/grammar-service.ts`
- Modify: `src/server/practice/practice-service.ts` (add `checkAnswer`; add `"check_unavailable" | "answer_locked"` to engine errors)
- Modify: `src/server/auth/session.ts` (`CurrentUser.dailyNewWords: 5 | 10 | 15`)
- Test: `tests/unit/server/srs-errors.test.ts` (error mapping only; DB behaviour is pgTAP-tested)

**Interfaces** (all `import "server-only"`, Zod-parse rows, map P0001 messages like `practice-service`):

- `listVocabularySets(): Promise<VocabularySetSummary[]>` (`{ id, slug, title, summary, level, topics, wordCount, addedCount }`)
- `getVocabularySet(slug): Promise<VocabularySetDetail | null>` (`… & { words: WordSummary[] }`, `WordSummary = { id, slug, lemma, partOfSpeech, meaningEn, meaningVi, inMyWords: boolean }`)
- `getWord(slug): Promise<WordDetail | null>` (`WordSummary & { ipa, examples, collocations, commonMistakes, srs: { status, intervalDays, dueAt, isMastered } | null }`)
- `getVocabularyOverview(): Promise<{ dueCount, newWaitingCount, newAllowanceToday, myWordsCount, masteredCount }>`
- `startReviewSession(): Promise<ReviewSessionPlan>` — calls `introduce_new_words`, then loads up to 30 due words (oldest `due_at` first, excluding just-introduced) → `{ startedAt: string, newWords: ReviewCard[], dueWords: ReviewCard[], extraDueCount: number }`; `ReviewCard = WordDetail-subset + { reviewCount: number }`.
- `reviewWord(input: { wordId, grade, exercise, expectedReviewCount }): Promise<EngineResult<{ dueAt: string }>>`
- `finishReviewSession(startedAt: string): Promise<EngineResult<null>>`
- `addSetToMyWords(setId)`, `addWordToMyWords(wordId)`: `Promise<EngineResult<number | boolean>>`
- `listGrammarTopics(): Promise<GrammarTopicSummary[]>` (`{ slug, title, summary, level, position, mastery: "not_started" | "practising" | "mastered", lastScorePercent: number | null }`)
- `getGrammarTopic(slug): Promise<GrammarTopicDetail | null>` (`summary & { lesson: GrammarLesson, practiceSetId, practiceSetSlug }`)
- `checkAnswer(attemptId, questionId, response): Promise<EngineResult<{ isCorrect, points, accepted, explanation, explanationVi }>>`
- `masteryFromScore(score: number | null, max: number | null)` exported pure helper (unit-tested: null → not_started, 7/8 → mastered (87.5%), 6/8 → practising (75%), 0/0 → not_started).
- `getWordGarden(): Promise<GardenBed[]>` — `GardenBed = { topic: ContentTopic, plants: { wordSlug, lemma, stage: GardenStage }[] }`, one bed per word's **first** topic, beds sorted by topic order in `CONTENT_TOPICS`.
- `gardenStage(status: "new" | "learning", intervalDays: number): GardenStage` (`GardenStage = "seed" | "sprout" | "plant" | "bloom"`; new → seed, 0–6 days → sprout, 7–20 → plant, ≥ 21 → bloom) — exported pure helper.
- `getWeeklyGoal(): Promise<{ daysThisWeek: number; goal: 5 }>` (calls `weekly_review_days`).

- [ ] **Step 1: Write failing unit tests** for `masteryFromScore`, `gardenStage` (new/0 → seed and sprout boundaries at 0, 6, 7, 20, 21) and the new error mapping (`answer_locked`, `check_unavailable`, `stale_review`, `word_not_introduced` map to themselves; unknown → `failed`).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** unit tests + `pnpm typecheck` → PASS.
- [ ] **Step 5: Commit** `feat(server): add vocabulary, grammar and instant-check services`

### Task 6: Grammar UI

**Files:**

- Create: `src/features/grammar/{index.ts,routes.ts}`, `components/{grammar-catalogue,grammar-lesson,grammar-practice}.tsx`, `actions.ts` (`checkAnswerAction`)
- Modify: `src/features/practice/components/attempt-runner.tsx` (prop `instantCheck?: (questionId: string, response: string[]) => Promise<CheckResult>`; when set, each question shows a "Check" button, locks after checking, shows `InstantFeedback`), create `src/features/practice/components/instant-feedback.tsx`
- Create routes: `src/app/(app)/grammar/page.tsx` (replace empty state), `src/app/(app)/grammar/[topicSlug]/page.tsx`, `src/app/(focus)/grammar/[topicSlug]/practice/[attemptId]/page.tsx`, `src/app/(app)/grammar/[topicSlug]/practice/[attemptId]/review/page.tsx`
- Test: `tests/unit/features/grammar.test.tsx`

**Interfaces:**

- Consumes Task 5 grammar service + `checkAnswer`; P2 `StartAttemptButton` (mode `"learn"` only), `AttemptReview`.
- `CheckResult = { ok: true; isCorrect: boolean; accepted: string[]; explanation: string; correction: string | null } | { ok: false; error: string }` (explanation already language-picked on the server from `CurrentUser.explanationLanguage`).
- `QuestionInput` renders `error_correction` ("Spot the mistake") as the sentence split into tappable word chips (`role="radio"` in a radiogroup, accessible name = the word); selecting one sets the response to that token id.

- [ ] **Step 1: Failing tests:** catalogue groups topics by level and shows mastery badges ("Not started", "Practising 75%", "Mastered"); lesson renders VI first when `explanationLanguage="vi"` with EN collapsible, and the common-mistakes table; Spot the mistake: tapping the chip "a" in "She is a honest student." sets response `["t3"]`; AttemptRunner with `instantCheck`: clicking Check calls it once, shows "Correct"/"Not quite" + explanation (+ correction when present), disables the input; without `instantCheck` behaviour unchanged (existing tests still pass).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** unit tests, `pnpm lint`, `pnpm typecheck`, `pnpm build` → PASS.
- [ ] **Step 5: Commit** `feat(grammar): add grammar catalogue, lessons and instantly-checked practice`

### Task 7: Vocabulary UI

**Files:**

- Create: `src/features/vocabulary/{index.ts,routes.ts,actions.ts}`, `components/{vocabulary-home,set-catalogue,set-detail,word-detail,word-card,listen-button,review-session,match-pairs}.tsx`, `utils/{review-session.ts,cloze.ts}`, `hooks/use-speech.ts`
- Modify: `src/features/settings/{schemas/settings-schemas.ts,components/profile-form.tsx,actions.ts}` (daily new words select 5/10/15)
- Create routes: `src/app/(app)/vocabulary/page.tsx` (replace empty state), `.../vocabulary/sets/page.tsx`, `.../vocabulary/sets/[setSlug]/page.tsx`, `.../vocabulary/words/[wordSlug]/page.tsx`, `src/app/(focus)/vocabulary/review/page.tsx`
- Test: `tests/unit/features/vocabulary.test.tsx`, `tests/unit/features/review-session.test.ts`

**Interfaces:**

- `checkCloze(input: string, expected: string): boolean` — trim, collapse spaces, case-insensitive; spelling exact.
- `reviewSessionReducer(state: SessionState, action: SessionAction): SessionState` — pure. Order: each new word → `card` step then `intro-check` (pick meaning; correct → good, wrong → again); then due words in games: batches of up to 5 words → `match-pairs` (each pair graded on first try: correct → good, mismatched → again), then per word alternating `save-sentence` (cloze) and `perfect-pair` (collocation, only with ≥ 2 collocations; else `recall`); `again` re-queues the word once as `recall` at the end; also tracks `combo` (consecutive correct, reset on a miss) and `bestCombo`; finishes with `done` (`{ reviewed, newWords, againCount, extraDueCount, bestCombo }`).
- `useSpeech(): { isSupported: boolean; speak: (text: string) => void }` (`window.speechSynthesis`, `lang: "en-GB"`).
- `ListenButton({ text })` renders nothing when unsupported.

- [ ] **Step 1: Failing tests:** `checkCloze("  Sustainable ", "sustainable")` true, `"sustainble"` false; reducer sequences (2 new + 2 due → card, intro-check, card, intro-check, match-pairs (2 words), save-sentence, perfect-pair; a mismatched pair grades that word `again` and re-queues it once as `recall`; combo 3 then a miss → combo 0, bestCombo 3; empty plan → `done` immediately with zeros); `ListenButton` absent when `speechSynthesis` undefined, present and calls `speak` when defined; home empty state ("Add a set to start learning" + link to sets) when `myWordsCount = 0`; done screen shows "All done for today" and "Review 12 more" only when `extraDueCount > 0`; settings form saves `dailyNewWords`; MatchPairs (interface in Task 8) — correct pair removed and `onResult(id, true)`; wrong pair keeps both and `onResult(id, false)` once even after a later correct match.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (session page calls `startReviewSession` on load, `reviewWord` per grade with `expectedReviewCount`, `finishReviewSession` on done; grade buttons disabled while a review is in flight). **Step 4: Run** unit tests, lint, typecheck, build → PASS.
- [ ] **Step 5: Commit** `feat(vocabulary): add sets, word cards, My words and the daily review session`

### Task 8: Play layer (mascot, combo, sound, celebration, garden, weekly goal)

**Files:**

- Create: `src/components/shared/mascot.tsx` (business-agnostic inline SVG character)
- Create: `src/features/vocabulary/components/{combo-meter,session-celebration,word-garden,weekly-goal}.tsx`, `src/features/vocabulary/hooks/use-feedback-sound.ts`
- Modify: `src/features/vocabulary/components/{review-session,vocabulary-home}.tsx`; `src/features/practice/components/instant-feedback.tsx` (mascot reaction in grammar)
- Test: `tests/unit/features/play.test.tsx`

**Interfaces:**

- `Mascot({ mood }: { mood: "idle" | "happy" | "thinking" | "cheering" })` — decorative (`aria-hidden`), original drawing, tokens for colours (works in dark mode).
- `useFeedbackSound(): { playCorrect(): void; playMiss(): void; playCelebrate(): void; isMuted: boolean; toggleMute(): void }` — Web Audio tones (no files); mute stored in `localStorage` key `ielts-hub:sound-muted`, read/write wrapped in try/catch; no-op when `AudioContext` is missing.
- (Task 7 creates) `MatchPairs({ words, onResult })` — two columns (words, meanings) as buttons; selecting a word then its meaning: correct → pair disappears with animation; wrong → brief shake, that word graded `again` once; `onResult(wordId, correct)` fires on each word's **first** attempt only.
- `ComboMeter({ combo })` hidden below 2, shows "x2", "x3"…; `SessionCelebration({ summary })` uses the reducer's `done` summary; `WordGarden({ beds })`; `WeeklyGoal({ daysThisWeek, goal })` ("4/5 days this week", full ring when reached, never a reset message).
- Copy rules: mascot lines are short, kind and funny; never mock ("Oops, so close!" not "Wrong!").

- [ ] **Step 1: Failing tests:** ComboMeter hidden at 1, shows "x3" at 3; `useFeedbackSound` toggles and persists mute, does not throw when `AudioContext` and `localStorage` throw; WordGarden renders a bloom for interval ≥ 21 and an empty-garden message when no beds; WeeklyGoal "4/5 days this week" and celebratory label at 5/5; with `prefers-reduced-motion: reduce` the celebration renders without the confetti element.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (home shows WeeklyGoal + WordGarden above the session card; review session shows Mascot + ComboMeter + mute toggle; MatchPairs gets its pair-vanish and shake animations; celebration at `done`). **Step 4: Run** unit tests, lint, typecheck, build → PASS.
- [ ] **Step 5: Commit** `feat(vocabulary): add mini-games, combo, mascot, word garden and weekly goal`

### Task 9: E2E, docs, final verification

**Files:**

- Create: `tests/e2e/vocabulary.spec.ts`, `tests/e2e/grammar.spec.ts` (fresh learner per test, like `reading.spec.ts`)
- Create: `docs/decisions/0008-vocabulary-srs-and-grammar.md`; Modify: `docs/decisions/README.md`, `README.md` (status, content dirs), `CLAUDE.md` (status), `docs/product/mvp-roadmap.md` (P3 status), `docs/architecture/folder-structure.md`, `docs/development/setup.md` (content dirs), `docs/design-system/components.md` (if new shared components)

- [ ] **Step 1: E2E vocabulary:** add Education set → home shows "10 new words waiting"; set daily limit 5 in Settings; start session → exactly 5 new cards; answer intro checks; done screen shows the celebration and "All done for today"; home shows "1/5 days this week" and 5 sprouts in the Education garden bed; reopen review → done state (no new words); word page shows VI + EN meaning and examples.
- [ ] **Step 2: E2E grammar:** catalogue shows 4 topics "Not started"; open Articles lesson; practice: tap the wrong word in a Spot-the-mistake item and check → feedback with the correction + locked input; submit → results; catalogue shows mastery state from score.
- [ ] **Step 3: Run** `pnpm test:e2e` → all pass (existing 50 + new).
- [ ] **Step 4: Docs** (ADR 0008: SRS in SQL, local-day limit, reserved events, instant check, mastery rule + P8 caveat, browser speech fallback, play layer derived from SRS state with no stored game state).
- [ ] **Step 5: Full gates:** `pnpm db:test`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm test`, `pnpm test:e2e` → all pass; 360px light/dark screenshots of /vocabulary, review session, /grammar lesson and practice checked.
- [ ] **Step 6: Commit** `test(e2e): cover vocabulary and grammar flows; docs: ADR 0008 and P3 status`
