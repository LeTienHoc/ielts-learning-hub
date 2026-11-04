import { z } from "zod"

/** Shared by client forms (UX) and Server Actions (authoritative validation). */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address")
  .max(254, "Email address is too long")
  .pipe(z.email("Enter a valid email address"))

export const newPasswordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(72, "Use at most 72 characters"),
})

export const signUpSchema = z.object({
  displayName: z.string().trim().max(60, "Use at most 60 characters"),
  email: emailSchema,
  password: newPasswordSchema,
  ageConfirmed: z.boolean().refine((value) => value, {
    message: "You must be 16 or older to create an account",
  }),
})

export const forgotPasswordSchema = z.object({ email: emailSchema })

export const resetPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
