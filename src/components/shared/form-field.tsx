"use client"

import { useId, type ReactNode } from "react"
import {
  Controller,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"

/** Props to spread onto the form control so label, description and error are wired up. */
export type FormControlProps = {
  id: string
  "aria-invalid": boolean
  "aria-describedby"?: string
}

type FormFieldProps<TValues extends FieldValues, TName extends FieldPath<TValues>> = {
  control: Control<TValues>
  name: TName
  label: string
  description?: string
  /** "horizontal" puts the control before the label (checkboxes, switches). */
  orientation?: "vertical" | "horizontal"
  render: (props: {
    field: ControllerRenderProps<TValues, TName>
    fieldState: ControllerFieldState
    controlProps: FormControlProps
  }) => ReactNode
}

/**
 * React Hook Form field with label, description and validation message.
 * Validation rules come from the form's Zod schema (via zodResolver); add `noValidate`
 * to the <form> so native browser validation does not pre-empt the Zod messages.
 *
 * @example
 * <FormField control={form.control} name="email" label="Email"
 *   render={({ field, controlProps }) => <Input type="email" {...field} {...controlProps} />} />
 */
export function FormField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  control,
  name,
  label,
  description,
  orientation = "vertical",
  render,
}: FormFieldProps<TValues, TName>) {
  const id = useId()
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const describedBy =
          [description && descriptionId, fieldState.invalid && errorId].filter(Boolean).join(" ") ||
          undefined

        const labelElement = <FieldLabel htmlFor={id}>{label}</FieldLabel>
        const controlElement = render({
          field,
          fieldState,
          controlProps: {
            id,
            "aria-invalid": fieldState.invalid,
            "aria-describedby": describedBy,
          },
        })
        const messages = (
          <>
            {description && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError id={errorId} errors={[fieldState.error]} />}
          </>
        )

        if (orientation === "horizontal") {
          return (
            <div className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
              <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                {controlElement}
                {labelElement}
              </Field>
              {messages}
            </div>
          )
        }

        return (
          <Field data-invalid={fieldState.invalid}>
            {labelElement}
            {controlElement}
            {messages}
          </Field>
        )
      }}
    />
  )
}
