import { GraduationCap } from "lucide-react"
import Link from "next/link"

import { APP_NAME } from "@/config/site"

/** Logo + product name linking to the landing page (marketing and auth headers). */
export function BrandMark() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 rounded-md text-label font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap aria-hidden="true" className="size-5" />
      </span>
      {APP_NAME}
    </Link>
  )
}
