/** A [start, end) range of JavaScript string offsets in a passage. */
export type TextRange = { start: number; end: number }

/** Sorted, non-empty ranges with overlapping or touching ones merged. */
export function mergeRanges(ranges: readonly TextRange[]): TextRange[] {
  const sorted = ranges
    .filter((range) => range.end > range.start)
    .map((range) => ({ ...range }))
    .sort((a, b) => a.start - b.start)
  const merged: TextRange[] = []
  for (const range of sorted) {
    const last = merged.at(-1)
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end)
    else merged.push(range)
  }
  return merged
}

/** The part of a range inside a text of `length` characters, or null if none. */
export function clampRange(range: TextRange, length: number): TextRange | null {
  const start = Math.max(0, range.start)
  const end = Math.min(length, range.end)
  return end > start ? { start, end } : null
}

export type TextSegment = {
  text: string
  start: number
  isHighlighted: boolean
  isEvidence: boolean
  keyWordId: string | null
}

const inside = (offset: number, range: TextRange) => offset >= range.start && offset < range.end

/**
 * Splits a passage at every highlight, evidence and key word boundary, so each piece can be
 * rendered with flat (never nested) marks. The segments cover the text exactly once.
 */
export function segmentText(
  text: string,
  layers: {
    highlights?: readonly TextRange[]
    evidence?: TextRange | null
    keyWords?: readonly { id: string; start: number; end: number }[]
  },
): TextSegment[] {
  const highlights = mergeRanges(layers.highlights ?? [])
  const keyWords = layers.keyWords ?? []
  const evidence = layers.evidence ?? null
  const cuts = new Set([0, text.length])
  for (const range of [...highlights, ...keyWords, ...(evidence ? [evidence] : [])]) {
    cuts.add(Math.max(0, Math.min(text.length, range.start)))
    cuts.add(Math.max(0, Math.min(text.length, range.end)))
  }
  const points = [...cuts].sort((a, b) => a - b)

  return points.slice(0, -1).flatMap((start, index) => {
    const end = points[index + 1] ?? text.length
    if (end <= start) return []
    return [
      {
        text: text.slice(start, end),
        start,
        isHighlighted: highlights.some((range) => inside(start, range)),
        isEvidence: evidence !== null && inside(start, evidence),
        keyWordId: keyWords.find((range) => inside(start, range))?.id ?? null,
      },
    ]
  })
}
