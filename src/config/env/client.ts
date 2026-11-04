import { clientEnvSchema, parseEnv } from "./schema"

/**
 * Validated public environment. Each variable is referenced explicitly so Next.js
 * can inline it into the client bundle.
 */
export const clientEnv = parseEnv(clientEnvSchema, {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
})
