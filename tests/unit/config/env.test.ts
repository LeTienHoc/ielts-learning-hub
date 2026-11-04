import { describe, expect, it } from "vitest"

import { clientEnvSchema, parseEnv, serverEnvSchema } from "@/config/env/schema"

describe("client env", () => {
  it("runs without any integration variables", () => {
    expect(parseEnv(clientEnvSchema, {})).toEqual({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" })
  })

  it("treats empty strings as unset", () => {
    const env = parseEnv(clientEnvSchema, {
      NEXT_PUBLIC_APP_URL: "",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    })
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined()
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000")
  })

  it("rejects invalid URLs with a message naming the variable", () => {
    expect(() => parseEnv(clientEnvSchema, { NEXT_PUBLIC_SUPABASE_URL: "not-a-url" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    )
  })
})

describe("server env", () => {
  it("runs without credentials", () => {
    const env = parseEnv(serverEnvSchema, { NODE_ENV: "test" })
    expect(env.ANTHROPIC_API_KEY).toBeUndefined()
  })

  it("does not echo secret values in errors", () => {
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
