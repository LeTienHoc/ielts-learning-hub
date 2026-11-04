import { existsSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import {
  findNavItemByPathname,
  getBreadcrumbs,
  getNavItem,
  isRouteActive,
  NAV_ITEMS,
  NAV_SECTIONS,
} from "@/config/navigation"

describe("navigation config", () => {
  it("defines the sidebar sections in order", () => {
    expect(NAV_SECTIONS.map((section) => section.title)).toEqual([
      "Overview",
      "Learning",
      "IELTS Practice",
      "AI Learning",
      "Analytics",
      "Preferences",
    ])
  })

  it("has unique hrefs", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it.each(NAV_ITEMS.map((item) => item.href))("has a page for %s", (href) => {
    const page = path.join(process.cwd(), "src/app/(app)", href, "page.tsx")
    expect(existsSync(page)).toBe(true)
  })
})

describe("isRouteActive", () => {
  it("matches the route itself and nested routes", () => {
    expect(isRouteActive("/reading", "/reading")).toBe(true)
    expect(isRouteActive("/reading/test-1", "/reading")).toBe(true)
  })

  it("does not match routes that only share a prefix", () => {
    expect(isRouteActive("/readings", "/reading")).toBe(false)
    expect(isRouteActive("/", "/dashboard")).toBe(false)
  })
})

describe("getBreadcrumbs", () => {
  it("shows only the current page on the dashboard", () => {
    expect(getBreadcrumbs("/dashboard")).toEqual([{ title: "Dashboard" }])
  })

  it("links back to the dashboard from other routes", () => {
    expect(getBreadcrumbs("/speaking")).toEqual([
      { title: "Dashboard", href: "/dashboard" },
      { title: "Speaking" },
    ])
  })

  it("resolves nested paths to their section page", () => {
    expect(getBreadcrumbs("/vocabulary/word-lists")).toEqual([
      { title: "Dashboard", href: "/dashboard" },
      { title: "Vocabulary" },
    ])
  })

  it("falls back to the dashboard link for unknown paths", () => {
    expect(findNavItemByPathname("/unknown")).toBeUndefined()
    expect(getBreadcrumbs("/unknown")).toEqual([{ title: "Dashboard", href: "/dashboard" }])
  })
})

describe("getNavItem", () => {
  it("returns the configured item", () => {
    expect(getNavItem("/ai-tutor").title).toBe("AI Tutor")
  })
})
