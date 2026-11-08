/**
 * Splits today's learning words into new ones (introduced but never reviewed, including words
 * from an abandoned session) and due reviews, oldest due first, capped for one session.
 * New words always get their card and intro check (spec §5.1).
 */
export function splitSessionRows<T extends { review_count: number; due_at: string | null }>(
  rows: readonly T[],
  reviewCap: number,
): { fresh: T[]; due: T[]; extraDueCount: number } {
  const fresh = rows.filter((row) => row.review_count === 0)
  const due = rows
    .filter((row) => row.review_count > 0)
    .sort((a, b) => (a.due_at ?? "").localeCompare(b.due_at ?? ""))
  return {
    fresh,
    due: due.slice(0, reviewCap),
    extraDueCount: Math.max(0, due.length - reviewCap),
  }
}
