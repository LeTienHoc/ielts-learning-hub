import { describe, expect, it } from "vitest"

import { cn } from "@/lib/utils"

describe("cn", () => {
  it("keeps typography tokens alongside colour utilities", () => {
    expect(cn("text-h1", "text-foreground")).toBe("text-h1 text-foreground")
  })

  it("resolves conflicts between typography tokens", () => {
    expect(cn("text-sm", "text-body-lg")).toBe("text-body-lg")
  })

  it("resolves conflicts between radius and shadow tokens", () => {
    expect(cn("rounded-xl shadow-sm", "rounded-card shadow-subtle")).toBe(
      "rounded-card shadow-subtle",
    )
  })
})
