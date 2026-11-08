"use client"

import { Eraser, Highlighter } from "lucide-react"
import { useRef, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useHighlights, type PassageHighlights } from "../hooks/use-highlights"
import type { PracticePassage } from "../types"
import { clampRange, segmentText, type TextRange, type TextSegment } from "../utils/highlights"
import { rangeFromSelection } from "../utils/selection"
import { KeyWordPopover } from "./key-word-popover"

export type PassageEvidence = { passageId: string; range: TextRange }

type PassagePanelProps = {
  passages: readonly PracticePassage[]
  /** During an attempt: enables highlighting, stored per attempt on this device. */
  attemptId?: string
  language: "en" | "vi"
  /** Review: the answer evidence to mark (its passage is shown). */
  evidence?: PassageEvidence | null
  /** "Add to My words" buttons by word id, rendered by the server page. */
  keyWordActions?: Readonly<Record<string, ReactNode>>
}

/** Paragraphs (split on blank lines) with their start offset in the passage text. */
function paragraphs(text: string): { text: string; start: number }[] {
  const result: { text: string; start: number }[] = []
  for (const match of text.matchAll(/[^\n]+(?:\n(?!\s*\n)[^\n]*)*/g)) {
    const raw = match[0]
    const leading = raw.length - raw.trimStart().length
    const trimmed = raw.trim()
    if (trimmed) result.push({ text: trimmed, start: match.index + leading })
  }
  return result
}

/** Moves passage ranges into a paragraph's own offsets, dropping those outside it. */
function within<T extends TextRange>(ranges: readonly T[], start: number, length: number): T[] {
  return ranges.flatMap((range) => {
    const local = clampRange({ start: range.start - start, end: range.end - start }, length)
    return local ? [{ ...range, ...local }] : []
  })
}

/** Groups consecutive segments of the same key word so each word is one button. */
function runs(segments: TextSegment[]): { keyWordId: string | null; segments: TextSegment[] }[] {
  const result: { keyWordId: string | null; segments: TextSegment[] }[] = []
  for (const segment of segments) {
    const last = result.at(-1)
    if (last && segment.keyWordId !== null && last.keyWordId === segment.keyWordId) {
      last.segments.push(segment)
    } else {
      result.push({ keyWordId: segment.keyWordId, segments: [segment] })
    }
  }
  return result
}

function SegmentText({ segment }: { segment: TextSegment }) {
  if (!segment.isHighlighted && !segment.isEvidence) return segment.text
  return (
    <mark
      className={cn(
        "rounded-sm text-foreground",
        segment.isEvidence ? "bg-success-subtle ring-1 ring-success" : "bg-warning-subtle",
      )}
    >
      {segment.text}
    </mark>
  )
}

const NO_HIGHLIGHTS: PassageHighlights = {}

/**
 * Reading passages: switcher for multi-passage sets, highlighting during an attempt, key words
 * with their meaning, and the evidence of an answer in review.
 */
export function PassagePanel({
  passages,
  attemptId,
  language,
  evidence = null,
  keyWordActions = {},
}: PassagePanelProps) {
  const [selectedId, setSelectedId] = useState(passages[0]?.id ?? "")
  // Showing new evidence opens its passage (adjusting state during render, not in an effect).
  const [shownEvidence, setShownEvidence] = useState(evidence)
  if (evidence !== shownEvidence) {
    setShownEvidence(evidence)
    if (evidence) setSelectedId(evidence.passageId)
  }

  const passage = passages.find((item) => item.id === selectedId) ?? passages[0]
  if (!passage) return null

  return (
    <div className="flex flex-col gap-4">
      {passages.length > 1 && (
        <div role="tablist" aria-label="Passages" className="flex flex-wrap gap-2">
          {passages.map((item) => (
            <Button
              key={item.id}
              role="tab"
              size="sm"
              variant={item.id === passage.id ? "default" : "outline"}
              aria-selected={item.id === passage.id}
              onClick={() => setSelectedId(item.id)}
            >
              Passage {item.position}
            </Button>
          ))}
        </div>
      )}
      {attemptId ? (
        <HighlightablePassage
          key={passage.id}
          passage={passage}
          attemptId={attemptId}
          language={language}
          keyWordActions={keyWordActions}
        />
      ) : (
        <PassageBody
          passage={passage}
          language={language}
          highlights={NO_HIGHLIGHTS}
          evidence={evidence?.passageId === passage.id ? evidence.range : null}
          keyWordActions={keyWordActions}
        />
      )}
    </div>
  )
}

