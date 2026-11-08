/** Marks in a full IELTS Academic Reading test. */
export const READING_FULL_TEST_MARKS = 40

// Commonly published IELTS Academic Reading raw-score conversion: [lowest raw score, band].
const CONVERSION: readonly (readonly [number, number])[] = [
  [39, 9],
  [37, 8.5],
  [35, 8],
  [33, 7.5],
  [30, 7],
  [27, 6.5],
  [23, 6],
  [19, 5.5],
  [15, 5],
  [13, 4.5],
  [10, 4],
  [8, 3.5],
  [6, 3],
  [4, 2.5],
  [2, 2],
  [1, 1],
  [0, 0],
]

/** Estimated band for a raw score out of 40 (clamped to 0..40). */
export function readingBandFromRaw(raw: number): number {
  const score = Math.min(READING_FULL_TEST_MARKS, Math.max(0, Math.floor(raw)))
  return CONVERSION.find(([minimum]) => score >= minimum)?.[1] ?? 0
}

/** A band estimate only for a full 40-mark test (READ-05); otherwise null. */
export function bandEstimate(
  kind: "practice" | "full_test",
  score: number | null,
  maxScore: number | null,
): number | null {
  if (kind !== "full_test" || score === null || maxScore !== READING_FULL_TEST_MARKS) return null
  return readingBandFromRaw(score)
}
