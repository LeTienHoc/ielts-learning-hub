import "server-only"

import { activityEventSchema, type ActivityEvent } from "@/lib/validators/activity-event"
import type { SupabaseServerClient } from "@/server/database/server-client"

/**
 * Appends a learning activity event for the signed-in user (RLS sets/validates user_id).
 * Event recording must never break the user's action, so failures are logged and swallowed.
 */
export async function recordActivityEvent(
  supabase: SupabaseServerClient,
  event: ActivityEvent,
): Promise<void> {
  const parsed = activityEventSchema.safeParse(event)
  if (!parsed.success) {
    console.error(
      "Invalid activity event",
      parsed.error.issues.map((issue) => issue.path.join(".")),
    )
    return
  }
  const { type, module, refType, refId, durationSeconds, metadata } = parsed.data
  const { error } = await supabase.from("activity_events").insert({
    type,
    module,
    ref_type: refType ?? null,
    ref_id: refId ?? null,
    duration_seconds: durationSeconds ?? null,
    metadata: metadata ?? {},
  })
  if (error) console.error("Could not record activity event", { type, code: error.code })
}
