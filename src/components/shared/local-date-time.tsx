"use client"

import { useSyncExternalStore } from "react"

const noSubscription = () => () => {}

type LocalDateTimeProps = { value: string }

/**
 * A date and time in the viewer's own locale and time zone. The server does not know them,
 * so it renders the calendar date (UTC) and the browser replaces it after hydration.
 */
export function LocalDateTime({ value }: LocalDateTimeProps) {
  const text = useSyncExternalStore(
    noSubscription,
    () =>
      new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(value),
      ),
    () => value.slice(0, 10),
  )
  return <time dateTime={value}>{text}</time>
}
