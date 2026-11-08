import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { saveAnswerAction, submitAttemptAction } from "@/features/practice/actions"
import { AttemptReview } from "@/features/practice/components/attempt-review"
import { AttemptRunner } from "@/features/practice/components/attempt-runner"
import { QuestionInput } from "@/features/practice/components/question-input"
import type { AttemptState, PracticeQuestion, PracticeSetDetail } from "@/features/practice/types"

vi.mock("@/features/practice/actions", () => ({
  saveAnswerAction: vi.fn(),
  submitAttemptAction: vi.fn(),
}))
const replace = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }))

const TFNG = [
  { id: "TRUE", text: "TRUE" },
  { id: "FALSE", text: "FALSE" },
  { id: "NOT_GIVEN", text: "NOT GIVEN" },
]

const singleQuestion: PracticeQuestion = {
  id: "q1",
  number: 1,
  prompt: "Flat roofs are often visited by the public.",
  responseKind: "single",
  options: TFNG,
  selectCount: null,
  maxWords: null,
}
const textQuestion: PracticeQuestion = {
  id: "q2",
  number: 2,
  prompt: "Before planting, older buildings may need ______.",
  responseKind: "text",
  options: [],
  selectCount: null,
  maxWords: 2,
}
const multipleQuestion: PracticeQuestion = {
  id: "q3",
  number: 3,
  prompt: "Which TWO costs are mentioned?",
  responseKind: "multiple",
  options: [
    { id: "A", text: "insurance" },
    { id: "B", text: "weeding" },
    { id: "C", text: "windows" },
  ],
  selectCount: 2,
  maxWords: null,
}

const set: PracticeSetDetail = {
  id: "set-1",
  slug: "reading-sample",
  title: "Rooftop gardens",
  summary: null,
  level: "B1",
  topics: [],
  questionCount: 3,
  testTimeLimitSeconds: 1200,
  kind: "practice",
  questionTypes: ["true_false_not_given", "sentence_completion", "multiple_choice_multi"],
  passageCount: 1,
  passages: [
    {
      id: "p1",
      position: 1,
      title: "Rooftop gardens",
      text: "Roofs are rarely visited.\n\nOld buildings need reinforcement.",
      keyWords: [],
    },
  ],
  groups: [
    {
      id: "g1",
      type: "true_false_not_given",
      instructions: "Choose TRUE, FALSE or NOT GIVEN.",
      sharedOptions: TFNG,
      passageId: "p1",
      questions: [singleQuestion],
    },
    {
      id: "g2",
      type: "sentence_completion",
      instructions: "Write NO MORE THAN TWO WORDS.",
      sharedOptions: [],
      passageId: "p1",
      questions: [textQuestion],
    },
    {
      id: "g3",
      type: "multiple_choice_multi",
      instructions: "Choose TWO letters.",
      sharedOptions: [],
      passageId: "p1",
      questions: [multipleQuestion],
    },
  ],
}

describe("QuestionInput", () => {
  it("answers a True/False/Not Given question with a labelled radio group", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <QuestionInput
        question={singleQuestion}
        groupType="true_false_not_given"
        response={[]}
        onChange={onChange}
      />,
    )

    expect(screen.getByRole("group", { name: /Flat roofs are often visited/ })).toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: "FALSE" }))
    expect(onChange).toHaveBeenCalledWith(["FALSE"])
  })

  it("debounces text answers and shows the word limit", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <QuestionInput
        question={textQuestion}
        groupType="sentence_completion"
        response={[]}
        onChange={onChange}
      />,
    )

    const input = screen.getByRole("textbox", { name: "Answer for question 2" })
    expect(input).toHaveAccessibleDescription("No more than 2 words")
    await user.type(input, "r")
    expect(onChange).toHaveBeenLastCalledWith(["r"], 800)
  })

  it("limits multi-answer questions to the number of choices", () => {
    render(
      <QuestionInput
        question={multipleQuestion}
        groupType="multiple_choice_multi"
        response={["A", "B"]}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByText("Choose 2 (2 selected)")).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: /insurance/ })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: /windows/ })).toBeDisabled()
  })

  it("uses a select for matching questions", () => {
    render(
      <QuestionInput
        question={{ ...singleQuestion, options: [{ id: "i", text: "Heading one" }] }}
        groupType="matching_headings"
        response={[]}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole("combobox", { name: "Answer for Question 1" })).toBeInTheDocument()
  })
})

