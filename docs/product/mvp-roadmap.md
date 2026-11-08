# MVP scope & implementation roadmap — IELTS Learning Hub

- **Status:** Approved for MVP planning (2026-11-04). Decisions D-01–D-10 accepted; D-11–D-14 open. MVP = Reading + Writing (D-10).
- Requirement IDs: [product-requirements.md](product-requirements.md).

## E. MVP scope (MoSCoW)

**MVP goal:** validate the core loop _plan → practise → explained feedback → visible progress_ for
Vietnamese learners preparing for IELTS Academic, with the two skills where self-study fails most
(Writing feedback) and the most-practised skill (Reading), supported by vocabulary and grammar.

### Must have (MVP / Release 1.0)

| Area       | Scope                                                                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth       | AUTH-01..05 (email + Google, reset, protected routes); AUTH-06 delete account                                                                      |
| Onboarding | ONB-01..03, ONB-05; placement ONB-04 with grammar + vocabulary + one Reading mini-set                                                              |
| Dashboard  | DASH-01, 02, 03, 05                                                                                                                                |
| Roadmap    | ROAD-01..03 (rule-based), ROAD-06                                                                                                                  |
| Vocabulary | VOC-01..05 (curated sets, SRS review, add from passages)                                                                                           |
| Grammar    | GRAM-01..04 (≈ 15 core topics)                                                                                                                     |
| Reading    | READ-01..04, 06, 07 (learn + test mode; band conversion for full tests)                                                                            |
| Writing    | WRIT-01 (Task 2 only), WRIT-02, 03, 04, 06                                                                                                         |
| AI Tutor   | AI-01, 02, 04, 05, 06 (text chat, contextual entry, quotas, safety scope)                                                                          |
| Progress   | PROG-01, PROG-02 (Reading, Writing), PROG-03 (Reading, Grammar), PROG-04                                                                           |
| Settings   | SET-01, 02, 03, 05 (export + delete), SET-06                                                                                                       |
| Platform   | Supabase + RLS, AI server adapter, activity events, content pipeline (D-04), legal pages + AI disclosure, error monitoring, basic analytics events |

### Should have (Release 1.1 — first increment after MVP)

- **Listening** LIST-01..04 (needs audio content production).
- **Speaking (recorded)** SPK-01..04, 06 — Part 1 and Part 2 first; STT provider selected (D-08).
- Writing Task 1 (WRIT-01), improved essay + revision flow (WRIT-05), tutor follow-up on feedback
  (WRIT-07).
- Dashboard skill snapshot and exam countdown (DASH-04, 06); roadmap weekly re-plan (ROAD-04),
  readiness (ROAD-05, PROG-05).
- Tutor modes "Quiz me" and "Exam strategy" (AI-03); email reminders (SET-04).
- Vietnamese UI translation (beyond explanations).

### Could have (Release 1.2+)

- Pronunciation assessment (SPK-05) via a dedicated provider.
- Speaking Part 3; full-length mock tests across four skills with combined band estimate.
- FSRS scheduling for vocabulary; personalised vocabulary from the user's own writing.
- AI-assisted roadmap adjustments (beyond rules); weekly progress email.
- Global search across content and history; in-app notifications centre.

### Future (not planned yet)

- **Real-time voice conversation** with the tutor (AI-07).
- IELTS General Training content; teacher/classroom accounts; payments and subscription tiers.
- Native mobile apps / offline mode; community features; certificates.

### Explicitly out of MVP and why

| Item                  | Reason                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Listening             | Requires a library of quality audio; content production is the bottleneck, not code                                            |
| Recorded Speaking     | Needs STT provider selection, consent/retention flow, calibration — high risk to bundle into the first release                 |
| Real-time voice       | Highest complexity and cost (streaming STT → LLM → TTS, latency budget, barge-in); build on top of recorded Speaking learnings |
| Pronunciation scoring | Not achievable reliably with an LLM alone; needs a specialised provider                                                        |
| Payments              | Validate learning value and retention first                                                                                    |

> **Decision D-10 (accepted 2026-11-04: Reading + Writing in 1.0):** the product goal emphasises balanced four skills.
> The MVP above ships two of four skills (Reading, Writing) to reach users sooner. The
> alternative — including Listening and recorded Speaking in 1.0 — adds an estimated 2 phases
> (≈ 6–8 weeks) and audio-content production before launch.

## H. Technical implementation roadmap

Phases are ordered by dependency. Each phase ends with lint, typecheck, unit + E2E tests, build,
updated docs, and a demo on staging. Phase 0 is complete.

**P1 status (2026-11-08): in progress.**

