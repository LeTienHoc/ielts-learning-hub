import { Suspense, type ReactNode } from "react"

import { AppBreadcrumb } from "@/components/layout/app-breadcrumb"
import { NotificationsMenu } from "@/components/layout/notifications-menu"
import { SearchDialog } from "@/components/layout/search-dialog"
import { ThemeSwitcher } from "@/components/shared/theme-switcher"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

/** `accountMenu` is injected by the route layout so this shared component stays data-free. */
export function AppHeader({ accountMenu }: { accountMenu: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-header shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur-sm md:px-6">
      <SidebarTrigger className="-ml-1 size-9" />
      <Separator
        orientation="vertical"
        className="mx-1 data-vertical:h-5 data-vertical:self-center"
      />
      {/* Reads the URL: on dynamic routes it streams in after the static shell. */}
      <Suspense fallback={null}>
        <AppBreadcrumb />
      </Suspense>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <SearchDialog />
        <NotificationsMenu />
        <ThemeSwitcher />
        {accountMenu}
      </div>
    </header>
  )
}
