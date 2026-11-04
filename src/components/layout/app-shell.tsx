import type { ReactNode } from "react"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

type AppShellProps = {
  children: ReactNode
  /** Account control for the header (rendered by the route layout, may suspend). */
  accountMenu: ReactNode
}

/** Authenticated application frame: sidebar, header and main content area. */
export function AppShell({ children, accountMenu }: AppShellProps) {
  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-label focus:shadow-elevated focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <AppSidebar />
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <AppHeader accountMenu={accountMenu} />
        <main id="main-content" tabIndex={-1} className="flex-1 bg-surface outline-none">
          <div className="mx-auto w-full max-w-content px-4 py-6 md:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
