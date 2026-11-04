// Used only by src/proxy.ts. It deliberately does not import "server-only": the proxy is
// compiled outside the React Server Components graph. It is never imported by client code.

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { clientEnv } from "@/config/env/client"
import type { Database } from "@/server/database/database.types"

/**
 * Refreshes the Supabase session cookie for this request and reports whether a valid
 * session exists. Must run before rendering so Server Components see fresh tokens.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
          // Cache-control headers that stop CDNs caching responses carrying auth cookies.
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value)
        },
      },
    },
  )

  // getClaims() validates the JWT (and refreshes it when needed). Do not use getSession()
  // here: it does not verify the token.
  const { data } = await supabase.auth.getClaims()
  const isSignedIn = Boolean(data?.claims?.sub)

  return { response, isSignedIn }
}
