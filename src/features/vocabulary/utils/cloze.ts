const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase()

/** "Save the sentence": case and extra spaces are ignored, spelling must match. */
export function checkCloze(input: string, expected: string): boolean {
  return normalize(input) !== "" && normalize(input) === normalize(expected)
}

/** Splits a sentence around its single cloze word: [before, after]. */
export function splitCloze(sentence: string, cloze: string): [string, string] {
  const index = sentence.indexOf(cloze)
  if (index === -1) return [sentence, ""]
  return [sentence.slice(0, index), sentence.slice(index + cloze.length)]
}

/** Deterministic, render-safe ordering for game options (no Math.random during render). */
export function stableShuffle<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  seed: string,
): T[] {
  const hash = (text: string) => {
    let value = 2166136261
    for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619)
    return value >>> 0
  }
  return [...items].sort((a, b) => hash(seed + keyOf(a)) - hash(seed + keyOf(b)))
}
