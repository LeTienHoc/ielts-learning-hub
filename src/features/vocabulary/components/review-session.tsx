"use client"

import { useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react"
import { Volume2, VolumeX } from "lucide-react"

import { FocusShell } from "@/components/layout/focus-shell"
import { Mascot, type MascotMood } from "@/components/shared/mascot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { finishReviewSessionAction, reviewWordAction, type ReviewWordInput } from "../actions"
import { useFeedbackSound } from "../hooks/use-feedback-sound"
import { VOCABULARY_HREF } from "../routes"
import type { ReviewCard, ReviewSessionPlan } from "../types"
import { checkCloze, splitCloze, stableShuffle } from "../utils/cloze"
import {
  buildSessionSteps,
  initialSessionState,
  phraseFor,
  sessionReducer,
  type Grade,
  type SessionStep,
} from "../utils/review-session"
import { ComboMeter } from "./combo-meter"
import { ListenButton } from "./listen-button"
import { MatchPairs } from "./match-pairs"
import { SessionCelebration } from "./session-celebration"
import { WordCard } from "./word-card"

type Language = "en" | "vi"
type Exercise = ReviewWordInput["exercise"]

const EXERCISE: Record<Exclude<SessionStep["kind"], "card">, Exercise> = {
  "intro-check": "intro",
  "match-pairs": "match",
  "save-sentence": "cloze",
  "perfect-pair": "collocation",
  recall: "recall",
}

type ReviewSessionProps = { plan: ReviewSessionPlan; language: Language }

// Short, kind lines from the mascot. Never mocking (spec §5.5).
const MOOD_LINES: Record<MascotMood, string> = {
  idle: "Let's grow some words today.",
  happy: "Nice one! Keep it going.",
  thinking: "Oops, so close! It will come back soon.",
  cheering: "You did it!",
}

/**
 * Today's vocabulary session in focus mode: games for due words, then new word cards.
 * Grades go to the server in order per word; the session ends with a calm summary.
 */
export function ReviewSession({ plan, language }: ReviewSessionProps) {
  const words = useMemo(
    () => new Map([...plan.dueWords, ...plan.newWords].map((card) => [card.id, card])),
    [plan],
  )
  const newIds = useMemo(() => new Set(plan.newWords.map((card) => card.id)), [plan])
  const [state, dispatch] = useReducer(sessionReducer, plan, (initial) =>
    initialSessionState(
      buildSessionSteps({ due: initial.dueWords, new: initial.newWords }),
      initial.extraDueCount,
    ),
  )
  const [notice, setNotice] = useState<string | null>(null)
  const [mood, setMood] = useState<MascotMood>("idle")
  const sound = useFeedbackSound()
  const soundRef = useRef(sound)
  useEffect(() => {
    soundRef.current = sound
  })

  // Server grading: one chain per word so expected review counts stay in order.
  const reviewCounts = useRef(
    new Map([...words.values()].map((card) => [card.id, card.reviewCount])),
  )
  const gradedOnce = useRef(new Set<string>())
  const chains = useRef(new Map<string, Promise<void>>())
  const inFlight = useRef(new Set<Promise<void>>())

  const grade = (wordId: string, value: Grade, stepKind: Exclude<SessionStep["kind"], "card">) => {
    const isNew = newIds.has(wordId) && !gradedOnce.current.has(wordId)
    gradedOnce.current.add(wordId)
    dispatch({ type: "result", wordId, grade: value, isNew })
    if (value === "again") {
      setMood("thinking")
      sound.playMiss()
    } else {
      setMood("happy")
      sound.playCorrect()
    }

    const exercise: Exercise = isNew ? "intro" : EXERCISE[stepKind]
    const previous = chains.current.get(wordId) ?? Promise.resolve()
    const next = previous.then(async () => {
      const expected = reviewCounts.current.get(wordId) ?? 0
      const result = await reviewWordAction({
        wordId,
        grade: value,
        exercise,
        expectedReviewCount: expected,
      })
      if (result.ok) {
        reviewCounts.current.set(wordId, expected + 1)
      } else {
        setNotice(
          result.reason === "stale"
            ? "This word was already reviewed in another tab, so this answer was not counted."
            : "One answer could not be saved. Your progress is safe; it will be due again.",
        )
      }
    })
    chains.current.set(wordId, next)
    inFlight.current.add(next)
    void next.finally(() => inFlight.current.delete(next))
  }

  const isDone = state.summary !== null
  useEffect(() => {
    if (!isDone) return
    soundRef.current.playCelebrate()
    // Record the session only after every grade has reached the server.
    void Promise.allSettled([...inFlight.current]).then(() =>
      finishReviewSessionAction(plan.startedAt),
    )
  }, [isDone, plan.startedAt])

  const step = state.steps[state.index]
  const total = state.steps.length

  return (
    <FocusShell
      title="Today's session"
      exitHref={VOCABULARY_HREF}
      status={
        <div className="flex items-center gap-1">
          <ComboMeter combo={state.combo} />
          <Button
            variant="ghost"
            size="icon"
            aria-label={sound.isMuted ? "Turn sound on" : "Turn sound off"}
            onClick={sound.toggleMute}
          >
            {sound.isMuted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
          </Button>
        </div>
      }
      footer={
        <p className="text-body-sm text-muted-foreground" aria-live="polite">
          {isDone ? "Session complete" : `Step ${Math.min(state.index + 1, total)} of ${total}`}
          {notice && <span className="block text-warning-emphasis">{notice}</span>}
        </p>
      }
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        {!isDone && (
          <div className="flex items-center gap-3">
            <Mascot mood={mood} />
            <p className="text-body-sm text-muted-foreground">{MOOD_LINES[mood]}</p>
          </div>
        )}
        {state.summary ? (
          <SessionCelebration summary={state.summary} />
        ) : step ? (
          <StepView
            key={`${state.index}-${step.kind}`}
            step={step}
            words={words}
            language={language}
            onGrade={(wordId, value) =>
              grade(wordId, value, step.kind === "card" ? "recall" : step.kind)
            }
            onContinue={() => dispatch({ type: "continue" })}
          />
        ) : null}
      </div>
    </FocusShell>
  )
}

type StepViewProps = {
  step: SessionStep
  words: ReadonlyMap<string, ReviewCard>
  language: Language
  onGrade: (wordId: string, grade: Grade) => void
  onContinue: () => void
}

function meaningOf(card: ReviewCard, language: Language) {
  return language === "vi" ? card.meaningVi : card.meaningEn
}

/** Other words in this session, in a stable order, for distractor options. */
function others(words: ReadonlyMap<string, ReviewCard>, wordId: string, count: number) {
  return stableShuffle(
    [...words.values()].filter((card) => card.id !== wordId),
    (card) => card.id,
    wordId,
  ).slice(0, count)
}

function StepView({ step, words, language, onGrade, onContinue }: StepViewProps) {
  if (step.kind === "match-pairs") {
    const batch = step.wordIds.flatMap((id) => {
      const card = words.get(id)
      return card ? [{ id, lemma: card.lemma, meaning: meaningOf(card, language) }] : []
    })
    return (
      <section aria-label="Match pairs" className="flex flex-col gap-4">
        <h2 className="text-h4 text-foreground">Match each word with its meaning</h2>
        <MatchPairs
          words={batch}
          onResult={(wordId, isCorrect) => onGrade(wordId, isCorrect ? "good" : "again")}
          onComplete={onContinue}
        />
      </section>
    )
  }

  const card = words.get(step.wordId)
  if (!card) return null

  switch (step.kind) {
    case "card":
      return (
        <section aria-label="New word" className="flex flex-col gap-6">
          <p className="text-label text-primary">New word</p>
          <WordCard word={card} language={language} />
          <Button onClick={onContinue} className="self-start">
            Got it
          </Button>
        </section>
      )
    case "intro-check":
      return (
        <ChoiceGame
          title={`What does “${card.lemma}” mean?`}
          correct={meaningOf(card, language)}
          wrong={others(words, card.id, 2).map((other) => meaningOf(other, language))}
          seed={card.id}
          onAnswer={(isCorrect) => onGrade(card.id, isCorrect ? "good" : "again")}
          onContinue={onContinue}
        />
      )
    case "perfect-pair": {
      const phrase = phraseFor(card) ?? card.lemma
      const blanked = phrase.replace(new RegExp(escapeRegExp(card.lemma), "i"), "_____")
      return (
        <ChoiceGame
          title="Perfect pair: complete the phrase"
          prompt={blanked}
          correct={card.lemma}
          wrong={others(words, card.id, 2).map((other) => other.lemma)}
          seed={card.id}
          onAnswer={(isCorrect) => onGrade(card.id, isCorrect ? "good" : "again")}
          onContinue={onContinue}
          explanation={`“${phrase}” is a natural phrase.`}
        />
      )
    }
    case "save-sentence":
      return <SaveTheSentence card={card} onGrade={onGrade} onContinue={onContinue} />
    case "recall":
      return <Recall card={card} language={language} onGrade={onGrade} onContinue={onContinue} />
  }
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function Feedback({ isCorrect, children }: { isCorrect: boolean; children?: ReactNode }) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-md border p-3 text-body-sm",
        isCorrect
          ? "border-success/30 bg-success-subtle text-success-emphasis"
          : "border-warning/30 bg-warning-subtle text-warning-emphasis",
      )}
    >
      <p className="font-semibold">{isCorrect ? "Nice!" : "Not quite"}</p>
      {children}
    </div>
  )
}

