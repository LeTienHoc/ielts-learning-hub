import { describe, expect, it } from "vitest"

import { bandEstimate, readingBandFromRaw } from "@/lib/learning/reading-band"

describe("readingBandFromRaw", () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 2],
    [4, 2.5],
    [5, 2.5],
    [6, 3],
    [7, 3],
    [8, 3.5],
    [9, 3.5],
    [10, 4],
    [12, 4],
    [13, 4.5],
    [14, 4.5],
    [15, 5],
    [18, 5],
    [19, 5.5],
    [22, 5.5],
    [23, 6],
    [26, 6],
    [27, 6.5],
    [29, 6.5],
    [30, 7],
    [32, 7],
    [33, 7.5],
    [34, 7.5],
    [35, 8],
    [36, 8],
    [37, 8.5],
    [38, 8.5],
    [39, 9],
    [40, 9],
  ])("raw %i → band %d", (raw, band) => {
    expect(readingBandFromRaw(raw)).toBe(band)
  })

  it("clamps out-of-range scores", () => {
    expect(readingBandFromRaw(-3)).toBe(0)
    expect(readingBandFromRaw(41)).toBe(9)
  })
})

describe("bandEstimate", () => {
  it("is only given for a full 40-mark test", () => {
    expect(bandEstimate("full_test", 30, 40)).toBe(7)
    expect(bandEstimate("practice", 13, 13)).toBeNull()
    expect(bandEstimate("full_test", 10, 13)).toBeNull()
    expect(bandEstimate("full_test", null, null)).toBeNull()
  })
})
