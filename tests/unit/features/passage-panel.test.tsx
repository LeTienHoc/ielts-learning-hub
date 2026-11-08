import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { saveAnswerAction, submitAttemptAction } from "@/features/practice/actions"
import { AttemptRunner } from "@/features/practice/components/attempt-runner"
import { PassagePanel } from "@/features/practice/components/passage-panel"
import type { PracticePassage, PracticeSetDetail } from "@/features/practice/types"
import { rangeFromSelection } from "@/features/practice/utils/selection"

vi.mock("@/features/practice/actions", () => ({
  saveAnswerAction: vi.fn(),
  submitAttemptAction: vi.fn(),
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}))

const passage: PracticePassage = {
  id: "p1",
  position: 1,
  title: "Green cities",
  text: "Cities want sustainable growth.\n\nRoof gardens cool buildings.",
  keyWords: [
    {
      wordId: "w1",
      slug: "sustainable",
      lemma: "sustainable",
      form: "sustainable",
      meaningEn: "able to continue without harming the environment",
      meaningVi: "bền vững",
      inMyWords: false,
    },
  ],
}

/** Selects text from (node, offset) to (node, offset) in the document. */
function select(start: Node, startOffset: number, end: Node, endOffset: number) {
  const range = document.createRange()
  range.setStart(start, startOffset)
  range.setEnd(end, endOffset)
  const selection = document.getSelection()
  if (!selection) throw new Error("No selection support")
  selection.removeAllRanges()
  selection.addRange(range)
  return selection
}

const firstText = (element: Element) => {
  const node = element.firstChild
  if (!node) throw new Error("Element has no text")
  return node
}

beforeEach(() => {
  window.localStorage.clear()
})
afterEach(() => {
  vi.restoreAllMocks()
  document.getSelection()?.removeAllRanges()
})

describe("rangeFromSelection", () => {
  function passageDom() {
    const container = document.createElement("div")
    container.innerHTML =
      '<h2>Title</h2><p data-offset="0">Hello world.</p><p data-offset="14">Second para.</p>'
    document.body.append(container)
    const [first, second] = container.querySelectorAll("p")
    if (!first || !second) throw new Error("Missing paragraphs")
    return { container, first, second }
  }

  it("maps a selection across two paragraphs to one passage range", () => {
    const { container, first, second } = passageDom()
    const selection = select(firstText(first), 6, firstText(second), 6)
    expect(rangeFromSelection(container, selection)).toEqual({ start: 6, end: 20 })
    container.remove()
  })

  it("ignores a selection outside the passage", () => {
    const { container } = passageDom()
    const outside = document.createElement("p")
    outside.textContent = "Elsewhere on the page"
    document.body.append(outside)
    const selection = select(firstText(outside), 0, firstText(outside), 9)
    expect(rangeFromSelection(container, selection)).toBeNull()
    container.remove()
    outside.remove()
  })

  it("ignores a collapsed selection", () => {
    const { container, first } = passageDom()
    const selection = select(firstText(first), 3, firstText(first), 3)
    expect(rangeFromSelection(container, selection)).toBeNull()
    container.remove()
  })
})

describe("PassagePanel highlights", () => {
  async function highlightRoofGardens(attemptId: string) {
    const user = userEvent.setup()
    render(<PassagePanel passages={[passage]} attemptId={attemptId} language="en" />)
    const paragraph = screen.getByText("Roof gardens cool buildings.")
    select(firstText(paragraph), 0, firstText(paragraph), 12)
    await user.click(screen.getByRole("button", { name: "Highlight" }))
  }

  it("highlights the selection and keeps it on this device", async () => {
    await highlightRoofGardens("attempt-h1")

    expect(screen.getByText("Roof gardens", { selector: "mark" })).toBeInTheDocument()
    const stored = window.localStorage.getItem("ielts-hub:highlights:attempt-h1")
    expect(JSON.parse(stored ?? "null")).toEqual({ p1: [{ start: 33, end: 45 }] })
  })

  it("restores saved highlights when the page is opened again", () => {
    window.localStorage.setItem(
      "ielts-hub:highlights:attempt-h2",
      JSON.stringify({ p1: [{ start: 0, end: 6 }] }),
    )
    render(<PassagePanel passages={[passage]} attemptId="attempt-h2" language="en" />)
    expect(screen.getByText("Cities", { selector: "mark" })).toBeInTheDocument()
  })

  it("still shows the highlight when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })
    await highlightRoofGardens("attempt-h3")
    expect(screen.getByText("Roof gardens", { selector: "mark" })).toBeInTheDocument()
  })

  it("clears the highlights of the passage", async () => {
    await highlightRoofGardens("attempt-h4")
    await userEvent.setup().click(screen.getByRole("button", { name: "Clear highlights" }))
    expect(screen.queryByText("Roof gardens", { selector: "mark" })).not.toBeInTheDocument()
  })
})

