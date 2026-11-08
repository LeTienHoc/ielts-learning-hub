import { requireUser } from "@/server/auth/session"

import { ProfileForm } from "./profile-form"

/** Loads the signed-in user's profile. Reads the session: render inside <Suspense>. */
export async function ProfileSection() {
  const user = await requireUser()
  return (
    <ProfileForm
      email={user.email}
      defaultValues={{
        displayName: user.displayName ?? "",
        explanationLanguage: user.explanationLanguage,
        dailyNewWords: user.dailyNewWords,
      }}
    />
  )
}
