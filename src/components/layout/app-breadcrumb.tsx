"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getBreadcrumbs } from "@/config/navigation"
import { cn } from "@/lib/utils"

export function AppBreadcrumb() {
  const pathname = usePathname()
  const crumbs = getBreadcrumbs(pathname)

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          // Small screens have room for the current page only (the sidebar drawer and page
          // back links cover navigation), so ancestors and separators appear from `sm` up.
          const isCurrent = index === crumbs.length - 1
          return (
            <Fragment key={crumb.title}>
              {index > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
              <BreadcrumbItem className={cn("min-w-0", !isCurrent && "hidden sm:inline-flex")}>
                {crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.title}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate">{crumb.title}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
