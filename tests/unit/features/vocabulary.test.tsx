import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { updateProfileAction } from "@/features/settings/actions"
import { ProfileForm } from "@/features/settings/components/profile-form"
import { ListenButton } from "@/features/vocabulary/components/listen-button"
import { MatchPairs } from "@/features/vocabulary/components/match-pairs"
import { SessionDone } from "@/features/vocabulary/components/session-done"
import { VocabularyHomeView } from "@/features/vocabulary/components/vocabulary-home-view"

vi.mock("@/features/settings/actions", () => ({ updateProfileAction: vi.fn() }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const overview = {
  dueCount: 3,
  newWaitingCount: 10,
  newAllowanceToday: 5,
  myWordsCount: 13,
  masteredCount: 0,
}

describe("ListenButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("is not shown when the browser cannot speak", () => {
    vi.stubGlobal("speechSynthesis", undefined)
    render(<ListenButton text="sustainable" />)
    expect(screen.queryByRole("button", { name: /Listen/ })).not.toBeInTheDocument()
  })

  it("reads the word aloud with the device voice", async () => {
    const speak = vi.fn()
    vi.stubGlobal("speechSynthesis", { speak, cancel: vi.fn() })
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        lang = ""
        constructor(public text: string) {}
      },
    )
    const user = userEvent.setup()
    render(<ListenButton text="sustainable" />)
    await user.click(
      await screen.findByRole("button", { name: "Listen to “sustainable” (device voice)" }),
    )
    expect(speak).toHaveBeenCalledWith(
      expect.objectContaining({ text: "sustainable", lang: "en-GB" }),
    )
  })
})

describe("VocabularyHomeView", () => {
  it("invites learners with no words to add a set", () => {
    render(
      <VocabularyHomeView
        overview={{ ...overview, myWordsCount: 0, newWaitingCount: 0, dueCount: 0 }}
      />,
    )
    expect(screen.getByText("Add a set to start learning")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Browse vocabulary sets" })).toHaveAttribute(
      "href",
      "/vocabulary/sets",
    )
  })

  it("shows today's session from real counts", () => {
    render(<VocabularyHomeView overview={overview} />)
    expect(screen.getByText("3 reviews due · 5 new words today")).toBeInTheDocument()
    expect(screen.getByText("10 new words waiting")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Start today's session" })).toHaveAttribute(
      "href",
      "/vocabulary/review",
    )
  })
})

describe("SessionDone", () => {
  const summary = { reviewed: 8, newWords: 5, againCount: 1, extraDueCount: 0, bestCombo: 4 }

  it("ends the day calmly", () => {
    render(<SessionDone summary={summary} />)
    expect(screen.getByRole("heading", { name: "All done for today" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Review \d+ more/ })).not.toBeInTheDocument()
  })

  it("offers extra reviews only when some are left", () => {
    render(<SessionDone summary={{ ...summary, extraDueCount: 12 }} />)
    expect(screen.getByRole("link", { name: "Review 12 more" })).toHaveAttribute(
      "href",
      "/vocabulary/review",
    )
  })
})

describe("MatchPairs", () => {
  const words = [
    { id: "w1", lemma: "drought", meaning: "hạn hán" },
    { id: "w2", lemma: "habitat", meaning: "môi trường sống" },
  ]

  it("removes a correct pair and reports it", async () => {
    const onResult = vi.fn()
    const user = userEvent.setup()
    render(<MatchPairs words={words} onResult={onResult} onComplete={vi.fn()} />)
    await user.click(screen.getByRole("button", { name: "drought" }))
    await user.click(screen.getByRole("button", { name: "hạn hán" }))
    expect(onResult).toHaveBeenCalledWith("w1", true)
    expect(screen.queryByRole("button", { name: "drought" })).not.toBeInTheDocument()
  })

  it("reports a wrong first try once, even after a later correct match", async () => {
    const onResult = vi.fn()
    const onComplete = vi.fn()
    const user = userEvent.setup()
    render(<MatchPairs words={words} onResult={onResult} onComplete={onComplete} />)
    await user.click(screen.getByRole("button", { name: "drought" }))
    await user.click(screen.getByRole("button", { name: "môi trường sống" }))
    expect(onResult).toHaveBeenCalledWith("w1", false)
    expect(screen.getByRole("button", { name: "drought" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "drought" }))
    await user.click(screen.getByRole("button", { name: "hạn hán" }))
    await user.click(screen.getByRole("button", { name: "habitat" }))
    await user.click(screen.getByRole("button", { name: "môi trường sống" }))
    expect(onResult.mock.calls).toEqual([
      ["w1", false],
      ["w2", true],
    ])
    expect(onComplete).toHaveBeenCalledOnce()
  })
})

describe("ProfileForm daily new words", () => {
  it("saves the learner's daily limit", async () => {
    vi.mocked(updateProfileAction).mockResolvedValue({ ok: true })
    const user = userEvent.setup()
    render(
      <ProfileForm
        email="linh@example.com"
        defaultValues={{ displayName: "Linh", explanationLanguage: "vi", dailyNewWords: 10 }}
      />,
    )
    await user.click(screen.getByRole("radio", { name: "5 words" }))
    await user.click(screen.getByRole("button", { name: "Save changes" }))
    expect(updateProfileAction).toHaveBeenCalledWith({
      displayName: "Linh",
      explanationLanguage: "vi",
      dailyNewWords: 5,
    })
  })
})
