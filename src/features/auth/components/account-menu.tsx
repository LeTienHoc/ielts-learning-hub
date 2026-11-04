import { UserMenu } from "@/components/layout/user-menu"
import { getCurrentUser } from "@/server/auth/session"

import { signOutAction } from "../actions"

/** Header account control for the signed-in user. Reads the session: render inside <Suspense>. */
export async function AccountMenu() {
  const user = await getCurrentUser()
  // The proxy keeps signed-out users out of the app; render nothing if the session just ended.
  if (!user) return null
  return <UserMenu name={user.displayName} email={user.email} signOutAction={signOutAction} />
}
