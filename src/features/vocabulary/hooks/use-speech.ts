"use client"

import { useCallback, useSyncExternalStore } from "react"

const subscribe = () => () => {}
const isSupported = () => typeof window !== "undefined" && Boolean(window.speechSynthesis)

/**
 * Pronunciation with the browser's own voice (Web Speech API), used until a TTS provider is
 * chosen (spec §5.4). Unsupported browsers simply get no Listen button.
 */
export function useSpeech(): { isSupported: boolean; speak: (text: string) => void } {
  const supported = useSyncExternalStore(subscribe, isSupported, () => false)
  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-GB"
    synth.speak(utterance)
  }, [])
  return { isSupported: supported, speak }
}
