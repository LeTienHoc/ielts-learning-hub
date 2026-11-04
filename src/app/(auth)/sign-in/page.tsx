import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { AuthCard, SignInForm } from "@/features/auth"

export const metadata: Metadata = { title: "Sign in" }

export default function SignInPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to continue your IELTS preparation."
      footer={
        <p>
          New to IELTS Learning Hub?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      {/* The form reads ?next and ?error from the URL. */}
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <SignInForm />
      </Suspense>
    </AuthCard>
  )
}
