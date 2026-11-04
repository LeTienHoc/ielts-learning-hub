import { z } from "zod"

/** Activity event payload. Mirrors the CHECK constraints on public.activity_events. */
export const activityEventSchema = z.object({
  type: z
    .string()
    .max(64)
    .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, "Event type must look like 'area.action'"),
  module: z.enum([
    "auth",
    "onboarding",
    "roadmap",
    "dashboard",
    "vocabulary",
    "grammar",
    "reading",
    "listening",
    "writing",
    "speaking",
    "ai_tutor",
    "progress",
    "settings",
  ]),
  refType: z.string().max(64).optional(),
  refId: z.string().max(128).optional(),
  durationSeconds: z.number().int().min(0).max(86400).optional(),
  metadata: z.record(z.string(), z.json()).optional(),
})

export type ActivityEvent = z.infer<typeof activityEventSchema>
