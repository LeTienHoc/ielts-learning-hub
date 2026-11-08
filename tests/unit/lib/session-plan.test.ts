import { describe, expect, it } from "vitest"

import { splitSessionRows } from "@/lib/learning/session-plan"

const row = (id: string, reviewCount: number, dueAt: string) => ({
  word_id: id,
  review_count: reviewCount,
  due_at: dueAt,
})

describe("splitSessionRows", () => {
  it("treats introduced but never-reviewed words as new, even from an abandoned session", () => {
    const plan = splitSessionRows(
      [
        row("abandoned", 0, "2026-11-08T10:00:00Z"),
        row("due", 3, "2026-11-08T09:00:00Z"),
        row("just-introduced", 0, "2026-11-09T10:00:00Z"),
      ],
      30,
    )
    expect(plan.fresh.map((r) => r.word_id)).toEqual(["abandoned", "just-introduced"])
    expect(plan.due.map((r) => r.word_id)).toEqual(["due"])
  })

  it("caps due reviews and counts the rest as extra", () => {
    const rows = Array.from({ length: 5 }, (_, index) =>
      row(`w${index}`, 1, "2026-11-08T09:00:00Z"),
    )
    const plan = splitSessionRows(rows, 3)
    expect(plan.due).toHaveLength(3)
    expect(plan.extraDueCount).toBe(2)
  })
})
