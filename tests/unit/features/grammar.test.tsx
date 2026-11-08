import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GrammarLessonView } from "@/features/grammar/components/grammar-lesson-view"
import { GrammarTopicList } from "@/features/grammar/components/grammar-topic-list"
import { saveAnswerAction, submitAttemptAction } from "@/features/practice/actions"
import { AttemptRunner } from "@/features/practice/components/attempt-runner"
import { QuestionInput } from "@/features/practice/components/question-input"
import type { PracticeQuestion, PracticeSetDetail } from "@/features/practice/types"
import type { GrammarLesson } from "@/lib/content/grammar-schema"

vi.mock("@/features/practice/actions", () => ({
  saveAnswerAction: vi.fn(),
  submitAttemptAction: vi.fn(),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }))

const lesson: GrammarLesson = {
  introEn: "Articles are tiny words with big jobs.",
  introVi: "Mạo từ nhỏ nhưng việc to.",
  sections: [
    {
      heading: "A or an?",
      bodyEn: "Listen to the first sound.",
      bodyVi: "Nghe âm đầu.",
      examples: [{ en: "an hour", note: "Silent h." }],
    },
  ],
  commonMistakes: [
    { wrong: "a honest man", right: "an honest man", whyEn: "Silent h.", whyVi: "Chữ h câm." },
  ],
  ieltsTipEn: "Check every the.",
  ieltsTipVi: "Soát từng chữ the.",
}

describe("GrammarTopicList", () => {
  it("groups topics by level and shows honest mastery", () => {
    render(
      <GrammarTopicList
        topics={[
          {
            slug: "articles",
            title: "Articles",
            summary: null,
            level: "B1",
            position: 1,
            mastery: "mastered",
            lastScorePercent: 88,
          },
          {
            slug: "tenses",
            title: "Tenses",
            summary: null,
            level: "B1",
            position: 2,
            mastery: "practising",
            lastScorePercent: 75,
          },
          {
            slug: "relatives",
            title: "Relative clauses",
            summary: null,
            level: "B2",
            position: 3,
            mastery: "not_started",
            lastScorePercent: null,
          },
        ]}
      />,
    )
    const b1 = screen.getByRole("region", { name: "Level B1" })
    expect(within(b1).getByRole("link", { name: /Articles/ })).toHaveAttribute(
      "href",
      "/grammar/articles",
    )
    expect(within(b1).getByText("Mastered · 88%")).toBeInTheDocument()
    expect(within(b1).getByText("Practising · 75%")).toBeInTheDocument()
    expect(
      within(screen.getByRole("region", { name: "Level B2" })).getByText("Not started"),
    ).toBeInTheDocument()
  })
})

describe("GrammarLessonView", () => {
  it("shows the learner's language first and the other one on demand", () => {
    const { container } = render(<GrammarLessonView lesson={lesson} explanationLanguage="vi" />)
    const text = container.textContent ?? ""
    expect(text.indexOf("Nghe âm đầu.")).toBeLessThan(text.indexOf("Listen to the first sound."))
    expect(screen.getAllByText("Read in English").length).toBeGreaterThan(0)
  })

  it("lists common mistakes with the fix", () => {
    render(<GrammarLessonView lesson={lesson} explanationLanguage="en" />)
    const mistakes = screen.getByRole("list", { name: "Common mistakes" })
    expect(within(mistakes).getByText("a honest man")).toBeInTheDocument()
    expect(within(mistakes).getByText("an honest man")).toBeInTheDocument()
  })
})

const spotQuestion: PracticeQuestion = {
  id: "q1",
  number: 1,
  prompt: "She is a honest student.",
  responseKind: "single",
  options: [
    { id: "t1", text: "She" },
    { id: "t2", text: "is" },
    { id: "t3", text: "a" },
    { id: "t4", text: "honest" },
    { id: "t5", text: "student." },
  ],
  selectCount: null,
  maxWords: null,
}

describe("Spot the mistake", () => {
  it("lets the learner tap the wrong word", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <QuestionInput
        question={spotQuestion}
        groupType="error_correction"
        response={[]}
        onChange={onChange}
      />,
    )
    await user.click(screen.getByRole("radio", { name: "a" }))
    expect(onChange).toHaveBeenCalledWith(["t3"])
  })
})

