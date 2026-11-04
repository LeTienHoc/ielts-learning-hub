import type { ReactNode } from "react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"

type AuthCardProps = {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card className="w-full max-w-md py-6">
      <CardHeader className="px-6">
        <h1 className="text-h3 text-foreground">{title}</h1>
        <CardDescription className="text-body-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-6">{children}</CardContent>
      {footer && (
        <CardFooter className="justify-center border-t px-6 pt-4 text-body-sm text-muted-foreground">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
