import { describe, expect, it } from "vitest"

import { clientEnvSchema, parseEnv, serverEnvSchema } from "@/config/env/schema"

const SUPABASE = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
}

describe("client env", () => {
  it("requires the Supabase URL and publishable key", () => {
    expect(() => parseEnv(clientEnvSchema, {})).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL[\s\S]*NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
    )
  })

  it("defaults the app URL and treats empty strings as unset", () => {
    const env = parseEnv(clientEnvSchema, { ...SUPABASE, NEXT_PUBLIC_APP_URL: "" })
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000")
  })

  it("rejects an empty publishable key", () => {
    expect(() =>
      parseEnv(clientEnvSchema, { ...SUPABASE, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/)
  })

  it("rejects invalid URLs with a message naming the variable", () => {
    expect(() =>
      parseEnv(clientEnvSchema, { ...SUPABASE, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/)
  })
})

describe("server env", () => {
  it("runs without integration credentials", () => {
    const env = parseEnv(serverEnvSchema, { NODE_ENV: "test" })
    expect(env.ANTHROPIC_API_KEY).toBeUndefined()
    expect(env.SUPABASE_SECRET_KEY).toBeUndefined()
  })

  it("does not echo values in errors", () => {
    expect(() => parseEnv(serverEnvSchema, { NODE_ENV: "staging-secret-value" })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining("staging-secret-value") }),
    )
  })

  it("never declares secrets as public variables", () => {
    for (const key of Object.keys(serverEnvSchema.shape)) {
      expect(key.startsWith("NEXT_PUBLIC_")).toBe(false)
    }
  })
})
