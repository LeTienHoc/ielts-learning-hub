import { Suspense } from "react"

import { AppShell } from "@/components/layout/app-shell"
import { UserMenuSkeleton } from "@/components/layout/user-menu"
import { AccountMenu } from "@/features/auth"

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell
      accountMenu={
        // Session read streams in; the rest of the shell stays in the static shell.
        <Suspense fallback={<UserMenuSkeleton />}>
          <AccountMenu />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  )
}
