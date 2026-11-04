# Information architecture — IELTS Learning Hub

- **Status:** Approved for MVP planning (2026-11-04). Decisions D-01–D-10 accepted; D-11–D-14 open.
- Builds on the routes that already exist from Phase 0 (marked _Exists_ — placeholders with empty
  states). Everything else is proposed.
- Requirement IDs refer to [product-requirements.md](product-requirements.md).

## Route groups

| Group          | Purpose                                                  | Layout                                             | Access                                                 |
| -------------- | -------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| `(marketing)`  | Public pages                                             | Minimal header, no sidebar                         | Public                                                 |
| `(auth)`       | Sign-in/up, password reset                               | Centered card                                      | Public; signed-in users are redirected to `/dashboard` |
| `(onboarding)` | First-run setup and placement                            | Focused, step progress, no sidebar                 | Signed in, onboarding not completed                    |
| `(app)`        | Learning application                                     | App shell (sidebar, header, breadcrumb) — _Exists_ | Signed in                                              |
| `api/`         | Route handlers (AI streaming, uploads, webhooks, health) | —                                                  | Per handler; server-side auth                          |

Focused **practice/test mode** pages inside `(app)` hide the sidebar (full-screen exam
experience) while keeping a clear exit.

## Sitemap

```
/                                   Landing (Exists)                         public
/privacy  /terms                    Legal pages                              public
/ai-disclosure                      How AI feedback works & its limits       public

(auth)
/sign-in                            AUTH-02, AUTH-03
/sign-up                            AUTH-01
/forgot-password                    AUTH-04
/reset-password                     AUTH-04
/auth/callback                      OAuth / email-link callback (route handler)

(onboarding)
/onboarding                         → redirects to current step
/onboarding/goal                    ONB-01
/onboarding/schedule                ONB-02
/onboarding/preferences             ONB-03
/onboarding/placement               ONB-04 (skippable)
/onboarding/result                  ONB-05

(app) — OVERVIEW
/dashboard                          DASH-*                                   Exists

(app) — LEARNING
/learning                           Roadmap overview (phases, this week)     Exists  ROAD-*
/learning/week/[weekId]             Week detail and tasks                            ROAD-02
/vocabulary                         My words + due reviews + sets            Exists  VOC-*
/vocabulary/sets                    Set catalogue (topic, level)                     VOC-01
/vocabulary/sets/[setSlug]          Set detail, add words                            VOC-01, VOC-03
/vocabulary/words/[wordSlug]        Word detail                                      VOC-02
/vocabulary/review                  SRS review session (focus mode)                  VOC-04
/grammar                            Topic catalogue by level + mastery       Exists  GRAM-01
/grammar/[topicSlug]                Lesson                                           GRAM-02
/grammar/[topicSlug]/practice       Practice set (focus mode)                        GRAM-03

(app) — IELTS PRACTICE
/reading                            Library (filters: question type, level)  Exists  READ-01
/reading/[setId]                    Set intro: mode choice (learn/test)              READ-02
/reading/[setId]/attempt/[attemptId]           Attempt (focus mode)                  READ-03
/reading/[setId]/attempt/[attemptId]/review    Results + explanations                READ-04
/listening                          Library                                  Exists  LIST-01
/listening/[setId]                  Set intro                                        LIST-02
/listening/[setId]/attempt/[attemptId]         Attempt (focus mode)                  LIST-02
/listening/[setId]/attempt/[attemptId]/review  Results + transcript                  LIST-03
/writing                            Prompt library + my submissions          Exists  WRIT-01, WRIT-06
/writing/[promptId]                 Editor (focus mode)                              WRIT-02
/writing/submissions/[submissionId] Feedback report                                  WRIT-03..05
/speaking                           Practice sets by part/topic + history    Exists  SPK-01
/speaking/[setId]                   Session: record answers (focus mode)             SPK-02
/speaking/sessions/[sessionId]      Feedback report                                  SPK-03..06

(app) — AI LEARNING
/ai-tutor                           Conversation list + new chat             Exists  AI-01
/ai-tutor/[conversationId]          Conversation                                     AI-01..04
/ai-tutor/voice                     Real-time voice session (Future)                 AI-07

(app) — ANALYTICS
/progress                           Overview: activity, skills, readiness    Exists  PROG-01, 02, 05
/progress/skills/[skill]            Skill detail (question types / criteria)         PROG-02, 03
/progress/history                   Activity history                                 PROG-01

(app) — PREFERENCES
/settings                           → /settings/profile                      Exists
/settings/profile                   SET-01
/settings/learning                  Goals, schedule, language, word limit            SET-02, SET-03
/settings/notifications             SET-04
/settings/privacy                   Consent, export, delete recordings/account       SET-05, AUTH-06
/settings/usage                     AI quota and usage                               SET-06

api/
/api/health                         Liveness                                 Exists
/api/ai/tutor                       Streaming chat (POST)
/api/ai/writing-evaluations         Start evaluation (POST)
/api/speaking/uploads               Signed upload URL (POST)
/api/speaking/evaluations           Transcribe + evaluate (POST)
```

