import "server-only"

import { parseEnv, serverEnvSchema } from "./schema"

/** Validated server-only environment. Importing this from a Client Component fails the build. */
export const serverEnv = parseEnv(serverEnvSchema, {
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  SPEECH_TO_TEXT_API_KEY: process.env.SPEECH_TO_TEXT_API_KEY,
  TEXT_TO_SPEECH_API_KEY: process.env.TEXT_TO_SPEECH_API_KEY,
})