describe("AttemptRunner", () => {
  beforeEach(() => {
    vi.mocked(saveAnswerAction).mockReset().mockResolvedValue({ ok: true })
    vi.mocked(submitAttemptAction).mockReset().mockResolvedValue({ ok: true })
    replace.mockReset()
  })

  it("tracks answered questions and submits after confirmation", async () => {
    const user = userEvent.setup()
    render(
      <AttemptRunner
        set={set}
        attempt={{ id: "attempt-1", mode: "learn", answers: { q1: ["TRUE"] } }}
        initialRemainingMs={null}
        exitHref="/reading/reading-sample"
        reviewHref="/reading/reading-sample/attempt/attempt-1/review"
      />,
    )

    expect(screen.getByText("Learn mode")).toBeInTheDocument()
    expect(screen.getByRole("article", { name: "Reading passage" })).toHaveTextContent(
      "Roofs are rarely visited.",
    )
    expect(screen.getByText("1 of 3 answered")).toBeInTheDocument()

    await user.click(screen.getByRole("checkbox", { name: /weeding/ }))
    expect(screen.getByText("2 of 3 answered")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Submit" }))
    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveTextContent("You have 1 unanswered question.")
    await user.click(within(dialog).getByRole("button", { name: "Submit answers" }))

    await vi.waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/reading/reading-sample/attempt/attempt-1/review"),
    )
    expect(saveAnswerAction).toHaveBeenCalledWith({
      attemptId: "attempt-1",
      questionId: "q3",
      response: ["B"],
    })
    expect(submitAttemptAction).toHaveBeenCalledWith("attempt-1")
  })

  it("shows the submit error and stays on the page", async () => {
    vi.mocked(submitAttemptAction).mockResolvedValue({ ok: false, error: "Could not submit." })
    const user = userEvent.setup()
    render(
      <AttemptRunner
        set={set}
        attempt={{ id: "attempt-1", mode: "learn", answers: {} }}
        initialRemainingMs={null}
        exitHref="/reading/reading-sample"
        reviewHref="/review"
      />,
    )

    await user.click(screen.getByRole("button", { name: "Submit" }))
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Submit answers" }),
    )
    expect(
      await within(screen.getByRole("dialog")).findByText("Could not submit."),
    ).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })
})

describe("AttemptReview", () => {
  const attempt: AttemptState = {
    id: "attempt-1",
    practiceSetId: "set-1",
    mode: "test",
    status: "submitted",
    startedAt: "2026-11-08T10:00:00Z",
    deadlineAt: "2026-11-08T10:20:00Z",
    remainingMs: null,
    submittedAt: "2026-11-08T10:20:00Z",
    submitReason: "time_expired",
    score: 2,
    maxScore: 4,
    answers: { q1: ["FALSE"], q3: ["A", "B"] },
    results: {
      q1: { isCorrect: true, points: 1 },
      q2: { isCorrect: false, points: 0 },
      q3: { isCorrect: false, points: 1 },
    },
  }
  const keys = {
    q1: {
      questionId: "q1",
      accepted: ["FALSE"],
      explanation: "They are rarely visited.",
      explanationVi: "Hiếm khi có người lên.",
      evidence: { start: 0, end: 25 },
      correction: null,
    },
    q2: {
      questionId: "q2",
      accepted: ["structural reinforcement", "reinforcement"],
      explanation: "Stated in paragraph D.",
      explanationVi: null,
      evidence: null,
      correction: null,
    },
    q3: {
      questionId: "q3",
      accepted: ["B", "C"],
      explanation: "Weeding and windows.",
      explanationVi: null,
      evidence: null,
      correction: null,
    },
  }

  it("shows the score, each outcome, answers and explanations", () => {
    render(<AttemptReview set={set} attempt={attempt} keys={keys} explanationLanguage="vi" />)

    expect(screen.getByText("2 / 4")).toBeInTheDocument()
    expect(screen.getByText(/submitted automatically/)).toBeInTheDocument()

    const items = within(
      screen.getByRole("list", { name: "Answers and explanations" }),
    ).getAllByRole("listitem")
    expect(items[0]).toHaveTextContent("Correct")
    // Vietnamese explanation when available, with the passage evidence.
    expect(items[0]).toHaveTextContent("Hiếm khi có người lên.")
    expect(items[0]).toHaveTextContent("“Roofs are rarely visited.”")
    expect(items[1]).toHaveTextContent("Not answered")
    expect(items[1]).toHaveTextContent("structural reinforcement / reinforcement")
    // Falls back to English when there is no Vietnamese explanation.
    expect(items[1]).toHaveTextContent("Stated in paragraph D.")
    expect(items[2]).toHaveTextContent("Partly correct")
    expect(items[2]).toHaveTextContent("A — insurance, B — weeding")
  })
})

