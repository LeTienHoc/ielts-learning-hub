"use client"

import { Search } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"

/** Global search entry point. Placeholder until search is implemented. */
export function SearchDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        aria-keyshortcuts="Control+K Meta+K"
        className="hidden w-64 justify-start gap-2 text-muted-foreground md:flex"
      >
        <Search aria-hidden="true" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="rounded-sm border bg-surface px-1.5 font-mono text-caption">Ctrl K</kbd>
      </Button>
      <IconButton
        icon={Search}
        label="Search"
        onClick={() => setOpen(true)}
        className="md:hidden"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>
              Search across lessons, vocabulary and practice will be available soon.
            </DialogDescription>
          </DialogHeader>
          <Input type="search" placeholder="Search…" aria-label="Search" disabled />
        </DialogContent>
      </Dialog>
    </>
  )
}
