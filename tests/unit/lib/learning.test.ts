import { describe, expect, it } from "vitest"

import { toEngineError } from "@/lib/learning/engine-errors"
import { gardenStage, masteryFromScore } from "@/lib/learning/mastery"

describe("masteryFromScore", () => {
  it("is not started without a submitted attempt", () => {
    expect(masteryFromScore(null, null)).toEqual({ mastery: "not_started", percent: null })
    expect(masteryFromScore(0, 0)).toEqual({ mastery: "not_started", percent: null })
  })

  it("is mastered from 80%", () => {
    expect(masteryFromScore(7, 8)).toEqual({ mastery: "mastered", percent: 88 })
    expect(masteryFromScore(8, 10)).toEqual({ mastery: "mastered", percent: 80 })
  })

  it("is practising below 80%", () => {
    expect(masteryFromScore(6, 8)).toEqual({ mastery: "practising", percent: 75 })
    expect(masteryFromScore(0, 8)).toEqual({ mastery: "practising", percent: 0 })
  })
})

describe("gardenStage", () => {
  it("is a seed before the word is introduced", () => {
    expect(gardenStage("new", 0)).toBe("seed")
  })

  it("grows with the review interval and blooms when mastered", () => {
    expect(gardenStage("learning", 0)).toBe("sprout")
    expect(gardenStage("learning", 6)).toBe("sprout")
    expect(gardenStage("learning", 7)).toBe("plant")
    expect(gardenStage("learning", 20)).toBe("plant")
    expect(gardenStage("learning", 21)).toBe("bloom")
  })
})

describe("toEngineError", () => {
  it("maps known engine errors raised by the database", () => {
    for (const code of [
      "answer_locked",
      "check_unavailable",
      "stale_review",
      "word_not_introduced",
      "word_not_found",
      "attempt_expired",
    ]) {
      expect(toEngineError({ code: "P0001", message: code })).toBe(code)
    }
  })

  it("reports anything else as failed", () => {
    expect(toEngineError({ code: "P0001", message: "something_else" })).toBe("failed")
    expect(toEngineError({ code: "42501", message: "answer_locked" })).toBe("failed")
  })
})
