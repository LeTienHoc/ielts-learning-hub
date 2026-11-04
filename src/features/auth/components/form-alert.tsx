import { CircleAlert, CircleCheck } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"

type FormAlertProps = { variant?: "error" | "success"; message: string }

/** Form-level message (server errors, confirmations). Announced to screen readers. */
export function FormAlert({ variant = "error", message }: FormAlertProps) {
  const Icon = variant === "error" ? CircleAlert : CircleCheck
  return (
    <Alert variant={variant === "error" ? "destructive" : "success"}>
      <Icon aria-hidden="true" />
      <AlertDescription className="text-current">{message}</AlertDescription>
    </Alert>
  )
}
