import type { Metadata } from "next"
import Link from "next/link"

import { AuthCard, SignUpForm } from "@/features/auth"

export const metadata: Metadata = { title: "Create account" }

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Get a personal IELTS study plan and explained feedback."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <SignUpForm />
    </AuthCard>
  )
}
