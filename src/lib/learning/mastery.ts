/** Grammar topic mastery from the latest submitted practice score (spec §5.3). */
export type Mastery = "not_started" | "practising" | "mastered"

/** Score needed for "Mastered", as a percentage of the maximum. */
export const MASTERY_THRESHOLD_PERCENT = 80

export function masteryFromScore(
  score: number | null,
  maxScore: number | null,
): { mastery: Mastery; percent: number | null } {
  if (score === null || !maxScore) return { mastery: "not_started", percent: null }
  const exact = (score / maxScore) * 100
  return {
    mastery: exact >= MASTERY_THRESHOLD_PERCENT ? "mastered" : "practising",
    percent: Math.round(exact),
  }
}

/** Word garden: a plant grows with its SRS interval and blooms when mastered (spec §5.5). */
export type GardenStage = "seed" | "sprout" | "plant" | "bloom"

/** A word is mastered once its review interval reaches this many days. */
export const MASTERED_INTERVAL_DAYS = 21

export function gardenStage(status: "new" | "learning", intervalDays: number): GardenStage {
  if (status === "new") return "seed"
  if (intervalDays >= MASTERED_INTERVAL_DAYS) return "bloom"
  return intervalDays >= 7 ? "plant" : "sprout"
}
