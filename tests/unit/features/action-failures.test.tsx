import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { saveAnswerAction, submitAttemptAction } from "@/features/practice/actions"
import { AttemptRunner } from "@/features/practice/components/attempt-runner"
import type { PracticeSetDetail } from "@/features/practice/types"
import { finishReviewSessionAction, reviewWordAction } from "@/features/vocabulary/actions"
import { ReviewSession } from "@/features/vocabulary/components/review-session"
import type { ReviewCard } from "@/features/vocabulary/types"

vi.mock("@/features/practice/actions", () => ({
  saveAnswerAction: vi.fn(),
  submitAttemptAction: vi.fn(),
}))
vi.mock("@/features/vocabulary/actions", () => ({
  reviewWordAction: vi.fn(),
  finishReviewSessionAction: vi.fn(),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }))

// Regression (final review): a rejected server action froze the grammar Check buttons.
describe("AttemptRunner when an instant check fails", () => {
  const set: PracticeSetDetail = {
    id: "set-1",
    slug: "articles-practice",
    title: "Articles — practice",
    summary: null,
    level: "B1",
    topics: [],
    questionCount: 1,
    testTimeLimitSeconds: null,
    kind: "practice",
    questionTypes: [],
    passageCount: 0,
    passages: [],
    groups: [
      {
        id: "g1",
        type: "multiple_choice",
        instructions: "Choose.",
        sharedOptions: [],
        passageId: null,
        questions: [
          {
            id: "q1",
            number: 1,
            prompt: "Pick one.",
            responseKind: "single",
            options: [
              { id: "A", text: "an" },
              { id: "B", text: "a" },
            ],
            selectCount: null,
            maxWords: null,
          },
        ],
      },
    ],
  }

  beforeEach(() => {
    vi.mocked(saveAnswerAction).mockReset().mockResolvedValue({ ok: true })
    vi.mocked(submitAttemptAction).mockReset().mockResolvedValue({ ok: true })
  })

  it("shows an error and lets the learner try again", async () => {
    const instantCheck = vi.fn().mockRejectedValue(new Error("network"))
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
    await user.click(screen.getByRole("radio", { name: /an/ }))
    await user.click(screen.getByRole("button", { name: "Check answer 1" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not check")
    expect(screen.getByRole("button", { name: "Check answer 1" })).toBeEnabled()
  })
})

// Regression (final review): a rejected grade broke the word's chain and later grades were lost.
describe("ReviewSession when grading fails", () => {
  const card: ReviewCard = {
    id: "w1",
    slug: "drought",
    lemma: "drought",
    partOfSpeech: "noun",
    ipa: null,
    meaningEn: "a long period without rain",
    meaningVi: "hạn hán",
    examples: [{ en: "The drought lasted months.", vi: "Hạn hán kéo dài.", cloze: "drought" }],
    collocations: [],
    commonMistakes: [],
    reviewCount: 2,
    intervalDays: 3,
  }

  beforeEach(() => {
    vi.mocked(finishReviewSessionAction).mockReset().mockResolvedValue({ ok: true })
    vi.mocked(reviewWordAction)
      .mockReset()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue({ ok: true })
  })

  it("keeps grading later answers and tells the learner", async () => {
    const user = userEvent.setup()
    render(
      <ReviewSession
        plan={{
          startedAt: "2026-11-09T00:00:00.000Z",
          newWords: [],
          dueWords: [card],
          extraDueCount: 0,
        }}
        language="en"
      />,
    )
    // One due word alone → recall; "Again" re-queues it once as recall.
    await user.click(screen.getByRole("button", { name: "Show meaning" }))
    await user.click(screen.getByRole("button", { name: "Again" }))
    await user.click(await screen.findByRole("button", { name: "Show meaning" }))
    await user.click(screen.getByRole("button", { name: "Good" }))

    await vi.waitFor(() => expect(reviewWordAction).toHaveBeenCalledTimes(2))
    expect(await screen.findByText(/could not be saved/)).toBeInTheDocument()
  })
})
