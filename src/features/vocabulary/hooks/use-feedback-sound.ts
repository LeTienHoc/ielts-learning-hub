"use client"

import { useCallback, useRef, useSyncExternalStore } from "react"

const STORAGE_KEY = "ielts-hub:sound-muted"
const CHANGE_EVENT = "ielts-hub:sound-muted-change"

// Used when storage is blocked (private mode, disabled site data): mute still works this visit.
let mutedInMemory = false

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return mutedInMemory
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

type Tone = { frequency: number; start: number; duration: number }

/**
 * Short feedback tones made in the browser (Web Audio, no files). Sound is on by default with
 * a mute toggle remembered on this device (spec §5.5). Every call is safe when audio or
 * storage is unavailable.
 */
export function useFeedbackSound() {
  const isMuted = useSyncExternalStore(subscribe, readMuted, () => false)
  const context = useRef<AudioContext | null>(null)

  const play = useCallback(
    (tones: Tone[]) => {
      if (isMuted) return
      try {
        const AudioContextClass = window.AudioContext
        if (!AudioContextClass) return
        context.current ??= new AudioContextClass()
        const audio = context.current
        const now = audio.currentTime
        for (const tone of tones) {
          const oscillator = audio.createOscillator()
          const gain = audio.createGain()
          oscillator.type = "sine"
          oscillator.frequency.value = tone.frequency
          gain.gain.setValueAtTime(0.08, now + tone.start)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.start + tone.duration)
          oscillator.connect(gain).connect(audio.destination)
          oscillator.start(now + tone.start)
          oscillator.stop(now + tone.start + tone.duration)
        }
      } catch {
        // Audio is a nice-to-have: a blocked or missing audio device must never break learning.
      }
    },
    [isMuted],
  )

  const toggleMute = useCallback(() => {
    const next = !readMuted()
    mutedInMemory = next
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // Storage blocked: the in-memory value above keeps mute working for this visit.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return {
    isMuted,
    toggleMute,
    playCorrect: () =>
      play([
        { frequency: 660, start: 0, duration: 0.09 },
        { frequency: 880, start: 0.08, duration: 0.12 },
      ]),
    playMiss: () => play([{ frequency: 220, start: 0, duration: 0.16 }]),
    playCelebrate: () =>
      play(
        [523, 659, 784, 1047].map((frequency, index) => ({
          frequency,
          start: index * 0.1,
          duration: 0.18,
        })),
      ),
  }
}