function HighlightablePassage({
  passage,
  attemptId,
  language,
  keyWordActions,
}: {
  passage: PracticePassage
  attemptId: string
  language: "en" | "vi"
  keyWordActions: Readonly<Record<string, ReactNode>>
}) {
  const { highlights, add, clear } = useHighlights(attemptId)
  const bodyRef = useRef<HTMLDivElement>(null)
  const passageHighlights = highlights[passage.id] ?? []

  const highlight = () => {
    const selection = document.getSelection()
    if (!selection || !bodyRef.current) return
    const range = rangeFromSelection(bodyRef.current, selection)
    if (!range) return
    const clamped = clampRange(range, passage.text.length)
    if (clamped) add(passage.id, clamped)
    selection.removeAllRanges()
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          // Keep the text selection: pressing the button must not clear it before the click.
          onMouseDown={(event) => event.preventDefault()}
          onClick={highlight}
        >
          <Highlighter aria-hidden="true" />
          Highlight
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={passageHighlights.length === 0}
          onClick={() => clear(passage.id)}
        >
          <Eraser aria-hidden="true" />
          Clear highlights
        </Button>
      </div>
      <div ref={bodyRef}>
        <PassageBody
          passage={passage}
          language={language}
          highlights={highlights}
          evidence={null}
          keyWordActions={keyWordActions}
        />
      </div>
    </>
  )
}

function PassageBody({
  passage,
  language,
  highlights,
  evidence,
  keyWordActions,
}: {
  passage: PracticePassage
  language: "en" | "vi"
  highlights: PassageHighlights
  evidence: TextRange | null
  keyWordActions: Readonly<Record<string, ReactNode>>
}) {
  // Each key word is marked at its first occurrence in the passage.
  const keyWordRanges = passage.keyWords.flatMap((keyWord) => {
    const start = passage.text.indexOf(keyWord.form)
    return start === -1 ? [] : [{ id: keyWord.wordId, start, end: start + keyWord.form.length }]
  })
  const keyWords = new Map(passage.keyWords.map((keyWord) => [keyWord.wordId, keyWord]))
  const passageHighlights = highlights[passage.id] ?? []

  return (
    <article aria-label="Reading passage" className="flex flex-col gap-4">
      {passage.title && <h2 className="text-h4 text-foreground">{passage.title}</h2>}
      {paragraphs(passage.text).map((paragraph) => {
        const length = paragraph.text.length
        const segments = segmentText(paragraph.text, {
          highlights: within(passageHighlights, paragraph.start, length),
          evidence: evidence ? (within([evidence], paragraph.start, length)[0] ?? null) : null,
          keyWords: within(keyWordRanges, paragraph.start, length),
        })
        return (
          <p
            key={paragraph.start}
            data-offset={paragraph.start}
            className="text-body-lg text-foreground"
          >
            {runs(segments).map((run) => {
              const keyWord = run.keyWordId ? keyWords.get(run.keyWordId) : undefined
              const content = run.segments.map((segment) => (
                <SegmentText key={segment.start} segment={segment} />
              ))
              const first = run.segments[0]?.start ?? 0
              return keyWord ? (
                <KeyWordPopover
                  key={first}
                  keyWord={keyWord}
                  language={language}
                  action={keyWordActions[keyWord.wordId]}
                >
                  {content}
                </KeyWordPopover>
              ) : (
                <span key={first}>{content}</span>
              )
            })}
          </p>
        )
      })}
    </article>
  )
}
