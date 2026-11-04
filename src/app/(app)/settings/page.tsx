import { Suspense } from "react"

import { RoutePage, routeMetadata } from "@/components/layout/route-page"
import { ThemeSwitcher } from "@/components/shared/theme-switcher"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DeleteAccountDialog, ProfileSection } from "@/features/settings"

export const metadata = routeMetadata("/settings")

export default function SettingsPage() {
  return (
    <RoutePage href="/settings">
      <div className="flex max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-h4">Profile</CardTitle>
            <CardDescription>Your name and learning preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-56 w-full" />}>
              <ProfileSection />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-h4">Appearance</CardTitle>
            <CardDescription>
              Choose a light or dark theme, or follow your system setting.
            </CardDescription>
            <CardAction>
              <ThemeSwitcher />
            </CardAction>
          </CardHeader>
        </Card>

        <Card className="ring-error/30">
          <CardHeader>
            <CardTitle className="text-h4">Delete account</CardTitle>
            <CardDescription>
              Permanently remove your account, profile and learning history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccountDialog />
          </CardContent>
        </Card>
      </div>
    </RoutePage>
  )
}
