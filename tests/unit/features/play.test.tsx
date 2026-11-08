import { act, render, renderHook, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ComboMeter } from "@/features/vocabulary/components/combo-meter"
import { SessionCelebration } from "@/features/vocabulary/components/session-celebration"
import { WeeklyGoal } from "@/features/vocabulary/components/weekly-goal"
import { WordGarden } from "@/features/vocabulary/components/word-garden"
import { useFeedbackSound } from "@/features/vocabulary/hooks/use-feedback-sound"

import { mockMatchMedia } from "../../setup"

describe("ComboMeter", () => {
  it("stays hidden until two correct answers in a row", () => {
    const { rerender } = render(<ComboMeter combo={1} />)
    expect(screen.queryByText(/x\d/)).not.toBeInTheDocument()
    rerender(<ComboMeter combo={3} />)
    expect(screen.getByText("x3")).toBeInTheDocument()
  })
})

describe("useFeedbackSound", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("remembers mute on this device", () => {
    const { result } = renderHook(() => useFeedbackSound())
    expect(result.current.isMuted).toBe(false)
    act(() => result.current.toggleMute())
    expect(result.current.isMuted).toBe(true)
    expect(window.localStorage.getItem("ielts-hub:sound-muted")).toBe("true")

    const { result: again } = renderHook(() => useFeedbackSound())
    expect(again.current.isMuted).toBe(true)
  })

  it("never throws when audio or storage are unavailable", () => {
    vi.stubGlobal("AudioContext", undefined)
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const { result } = renderHook(() => useFeedbackSound())
    expect(() => {
      result.current.playCorrect()
      result.current.playMiss()
      result.current.playCelebrate()
      act(() => result.current.toggleMute())
    }).not.toThrow()
  })
})

describe("WordGarden", () => {
  it("shows each word as a plant that blooms when mastered", () => {
    render(
      <WordGarden
        beds={[
          {
            topic: "environment",
            plants: [
              { wordSlug: "drought", lemma: "drought", stage: "bloom" },
              { wordSlug: "habitat", lemma: "habitat", stage: "seed" },
            ],
          },
        ]}
      />,
    )
    expect(screen.getByRole("list", { name: "Environment" })).toBeInTheDocument()
    expect(screen.getByText("drought: in bloom (mastered)")).toBeInTheDocument()
    expect(screen.getByText("habitat: seed (not introduced yet)")).toBeInTheDocument()
  })

  it("explains an empty garden kindly", () => {
    render(<WordGarden beds={[]} />)
    expect(screen.getByText(/Your garden is waiting/)).toBeInTheDocument()
  })
})

describe("WeeklyGoal", () => {
  it("shows days this week without any reset message", () => {
    render(<WeeklyGoal daysThisWeek={4} goal={5} />)
    expect(screen.getByText("4/5 days this week")).toBeInTheDocument()
  })

  it("celebrates when the goal is reached", () => {
    render(<WeeklyGoal daysThisWeek={5} goal={5} />)
    expect(screen.getByText("Weekly goal reached!")).toBeInTheDocument()
  })
})

describe("SessionCelebration", () => {
  const summary = { reviewed: 8, newWords: 5, againCount: 1, extraDueCount: 0, bestCombo: 4 }

  afterEach(() => {
    mockMatchMedia()
  })

  it("shows confetti and the summary", () => {
    render(<SessionCelebration summary={summary} />)
    expect(screen.getByRole("heading", { name: "All done for today" })).toBeInTheDocument()
    expect(document.querySelector("[data-confetti]")).not.toBeNull()
  })

  it("skips confetti for people who prefer reduced motion", () => {
    mockMatchMedia((query) => query.includes("prefers-reduced-motion"))
    render(<SessionCelebration summary={summary} />)
    expect(document.querySelector("[data-confetti]")).toBeNull()
  })
})
