"use client"

import { LogOut, Settings } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { navigateWithFullReload } from "@/lib/helpers/full-page-navigation"

type UserMenuProps = {
  name: string | null
  email: string
  /** Server Action that signs the user out and returns where to go next (auth feature). */
  signOutAction: () => Promise<{ redirectTo: string }>
}

function initials(name: string | null, email: string) {
  const source = name?.trim() || email
  const [first = "", second = ""] = source.split(/[\s@._-]+/).filter(Boolean)
  return (second ? first.charAt(0) + second.charAt(0) : source.slice(0, 2)).toUpperCase()
}

/** Account menu in the app header. */
export function UserMenu({ name, email, signOutAction }: UserMenuProps) {
  const signOut = async () => {
    const { redirectTo } = await signOutAction()
    navigateWithFullReload(redirectTo)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary-subtle text-caption font-semibold text-primary-subtle-foreground">
              {initials(name, email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-label text-foreground">{name ?? "Learner"}</span>
          <span className="truncate text-caption font-normal text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings aria-hidden="true" />
            Settings
          </Link>
        </DropdownMenuItem>
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut aria-hidden="true" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Placeholder while the current user loads. */
export function UserMenuSkeleton() {
  return <Skeleton className="size-9 rounded-full" aria-label="Loading account" />
}
