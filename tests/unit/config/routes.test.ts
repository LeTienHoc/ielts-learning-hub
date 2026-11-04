import { describe, expect, it } from "vitest"

import { decideRoute, isPublicRoute } from "@/config/routes"
import { NAV_ITEMS } from "@/config/navigation"
import { safeRedirectPath } from "@/lib/helpers/safe-redirect"

describe("decideRoute", () => {
  it.each(NAV_ITEMS.map((item) => item.href))(
    "sends signed-out users from %s to sign-in with a return path",
    (href) => {
      expect(decideRoute(href, "", false)).toEqual({
        type: "redirect",
        to: `/sign-in?next=${encodeURIComponent(href)}`,
      })
    },
  )

  it("keeps the query string in the return path", () => {
    expect(decideRoute("/reading", "?level=b2", false)).toEqual({
      type: "redirect",
      to: `/sign-in?next=${encodeURIComponent("/reading?level=b2")}`,
    })
  })

  it("denies unknown routes by default for signed-out users", () => {
    expect(decideRoute("/some/new/page", "", false).type).toBe("redirect")
  })

  it.each(["/", "/sign-in", "/sign-up", "/forgot-password", "/auth/confirm", "/api/health"])(
    "lets signed-out users open the public route %s",
    (path) => {
      expect(decideRoute(path, "", false)).toEqual({ type: "next" })
    },
  )

  it.each(["/sign-in", "/sign-up", "/forgot-password"])(
    "sends signed-in users away from %s",
    (path) => {
      expect(decideRoute(path, "", true)).toEqual({ type: "redirect", to: "/dashboard" })
    },
  )

  it("lets the reset-password page decide for itself (recovery session)", () => {
    expect(decideRoute("/reset-password", "", false)).toEqual({ type: "next" })
    expect(decideRoute("/reset-password", "", true)).toEqual({ type: "next" })
  })

  it("lets signed-in users through to the app", () => {
    expect(decideRoute("/dashboard", "", true)).toEqual({ type: "next" })
  })

  it("does not treat look-alike paths as public", () => {
    expect(isPublicRoute("/sign-in-now")).toBe(false)
    expect(isPublicRoute("/authors")).toBe(false)
    expect(isPublicRoute("/api/healthcheck")).toBe(false)
  })
})

describe("safeRedirectPath", () => {
  it.each(["/dashboard", "/reading?level=b2", "/writing/abc#feedback"])("keeps %s", (path) => {
    expect(safeRedirectPath(path)).toBe(path)
  })

  it.each([
    undefined,
    null,
    "",
    "dashboard",
    "//evil.example",
    "/\\evil.example",
    "https://evil.example",
    "javascript:alert(1)",
    "/ok\nSet-Cookie:x",
    `/${"a".repeat(600)}`,
  ])("falls back for unsafe value %s", (path) => {
    expect(safeRedirectPath(path, "/dashboard")).toBe("/dashboard")
  })
})