- Done locally: AUTH-01, 02, 04, 05, 06; SET-01 without avatar; SET-05 account deletion only.
  This includes migrations with RLS and pgTAP tests, the `ActivityEvent` table and emitter, the
  `(auth)` route group, and settings.
- Open: AUTH-03 Google OAuth (deferred by the user), the `(onboarding)` route group, and a
  staging demo.

**P2 status (2026-11-08): implemented locally** ([ADR 0007](../decisions/0007-content-and-practice-engine.md)).

- **Content model:** `content_items` with review status, practice sets, question groups,
  questions and hidden answer keys.
- **Content import:** JSON → `pnpm content:seed` → local `seed.sql`.
- **Attempt engine:** SQL functions for start, save, submit and score, using server time; one
  active attempt per set; test-mode deadline with auto-submit; `attempt.submitted` events.
- **Learner UI:** question renderers for the 11 question types; focus-mode layout; minimal
  Reading flow (library → intro → attempt → results).
- Open: a production content import with a review workflow, and real reviewed content (D-04,
  D-13). P3/P4 build on the engine: grammar instant checking, Reading filters, highlight, band
  conversion and history.

**P3 status (2026-11-09): implemented locally**
([ADR 0008](../decisions/0008-vocabulary-srs-and-grammar.md),
[design](../superpowers/specs/2026-11-08-p3-vocabulary-grammar-design.md)).

- Vocabulary:
  - VOC-01: topic sets.
  - VOC-02: bilingual word cards with examples, collocations, mistakes and device-voice
    pronunciation.
  - VOC-03: add from sets.
  - VOC-04: SM-2 review through mini-games.
  - VOC-05: daily session with a 5/10/15 new-word limit.
- Grammar:
  - GRAM-01: catalogue.
  - GRAM-02: bilingual lessons.
  - GRAM-03: practice with instant check, including Spot the mistake.
  - GRAM-04: mastery.
- Learning through play: combo, mascot, celebration, word garden and weekly goal.
- Starter content: 4 vocabulary sets × 10 words and 4 grammar topics, AI-drafted and local only.
- Open:
  - review of the starter content by the user;
  - TTS audio (D-08);
  - adding words from passages (P4) or feedback (P6);
  - the AI tutor (VOC-06, P7);
  - GRAM-05 (P6);
  - roadmap use of mastery (P8: revisit the retake rule).

**P4 status (2026-11-09): implemented locally**
([ADR 0009](../decisions/0009-reading-passages-and-band.md),
[design](../superpowers/specs/2026-11-09-p4-reading-design.md)).

- READ-01: library filters by question type and level (in the URL).
- READ-02: learn and test modes, including a 60-minute full test with three passages.
- READ-03: split view with passage tabs, device-only highlights and mobile Passage / Questions
  tabs.
- READ-04: explanations with "Show in passage" evidence.
- READ-05: estimated band for full 40-question tests (with a not-official note).
- READ-06: passage key words with meanings and "Add to My words".
- READ-07: attempt history (`/reading/history`) and recent attempts on each set.
- Also: an offline answer buffer for attempts.
- Content: one AI-drafted full test and key words for the rooftop set, local only.
- Open: review of the drafted test by the user; synced highlights; more full tests.

```
P0 Foundation ✔
 └─ P1 Platform: Supabase, Auth, Profile, events
     ├─ P2 Content & practice engine ──┬─ P3 Vocabulary & Grammar
     │                                 └─ P4 Reading
     └─ P5 AI platform ── P6 Writing feedback ── P7 AI Tutor (text)
                          P3+P4+P6 ── P8 Onboarding, Roadmap, Dashboard, Progress
                                       └─ P9 MVP hardening & launch  ── R1.1: P10 Listening, P11 Speaking (recorded)
                                                                         Future: P12 Real-time voice
```

