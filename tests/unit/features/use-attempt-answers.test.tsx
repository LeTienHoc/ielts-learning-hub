import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useAttemptAnswers } from "@/features/practice/hooks/use-attempt-answers"
import type { SaveAnswerInput } from "@/features/practice/schemas/practice-schemas"

type SaveResult =
  { ok: true } | { ok: false; reason: "retry" | "expired" | "submitted" | "rejected" }

function setup(saveAnswer: (input: SaveAnswerInput) => Promise<SaveResult>) {
  const onClosed = vi.fn()
  const hook = renderHook(() =>
    useAttemptAnswers({
      attemptId: "attempt-1",
      initialAnswers: { q0: ["A"] },
      saveAnswer,
      onClosed,
    }),
  )
  return { ...hook, onClosed }
}

/** Advances fake timers and lets pending promises settle. */
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

describe("useAttemptAnswers", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts from the saved answers", () => {
    const { result } = setup(vi.fn())
    expect(result.current.answers).toEqual({ q0: ["A"] })
    expect(result.current.status).toBe("idle")
  })

  it("saves a choice right away", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true })
    const { result } = setup(save)

    act(() => result.current.setAnswer("q1", ["B"]))
    expect(result.current.answers.q1).toEqual(["B"])
    await advance(0)

    expect(save).toHaveBeenCalledWith({ attemptId: "attempt-1", questionId: "q1", response: ["B"] })
    expect(result.current.status).toBe("saved")
  })

  it("saves only the latest text after typing pauses", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true })
    const { result } = setup(save)

    act(() => result.current.setAnswer("q2", ["so"], 800))
    await advance(500)
    act(() => result.current.setAnswer("q2", ["solar"], 800))
    await advance(500)
    expect(save).not.toHaveBeenCalled()

    await advance(300)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith({
      attemptId: "attempt-1",
      questionId: "q2",
      response: ["solar"],
    })
  })

  it("keeps an answer that failed to save and retries it", async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, reason: "retry" })
      .mockResolvedValue({ ok: true })
    const { result } = setup(save)

    act(() => result.current.setAnswer("q1", ["C"]))
    await advance(0)
    expect(result.current.status).toBe("retrying")

    await advance(2_000)
    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenLastCalledWith({
      attemptId: "attempt-1",
      questionId: "q1",
      response: ["C"],
    })
    expect(result.current.status).toBe("saved")
  })

  it("treats a thrown save (network error) as temporary", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ ok: true })
    const { result } = setup(save)

    act(() => result.current.setAnswer("q1", ["C"]))
    let outcome: string | undefined
    await act(async () => {
      outcome = await result.current.flush()
    })
    expect(outcome).toBe("pending")
    expect(result.current.status).toBe("retrying")
  })

  it("reports a rejected answer without retrying it", async () => {
    const save = vi.fn().mockResolvedValue({ ok: false, reason: "rejected" })
    const { result } = setup(save)

    act(() => result.current.setAnswer("q1", ["Z"]))
    await advance(10_000)
    expect(save).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe("error")
  })

  it("stops saving once the server closes the attempt", async () => {
    const save = vi.fn().mockResolvedValue({ ok: false, reason: "expired" })
    const { result, onClosed } = setup(save)

    act(() => result.current.setAnswer("q1", ["A"]))
    await advance(0)
    expect(onClosed).toHaveBeenCalledWith("expired")

    act(() => result.current.setAnswer("q2", ["B"]))
    await advance(1_000)
    expect(save).toHaveBeenCalledTimes(1)
    expect(result.current.answers.q2).toBeUndefined()
  })

  it("flush saves debounced answers immediately", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true })
    const { result } = setup(save)

    act(() => result.current.setAnswer("q2", ["solar"], 800))
    let outcome: string | undefined
    await act(async () => {
      outcome = await result.current.flush()
    })
    expect(outcome).toBe("saved")
    expect(save).toHaveBeenCalledTimes(1)
  })
})

describe("useAttemptAnswers offline buffer", () => {
  const KEY = "ielts-hub:pending-answers:attempt-1"
  const mount = (saveAnswer: (input: SaveAnswerInput) => Promise<SaveResult>) =>
    renderHook(() =>
      useAttemptAnswers({
        attemptId: "attempt-1",
        initialAnswers: { q1: ["A"] },
        saveAnswer,
        onClosed: vi.fn(),
        persistKey: KEY,
      }),
    )

  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("keeps an unsaved answer on the device and sends it on the next visit", async () => {
    const offline = mount(vi.fn().mockResolvedValue({ ok: false, reason: "retry" }))
    act(() => offline.result.current.setAnswer("q1", ["B"]))
    await advance(0)
    expect(JSON.parse(window.localStorage.getItem(KEY) ?? "null")).toEqual({ q1: ["B"] })
    offline.unmount()

    const save = vi.fn().mockResolvedValue({ ok: true })
    const online = mount(save)
    await advance(0)

    expect(online.result.current.answers.q1).toEqual(["B"])
    expect(save).toHaveBeenCalledWith({ attemptId: "attempt-1", questionId: "q1", response: ["B"] })
    expect(window.localStorage.getItem(KEY)).toBeNull()
  })

  it("ignores unreadable stored answers", async () => {
    window.localStorage.setItem(KEY, "{not json")
    const save = vi.fn().mockResolvedValue({ ok: true })
    const { result } = mount(save)
    await advance(0)
    expect(result.current.answers).toEqual({ q1: ["A"] })
    expect(save).not.toHaveBeenCalled()
  })

  it("keeps working when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const save = vi.fn().mockResolvedValue({ ok: true })
    const { result } = mount(save)
    act(() => result.current.setAnswer("q2", ["x"]))
    await advance(0)
    expect(save).toHaveBeenCalledWith({ attemptId: "attempt-1", questionId: "q2", response: ["x"] })
  })
})
