# Product requirements — IELTS Learning Hub

- **Status:** Approved for MVP planning (2026-11-04). Decisions D-01–D-10 accepted; D-11–D-14 open. Nothing in this document is implemented yet unless
  marked _Exists_. Phase 0 delivered the app shell, design system and route placeholders only.
- **Related:** [Information architecture](information-architecture.md) ·
  [User journeys](user-journeys.md) · [MVP & roadmap](mvp-roadmap.md)
- **Requirement IDs** (`VOC-03`, `AI-02` …) are referenced from the roadmap and should be used in
  tickets and PR titles.

---

## A. Product vision

### Vision

Every learner gets a personal IELTS coach: a clear plan from their current level to their target
band, focused practice in all four skills, and explanations that build real understanding — at
a fraction of the cost of private tutoring.

### Target users

| Persona                                 | Profile                                                                                                           | Main need                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Linh — university student** (primary) | 19–23, Vietnamese, band ~5.0–5.5, target 6.5 for graduation/exchange, studies on phone and laptop, limited budget | A structured plan and honest feedback on Writing/Speaking without paying for a tutor |
| **Minh — working professional**         | 24–35, band ~6.0, target 7.0 for migration or a job, 30–45 min/day, exam date fixed                               | Efficient, prioritised practice on weak areas before a deadline                      |
| **Self-learner returning to English**   | any age 16+, level B1, no fixed date                                                                              | Rebuild grammar and vocabulary foundations before IELTS-specific practice            |

Initial market: **Vietnamese learners** (UI in English with Vietnamese explanations available;
see decision D-02). Out of scope for now: teachers/classes, children under 16, IELTS General
Training-specific content (Academic first).

### Core problems

1. **No clear path.** Learners don't know what to study next or how far they are from the target.
2. **Productive skills lack feedback.** Writing and Speaking need expert feedback, which is
   expensive and slow.
3. **Memorising answers instead of understanding.** Practice books give keys, not reasons.
4. **Unbalanced skills.** Learners over-practise what they like (Reading) and avoid Speaking.
5. **Fragmented tools.** Vocabulary apps, test PDFs, chatbots and trackers are disconnected.
6. **Low motivation and consistency.** Progress is invisible, so learners give up.

### Unique value proposition

> A personalised IELTS roadmap that connects structured lessons, four-skill practice and an AI
> tutor that explains _why_ — in one place, with progress you can see.

Differentiators: (1) roadmap drives every activity; (2) AI feedback is criteria-based and
explained, with Vietnamese explanations; (3) every mistake becomes review material (vocabulary,
grammar points, tutor follow-up); (4) honest, estimate-only band guidance.

### Product principles

