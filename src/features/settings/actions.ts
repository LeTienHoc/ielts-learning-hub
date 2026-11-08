"use server"

import { revalidatePath } from "next/cache"

import { createSupabaseServerClient } from "@/server/database/server-client"

import {
  deleteAccountSchema,
  profileSchema,
  type DeleteAccountInput,
  type ProfileInput,
} from "./schemas/settings-schemas"

type ActionResult = { ok: true } | { ok: false; error: string }

const NOT_SIGNED_IN: ActionResult = {
  ok: false,
  error: "Your session has ended. Please sign in again.",
}

export async function updateProfileAction(input: ProfileInput): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields." }

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) return NOT_SIGNED_IN

  // RLS also restricts the update to the caller's own row.
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName || null,
      explanation_language: parsed.data.explanationLanguage,
    })
    .eq("id", userId)
  if (error) return { ok: false, error: "Could not save your profile. Please try again." }

  // The header shows the display name, so refresh the whole app layout.
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function deleteAccountAction(input: DeleteAccountInput): Promise<ActionResult> {
  const parsed = deleteAccountSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Type DELETE to confirm." }

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims?.sub) return NOT_SIGNED_IN

  // Deletes the caller's auth user; profile and activity cascade (see migration).
  const { error } = await supabase.rpc("delete_current_user")
  if (error) return { ok: false, error: "Could not delete your account. Please try again." }

  // The user no longer exists; clear this browser's session cookies only.
  await supabase.auth.signOut({ scope: "local" })
  // The client leaves with a full page load so no signed-in UI stays mounted in the tab.
  return { ok: true }
}