type ChoiceGameProps = {
  title: string
  prompt?: string
  correct: string
  wrong: string[]
  seed: string
  explanation?: string
  onAnswer: (isCorrect: boolean) => void
  onContinue: () => void
}

function ChoiceGame({
  title,
  prompt,
  correct,
  wrong,
  seed,
  explanation,
  onAnswer,
  onContinue,
}: ChoiceGameProps) {
  const [chosen, setChosen] = useState<string | null>(null)
  const options = stableShuffle([correct, ...wrong], (option) => option, seed)
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <h2 className="text-h4 text-foreground">{title}</h2>
      {prompt && (
        <p className="text-h3 text-foreground" lang="en">
          {prompt}
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {options.map((option) => (
          <li key={option}>
            <button
              type="button"
              disabled={chosen !== null}
              onClick={() => {
                setChosen(option)
                onAnswer(option === correct)
              }}
              className={cn(
                "w-full rounded-md border border-border bg-background px-3 py-2.5 text-left text-body text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
                chosen !== null &&
                  option === correct &&
                  "border-success bg-success-subtle text-success-emphasis",
                chosen === option &&
                  option !== correct &&
                  "border-warning bg-warning-subtle text-warning-emphasis",
              )}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
      {chosen !== null && (
        <>
          <Feedback isCorrect={chosen === correct}>
            {chosen !== correct && <p>Answer: {correct}</p>}
            {explanation && <p>{explanation}</p>}
          </Feedback>
          <Button onClick={onContinue} className="self-start">
            Continue
          </Button>
        </>
      )}
    </section>
  )
}

function SaveTheSentence({
  card,
  onGrade,
  onContinue,
}: {
  card: ReviewCard
  onGrade: (wordId: string, grade: Grade) => void
  onContinue: () => void
}) {
  const example = card.examples[0]
  const [value, setValue] = useState("")
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  if (!example) return null
  const [before, after] = splitCloze(example.en, example.cloze)

  return (
    <section aria-label="Save the sentence" className="flex flex-col gap-4">
      <h2 className="text-h4 text-foreground">Save the sentence: type the missing word</h2>
      <p className="text-body-lg text-foreground" lang="en">
        {before}
        <span
          className="mx-1 inline-block min-w-16 border-b-2 border-primary"
          aria-label="missing word"
        />
        {after}
      </p>
      <p className="text-body-sm text-muted-foreground" lang="vi">
        {example.vi}
      </p>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (isCorrect !== null || !value.trim()) return
          const correct = checkCloze(value, example.cloze)
          setIsCorrect(correct)
          onGrade(card.id, correct ? "good" : "again")
        }}
      >
        <Input
          aria-label="Missing word"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={isCorrect !== null}
          autoComplete="off"
          spellCheck={false}
          className="max-w-xs"
        />
        {isCorrect === null && (
          <Button type="submit" disabled={!value.trim()}>
            Check
          </Button>
        )}
      </form>
      {isCorrect !== null && (
        <>
          <Feedback isCorrect={isCorrect}>{!isCorrect && <p>Answer: {example.cloze}</p>}</Feedback>
          <Button onClick={onContinue} className="self-start">
            Continue
          </Button>
        </>
      )}
    </section>
  )
}

const GRADES: { grade: Grade; label: string }[] = [
  { grade: "again", label: "Again" },
  { grade: "hard", label: "Hard" },
  { grade: "good", label: "Good" },
  { grade: "easy", label: "Easy" },
]

function Recall({
  card,
  language,
  onGrade,
  onContinue,
}: {
  card: ReviewCard
  language: Language
  onGrade: (wordId: string, grade: Grade) => void
  onContinue: () => void
}) {
  const [isRevealed, setIsRevealed] = useState(false)
  return (
    <section aria-label="Remember the meaning" className="flex flex-col gap-4">
      <h2 className="text-h4 text-foreground">Do you remember this word?</h2>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-h2 text-foreground" lang="en">
          {card.lemma}
        </p>
        <ListenButton text={card.lemma} />
      </div>
      {card.examples[0] && (
        <p className="text-body text-muted-foreground" lang="en">
          {card.examples[0].en}
        </p>
      )}
      {isRevealed ? (
        <>
          <p className="text-body-lg text-foreground">{meaningOf(card, language)}</p>
          <div
            role="group"
            aria-label="How well did you remember?"
            className="flex flex-wrap gap-2"
          >
            {GRADES.map(({ grade, label }) => (
              <Button
                key={grade}
                variant={grade === "good" ? "default" : "outline"}
                onClick={() => {
                  onGrade(card.id, grade)
                  onContinue()
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <Button onClick={() => setIsRevealed(true)} className="self-start">
          Show meaning
        </Button>
      )}
    </section>
  )
}
