import { QueryClient } from "@tanstack/react-query"

/** Shared TanStack Query defaults. One client per browser session (see app/providers.tsx). */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  })
}
