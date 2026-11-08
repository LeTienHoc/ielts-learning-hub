"use client"

import type { ReactNode } from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import type { PassageKeyWord } from "../types"

type KeyWordPopoverProps = {
  keyWord: PassageKeyWord
  language: "en" | "vi"
  /** The passage text of the word (may contain highlight marks). */
  children: ReactNode
  /** "Add to My words", rendered by the server page. */
  action?: ReactNode
}

/** A key word in the passage: tap it to see its meaning and add it to My words. */
export function KeyWordPopover({ keyWord, language, children, action }: KeyWordPopoverProps) {
  const meanings =
    language === "vi"
      ? [keyWord.meaningVi, keyWord.meaningEn]
      : [keyWord.meaningEn, keyWord.meaningVi]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="cursor-pointer rounded-sm underline decoration-primary decoration-dotted decoration-2 underline-offset-4 hover:bg-primary-subtle focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="flex w-72 flex-col gap-2">
        <p className="text-label text-foreground">{keyWord.lemma}</p>
        <p className="text-body-sm text-foreground">{meanings[0]}</p>
        <p className="text-body-sm text-muted-foreground">{meanings[1]}</p>
        {action}
      </PopoverContent>
    </Popover>
  )
}
