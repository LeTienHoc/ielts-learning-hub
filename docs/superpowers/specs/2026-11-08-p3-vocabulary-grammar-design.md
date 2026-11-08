# P3 — Vocabulary & Grammar: design

- **Date:** 2026-11-08
- **Status:** Approved 2026-11-08, then extended with §5.5 "learning through play" (user-approved ideas; mascot, sound and goal numbers are designer's calls)
- **Builds on:** P2 practice engine ([ADR 0007](../../decisions/0007-content-and-practice-engine.md)),
  product requirements VOC-01..05 and GRAM-01..04
  ([product-requirements.md](../../product/product-requirements.md)), and routes in
  [information-architecture.md](../../product/information-architecture.md).

## 1. Intent and the why

Learners usually give up on vocabulary and grammar for three reasons:

- they cram too much at once and feel overloaded, so new words do not stick;
- the material is dry and textbook-like, so it gets boring;
- after a few days they drop it.

P3 must make the daily habit easy to keep. **Success means learners still come back after two
weeks.** The total number of words or lessons covered is not the measure.

The user described a good day as follows (their words in quotes):

- **"15–20 minutes"**, made of **"a few new words and reviewing old ones"**.
- New words are remembered when they come with **real example sentences on familiar IELTS
  topics**, explanations that show the **precise meaning**, and **Vietnamese and English
  explanations that are easy to understand**.
- Grammar explains **why** a form is used and **in which situations**. The tone is **natural and
  humorous, not mechanical**. The user referred to an app called "hala rabbit" as the model.
  The designer could not identify that app, so the target is read as a warm, playful tutor
  voice.

## 2. Goals

1. **Daily vocabulary session** (VOC-04, VOC-05) that fits in 15–20 minutes:
   - due reviews first, then a small number of new words;
   - a clear end ("All done for today").
2. **Word cards that teach meaning** (VOC-02). Each card has:
   - a plain explanation in both Vietnamese and English;
   - real example sentences on an IELTS topic;
   - collocations;
   - common mistakes made by Vietnamese learners;
   - part of speech and IPA.
3. **Topic sets** (VOC-01): browse vocabulary by IELTS topic and level, and add words to _My
   words_ (VOC-03, from sets only).
4. **Spaced repetition** (VOC-04): SM-2 style scheduling with Again/Hard/Good/Easy, run on
   server time. A word counts as _mastered_ once its interval is at least 21 days.
5. **Short grammar lessons** (GRAM-01, GRAM-02):
   - grouped by level;
   - each lesson explains why the form exists, when to use it and when not to, IELTS-context
     examples, typical Vietnamese-learner mistakes and why they happen;
   - in Vietnamese and English, in the friendly tone above;
   - readable in a few minutes.
6. **Grammar practice with instant feedback** (GRAM-03): each item is checked and explained as
   soon as it is answered. Item types: multiple choice, gap fill, error correction, sentence
   transformation (with accepted variants).
7. **Topic mastery** (GRAM-04), based on practice accuracy and shown in the catalogue.
8. **Starter content**, drafted by Claude (see §6).
9. **Learning through play** (§5.5): mini-games, combo and mascot feedback, an
   end-of-session celebration, a word garden and a weekly goal.

## 3. Non-goals (this phase)

- Pronunciation audio from a TTS provider (provider not chosen, D-08). See §5.4 for the
  fallback.
- Adding words from Reading passages (P4) or from AI feedback (P6). Asking the AI tutor about a
  word (VOC-06, P7).
- Grammar links from Writing feedback (GRAM-05, P6). Roadmap and dashboard integration (P8).
- FSRS scheduling. Leaderboards, daily streaks that reset, and reminder notifications. The
  play elements that are in scope are listed in §5.5.
- An in-app content review or editing tool.

## 4. Anti-goals (failure even if it "works")

- **Overload:** never present more new words than the learner's daily limit. The session
  stops at the limit.
- **Walls of text:** a lesson or word card that reads like a dictionary or textbook page.
  Keep it short: explanation, example, done.
- **Pressure:** no guilt messages, no fake urgency, no "you lost your streak", no countdown
  timers in games, no leaderboards. Play should feel fun, never stressful. This follows the
  product principle "Calm and focused".
- **Play that hides learning:** every game step must still be an honest review of a word or
  rule. Rewards follow real reviews only and are never bought or faked.
- **Fake data:** no invented counts or mastery. Empty states instead.
- **Jokes that obscure the answer:** humour lives in explanations and examples; the correct
  answer and the rule are always stated plainly.

## 5. Decisions

### 5.1 Session shape (user-decided intent, designer's numbers)

- **Today's session = due reviews, then new words.**
  - New words per day default to **10**, chosen by the learner as 5, 10 or 15 in Settings.
    The product docs' default of 20 is reduced to avoid overload. _Designer's call._
  - When there are many due reviews, the session takes at most about 30 reviews and leaves
    the rest for later, so it stays near 20 minutes. _Designer's call; the builder may tune
    the cap._
- Learning a new word: show the card first, then one quick check (pick the meaning).
- **Review exercises are mini-games** (§5.5), not a flip-card loop:
  - _Match pairs_ ("Ghép đôi"): match a batch of words to their meanings;
  - _Save the sentence_ ("Cứu câu"): type the missing word into an example sentence (cloze);
  - _Perfect pair_ ("Cặp đôi hoàn hảo"): choose the right collocation;
  - _meaning recall:_ show the word, reveal, self-grade Again/Hard/Good/Easy. This remains as
    the fallback for a word that fits no game (e.g. no collocations).

  Auto-checked games grade **Good** when correct and **Again** when wrong. Only recall is
  self-graded.

### 5.1a Where new words come from (designer's call)

- The learner adds a **whole set** ("Start learning this set") or a **single word** from its
  word page. Added words wait in My words as _new_ (not yet introduced).
- Today's session introduces the oldest waiting new words, up to the daily limit, in set
  order. The limit is enforced when words are **introduced**, never when they are added.
- Empty My words: the session page explains this and links to the set catalogue (VOC empty
  state). It invents nothing.
- **Words are shared across sets.**
  - A word is unique by lemma and part of speech; its slug is `lemma` or `lemma-pos` when
    needed (e.g. `address-verb`).
  - A word can appear in several sets, but the learner has **one SRS record per word**.
  - Adding a set skips words already in My words.

### 5.1b What "today" means (designer's call)

- "Today" is the learner's **local calendar day**, from `profiles.timezone`. New words
  introduced today are counted within that day.
- A review is due when `due_at <= now()` (server time).
- **After "All done for today":**
  - New words stop for the day (anti-overload).
  - If due reviews are left because of the ~30 cap, the end screen offers **"Review N more"**,
    which is optional and never pushed.
  - Reopening the session later the same day shows the done state, or any remaining reviews.

### 5.2 Spaced repetition

- SM-2 style, as product-requirements §5 specifies: ease, interval, repetitions and `due_at`.
- Grading and scheduling run in a Postgres security-definer function using server time, like
  the P2 engine. Learners cannot write their SRS state directly.
- A review log is append-only and written only by that function. It is the authoritative
  record for progress and retention metrics.
- **Session events are server-emitted** (designer's call):
  - A definer function finishes a session.
  - It counts the reviews and new words from the review log since the session started.
  - It writes one `vocabulary.review_session` activity event.
- `vocabulary.*` and `grammar.*` event types are reserved like `attempt.*`: the learner insert
  policy rejects them, so the events cannot be forged.
- An abandoned session writes no event, but its reviews are still in the log.

### 5.3 Grammar practice reuses the P2 engine

- A grammar topic's practice is a P2 `practice_set` with `module = 'grammar'`, so its questions,
  keys and attempts work unchanged.
- **New in the engine: instant check in learn mode.** A function such as
  `check_answer(attempt, question)`:
  - saves the answer;
  - locks it;
  - returns correctness and the key and explanation **for that question only**;
  - is allowed only in learn mode, for the attempt's owner.

  Test mode and Reading keep their current behaviour.

- **New question types:** `error_correction` and `sentence_transformation`. Both use the
  existing `text` response kind with accepted variants. Matching ignores case and extra spaces,
  as today.
- **Grammar practice is learn mode only.** There is no timer; each item is checked
  instantly. Unanswered or unchecked items count as wrong when the attempt is submitted.
- **Mastery per topic:** the latest submitted attempt's score as a percentage.
  - _Not started_ — no attempt yet.
  - _Practising_ — below 80%.
  - _Mastered_ — 80% or more.

  The thresholds are a designer's call. A retake right after seeing the answers can reach
  _Mastered_; for grammar practice this is acceptable, because practising until the rule
  sticks is the point. This is the ADR 0007 caveat. **Before mastery feeds the roadmap (P8),
  revisit the rule**, e.g. require mastery on two different days.

### 5.4 Pronunciation

There is no TTS provider yet. A **"Listen" button** uses the browser's built-in speech
synthesis (Web Speech API) when available and is hidden when not. It is labelled as device
voice; the product docs' "audio unavailable (text only)" state covers browsers without it.
_Designer's call._ It can be replaced by pre-generated audio when D-08 is decided.

### 5.5 Learning through play (user-approved)

The user wants learning to feel like **"vừa học vừa chơi"** (learning while playing). They
accepted these four ideas:

1. **Mini-games instead of cards.**
   - Vocabulary reviews use the games in §5.1.
   - Grammar practice adds **Spot the mistake** ("Bắt lỗi"): tap the wrong part of a sentence,
     then read a funny "why it's wrong" explanation. This is the `error_correction` item
     type.
   - Correct pairs and answers get a small, satisfying animation.
2. **Instant, fun feedback.**
   - A **combo counter** for consecutive correct answers within a session (x2, x3…), with a
     light effect and a short sound.
   - A **mascot** reacts with humour to right and wrong answers and never mocks the learner.
   - An **end-of-session celebration** summarises today: words reviewed, new words, longest
     combo.
3. **Word garden.**
   - Each IELTS topic is a garden bed and each word in My words is a plant.
   - Plants grow with the word's SRS interval (seed → sprout → plant) and **bloom when
     mastered** (interval ≥ 21 days).
   - **Plants never die or wilt.** After a break the garden simply waits.
   - The garden is derived from SRS state; it adds no stored game state.
4. **Weekly goal instead of a fragile streak.**
   - Shown as "4/5 days this week", counting days with at least one review in the learner's
     local week.
   - The goal defaults to **5 days**. _Designer's call._
   - Missing a day never resets anything.

Designer's calls for the play layer:

- **Mascot:** a simple original character drawn as inline SVG with a few expressions
  (happy, thinking, cheering). No external art assets and no copied characters.
- **Sound:** short tones generated in the browser (Web Audio API), no audio files. Sound is
  **on by default**, with a mute toggle remembered on the device.
- **Motion:** animations respect `prefers-reduced-motion`; celebration effects become a
  simple fade.
- **Combo:** session-only, client-side state. It has no effect on SRS grading or scores.

### 5.6 Explanation language

Both Vietnamese and English are shown. The learner's explanation-language setting (already in
`profiles`) decides which comes first and is expanded. _Designer's call._

## 6. Content

- **The user asked Claude to write the content.** Drafts are marked `source: ai_assisted`.
- Like the P2 sample, they are published **only in the local database** for development and
  testing.
- **The user will read and approve them before any real learner sees them** (D-04). No
  production import is built in P3.
- **Starter volume** (_designer's call_, enough to exercise every flow):
  - **4 vocabulary sets × 10 words:** Education, Environment, Technology, Health; B1–B2.
  - **4 grammar topics**, each with a lesson and a practice set of about 8 items. Proposed:
    - Articles (a/an/the);
    - Present perfect vs past simple;
    - Conditionals (first and second);
    - Relative clauses.

    All are frequent problems for Vietnamese learners.
- **Format:** JSON files beside the P2 content (e.g. `content/vocabulary-sets/`,
  `content/grammar-topics/`), validated by Zod and turned into `supabase/seed.sql` by an
  extended `pnpm content:seed`.
- **Style guide for drafts:**
  - short sentences;
  - one idea per paragraph;
  - examples drawn from IELTS topics;
  - Vietnamese that sounds like a friendly Vietnamese teacher, not a translation;
  - light humour in examples and "why" explanations;
  - the rule always stated plainly.

## 7. Constraints

- Follow the existing architecture and rules: `.claude/rules/*` and the
  [ADR 0007](../../decisions/0007-content-and-practice-engine.md) security model.
  - Content is readable only when published.
  - User tables use owner-only RLS.
  - All writes with business rules go through ownership-checked definer functions.
  - pgTAP tests come with every migration.
- No new npm dependencies are expected. Anything that needs one must be raised first.
- Routes follow the IA:
  - `/vocabulary` (my words, due count, sets);
  - `/vocabulary/sets`, `/vocabulary/sets/[setSlug]`;
  - `/vocabulary/words/[wordSlug]`;
  - `/vocabulary/review` (focus mode);
  - `/grammar`, `/grammar/[topicSlug]`;
  - `/grammar/[topicSlug]/practice` (focus mode).
- Every page has loading, empty and error states, works at 360px, and supports light and dark.
- Login and OAuth work stays deferred.

## 8. Left to the builder

- Table and function names; how word cards and lesson blocks are stored (columns vs JSON
  blocks).
- Exact SM-2 constants, as long as Again/Hard/Good/Easy behave sensibly and the 21-day mastered
  rule holds.
- The URL shape for a grammar attempt (e.g. an attempt id under `/practice`).
- Visual design of cards, lessons and the review session, within the design system.
- How the new-word quick check and the three review exercise types are sequenced in a session.