describe("PassagePanel key words and passages", () => {
  it("opens a key word with the learner's language first and an add button", async () => {
    const user = userEvent.setup()
    render(
      <PassagePanel
        passages={[passage]}
        language="vi"
        keyWordActions={{ w1: <button type="button">Add to My words</button> }}
      />,
    )

    await user.click(screen.getByRole("button", { name: "sustainable" }))
    const vi_ = await screen.findByText("bền vững")
    const en = screen.getByText("able to continue without harming the environment")
    expect(vi_.compareDocumentPosition(en) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole("button", { name: "Add to My words" })).toBeInTheDocument()
  })

  it("switches between the passages of a full test", async () => {
    const user = userEvent.setup()
    const second = { ...passage, id: "p2", position: 2, title: "Deep oceans", keyWords: [] }
    render(<PassagePanel passages={[passage, second]} language="en" />)

    expect(screen.getByRole("heading", { name: "Green cities" })).toBeInTheDocument()
    await user.click(screen.getByRole("tab", { name: "Passage 2" }))
    expect(screen.getByRole("heading", { name: "Deep oceans" })).toBeInTheDocument()
  })
})

describe("AttemptRunner on small screens", () => {
  const set: PracticeSetDetail = {
    id: "set-1",
    slug: "reading-sample",
    title: "Green cities",
    summary: null,
    level: "B1",
    topics: [],
    questionCount: 1,
    testTimeLimitSeconds: 1200,
    kind: "practice",
    questionTypes: ["short_answer"],
    passageCount: 1,
    passages: [passage],
    groups: [
      {
        id: "g1",
        type: "short_answer",
        instructions: "Write ONE WORD.",
        sharedOptions: [],
        passageId: "p1",
        questions: [
          {
            id: "q1",
            number: 1,
            prompt: "What do cities want?",
            responseKind: "text",
            options: [],
            selectCount: null,
            maxWords: 1,
          },
        ],
      },
    ],
  }

  it("switches between Passage and Questions without losing typed answers", async () => {
    vi.mocked(saveAnswerAction).mockResolvedValue({ ok: true })
    vi.mocked(submitAttemptAction).mockResolvedValue({ ok: true })
    const user = userEvent.setup()
    render(
      <AttemptRunner
        set={set}
        attempt={{ id: "attempt-m1", mode: "learn", answers: {} }}
        initialRemainingMs={null}
        exitHref="/reading"
        reviewHref="/review"
        language="en"
      />,
    )

    const input = screen.getByRole("textbox", { name: "Answer for question 1" })
    await user.type(input, "growth")
    await user.click(screen.getByRole("tab", { name: "Passage" }))
    expect(screen.getByRole("tab", { name: "Passage" })).toHaveAttribute("aria-selected", "true")
    await user.click(screen.getByRole("tab", { name: "Questions" }))
    expect(screen.getByRole("textbox", { name: "Answer for question 1" })).toHaveValue("growth")
    await act(() => Promise.resolve())
  })

  it("returns to where the learner was in each panel", async () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    const scrollY = (value: number) =>
      Object.defineProperty(window, "scrollY", { value, configurable: true })
    const user = userEvent.setup()
    render(
      <AttemptRunner
        set={set}
        attempt={{ id: "attempt-m2", mode: "learn", answers: {} }}
        initialRemainingMs={null}
        exitHref="/reading"
        reviewHref="/review"
      />,
    )

    scrollY(120)
    await user.click(screen.getByRole("tab", { name: "Questions" }))
    scrollY(900)
    await user.click(screen.getByRole("tab", { name: "Passage" }))
    expect(scrollTo).toHaveBeenLastCalledWith(0, 120)
    scrollY(0)
    await user.click(screen.getByRole("tab", { name: "Questions" }))
    expect(scrollTo).toHaveBeenLastCalledWith(0, 900)
    scrollY(0)
  })

  it("forgets the device copies of an attempt once it is submitted", async () => {
    vi.mocked(saveAnswerAction).mockResolvedValue({ ok: true })
    vi.mocked(submitAttemptAction).mockResolvedValue({ ok: true })
    window.localStorage.setItem(
      "ielts-hub:highlights:attempt-m3",
      JSON.stringify({ p1: [{ start: 0, end: 6 }] }),
    )
    const user = userEvent.setup()
    render(
      <AttemptRunner
        set={set}
        attempt={{ id: "attempt-m3", mode: "learn", answers: {} }}
        initialRemainingMs={null}
        exitHref="/reading"
        reviewHref="/review"
      />,
    )

    await user.click(screen.getByRole("button", { name: "Submit" }))
    await user.click(screen.getByRole("button", { name: "Submit answers" }))
    await vi.waitFor(() =>
      expect(window.localStorage.getItem("ielts-hub:highlights:attempt-m3")).toBeNull(),
    )
  })
})
