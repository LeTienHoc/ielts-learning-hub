"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { MailCheck } from "lucide-react"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { FormField } from "@/components/shared/form-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

import { signUpAction } from "../actions"
import { signUpSchema } from "../schemas/auth-schemas"
import { FormAlert } from "./form-alert"

export function SignUpForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: "", email: "", password: "", ageConfirmed: false },
  })

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    startTransition(async () => {
      const result = await signUpAction(values)
      if (result.ok) setSentTo(values.email)
      else setServerError(result.error)
    })
  })

  if (sentTo) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary-subtle text-primary">
          <MailCheck aria-hidden="true" className="size-6" />
        </span>
        <p className="text-h4 text-foreground">Check your email</p>
        <p className="text-body-sm text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="font-medium text-foreground">{sentTo}</span>. Open it to activate your
          account.
        </p>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {serverError && <FormAlert message={serverError} />}
      <FormField
        control={form.control}
        name="displayName"
        label="Name (optional)"
        render={({ field, controlProps }) => (
          <Input autoComplete="nickname" {...field} {...controlProps} />
        )}
      />
      <FormField
        control={form.control}
        name="email"
        label="Email"
        render={({ field, controlProps }) => (
          <Input type="email" autoComplete="email" {...field} {...controlProps} />
        )}
      />
      <FormField
        control={form.control}
        name="password"
        label="Password"
        description="At least 8 characters."
        render={({ field, controlProps }) => (
          <Input type="password" autoComplete="new-password" {...field} {...controlProps} />
        )}
      />
      <FormField
        control={form.control}
        name="ageConfirmed"
        label="I am 16 years or older"
        orientation="horizontal"
        render={({ field, controlProps }) => (
          <Checkbox
            checked={field.value}
            onCheckedChange={(checked) => field.onChange(checked === true)}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            {...controlProps}
          />
        )}
      />
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  )
}
