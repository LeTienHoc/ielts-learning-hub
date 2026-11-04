# User journeys — IELTS Learning Hub

- **Status:** Approved for MVP planning (2026-11-04). Decisions D-01–D-10 accepted; D-11–D-14 open.
- Persona details: [product-requirements.md § Target users](product-requirements.md#target-users).
  Route names: [information-architecture.md](information-architecture.md).
- Journeys marked _(R1.1)_ or _(Future)_ depend on features outside the MVP
  ([mvp-roadmap.md](mvp-roadmap.md)).

## Journey overview

```
Discover → Sign up → Onboarding & placement → First win → Daily habit → Weekly re-plan → Exam readiness
   /          /sign-up     /onboarding/*        dashboard    dashboard     /learning        /progress
```

| Stage          | User goal                           | Success signal (metric)                     |
| -------------- | ----------------------------------- | ------------------------------------------- |
| Discover       | Understand what the product does    | Sign-up conversion from landing             |
| Sign up        | Create an account quickly           | Sign-up completion, time < 1 min            |
| Onboarding     | Get a plan that fits me             | Onboarding completion rate, placement taken |
| First win      | Finish one meaningful task on day 1 | % completing first task within 24 h         |
| Daily habit    | Study a little every day            | D7 / D30 retention, active days per week    |
| Weekly re-plan | Adjust to progress and missed days  | Roadmap task completion rate                |
| Exam readiness | Know whether I'm ready              | Readiness viewed, full mock tests taken     |

## J1 — First visit to first win (Linh, day 1)

1. **Landing (`/`).** Reads the value proposition and AI disclosure; clicks _Start free_.
2. **Sign up (`/sign-up`).** Chooses _Continue with Google_ (AUTH-03); confirms she is 16+.
   _Error path:_ Google cancelled → stays on page with a neutral message.
3. **Goal (`/onboarding/goal`).** Academic, target 6.5, exam in 5 months (ONB-01).
4. **Schedule (`/onboarding/schedule`).** 5 days/week, 45 min/day (ONB-02).
5. **Preferences.** Explanations in Vietnamese; self-assessed "intermediate" (ONB-03).
6. **Placement (`/onboarding/placement`).** 15-minute check: grammar + vocabulary + one Reading
   mini-set (ONB-04). She can pause; progress is saved. _Alternative:_ skip → plan based on
   self-assessment, flagged "low confidence".
7. **Result (`/onboarding/result`).** "Estimated Reading ≈ 5.0–5.5; strengths: vocabulary;
   focus: complex sentences, T/F/NG." Roadmap preview: Foundation (3 weeks) → Skill building →
   Exam practice (ONB-05, ROAD-01).
8. **Dashboard.** "Today's plan": Grammar — complex sentences (15 min), 10 new words
   (Education), Reading — T/F/NG set (20 min) (DASH-01).
9. **First task.** Completes the grammar lesson and practice; every wrong item shows why
   (GRAM-03). Task ticks off automatically (ROAD-03); dashboard shows 1/3 done.

Emotional goal: "I know where I stand and what to do next."

## J2 — Daily study session (Linh, week 2)

1. Opens `/dashboard` on her phone → sees 14 words due and two roadmap tasks.
2. **Review** (`/vocabulary/review`): 14 cards, 4 wrong → rescheduled sooner (VOC-04).
3. **Reading test mode**: timed passage; answers autosave; she loses connection briefly →
   answers buffered and synced (READ-03).
4. **Review results**: 8/13. For each wrong T/F/NG item the explanation highlights the evidence
   sentence (READ-04). She adds "mitigate" and "detrimental" to My words (READ-06).
5. Unsure why an answer is "Not Given", she taps _Ask the tutor_ → conversation opens with the
   question attached; explanation in Vietnamese with an English summary (AI-02, AI-04).
6. Dashboard: streak 6 days, 42 minutes today (DASH-03).

## J3 — Writing Task 2 with feedback (Minh)

1. `/writing` → filters _Opinion essays_ → picks a prompt on remote work.
2. Editor in focus mode with 40-minute timer; autosave every few seconds (WRIT-02).
3. Submits at 268 words → "Evaluating your essay" with streamed progress (WRIT-03).
   _Edge cases:_ 120 words → warning about under-length (allowed, flagged); daily quota reached
   → message with reset time, draft kept (AI-05); evaluation fails → retry, draft never lost.
4. **Feedback report**: estimates — TR 6.0–6.5, CC 6.0, LR 6.0–6.5, GRA 5.5–6.0 — each with
   evidence quotes; disclaimer "AI estimate, not an official IELTS score" (D-05).
5. Inline annotations: 9 issues (article errors, a run-on sentence, repeated "important") with
   explanations and suggested rewrites (WRIT-04). Article errors link to the _Articles_ grammar
   topic (GRAM-05); suggested words go to My words.
6. Reads the improved version, then writes a revision as a new submission (WRIT-05) → history
   shows GRA moving from 5.5–6.0 to 6.0 (WRIT-06).
7. Next week the roadmap includes an Articles practice task because the error recurred (ROAD-04).

## J4 — Speaking practice with a recording _(R1.1)_

1. `/speaking` → Part 2, topic "a place you like to visit".
2. First time: consent screen explaining recording, transcription by an external service and
   30-day audio retention (SPK rules) → accepts → browser mic permission.
   _Error path:_ permission denied → instructions for enabling the mic.
3. 1-minute preparation timer with notes field → records 1 min 50 s → listens back → submits.
4. Upload progress → transcribing → evaluating (SPK-02, SPK-03).
5. Report: transcript with fillers highlighted, FC/LR/GRA estimates with evidence; Pronunciation
   "not assessed" until the pronunciation provider is integrated (SPK-05); better answer and
   useful phrases (SPK-06).

## J5 — Weekly re-plan and progress check (Minh, end of week 3)

1. Monday: dashboard notes "2 tasks rolled over from last week" (ROAD-04).
2. `/learning` shows Week 4 with Listening weighted up (accuracy below target), total within his
   35 min/day availability.
3. `/progress`: activity chart, skill estimate trends with data-point counts, weakest areas:
   Matching headings, Articles, Listening map labelling — each linked to practice (PROG-03).
4. He changes his exam date in `/settings/learning` → roadmap regenerates, completed history kept
   (ROAD-06, SET-02).

## J6 — Returning after a break

1. Linh returns after 10 days. Dashboard: "Welcome back" with a reduced plan for the first day
   and the review backlog capped (e.g. 30 cards max today) instead of a wall of overdue tasks.
2. Roadmap shifts remaining weeks; readiness estimate updates against the exam date.

## J7 — Real-time voice conversation with the tutor _(Future)_

1. `/ai-tutor/voice` → chooses "Speaking Part 1 practice".
2. Speaks naturally; the tutor replies by voice with low latency, can be interrupted, and shows a
   live transcript.
3. After the session: summary of mistakes and phrases, saved to My words; optional feedback
   report like J4.

## Cross-cutting journey rules

- Every dead end has a next step (empty state CTA, "back to plan").
- Interrupted work is never lost: drafts, answers and recordings are saved before submission.
- AI waiting states show progress and allow leaving; results are available later from history and
  a notification.
- Estimates are always labelled; first exposure links to `/ai-disclosure`.