Server Actions are preferred for simple mutations (save answer, mark task done, update settings);
route handlers are used for streaming, uploads and webhooks.

## Navigation

The sidebar sections from Phase 0 stay unchanged (single source: `src/config/navigation.ts`):

| Section        | Items                                    |
| -------------- | ---------------------------------------- |
| Overview       | Dashboard                                |
| Learning       | Learning Roadmap · Vocabulary · Grammar  |
| IELTS Practice | Reading · Listening · Writing · Speaking |
| AI Learning    | AI Tutor                                 |
| Analytics      | Progress                                 |
| Preferences    | Settings                                 |

Rules:

- Sub-pages are reached from their module page, not added to the sidebar. The parent item stays
  active on nested routes (already implemented with `isRouteActive`).
- Breadcrumbs extend to nested pages: `Dashboard › Reading › Practice Set 3 › Review`. The
  breadcrumb helper will need per-page dynamic titles (e.g. set or prompt name) — an
  implementation detail for the first nested route.
- Header search (placeholder today) will search content titles (sets, topics, words, prompts)
  and the user's own conversations/submissions.
- Notifications (placeholder) are for reminders and "feedback ready" events.
- Contextual entry to the AI Tutor ("Ask the tutor") appears on word, grammar item, reading
  explanation and writing/speaking feedback views.

## Access and redirect rules

| Condition                                                            | Behaviour                                                                          |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Not signed in → any `(app)` or `(onboarding)` route                  | Redirect to `/sign-in?next=<path>`                                                 |
| Signed in → `(auth)` route                                           | Redirect to `/dashboard`                                                           |
| Signed in, onboarding incomplete → `(app)` route                     | Redirect to `/onboarding` (user may choose "skip for now", which marks it skipped) |
| Resource belongs to another user (attempt, submission, conversation) | 404 (not 403), to avoid revealing existence                                        |
| Content in draft/unreviewed status                                   | Not visible to learners                                                            |

Checks run on the server (proxy/middleware for coarse redirects, plus a per-request
authorization check in data access); hidden UI is never the only protection.

## Page templates

| Template        | Used by                                                    | Structure                                                                         |
| --------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Module home     | Vocabulary, Grammar, Reading, Listening, Writing, Speaking | PageHeader → "continue" card → filters → list/grid → empty state                  |
| Detail / lesson | Word, Grammar lesson, Set intro                            | Breadcrumb → title → content blocks → primary action                              |
| Focus mode      | Attempts, review session, writing editor, speaking session | Minimal top bar (title, timer, exit) → task area → sticky submit                  |
| Feedback report | Reading/Listening review, Writing/Speaking feedback        | Summary (score/estimate + disclaimer) → criteria → annotated content → next steps |
| Conversation    | AI Tutor                                                   | Conversation list (drawer on mobile) → messages → composer                        |
| Settings        | Settings sub-pages                                         | Section nav (tabs on mobile) → forms                                              |

## Content taxonomy

- **Skills:** Reading, Listening, Writing, Speaking (+ supporting: Vocabulary, Grammar).
- **Levels:** CEFR A2–C1 mapped to target bands (≈ B1: 4.0–5.0, B2: 5.5–6.5, C1: 7.0–8.0).
- **IELTS topics:** education, environment, technology, health, work, society, culture, media,
  cities, science (shared tags across vocabulary, reading, writing and speaking content).
- **Question types:** per skill (Reading 11 types, Listening 6 groups); used for filters,
  analytics and the roadmap.
- **Criteria:** Writing (TA/TR, CC, LR, GRA), Speaking (FC, LR, GRA, P).
