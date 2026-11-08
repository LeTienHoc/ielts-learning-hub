import { CircleCheck, CircleMinus } from "lucide-react"

import { Mascot } from "@/components/shared/mascot"
import { cn } from "@/lib/utils"

import type { PracticeQuestion } from "../types"
import { describeResponse } from "../utils/answers"

/** What a learn-mode check reveals for one question. */
export type CheckedView = {
  isCorrect: boolean
  /** Shown right after checking; absent when resuming a checked question. */
  explanation?: string
  correction?: string | null
  accepted?: string[]
}

type InstantFeedbackProps = {
  question: PracticeQuestion
  isSpotTheMistake: boolean
  result: CheckedView
}

/** Result of an instant check: verdict, the right answer when wrong, and the explanation. */
export function InstantFeedback({ question, isSpotTheMistake, result }: InstantFeedbackProps) {
  const Icon = result.isCorrect ? CircleCheck : CircleMinus
  const rightAnswer =
    !result.isCorrect && !isSpotTheMistake && result.accepted
      ? question.responseKind === "text"
        ? result.accepted.join(" / ")
        : describeResponse(result.accepted, question.options)
      : null

  return (
    <div
      role="status"
      aria-label={`Feedback for question ${question.number}`}
      className={cn(
        "flex flex-col gap-2 rounded-md border p-3 text-body-sm",
        result.isCorrect
          ? "border-success/30 bg-success-subtle text-success-emphasis"
          : "border-warning/30 bg-warning-subtle text-warning-emphasis",
      )}
    >
      <div className="flex items-center gap-2">
        <Mascot mood={result.isCorrect ? "happy" : "thinking"} className="size-9" />
        <p className="flex items-center gap-1.5 font-semibold">
          <Icon aria-hidden="true" className="size-4" />
          {result.isCorrect ? "Correct!" : "Not quite"}
        </p>
      </div>
      {rightAnswer && (
        <p>
          Answer: <span className="font-semibold">{rightAnswer}</span>
        </p>
      )}
      {result.correction && (
        <p>
          Correct version: <span className="font-semibold">{result.correction}</span>
        </p>
      )}
      {result.explanation && <p className="text-foreground">{result.explanation}</p>}
    </div>
  )
}
