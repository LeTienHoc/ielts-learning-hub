import { render, type RenderOptions } from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"

import { ThemeProvider } from "@/components/shared/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  )
}

/** Render with the app-wide client providers. */
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options })
}

/** Render inside the app shell's sidebar context (sidebar, header pieces). */
export function renderWithShell(ui: ReactElement) {
  return renderWithProviders(<SidebarProvider>{ui}</SidebarProvider>)
}