describe("AttemptRunner with instant check", () => {
  const set: PracticeSetDetail = {
    id: "set-1",
    slug: "articles-practice",
    title: "Articles — practice",
    summary: null,
    level: "B1",
    topics: [],
    questionCount: 1,
    testTimeLimitSeconds: null,
    passage: null,
    groups: [
      {
        id: "g1",
        type: "error_correction",
        instructions: "Tap the mistake.",
        sharedOptions: [],
        questions: [spotQuestion],
      },
    ],
  }

  beforeEach(() => {
    vi.mocked(saveAnswerAction).mockReset().mockResolvedValue({ ok: true })
    vi.mocked(submitAttemptAction).mockReset().mockResolvedValue({ ok: true })
  })

  it("checks one answer, explains it and locks the question", async () => {
    const instantCheck = vi.fn().mockResolvedValue({
      ok: true,
      isCorrect: true,
      accepted: ["t3"],
      explanation: "Honest starts with a vowel sound.",
      correction: "She is an honest student.",
    })
    const user = userEvent.setup()
    render(
      <AttemptRunner
        set={set}
        attempt={{ id: "attempt-1", mode: "learn", answers: {} }}
        initialRemainingMs={null}
        exitHref="/grammar/articles"
        reviewHref="/review"
        instantCheck={instantCheck}
      />,
    )

    const check = screen.getByRole("button", { name: "Check answer 1" })
    expect(check).toBeDisabled()
    await user.click(screen.getByRole("radio", { name: "a" }))
    await user.click(check)

    expect(instantCheck).toHaveBeenCalledWith({
      attemptId: "attempt-1",
      questionId: "q1",
      response: ["t3"],
    })
    const feedback = await screen.findByRole("status", { name: "Feedback for question 1" })
    expect(feedback).toHaveTextContent("Correct!")
    expect(feedback).toHaveTextContent("Honest starts with a vowel sound.")
    expect(feedback).toHaveTextContent("She is an honest student.")
    expect(screen.getByRole("radio", { name: "a" })).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Check answer 1" })).not.toBeInTheDocument()
  })

  it("shows already-checked questions as locked when resuming", () => {
    render(
      <AttemptRunner
        set={set}
        attempt={{ id: "attempt-1", mode: "learn", answers: { q1: ["t4"] } }}
        initialRemainingMs={null}
        exitHref="/grammar/articles"
        reviewHref="/review"
        instantCheck={vi.fn()}
        initialChecked={{ q1: { isCorrect: false } }}
      />,
    )
    expect(screen.getByRole("status", { name: "Feedback for question 1" })).toHaveTextContent(
      "Not quite",
    )
    expect(screen.getByRole("radio", { name: "honest" })).toBeDisabled()
  })
})

describe("AttemptReview for Spot the mistake", () => {
  it("shows the chosen word and the corrected sentence, not token ids", async () => {
    const { AttemptReview } = await import("@/features/practice/components/attempt-review")
    const set: PracticeSetDetail = {
      id: "set-1",
      slug: "articles-practice",
      title: "Articles — practice",
      summary: null,
      level: "B1",
      topics: [],
      questionCount: 1,
      testTimeLimitSeconds: null,
      passage: null,
      groups: [
        {
          id: "g1",
          type: "error_correction",
          instructions: "Tap.",
          sharedOptions: [],
          questions: [spotQuestion],
        },
      ],
    }
    render(
      <AttemptReview
        set={set}
        attempt={{
          id: "a1",
          practiceSetId: "set-1",
          mode: "learn",
          status: "submitted",
          startedAt: "2026-11-09T00:00:00Z",
          deadlineAt: null,
          remainingMs: null,
          submittedAt: "2026-11-09T00:05:00Z",
          submitReason: "learner",
          score: 0,
          maxScore: 1,
          answers: { q1: ["t4"] },
          results: { q1: { isCorrect: false, points: 0 } },
        }}
        keys={{
          q1: {
            questionId: "q1",
            accepted: ["t3"],
            explanation: "Honest starts with a vowel sound.",
            explanationVi: null,
            evidence: null,
            correction: "She is an honest student.",
          },
        }}
        explanationLanguage="en"
      />,
    )
    const item = screen.getByRole("listitem")
    expect(item).toHaveTextContent("Your answerhonest")
    expect(item).toHaveTextContent("Correct answera → She is an honest student.")
    expect(item).not.toHaveTextContent("t3")
  })
})
