# P4 — Reading: design

- **Date:** 2026-11-09
- **Status:** Approved in chat 2026-11-09. The user skipped the brainstorming questions ("làm
  luôn theo tài liệu") and approved the plan below, including Claude drafting one full test.
- **Builds on:** P2 engine ([ADR 0007](../../decisions/0007-content-and-practice-engine.md)), P3
  vocabulary ([ADR 0008](../../decisions/0008-vocabulary-srs-and-grammar.md)), READ-01..07 in
  [product-requirements.md](../../product/product-requirements.md), routes in
  [information-architecture.md](../../product/information-architecture.md).

## 1. Intent

Complete IELTS Academic Reading practice on top of the P2 minimal flow: find the right set,
practise comfortably on any screen, understand every answer from the passage, see an honest
band estimate for full tests, collect unknown words, and look back at past attempts.

## 2. Goals (from the product requirements)

| ID      | Goal                                                                                                                                                                                                                                                                                                                         |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| READ-01 | Library filters by **question type** and **level**, in the URL (`/reading?type=…&level=…`) so they survive reload and can be shared. Each set lists its question types.                                                                                                                                                      |
| READ-02 | Learn mode (untimed) and test mode: **20 minutes** for a one-passage set, **60 minutes** for a full test.                                                                                                                                                                                                                    |
| READ-03 | Desktop: passage and questions side by side. **Mobile: two tabs**, "Passage" and "Questions", with both kept mounted. Learners **highlight** text in the passage; highlights are stored on the device per attempt. An **offline answer buffer** keeps unsaved answers on the device and resends them on reload or reconnect. |
| READ-04 | Results show the passages. "Show in passage" jumps to the evidence and highlights it.                                                                                                                                                                                                                                        |
| READ-05 | **Band estimate only for full 40-question tests**, using the commonly published Academic Reading raw-score conversion. It is labelled as an estimate. Other sets show "x/y correct".                                                                                                                                         |
| READ-06 | Author-chosen **key words** are underlined in the passage. Tapping one shows a bilingual meaning and "Add to My words", which feeds the P3 daily session.                                                                                                                                                                    |
| READ-07 | `/reading/history` lists submitted Reading attempts (date, set, mode, score or band) with links to their results. The set intro page shows the latest attempts.                                                                                                                                                              |

## 3. Non-goals

- "Ask the tutor" (AI, P7).
- Listening (P10).
- Storing highlights on the server or syncing them across devices.
- A production content import.

## 4. Anti-goals

- A band shown for a partial set, or presented as an official score.
- Losing typed answers when the connection drops.
- A mobile layout where switching tabs erases answers or the scroll position.

## 5. Decisions

### Approved in chat

- A practice set can have several passages: a new `practice_set_passages` table. Each question
  group belongs to one passage, and evidence offsets are relative to that passage.
- `practice_sets.kind`: `practice` or `full_test`. A full test has 3 passages, 40 marks and a
  60-minute test mode.
- Passage key words reuse the P3 `words` table. A word is visible to learners when it belongs to
  a published vocabulary set _or_ a published practice set.
- The band conversion is a pure function with tests covering every boundary.
- Content is drafted by Claude (`ai_assisted`) and published only locally:
  - one full Academic test (3 passages of about 700–800 words, 40 mixed questions);
  - key words for the existing set and the full test, about 5–8 per passage.

### Designer's calls

- **Conversion table:**

  | Raw score | Band |
  | --------- | ---- |
  | 39–40     | 9    |
  | 37–38     | 8.5  |
  | 35–36     | 8    |
  | 33–34     | 7.5  |
  | 30–32     | 7    |
  | 27–29     | 6.5  |
  | 23–26     | 6    |
  | 19–22     | 5.5  |
  | 15–18     | 5    |
  | 13–14     | 4.5  |
  | 10–12     | 4    |
  | 8–9       | 3.5  |
  | 6–7       | 3    |
  | 4–5       | 2.5  |
  | 2–3       | 2    |
  | 1         | 1    |
  | 0         | 0    |

  The results page says it is an estimate based on the commonly published IELTS Academic
  conversion.

- **Filters** are applied on the server, after loading the small catalogue. Invalid parameter
  values are ignored.
- **Highlights:** the learner selects text, then taps "Highlight". "Clear highlights" removes
  them. Highlights are stored in `localStorage` under the attempt id, and every storage call is
  wrapped in try/catch.
- **Key words:** the first occurrence of each key word's form in its passage is underlined. The
  word card shows the meaning in the learner's language first.
