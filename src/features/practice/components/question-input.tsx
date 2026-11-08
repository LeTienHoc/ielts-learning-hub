"use client"

import { useId, type ReactNode } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AnswerOption, QuestionType } from "@/lib/content/practice-set-schema"

import type { PracticeQuestion } from "../types"
import { isSelfLabelled } from "../utils/answers"

/** Text answers are saved after the learner pauses typing for this long. */
const TEXT_SAVE_DELAY_MS = 800

type QuestionInputProps = {
  question: PracticeQuestion
  groupType: QuestionType
  response: readonly string[]
  onChange: (response: string[], debounceMs?: number) => void
  disabled?: boolean
}

const optionLabel = (option: AnswerOption) =>
  isSelfLabelled(option) ? option.text : `${option.id}  ${option.text}`

/** One IELTS question: prompt plus the input that fits its answer kind. */
export function QuestionInput({
  question,
  groupType,
  response,
  onChange,
  disabled,
}: QuestionInputProps) {
  const promptId = useId()
  const hintId = useId()
  const label = `Question ${question.number}`

  return (
    <div role="group" aria-labelledby={promptId} className="flex flex-col gap-3">
      <p id={promptId} className="text-body text-foreground">
        <span className="mr-2 inline-flex min-w-7 justify-center rounded-md bg-muted px-1.5 text-label">
          {question.number}
          <span className="sr-only">.</span>
        </span>
        {question.prompt}
      </p>

      {question.responseKind === "text" && (
        <div className="flex flex-col gap-1.5">
          <Input
            aria-label={`Answer for question ${question.number}`}
            aria-describedby={question.maxWords ? hintId : undefined}
            value={response[0] ?? ""}
            maxLength={200}
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            className="max-w-sm"
            onChange={(event) => {
              const value = event.target.value
              onChange(value.trim() ? [value] : [], TEXT_SAVE_DELAY_MS)
            }}
          />
          {question.maxWords && (
            <p id={hintId} className="text-caption text-muted-foreground">
              No more than {question.maxWords === 1 ? "one word" : `${question.maxWords} words`}
            </p>
          )}
        </div>
      )}

      {question.responseKind === "single" && groupType.startsWith("matching_") && (
        <Select
          value={response[0] ?? ""}
          onValueChange={(value) => onChange([value])}
          disabled={disabled}
        >
          <SelectTrigger className="w-full max-w-sm" aria-label={`Answer for ${label}`}>
            <SelectValue placeholder="Choose an answer" />
          </SelectTrigger>
          <SelectContent>
            {question.options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {optionLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {question.responseKind === "single" && !groupType.startsWith("matching_") && (
        <RadioGroup
          aria-label={`Answer for ${label}`}
          value={response[0] ?? ""}
          onValueChange={(value) => onChange([value])}
          disabled={disabled}
          className="gap-1"
        >
          {question.options.map((option) => (
            <OptionRow key={option.id} option={option}>
              {(id) => <RadioGroupItem id={id} value={option.id} />}
            </OptionRow>
          ))}
        </RadioGroup>
      )}

      {question.responseKind === "multiple" && (
        <div role="group" aria-label={`Answers for ${label}`} className="flex flex-col gap-1">
          <p className="text-caption text-muted-foreground">
            Choose {question.selectCount} ({response.length} selected)
          </p>
          {question.options.map((option) => {
            const isChecked = response.includes(option.id)
            const isFull = response.length >= (question.selectCount ?? 1)
            return (
              <OptionRow key={option.id} option={option}>
                {(id) => (
                  <Checkbox
                    id={id}
                    checked={isChecked}
                    disabled={disabled || (!isChecked && isFull)}
                    onCheckedChange={(checked) =>
                      onChange(
                        checked === true
                          ? [...response, option.id]
                          : response.filter((value) => value !== option.id),
                      )
                    }
                  />
                )}
              </OptionRow>
            )
          })}
        </div>
      )}
    </div>
  )
}

function OptionRow({
  option,
  children,
}: {
  option: AnswerOption
  children: (id: string) => ReactNode
}) {
  const id = useId()
  return (
    <div className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/60">
      <span className="pt-0.5">{children(id)}</span>
      <Label htmlFor={id} className="text-body font-normal">
        {isSelfLabelled(option) ? (
          option.text
        ) : (
          <>
            <span className="font-semibold">{option.id}</span>
            <span>{option.text}</span>
          </>
        )}
      </Label>
    </div>
  )
}
