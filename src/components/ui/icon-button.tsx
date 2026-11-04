import type { LucideIcon } from "lucide-react"
import type * as React from "react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const ICON_SIZES = {
  sm: "icon-sm",
  default: "icon",
  lg: "icon-lg",
} as const

type IconButtonProps = Omit<React.ComponentProps<typeof Button>, "size" | "children"> & {
  icon: LucideIcon
  /** Accessible name. Required because the button has no visible text. */
  label: string
  size?: keyof typeof ICON_SIZES
  /** Show `label` in a tooltip on hover/focus. */
  showTooltip?: boolean
}

/**
 * Square, icon-only button with a mandatory accessible label.
 * Use instead of `<Button size="icon">` so every icon button is labelled.
 */
export function IconButton({
  icon: Icon,
  label,
  size = "default",
  variant = "ghost",
  showTooltip = false,
  ...props
}: IconButtonProps) {
  const button = (
    <Button variant={variant} size={ICON_SIZES[size]} aria-label={label} {...props}>
      <Icon aria-hidden="true" />
    </Button>
  )

  if (!showTooltip) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
