import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { AuthCard, ResetPasswordForm } from "@/features/auth"
import { getCurrentUser } from "@/server/auth/session"

export const metadata: Metadata = { title: "Choose a new password" }

/** Requires the recovery session created by the emailed reset link (/auth/confirm). */
async function ResetPasswordContent() {
  const user = await getCurrentUser()
  if (!user) {
    return (
      <p className="text-body-sm text-muted-foreground">
        This reset link has expired or was already used.{" "}
        <Link
          href="/forgot-password"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Request a new link
        </Link>
        .
      </p>
    )
  }
  return <ResetPasswordForm />
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password" description="Use at least 8 characters.">
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <ResetPasswordContent />
      </Suspense>
    </AuthCard>
  )
}
