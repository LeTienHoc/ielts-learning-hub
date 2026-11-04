import { z } from "zod"

/** Treat empty strings (e.g. `KEY=` in .env files) as "not set". */
const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value)

const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional())
const optionalUrl = z.preprocess(emptyToUndefined, z.url().optional())

/**
 * Variables exposed to the browser. Only non-secret values may live here.
 * Integrations are optional until they are implemented.
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.preprocess(emptyToUndefined, z.url().default("http://localhost:3000")),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
})

/** Server-only secrets. Never prefix these with NEXT_PUBLIC_. */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  ANTHROPIC_API_KEY: optionalString,
  SPEECH_TO_TEXT_API_KEY: optionalString,
  TEXT_TO_SPEECH_API_KEY: optionalString,
})

export type ClientEnv = z.infer<typeof clientEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

/** Parse env vars, throwing one readable error listing every invalid variable (never values). */
export function parseEnv<TSchema extends z.ZodType>(
  schema: TSchema,
  source: Record<string, string | undefined>,
): z.infer<TSchema> {
  const result = schema.safeParse(source)
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")
    throw new Error(`Invalid environment variables:\n${details}`)
  }
  return result.data
}
