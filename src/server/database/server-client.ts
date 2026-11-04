import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { clientEnv } from "@/config/env/client"

import type { Database } from "./database.types"

/**
 * Supabase client for Server Components, Server Actions and Route Handlers, acting as the
 * signed-in user (RLS applies). Create one per request — never share it across requests.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Server Components cannot set cookies. That is safe to ignore because the proxy
            // (src/proxy.ts) refreshes the session on every request.
          }
        },
      },
    },
  )
}

export type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>
