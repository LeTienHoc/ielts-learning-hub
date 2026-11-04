import { RoutePage, routeMetadata } from "@/components/layout/route-page"
import { ThemeSwitcher } from "@/components/shared/theme-switcher"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = routeMetadata("/settings")

export default function SettingsPage() {
  return (
    <RoutePage href="/settings">
      <Card className="max-w-2xl">
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
    </RoutePage>
  )
}
