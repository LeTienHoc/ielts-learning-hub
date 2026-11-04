import { describe, expect, it } from "vitest"

import {
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/features/auth/schemas/auth-schemas"
import { activityEventSchema } from "@/lib/validators/activity-event"

const validSignUp = {
  displayName: "Linh",
  email: "linh@example.com",
  password: "correct horse",
  ageConfirmed: true,
}

describe("auth schemas", () => {
  it("trims the email before validating", () => {
    const result = signInSchema.parse({ email: "  linh@example.com ", password: "x" })
    expect(result.email).toBe("linh@example.com")
  })

  it("rejects invalid emails", () => {
    expect(signInSchema.safeParse({ email: "linh@", password: "x" }).success).toBe(false)
  })

  it("requires a password of 8–72 characters on sign-up", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, password: "short" }).success).toBe(false)
    expect(signUpSchema.safeParse({ ...validSignUp, password: "x".repeat(73) }).success).toBe(false)
    expect(signUpSchema.safeParse(validSignUp).success).toBe(true)
  })

  it("requires the 16+ confirmation", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, ageConfirmed: false })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("You must be 16 or older to create an account")
  })

  it("allows an empty display name but limits its length", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, displayName: "" }).success).toBe(true)
    expect(signUpSchema.safeParse({ ...validSignUp, displayName: "x".repeat(61) }).success).toBe(
      false,
    )
  })

  it("requires matching passwords on reset", () => {
    const result = resetPasswordSchema.safeParse({
      password: "new password 1",
      confirmPassword: "new password 2",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"])
  })
})

describe("activity event schema", () => {
  it("accepts a well-formed event", () => {
    expect(
      activityEventSchema.safeParse({ type: "attempt.submitted", module: "reading" }).success,
    ).toBe(true)
  })

  it.each(["Attempt.Submitted", "submitted", "attempt..submitted", "attempt submitted"])(
    "rejects the malformed type %s (mirrors the database CHECK)",
    (type) => {
      expect(activityEventSchema.safeParse({ type, module: "reading" }).success).toBe(false)
    },
  )

  it("rejects unknown modules and out-of-range durations", () => {
    expect(activityEventSchema.safeParse({ type: "a.b", module: "billing" }).success).toBe(false)
    expect(
      activityEventSchema.safeParse({ type: "a.b", module: "reading", durationSeconds: -1 })
        .success,
    ).toBe(false)
  })
})
