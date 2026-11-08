// The daily review session as pure data: which game each word gets, and how results move the
// session along. Grading (SRS) happens on the server; this only drives the UI.

export type SessionWord = { id: string; lemma: string; collocations: readonly string[] }

export type SessionStep =
  | { kind: "card"; wordId: string }
  | { kind: "intro-check"; wordId: string }
  | { kind: "match-pairs"; wordIds: string[] }
  | { kind: "save-sentence"; wordId: string }
  | { kind: "perfect-pair"; wordId: string }
  | { kind: "recall"; wordId: string }

export type Grade = "again" | "hard" | "good" | "easy"

export type SessionSummary = {
  reviewed: number
  newWords: number
  againCount: number
  extraDueCount: number
  bestCombo: number
}

export type SessionState = {
  steps: SessionStep[]
  index: number
  combo: number
  bestCombo: number
  reviewed: number
  newWords: number
  againCount: number
  requeued: string[]
  extraDueCount: number
  /** Set once every step is done. */
  summary: SessionSummary | null
}

export type SessionAction =
  { type: "result"; wordId: string; grade: Grade; isNew?: boolean } | { type: "continue" }

const MATCH_BATCH_SIZE = 5

/** The first collocation that contains the word itself, for "Perfect pair". */
export function phraseFor(word: SessionWord): string | undefined {
  const lemma = word.lemma.toLowerCase()
  return word.collocations.find((phrase) => phrase.toLowerCase().includes(lemma))
}

/**
 * Due reviews first, then new words (spec §5.1). Each due word gets exactly one game:
 * index % 3 → Match pairs (batched), Save the sentence, Perfect pair. Games without fair
 * options fall back to recall.
 */
export function buildSessionSteps(input: {
  due: readonly SessionWord[]
  new: readonly SessionWord[]
}): SessionStep[] {
  const total = input.due.length + input.new.length
  const hasDistractors = total >= 3

  const matchIds = input.due.filter((_, index) => index % 3 === 0).map((word) => word.id)
  const matchSteps: SessionStep[] = []
  for (let start = 0; start < matchIds.length; start += MATCH_BATCH_SIZE) {
    const batch = matchIds.slice(start, start + MATCH_BATCH_SIZE)
    const [only] = batch
    matchSteps.push(
      batch.length === 1 && only
        ? { kind: "recall", wordId: only }
        : { kind: "match-pairs", wordIds: batch },
    )
  }

  const gameSteps = input.due.flatMap((word, index): SessionStep[] => {
    if (index % 3 === 1) return [{ kind: "save-sentence", wordId: word.id }]
    if (index % 3 === 2) {
      return [
        hasDistractors && phraseFor(word)
          ? { kind: "perfect-pair", wordId: word.id }
          : { kind: "recall", wordId: word.id },
      ]
    }
    return []
  })

  const newSteps = input.new.flatMap((word): SessionStep[] => [
    { kind: "card", wordId: word.id },
    hasDistractors ? { kind: "intro-check", wordId: word.id } : { kind: "recall", wordId: word.id },
  ])

  return [...matchSteps, ...gameSteps, ...newSteps]
}

function summarise(state: Omit<SessionState, "summary">): SessionSummary | null {
  if (state.index < state.steps.length) return null
  return {
    reviewed: state.reviewed,
    newWords: state.newWords,
    againCount: state.againCount,
    extraDueCount: state.extraDueCount,
    bestCombo: state.bestCombo,
  }
}

export function initialSessionState(steps: SessionStep[], extraDueCount: number): SessionState {
  const base = {
    steps,
    index: 0,
    combo: 0,
    bestCombo: 0,
    reviewed: 0,
    newWords: 0,
    againCount: 0,
    requeued: [],
    extraDueCount,
  }
  return { ...base, summary: summarise(base) }
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  if (action.type === "continue") {
    const next = { ...state, index: Math.min(state.index + 1, state.steps.length) }
    return { ...next, summary: summarise(next) }
  }

  const isMiss = action.grade === "again"
  const combo = isMiss ? 0 : state.combo + 1
  // A forgotten word comes back once, as recall, at the end of the session.
  const requeue = isMiss && !state.requeued.includes(action.wordId)
  const next = {
    ...state,
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
    reviewed: state.reviewed + 1,
    newWords: state.newWords + (action.isNew ? 1 : 0),
    againCount: state.againCount + (isMiss ? 1 : 0),
    requeued: requeue ? [...state.requeued, action.wordId] : state.requeued,
    steps: requeue
      ? [...state.steps, { kind: "recall" as const, wordId: action.wordId }]
      : state.steps,
  }
  return { ...next, summary: summarise(next) }
}