describe("AttemptReview score and evidence", () => {
  const submitted: AttemptState = {
    id: "attempt-2",
    practiceSetId: "set-1",
    mode: "test",
    status: "submitted",
    startedAt: "2026-11-08T10:00:00Z",
    deadlineAt: "2026-11-08T11:00:00Z",
    remainingMs: null,
    submittedAt: "2026-11-08T10:50:00Z",
    submitReason: "learner",
    score: 30,
    maxScore: 40,
    answers: {},
    results: {},
  }

  it("shows an estimated band for a full test", () => {
    render(
      <AttemptReview
        set={{ ...set, kind: "full_test" }}
        attempt={submitted}
        keys={{}}
        explanationLanguage="en"
      />,
    )
    expect(screen.getByText("Estimated band 7")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Estimate based on the commonly published IELTS Academic Reading conversion — not an official score.",
      ),
    ).toBeInTheDocument()
  })

  it("shows the raw score without a band for a practice set", () => {
    render(
      <AttemptReview
        set={set}
        attempt={{ ...submitted, score: 8, maxScore: 13 }}
        keys={{}}
        explanationLanguage="en"
      />,
    )
    expect(screen.getByText("8 / 13")).toBeInTheDocument()
    expect(screen.queryByText(/Estimated band/)).not.toBeInTheDocument()
  })

  it("shows the evidence of an answer in its passage", async () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const twoPassages: PracticeSetDetail = {
      ...set,
      passages: [
        ...set.passages,
        {
          id: "p2",
          position: 2,
          title: "Deep oceans",
          text: "Whales sing at night.",
          keyWords: [],
        },
      ],
      groups: set.groups.map((group) =>
        group.id === "g2" ? { ...group, passageId: "p2" } : group,
      ),
    }
    const user = userEvent.setup()
    render(
      <AttemptReview
        set={twoPassages}
        attempt={{ ...submitted, score: 0, maxScore: 4 }}
        keys={{
          q2: {
            questionId: "q2",
            accepted: ["night"],
            explanation: "They sing at night.",
            explanationVi: null,
            evidence: { start: 7, end: 20 },
            correction: null,
          },
        }}
        explanationLanguage="en"
      />,
    )

    const item = within(
      screen.getByRole("list", { name: "Answers and explanations" }),
    ).getAllByRole("listitem")[1]
    if (!item) throw new Error("Missing answer for question 2")
    await user.click(within(item).getByRole("button", { name: "Show in passage" }))

    expect(screen.getByRole("heading", { name: "Deep oceans" })).toBeInTheDocument()
    expect(screen.getByText("sing at night", { selector: "mark" })).toBeInTheDocument()
    expect(scrollIntoView).toHaveBeenCalled()
  })
})