| Phase                                           | Deliverables                                                                                                                                                                                                                                                        | Key requirements                                      | Depends on                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| **P1 Platform**                                 | Supabase project, migrations workflow (`supabase/migrations`), RLS policy pattern, `src/server/database` + `src/server/auth` adapters, auth pages and redirects, profile + settings basics, `ActivityEvent` table and emitter, `(auth)`/`(onboarding)` route groups | AUTH-01..06, SET-01, SET-05 (delete)                  | P0                                                 |
| **P2 Content & practice engine**                | Content model (ContentItem, Question types), seed/import pipeline with review status, shared attempt engine (start/save/submit/score, server time), question renderers, focus-mode layout                                                                           | — (enabler)                                           | P1                                                 |
| **P3 Vocabulary & Grammar**                     | Word/set catalogue, word detail with pre-generated TTS audio, SRS review, grammar lessons + practice, mastery                                                                                                                                                       | VOC-01..05, GRAM-01..04                               | P2 (TTS provider for audio, or text-only fallback) |
| **P4 Reading**                                  | Library, learn/test modes, split view, autosave, scoring, explanations with evidence, band conversion, attempt history                                                                                                                                              | READ-01..07                                           | P2, P3 (add-to-words)                              |
| **P5 AI platform**                              | `src/server/ai` adapter (Claude), prompt registry with versions, structured-output schemas + Zod validation, streaming route pattern, quotas (`AiUsage`), refusal/error handling, evaluation harness with human-rated samples                                       | AI-05, AI-06                                          | P1                                                 |
| **P6 Writing feedback**                         | Prompt library (Task 2), editor + autosave, evaluation pipeline, feedback report with annotations, links to grammar/vocabulary, history                                                                                                                             | WRIT-01..04, 06                                       | P5, P3                                             |
| **P7 AI Tutor (text)**                          | Chat UI with streaming, conversations, contextual entry points from VOC/GRAM/READ/WRIT, language preference                                                                                                                                                         | AI-01, 02, 04                                         | P5                                                 |
| **P8 Onboarding, Roadmap, Dashboard, Progress** | Onboarding flow + placement, rule-based roadmap generator, auto-completion from events, dashboard widgets, progress views                                                                                                                                           | ONB-01..06, ROAD-01..03, 06, DASH-01..06, PROG-01..04 | P3, P4, P6 (content to plan against)               |
| **P9 MVP hardening & launch**                   | Accessibility audit, security review, performance budget, error monitoring, analytics events, legal pages + AI disclosure, content QA, calibration report for Writing estimates, beta with real learners                                                            | quality gates below                                   | P1–P8                                              |
| P10 Listening _(R1.1)_                          | Audio assets + storage, player modes, scoring with spelling rules                                                                                                                                                                                                   | LIST-*                                                | P2, P4 patterns                                    |
| P11 Speaking — recorded _(R1.1)_                | Consent, recorder, upload, STT adapter, evaluation, retention job, report                                                                                                                                                                                           | SPK-01..04, 06                                        | P5, P1 storage                                     |
| P12 Real-time voice _(Future)_                  | Streaming voice pipeline and session broker                                                                                                                                                                                                                         | AI-07                                                 | P7, P11                                            |

Rough sizing (one full-stack developer with AI assistance, to be refined per phase): P1 2 wks ·
P2 2 wks · P3 2–3 wks · P4 2 wks · P5 1–2 wks · P6 2 wks · P7 1–2 wks · P8 3 wks · P9 2 wks →
**MVP ≈ 17–20 weeks**. Content creation (vocabulary sets, grammar lessons, reading passages,
writing prompts) runs in parallel from P2 and is on the critical path.

### Architecture fit (no changes to the agreed architecture)

| New module                 | Location                                                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feature modules            | `src/features/{auth,onboarding,roadmap,dashboard,vocabulary,grammar,practice,reading,writing,ai-tutor,progress,settings}` — created when their phase starts |
| Server adapters            | `src/server/{database,auth,ai,speech,storage}` behind typed interfaces, `import "server-only"`                                                              |
| Shared practice UI         | `src/features/practice` (attempt engine, question renderers) consumed by Reading/Listening via its public `index.ts`                                        |
| Cross-module communication | `ActivityEvent` writes + content references; no feature imports another feature's internals                                                                 |

### Quality gates for MVP launch

1. All Must-have requirements implemented with loading/empty/error/success states.
2. Lint, typecheck, unit, E2E and build green; accessibility audit with no Critical/High issues;
   security review with no Critical/High issues; RLS tests per table.
3. Writing estimate calibration on a human-rated sample set: report agreement (e.g. % within
   ±0.5 band per criterion) and publish limitations in `/ai-disclosure`. Launch threshold to be
   agreed (decision D-11).
4. Per-user AI cost per active day measured and within budget (decision D-12).
5. No fake data anywhere; all content reviewed (D-04).
6. Privacy: data export and deletion work end to end.

### Decisions status

| ID         | Question                                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01..D-09 | **Accepted** — see [product-requirements.md](product-requirements.md#key-decisions-proposed--need-confirmation)                                                                   |
| D-10       | **Accepted** — MVP with Reading + Writing; Listening and Speaking in 1.1                                                                                                          |
| D-11       | Minimum calibration agreement required to launch Writing feedback                                                                                                                 |
| D-12       | Free usage limits (AI requests/day) and monthly AI budget                                                                                                                         |
| D-13       | Who produces and reviews content (in-house, contractors), and volume needed for launch (proposal: 30 vocabulary sets, 15 grammar topics, 40 reading passages, 30 writing prompts) |
| D-14       | Hosting/region and data residency (Supabase region, Vercel or other)                                                                                                              |
