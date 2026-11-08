"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { FormField } from "@/components/shared/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { updateProfileAction } from "../actions"
import {
  DAILY_NEW_WORDS_OPTIONS,
  EXPLANATION_LANGUAGES,
  profileSchema,
  type ProfileInput,
} from "../schemas/settings-schemas"

type ProfileFormProps = { email: string; defaultValues: ProfileInput }

export function ProfileForm({ email, defaultValues }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const form = useForm({ resolver: zodResolver(profileSchema), defaultValues })

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateProfileAction(values)
      if (result.ok) {
        toast.success("Profile saved")
        form.reset(values)
      } else {
        toast.error(result.error)
      }
    })
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-label text-foreground">Email</span>
        <span className="text-body-sm text-muted-foreground">{email}</span>
      </div>
      <FormField
        control={form.control}
        name="displayName"
        label="Display name"
        description="Shown in the app. Leave empty to use your email."
        render={({ field, controlProps }) => (
          <Input autoComplete="nickname" className="max-w-sm" {...field} {...controlProps} />
        )}
      />
      <FormField
        control={form.control}
        name="explanationLanguage"
        label="Explanation language"
        description="Language used for grammar explanations and AI feedback."
        render={({ field, controlProps }) => (
          <Select value={field.value} onValueChange={field.onChange} name={field.name}>
            <SelectTrigger className="w-full max-w-sm" onBlur={field.onBlur} {...controlProps}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPLANATION_LANGUAGES.map((language) => (
                <SelectItem key={language.value} value={language.value}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <FormField
        control={form.control}
        name="dailyNewWords"
        label="New words per day"
        description="A few words a day is easier to remember. Reviews of older words are not limited."
        render={({ field, controlProps }) => (
          <RadioGroup
            value={String(field.value)}
            onValueChange={(value) => field.onChange(Number(value))}
            name={field.name}
            className="flex flex-wrap gap-4"
            {...controlProps}
          >
            {DAILY_NEW_WORDS_OPTIONS.map((count) => (
              <div key={count} className="flex items-center gap-2">
                <RadioGroupItem id={`daily-new-words-${count}`} value={String(count)} />
                <Label htmlFor={`daily-new-words-${count}`} className="font-normal">
                  {count} words
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
      />
      <div>
        <Button type="submit" disabled={isPending || !form.formState.isDirty}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
