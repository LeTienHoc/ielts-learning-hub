"use server"

import { redirect } from "next/navigation"

import { clientEnv } from "@/config/env/client"
import { HOME_ROUTE, SIGN_IN_ROUTE } from "@/config/routes"
import { safeRedirectPath } from "@/lib/helpers/safe-redirect"
import { createSupabaseServerClient } from "@/server/database/server-client"

import { GENERIC_ERROR, type ActionResult } from "./action-result"
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type SignInInput,
  type SignUpInput,
} from "./schemas/auth-schemas"

const confirmUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/auth/confirm`

export async function signUpAction(input: SignUpInput): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." }

  const { email, password, displayName } = parsed.data
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmUrl,
      data: displayName ? { display_name: displayName } : {},
    },
  })

  if (error) {
    if (error.code === "weak_password") {
      return { ok: false, error: "That password is too weak. Choose a longer, less common one." }
    }
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return { ok: false, error: "Too many attempts. Please wait a moment and try again." }
    }
    // Includes "user already exists": answer like a success so emails cannot be enumerated.
    if (error.code !== "user_already_exists" && error.code !== "email_exists") {
      return { ok: false, error: GENERIC_ERROR }
    }
  }
  return { ok: true }
}

export async function signInAction(input: SignInInput, next?: string): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { ok: false, error: "Please confirm your email address first. Check your inbox." }
    }
    if (error.status === 429) {
      return { ok: false, error: "Too many attempts. Please wait a moment and try again." }
    }
    return { ok: false, error: "Email or password is incorrect." }
  }

  redirect(safeRedirectPath(next, HOME_ROUTE))
}

export async function requestPasswordResetAction(
  input: ForgotPasswordInput,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${confirmUrl}?next=/reset-password`,
  })
  if (error?.status === 429) {
    return { ok: false, error: "Too many attempts. Please wait a moment and try again." }
  }
  // Same answer whether or not the account exists.
  return { ok: true }
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." }

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims?.sub) {
    return { ok: false, error: "Your reset link has expired. Request a new one." }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    if (error.code === "same_password") {
      return { ok: false, error: "Choose a password different from your current one." }
    }
    if (error.code === "weak_password") {
      return { ok: false, error: "That password is too weak. Choose a longer, less common one." }
    }
    return { ok: false, error: GENERIC_ERROR }
  }

  redirect(HOME_ROUTE)
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect(SIGN_IN_ROUTE)
}
