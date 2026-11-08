"use client"

import { Volume2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import { useSpeech } from "../hooks/use-speech"

/** Plays the word with the device voice; hidden when the browser cannot speak. */
export function ListenButton({ text }: { text: string }) {
  const { isSupported, speak } = useSpeech()
  if (!isSupported) return null
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={`Listen to “${text}” (device voice)`}
      onClick={() => speak(text)}
    >
      <Volume2 aria-hidden="true" />
      Listen
    </Button>
  )
}
