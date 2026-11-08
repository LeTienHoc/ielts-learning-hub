"use client"

import { GraduationCap } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { APP_NAME } from "@/config/site"
import { HOME_ROUTE, isRouteActive, NAV_SECTIONS } from "@/config/navigation"

export function AppSidebar() {
  const { isMobile, setOpenMobile } = useSidebar()

  // The mobile drawer should close once the user picks a destination.
  const closeMobileDrawer = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-header justify-center border-b px-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <Link
          href={HOME_ROUTE}
          onClick={closeMobileDrawer}
          className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap aria-hidden="true" className="size-5" />
          </span>
          <span className="truncate text-label font-semibold text-foreground group-data-[collapsible=icon]:sr-only">
            {APP_NAME}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* The active item depends on the URL; on dynamic routes it streams in after the
            static shell, which shows the same menu without a highlight. */}
        <Suspense fallback={<MainNav pathname={null} onNavigate={closeMobileDrawer} />}>
          <CurrentMainNav onNavigate={closeMobileDrawer} />
        </Suspense>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

function CurrentMainNav({ onNavigate }: { onNavigate: () => void }) {
  return <MainNav pathname={usePathname()} onNavigate={onNavigate} />
}

function MainNav({ pathname, onNavigate }: { pathname: string | null; onNavigate: () => void }) {
  return (
    <nav aria-label="Main navigation">
      {NAV_SECTIONS.map((section) => (
        <SidebarGroup key={section.title} className="px-3 group-data-[collapsible=icon]:px-0">
          <SidebarGroupLabel className="text-caption font-semibold tracking-wider text-muted-foreground uppercase">
            {section.title}
          </SidebarGroupLabel>
          <SidebarMenu className="gap-0.5 group-data-[collapsible=icon]:items-center">
            {section.items.map((item) => {
              const active = pathname !== null && isRouteActive(pathname, item.href)
              const Icon = item.icon
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.title}
                    className="h-10 gap-3 px-3 text-body-sm font-medium text-muted-foreground group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center hover:text-foreground data-active:bg-primary-subtle data-active:text-primary-subtle-foreground [&_svg]:size-[1.125rem]"
                  >
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                    >
                      <Icon aria-hidden="true" />
                      <span className="group-data-[collapsible=icon]:sr-only">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </nav>
  )
}
