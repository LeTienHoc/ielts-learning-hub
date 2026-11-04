"use client"

import { Bell, Inbox } from "lucide-react"

import { IconButton } from "@/components/ui/icon-button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/** Notification centre. Placeholder until notifications are implemented. */
export function NotificationsMenu() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton icon={Bell} label="Notifications" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <p className="text-label text-foreground">Notifications</p>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Inbox aria-hidden="true" className="size-6 text-muted-foreground" />
          <p className="text-body-sm text-muted-foreground">You have no notifications yet.</p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
