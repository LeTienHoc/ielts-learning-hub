import { createCn } from "cn/config"

/**
 * Typography tokens defined in `globals.css` (`--text-*`). Registering them as
 * font sizes stops the merger from treating e.g. `text-h1` as a colour and
 * dropping it when combined with `text-foreground`.
 */
const TYPOGRAPHY_TOKENS = [
  "display",
  "h1",
  "h2",
  "h3",
  "h4",
  "body-lg",
  "body",
  "body-sm",
  "caption",
  "label",
] as const

/** Merge class names, resolving Tailwind conflicts (design-token aware). */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: [...TYPOGRAPHY_TOKENS] }],
      shadow: [{ shadow: ["subtle", "elevated"] }],
      rounded: [{ rounded: ["card", "modal"] }],
    },
  },
})
