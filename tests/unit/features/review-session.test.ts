import { describe, expect, it } from "vitest"

import { checkCloze } from "@/features/vocabulary/utils/cloze"
import {
  buildSessionSteps,
  initialSessionState,
  sessionReducer,
  type SessionWord,
} from "@/features/vocabulary/utils/review-session"

const word = (id: string, lemma: string, collocations: string[] = []): SessionWord => ({
  id,
  lemma,
  collocations,
})

describe("checkCloze", () => {
  it("ignores case and extra spaces", () => {
    expect(checkCloze("  Sustainable ", "sustainable")).toBe(true)
    expect(checkCloze("life   expectancy", "Life expectancy")).toBe(true)
  })

  it("requires the exact spelling", () => {
    expect(checkCloze("sustainble", "sustainable")).toBe(false)
    expect(checkCloze("", "sustainable")).toBe(false)
  })
})

describe("buildSessionSteps", () => {
  it("puts due reviews first, one game per word, then new words", () => {
    const steps = buildSessionSteps({
      due: [
        word("d1", "habitat"),
        word("d2", "drought"),
        word("d3", "sustainable", ["sustainable development"]),
        word("d4", "emission"),
      ],
      new: [word("n1", "obsolete"), word("n2", "gadget")],
    })
    expect(steps.map((step) => step.kind)).toEqual([
      "match-pairs",
      "save-sentence",
      "perfect-pair",
      "card",
      "intro-check",
      "card",
      "intro-check",
    ])
    expect(steps[0]).toEqual({ kind: "match-pairs", wordIds: ["d1", "d4"] })
  })

  it("falls back to recall when a game has no fair options", () => {
    const steps = buildSessionSteps({
      due: [word("d1", "habitat"), word("d2", "drought"), word("d3", "rely", ["depend on"])],
      new: [],
    })
    // d1 alone in a match batch, d3's collocation does not contain "rely".
    expect(steps.map((step) => step.kind)).toEqual(["recall", "save-sentence", "recall"])
  })

  it("uses recall for a new word when there are too few other words for options", () => {
    const steps = buildSessionSteps({ due: [], new: [word("n1", "obsolete")] })
    expect(steps.map((step) => step.kind)).toEqual(["card", "recall"])
  })
})

describe("sessionReducer", () => {
  const steps = buildSessionSteps({
    due: [word("d1", "habitat"), word("d2", "drought")],
    new: [],
  })

  it("counts results and keeps a combo of correct answers", () => {
    let state = initialSessionState(steps, 4)
    state = sessionReducer(state, { type: "result", wordId: "d1", grade: "good" })
    state = sessionReducer(state, { type: "continue" })
    state = sessionReducer(state, { type: "result", wordId: "d2", grade: "easy" })
    state = sessionReducer(state, { type: "continue" })
    expect(state.combo).toBe(2)
    expect(state.bestCombo).toBe(2)
    expect(state.reviewed).toBe(2)
  })

  it("re-queues a forgotten word once as recall and resets the combo", () => {
    let state = initialSessionState(steps, 0)
    state = sessionReducer(state, { type: "result", wordId: "d1", grade: "good" })
    state = sessionReducer(state, { type: "result", wordId: "d2", grade: "again" })
    expect(state.combo).toBe(0)
    expect(state.bestCombo).toBe(1)
    expect(state.steps.at(-1)).toEqual({ kind: "recall", wordId: "d2" })

    state = sessionReducer(state, { type: "result", wordId: "d2", grade: "again" })
    expect(
      state.steps.filter((step) => step.kind === "recall" && step.wordId === "d2"),
    ).toHaveLength(1)
    expect(state.againCount).toBe(2)
  })

  it("finishes after the last step with a summary", () => {
    let state = initialSessionState(steps, 12)
    state = sessionReducer(state, { type: "result", wordId: "d1", grade: "good" })
    state = sessionReducer(state, { type: "continue" })
    expect(state.summary).toBeNull()
    state = sessionReducer(state, { type: "result", wordId: "d2", grade: "good" })
    state = sessionReducer(state, { type: "continue" })
    expect(state.index).toBe(state.steps.length)
    expect(state.summary).toEqual({
      reviewed: 2,
      newWords: 0,
      againCount: 0,
      extraDueCount: 12,
      bestCombo: 2,
    })
  })

  it("is done immediately for an empty plan", () => {
    const state = initialSessionState([], 0)
    expect(state.summary).toEqual({
      reviewed: 0,
      newWords: 0,
      againCount: 0,
      extraDueCount: 0,
      bestCombo: 0,
    })
  })

  it("counts intro checks as new words", () => {
    const introSteps = buildSessionSteps({
      due: [word("d1", "a1"), word("d2", "a2")],
      new: [word("n1", "b1")],
    })
    let state = initialSessionState(introSteps, 0)
    state = sessionReducer(state, { type: "result", wordId: "n1", grade: "good", isNew: true })
    expect(state.newWords).toBe(1)
  })
})
