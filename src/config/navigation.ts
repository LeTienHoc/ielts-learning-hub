import {
  BookA,
  BookOpenText,
  Bot,
  ChartLine,
  Headphones,
  LayoutDashboard,
  Mic,
  PenLine,
  Route,
  Settings,
  SpellCheck,
  type LucideIcon,
} from "lucide-react"

import { HOME_ROUTE as DEFAULT_HOME_ROUTE } from "@/config/routes"

export type AppRoute =
  | "/dashboard"
  | "/learning"
  | "/vocabulary"
  | "/grammar"
  | "/reading"
  | "/listening"
  | "/writing"
  | "/speaking"
  | "/ai-tutor"
  | "/progress"
  | "/settings"

export type NavItem = {
  title: string
  href: AppRoute
  icon: LucideIcon
  /** One-line summary, used as the page description and metadata. */
  description: string
}

export type NavSection = {
  title: string
  items: readonly NavItem[]
}

export const HOME_ROUTE: AppRoute = DEFAULT_HOME_ROUTE

/** Primary application navigation. Single source for sidebar, breadcrumbs and page headers. */
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Your learning overview at a glance.",
      },
    ],
  },
  {
    title: "Learning",
    items: [
      {
        title: "Learning Roadmap",
        href: "/learning",
        icon: Route,
        description: "A structured path from your current level to your target band.",
      },
      {
        title: "Vocabulary",
        href: "/vocabulary",
        icon: BookA,
        description: "Build and review the words you need for IELTS.",
      },
      {
        title: "Grammar",
        href: "/grammar",
        icon: SpellCheck,
        description: "Master the grammar structures examiners look for.",
      },
    ],
  },
  {
    title: "IELTS Practice",
    items: [
      {
        title: "Reading",
        href: "/reading",
        icon: BookOpenText,
        description: "Practise IELTS Reading passages and question types.",
      },
      {
        title: "Listening",
        href: "/listening",
        icon: Headphones,
        description: "Practise IELTS Listening sections with audio.",
      },
      {
        title: "Writing",
        href: "/writing",
        icon: PenLine,
        description: "Practise Writing Task 1 and Task 2.",
      },
      {
        title: "Speaking",
        href: "/speaking",
        icon: Mic,
        description: "Practise IELTS Speaking Parts 1, 2 and 3.",
      },
    ],
  },
  {
    title: "AI Learning",
    items: [
      {
        title: "AI Tutor",
        href: "/ai-tutor",
        icon: Bot,
        description: "Your personal AI tutor for English and IELTS.",
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        title: "Progress",
        href: "/progress",
        icon: ChartLine,
        description: "Track your learning progress over time.",
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Manage your account and learning preferences.",
      },
    ],
  },
]

export const NAV_ITEMS: readonly NavItem[] = NAV_SECTIONS.flatMap((section) => section.items)

/** True when `pathname` is `href` or one of its nested routes. */
export function isRouteActive(pathname: string, href: AppRoute): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function getNavItem(href: AppRoute): NavItem {
  const item = NAV_ITEMS.find((navItem) => navItem.href === href)
  if (!item) throw new Error(`No navigation item registered for "${href}".`)
  return item
}

export function findNavItemByPathname(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => isRouteActive(pathname, item.href))
}

export type BreadcrumbEntry = { title: string; href?: AppRoute }

/** Breadcrumb trail for a pathname. The last entry is the current page (no href). */
export function getBreadcrumbs(pathname: string): BreadcrumbEntry[] {
  const home = getNavItem(HOME_ROUTE)
  const current = findNavItemByPathname(pathname)

  if (!current) return [{ title: home.title, href: home.href }]
  if (current.href === home.href) return [{ title: home.title }]
  return [{ title: home.title, href: home.href }, { title: current.title }]
}