1. **Understanding over answers** — every correction explains the rule, cause or strategy.
2. **Honest assessment** — AI scores are labelled as estimates with ranges; never presented as
   official IELTS results (see [§G](#g-ai-architecture)).
3. **Next best action** — the user always sees one clear next step.
4. **Calm and focused** — distraction-free UI, no dark patterns, no fake urgency.
5. **Real data only** — empty states instead of fake statistics; progress derives from actual
   activity.
6. **Privacy by default** — minimal personal data, explicit consent for audio, user can export
   and delete their data.
7. **Balanced skills** — the roadmap deliberately schedules weak and avoided skills.
8. **Content integrity** — only original or properly licensed content (decision D-04).

---

## D. Functional requirements

Common rules for all modules:

- Every page follows the app shell (sidebar, header, breadcrumb) delivered in Phase 0.
- All data-driven views implement **loading** (skeleton), **empty** (EmptyState with next step),
  **error** (ErrorState with retry; no internal details) and **success** states.
- All inputs are validated with Zod on the server; protected data is filtered by owner (RLS).
- "Activity events" (attempt completed, review done, submission evaluated…) feed Progress and the
  Roadmap. Modules emit events; they do not write to each other's tables.

### 1. Authentication — `AUTH`

**Purpose:** let learners create an account and access their data securely.

| ID      | Requirement                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------ |
| AUTH-01 | Sign up with email + password (email verification required before first sign-in).                                  |
| AUTH-02 | Sign in / sign out; session persists across visits.                                                                |
| AUTH-03 | Sign in with Google (OAuth).                                                                                       |
| AUTH-04 | Forgot / reset password via email link.                                                                            |
| AUTH-05 | Protected routes (`/dashboard` and all app routes) redirect unauthenticated users to sign-in and back after login. |
| AUTH-06 | Delete account (with confirmation) removes personal data and recordings.                                           |

User stories: _As a learner, I want to sign up with Google so I can start in seconds._ /
_As a learner, I want to reset my password so I don't lose my progress._

Business rules: minimum age 16 (checkbox on sign-up); password ≥ 8 chars; rate-limit sign-in and
reset attempts; generic error messages ("email or password is incorrect"); authorization is
always checked on the server.

Input/output: email, password, OAuth token → session + user record.
States: submitting (button busy), invalid credentials, unverified email, network error, success
redirect. Depends on: — (foundation for everything).

### 2. Onboarding & placement — `ONB`

**Purpose:** capture goals and estimate the current level to personalise the roadmap.

| ID     | Requirement                                                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| ONB-01 | Collect goal: test type (Academic), target overall band (5.0–8.5), optional per-skill targets, exam date (optional).          |
| ONB-02 | Collect availability: days per week and minutes per day.                                                                      |
| ONB-03 | Collect explanation language preference (Vietnamese / English) and self-assessed level.                                       |
| ONB-04 | Placement check (~15 min): short grammar + vocabulary quiz and one Reading mini-set; auto-scored. Optional and skippable.     |
| ONB-05 | Show a result summary: estimated starting level (CEFR + band range), strengths/weaknesses, and the generated roadmap preview. |
| ONB-06 | User can edit goals later in Settings; roadmap regenerates.                                                                   |

Business rules: onboarding must be completed (or skipped explicitly) before the dashboard is
personalised; placement result is an **estimate range** (e.g. "Reading ≈ 5.0–5.5"); skipping
placement uses the self-assessment with lower confidence.
States: step progress indicator; save after each step (resume later); error on save keeps input.
Depends on: AUTH, content bank (placement items), Roadmap.

### 3. Dashboard — `DASH`

**Purpose:** answer "What should I do today and how am I doing?"

| ID      | Requirement                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------------- |
| DASH-01 | "Today's plan": next 1–3 roadmap tasks with estimated minutes and a primary CTA.                     |
| DASH-02 | Vocabulary reviews due today (count + start review).                                                 |
| DASH-03 | Weekly activity summary (minutes studied, tasks completed, streak) from real events.                 |
| DASH-04 | Skill snapshot: latest estimated band range per skill with "insufficient data" when < 2 data points. |
| DASH-05 | Continue where you left off (unfinished attempt/lesson).                                             |
| DASH-06 | Days until exam (if set).                                                                            |

Business rules: never show placeholder numbers; a new user sees onboarding CTA / first task.
States: per-widget skeletons and per-widget errors (one failing widget does not break the page).
Depends on: Roadmap, Progress, Vocabulary.

### 4. Learning roadmap — `ROAD` (route `/learning`)

**Purpose:** a personalised, adaptive weekly plan from current level to target.

| ID      | Requirement                                                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| ROAD-01 | Generate a roadmap of phases (Foundation → Skill building → Exam practice) and weekly modules from goal, level, availability and exam date. |
| ROAD-02 | Each module contains tasks linking to lessons/practice in other modules (grammar topic, vocabulary set, reading set, writing prompt…).      |
| ROAD-03 | Mark tasks complete automatically from activity events; manual "skip" with reason.                                                          |
| ROAD-04 | Weekly re-planning: overdue tasks rolled over, weak skills weighted up (based on recent accuracy/feedback).                                 |
| ROAD-05 | Show progress through phases and estimated readiness vs exam date.                                                                          |
| ROAD-06 | Regenerate on goal change (keep completed history).                                                                                         |

Business rules: MVP generation is **rule-based and deterministic** (templates × level × time),
not LLM-generated (decision D-06), so it is explainable and testable; balance rule: each week
includes ≥ 3 of 4 skills once the user is past Foundation; total planned minutes ≤ availability.
Depends on: ONB, content catalogue, Progress events.

### 5. Vocabulary — `VOC`

**Purpose:** learn and retain academic and topic vocabulary with spaced repetition.

| ID     | Requirement                                                                                                                       |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| VOC-01 | Browse curated sets by IELTS topic (Environment, Education, Technology…) and level.                                               |
| VOC-02 | Word detail: meaning (EN + VI), part of speech, IPA, audio pronunciation (TTS), collocations, example sentences, common mistakes. |
| VOC-03 | Add words to "My words" from sets, from Reading passages and from AI feedback.                                                    |
| VOC-04 | Spaced-repetition review (SM-2 style; FSRS later) with exercise types: meaning recall, cloze, collocation choice, spelling.       |
| VOC-05 | Daily due count and review session summary.                                                                                       |
| VOC-06 | Ask the AI Tutor about a word (pre-filled context).                                                                               |

Business rules: review grades (Again/Hard/Good/Easy) update interval and due date; a word is
"mastered" after interval ≥ 21 days; max 20 new words/day by default (configurable).
Input/output: answer per card → updated SRS state + activity event.
States: no due cards ("All caught up — next review in X h"), empty "My words" (suggest a set),
audio unavailable (text only).
Depends on: content bank, TTS (pre-generated audio), Progress.

### 6. Grammar — `GRAM`

**Purpose:** understand the grammar structures that matter for band 6–7+.

| ID      | Requirement                                                                                                                             |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| GRAM-01 | Topic catalogue grouped by level (e.g. tenses, conditionals, relative clauses, passive, complex sentences, articles).                   |
| GRAM-02 | Lesson: explanation (EN + VI), form, usage, IELTS relevance (which criterion it affects), examples, common Vietnamese-learner mistakes. |
| GRAM-03 | Practice set per topic (multiple choice, gap fill, error correction, sentence transformation) with instant explanation per item.        |
| GRAM-04 | Mastery per topic from practice accuracy; weak topics surface in the roadmap.                                                           |
| GRAM-05 | Grammar errors found in Writing/Speaking feedback link to the relevant topic.                                                           |

Business rules: deterministic auto-grading for objective items; free-text transformation items
accept a list of correct variants (no AI needed in MVP).
Depends on: content bank, Progress; links from Writing feedback.

### 7. Reading — `READ`

**Purpose:** practise IELTS Academic Reading question types and strategies.

| ID      | Requirement                                                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| READ-01 | Practice library filtered by question type (T/F/NG, matching headings, sentence completion, MCQ, summary completion…) and difficulty. |
| READ-02 | Practice modes: **learn** (untimed, hints) and **test** (timed, 20 min per passage / 60 min full test).                               |
| READ-03 | Split view: passage + questions (desktop side-by-side; mobile tabs), highlight text, autosave answers.                                |
| READ-04 | Auto-scoring with per-question explanation showing the evidence location in the passage.                                              |
| READ-05 | Score → band estimate using the standard raw-score conversion table (for full 40-question tests only).                                |
| READ-06 | Add unknown words from the passage to My words.                                                                                       |
| READ-07 | Review past attempts.                                                                                                                 |

Business rules: one active attempt per set; leaving and returning resumes (test timer continues
from server time); band conversion only shown for full tests, otherwise "x/13 correct".
States: attempt saving indicator, timer expiry auto-submit, offline answer buffer with retry.
Depends on: content bank, attempt engine, Vocabulary, Progress.

### 8. Listening — `LIST`

**Purpose:** practise IELTS Listening sections and question types.

| ID      | Requirement                                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------------------------- |
| LIST-01 | Library by section (1–4) and question type (form completion, MCQ, map/plan labelling, matching).                          |
| LIST-02 | Audio player: test mode plays once (as in the exam); learn mode allows replay, speed 0.75–1.25×, transcript after submit. |
| LIST-03 | Auto-scoring with explanations, timestamped transcript evidence and spelling-tolerance rules.                             |
| LIST-04 | Band estimate for full 40-question tests via conversion table.                                                            |

Business rules: answer matching normalises case/whitespace; spelling must be correct (as in the
exam) — show "spelling" as a distinct error category.
Depends on: content bank with **audio assets** (TTS-produced multi-voice or recorded), storage,
attempt engine.

### 9. Writing — `WRIT`

**Purpose:** write Task 1 and Task 2 responses and receive detailed, explained feedback.

| ID      | Requirement                                                                                                                                                                      |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WRIT-01 | Prompt library: Task 2 essay types (opinion, discussion, problem–solution, two-part) and Task 1 Academic (charts, process, map).                                                 |
| WRIT-02 | Editor with word count, timer (40/20 min optional), autosave drafts.                                                                                                             |
| WRIT-03 | Submit for AI feedback: estimated band range per criterion (Task Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy) with justification. |
| WRIT-04 | Inline annotations: errors and improvements with category, explanation (EN/VI) and suggested rewrite; links to grammar topics / vocabulary.                                      |
| WRIT-05 | Improved model version of the user's essay (clearly marked as AI-written) and a revision task.                                                                                   |
| WRIT-06 | Submission history and criterion trend.                                                                                                                                          |
| WRIT-07 | Follow-up questions about the feedback via AI Tutor.                                                                                                                             |

Business rules: minimum 150 words (Task 2) / 100 (Task 1) to request feedback; under-length
essays are flagged as in the real test; AI feedback quota per day (see AI-05); feedback is
stored immutably with model + prompt version for audit; disclaimer on every result.
States: evaluating (streamed progress, typically 20–60 s), quota reached, evaluation failed
(draft preserved, retry), success.
Depends on: AI platform, Grammar/Vocabulary links, Progress.

### 10. Speaking — `SPK`

**Purpose:** practise Speaking Parts 1–3 by recording answers and receiving feedback.

| ID     | Requirement                                                                                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPK-01 | Practice sets by part and topic; Part 2 cue card with 1-min preparation timer and 2-min speaking limit.                                                                 |
| SPK-02 | Record answers in the browser (microphone permission flow), playback before submit, re-record.                                                                          |
| SPK-03 | Transcript (STT) with filler words and pauses preserved.                                                                                                                |
| SPK-04 | Feedback per criterion (Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation) as estimated band ranges with evidence from the transcript. |
| SPK-05 | Pronunciation detail (word-level issues) — only when a pronunciation-assessment provider is integrated; otherwise Pronunciation is marked "not assessed".               |
| SPK-06 | Suggested better answers and useful phrases; save phrases to My words.                                                                                                  |

Business rules: explicit consent before first recording; max recording length per part; raw audio
retained 30 days by default then deleted (transcript and feedback kept); quotas per day.
States: mic permission denied (instructions), recording, uploading (progress), transcribing,
evaluating, provider failure (keep audio, retry), success.
Depends on: STT provider, optional pronunciation provider, storage, AI platform.

### 11. AI Tutor — `AI`

**Purpose:** an always-available tutor that explains, quizzes and coaches in context.

| ID    | Requirement                                                                                                                                                 |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI-01 | Text chat with streaming responses, conversation history and new/rename/delete conversation.                                                                |
| AI-02 | Context-aware entry points: "Ask the tutor" from a word, grammar item, reading question, writing feedback — conversation starts with that context attached. |
| AI-03 | Tutor modes: Explain, Quiz me, Practice conversation (text), Exam strategy.                                                                                 |
| AI-04 | Responses respect explanation language preference and learner level.                                                                                        |
| AI-05 | Usage quotas per user per day for AI features, with clear remaining-usage display.                                                                          |
| AI-06 | Safety and scope: stays on English/IELTS learning; refuses to write content intended for cheating on assessed work; flags it does not give official scores. |
| AI-07 | **Real-time voice conversation** (speak and hear replies) — Future, see §G.                                                                                 |

Business rules: conversations are private to the user; the tutor never receives other users'
data; model output is rendered as sanitised Markdown (no raw HTML); messages are stored for the
user's history and can be deleted.
States: streaming, stopped by user, quota reached, provider error (retry, message preserved),
empty conversation (suggested starter prompts).
Depends on: AI platform; optional context from other modules.

### 12. Progress & analytics — `PROG`

**Purpose:** show real progress and where to focus.

| ID      | Requirement                                                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| PROG-01 | Activity history: time studied per day/week, tasks completed, streak.                                                                      |
| PROG-02 | Per-skill trend of estimated band ranges (Reading/Listening from scored tests; Writing/Speaking from AI estimates) with data-point counts. |
| PROG-03 | Accuracy by question type (Reading/Listening) and by grammar topic; weakest 3 areas highlighted with links to practice.                    |
| PROG-04 | Vocabulary stats: learning / mastered counts, review accuracy.                                                                             |
| PROG-05 | Readiness indicator vs target band (with confidence level).                                                                                |

Business rules: derived only from recorded events; charts show "Not enough data yet" below
thresholds; AI-derived values are visually marked as estimates.
Depends on: activity events from all modules.

### 13. Settings — `SET`

| ID     | Requirement                                                                        |
| ------ | ---------------------------------------------------------------------------------- |
| SET-01 | Profile: display name, avatar.                                                     |
| SET-02 | Learning goals and availability (re-plans roadmap).                                |
| SET-03 | Preferences: theme (_Exists_), explanation language, daily new-word limit.         |
| SET-04 | Notifications: email reminders (on/off, time).                                     |
| SET-05 | Privacy: recording consent, data export (JSON), delete recordings, delete account. |
| SET-06 | Usage: AI quota and usage this period.                                             |

---

## F. Data & domain design

Conceptual model (not a schema). Owner module in brackets. All user-owned tables carry
`user_id` and are protected by Row Level Security.

```
User 1─1 Profile 1─1 LearningGoal
User 1─* PlacementResult
User 1─1 Roadmap 1─* RoadmapWeek 1─* RoadmapTask ──(refers to)── ContentItem
ContentItem = VocabularySet | GrammarTopic | PracticeSet(Reading/Listening) | WritingPrompt | SpeakingSet
PracticeSet 1─* QuestionGroup 1─* Question ; PracticeSet 1─1 Passage | 1─* AudioTrack
User 1─* Attempt *─1 PracticeSet ; Attempt 1─* Answer
User 1─* UserWord *─1 Word ; UserWord 1─* ReviewLog
User 1─* WritingSubmission *─1 WritingPrompt ; WritingSubmission 1─* WritingEvaluation
User 1─* SpeakingSession *─1 SpeakingSet ; SpeakingSession 1─* SpeakingResponse 1─1 Recording, Transcript, SpeakingEvaluation
User 1─* TutorConversation 1─* TutorMessage
User 1─* ActivityEvent ; User 1─* SkillEstimate ; User 1─* AiUsage
```

| Entity                                                                                             | Owner              | Key attributes / notes                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User / Profile**                                                                                 | auth               | id, email (auth provider), display name, birth-year check (16+), explanation language, timezone                                                                                        |
| **LearningGoal**                                                                                   | onboarding         | test type, target overall + per-skill bands, exam date, days/week, minutes/day                                                                                                         |
| **PlacementResult**                                                                                | onboarding         | per-area score, estimated CEFR, band range, confidence, taken_at                                                                                                                       |
| **Roadmap / RoadmapWeek / RoadmapTask**                                                            | learning           | generator version, phase, week index, task type, content ref, planned minutes, status (planned/done/skipped/overdue), completed_by_event                                               |
| **ContentItem** (catalogue)                                                                        | content            | type, slug, level, IELTS topic tags, source (original/licensed/AI-assisted), review status (draft/reviewed/published), version                                                         |
| **Word**                                                                                           | vocabulary         | lemma, POS, IPA, definitions EN/VI, collocations, examples, audio asset ref, topic tags, level                                                                                         |
| **VocabularySet**                                                                                  | vocabulary         | topic, level, ordered word refs                                                                                                                                                        |
| **UserWord / ReviewLog**                                                                           | vocabulary         | SRS state (ease, interval, repetitions, due_at), source (set/passage/feedback); log of grade + timestamp                                                                               |
| **GrammarTopic / GrammarExercise**                                                                 | grammar            | explanation blocks EN/VI, level, related criteria; exercise items with accepted answers + explanation                                                                                  |
| **PracticeSet / Passage / AudioTrack / QuestionGroup / Question**                                  | reading, listening | question type, instructions, options, correct answers (+ variants), explanation, evidence location (char range / timestamp)                                                            |
| **Attempt / Answer**                                                                               | practice engine    | mode (learn/test), started/submitted (server time), raw score, band estimate (full tests only), per-answer correctness                                                                 |
| **WritingPrompt / WritingSubmission / WritingEvaluation**                                          | writing            | task type; essay text, word count, time spent; evaluation: criterion band ranges, rationale, annotations (offset, category, explanation, suggestion), model id, prompt version, status |
| **SpeakingSet / SpeakingSession / SpeakingResponse / Recording / Transcript / SpeakingEvaluation** | speaking           | part, cue card; storage path, duration, retention_until; transcript text + word timings; criterion band ranges, pronunciation detail (nullable), provider ids                          |
| **TutorConversation / TutorMessage**                                                               | ai-tutor           | mode, context ref (entity type + id), title; role, content, token usage                                                                                                                |
| **ActivityEvent**                                                                                  | progress           | type (lesson_completed, attempt_submitted, review_done, writing_evaluated…), module, ref id, duration, occurred_at — append-only                                                       |
| **SkillEstimate**                                                                                  | progress           | skill, band range low/high, source (test/AI), confidence, derived_from                                                                                                                 |
| **AiUsage**                                                                                        | ai platform        | feature, units (requests/tokens/audio seconds), period — used for quotas and cost tracking                                                                                             |
| **NotificationPreference**                                                                         | settings           | channel, schedule                                                                                                                                                                      |

Design rules: content tables are global and read-only to learners; user tables are per-user;
modules communicate through ActivityEvent and content references, not cross-module writes;
evaluations are immutable (re-evaluation creates a new row).

---

## G. AI architecture

### Capabilities and limits

- The Claude API accepts text, images and documents and returns text (streaming supported). It
  does **not** provide speech recognition or speech synthesis, so voice features combine Claude
  with dedicated STT/TTS providers. (Verify current capabilities at implementation time.)
- **Pronunciation** cannot be judged reliably from a transcript. It requires a pronunciation-
  assessment provider (phoneme-level scoring); until then it is reported as "not assessed".
- **Band scores from AI are estimates.** Output is a band _range_ per criterion with evidence and
  a confidence label, never an official score. Calibration against human-rated samples is a
  release requirement for Writing/Speaking feedback (see roadmap quality gates).

### Responsibilities by layer

| Concern                        | Frontend (browser)                                                          | Backend (Next.js server, `src/server/*`)                                                                        | External AI / speech APIs                               |
| ------------------------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Chat UI, streaming render      | Render streamed tokens, stop button, sanitised Markdown                     | Route handler streams from Claude; auth, quota check, prompt assembly, persistence                              | Claude Messages API (streaming)                         |
| Writing evaluation             | Editor, autosave, progress UI                                               | Validate, build rubric prompt, request **structured output** (JSON schema), validate with Zod, store evaluation | Claude (structured outputs)                             |
| Speaking (recorded)            | MediaRecorder capture, level meter, upload with progress                    | Signed upload URL, size/MIME check, call STT, then Claude evaluation; retention job                             | STT provider; optional pronunciation assessment; Claude |
| Word / passage audio           | Audio player                                                                | Pre-generate and cache TTS audio for content (not per request)                                                  | TTS provider                                            |
| Real-time voice tutor (Future) | Mic stream (WebRTC/WebSocket), voice activity detection, barge-in, playback | Session broker: short-lived tokens, streaming STT → Claude (streaming) → streaming TTS pipeline, latency/quotas | Streaming STT, Claude, streaming TTS                    |
| Quotas & cost                  | Show remaining usage                                                        | Enforce per-user/day limits before calling providers; record `AiUsage`                                          | —                                                       |
| Safety                         | —                                                                           | System prompts with scope rules, input length limits, output validation, refusal handling, PII minimisation     | Provider safety features                                |

No browser ever holds provider API keys; all calls go through server adapters
(`src/server/ai`, `src/server/speech`) behind typed interfaces, so providers can be swapped.

### Claude integration guidelines

- Default model `claude-opus-5-5` (current default); model id configurable per feature in server
  config. Whether cheaper tiers (e.g. `claude-sonnet-5-5`, `claude-haiku-5-5`) are used for
  high-volume routes (word explanations, quiz generation) is a product/cost decision to be made
  with eval data (decision D-07), not assumed.
- Streaming for chat and long evaluations; `effort` tuned per route (lower for chat/explanations,
  higher for essay evaluation).
- Structured outputs (`output_config.format` with a JSON schema) for evaluations; every response
  validated with Zod before storage.
- Prompt caching for the stable rubric/system prompt prefix; versioned prompts stored in the repo
  (`prompt_version` saved with each evaluation).
- Message Batches (async, lower cost) for offline work: content drafting, re-evaluation for
  calibration.
- Handle `refusal` and `max_tokens` stop reasons explicitly; show a friendly retry state.
- Evaluation harness: a set of human-rated essays/responses to measure agreement before launch
  and after every prompt or model change.

### Privacy for AI features

Send only the essay/transcript and learner level — no email, name or other users' data. Audio is
stored in private buckets with signed URLs and deleted after the retention period. Provider data-
retention settings are reviewed before launch. Users are told which features use AI and external
speech services.

---

## Key decisions (proposed — need confirmation)

| ID   | Decision                                                                                                                                     | Rationale                                                                                |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| D-01 | IELTS **Academic** first; General Training later                                                                                             | Largest student segment; keeps content scope manageable                                  |
| D-02 | UI in English; explanations available in **Vietnamese or English** (user preference); full UI translation later                              | Learners need native-language explanations most; full i18n is a large cross-cutting cost |
| D-03 | Auth via **Supabase Auth** (email + Google), data in Supabase Postgres with RLS                                                              | Already the planned stack; RLS enforces per-user data isolation                          |
| D-04 | Content is **original or licensed**; AI may draft, a human reviews before publishing                                                         | Cambridge/official materials are copyrighted; quality control of AI content              |
| D-05 | AI scores are **band ranges with evidence**, labelled as estimates                                                                           | Avoid false precision and misleading claims                                              |
| D-06 | Roadmap is **rule-based** in the MVP                                                                                                         | Explainable, testable, cheap; AI-assisted planning later                                 |
| D-07 | Model tier per feature decided from eval/cost data                                                                                           | Quality first; cost optimisation measured, not assumed                                   |
| D-08 | STT / TTS / pronunciation providers selected via a short evaluation (accuracy on Vietnamese-accented English, latency, cost, data retention) | No provider assumed; adapters keep them swappable                                        |
| D-09 | Responsive web only (no native apps)                                                                                                         | Phase 0 shell is responsive; one codebase                                                |
