import type { Metadata } from "next"
import type { ReactNode } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { getNavItem, type AppRoute } from "@/config/navigation"

/** Page metadata derived from the navigation config, so titles stay in one place. */
export function routeMetadata(href: AppRoute): Metadata {
  const { title, description } = getNavItem(href)
  return { title, description }
}

type RoutePageProps = {
  href: AppRoute
  actions?: ReactNode
  children?: ReactNode
}

/** Standard page layout for a navigation route: header from config, then content. */
export function RoutePage({ href, actions, children }: RoutePageProps) {
  const { title, description } = getNavItem(href)

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageHeader title={title} description={description} actions={actions} />
      {children}
    </div>
  )
}
