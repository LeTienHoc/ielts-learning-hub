import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { usePathname } from "next/navigation"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NAV_ITEMS } from "@/config/navigation"

import { mockMatchMedia } from "../../setup"
import { renderWithShell } from "../test-utils"

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }))

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/reading")
  })

  it("renders every navigation route as a link", () => {
    renderWithShell(<AppSidebar />)
    const nav = screen.getByRole("navigation", { name: "Main navigation" })

    for (const item of NAV_ITEMS) {
      expect(within(nav).getByRole("link", { name: item.title })).toHaveAttribute("href", item.href)
    }
  })

  it("shows section labels", () => {
    renderWithShell(<AppSidebar />)
    for (const label of [
      "Overview",
      "Learning",
      "IELTS Practice",
      "AI Learning",
      "Analytics",
      "Preferences",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it("marks only the current route as active", () => {
    renderWithShell(<AppSidebar />)

    expect(screen.getByRole("link", { name: "Reading" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "Listening" })).not.toHaveAttribute("aria-current")
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current")
  })

  it("keeps the parent route active on nested paths", () => {
    vi.mocked(usePathname).mockReturnValue("/vocabulary/lists")
    renderWithShell(<AppSidebar />)

    expect(screen.getByRole("link", { name: "Vocabulary" })).toHaveAttribute("aria-current", "page")
  })
})

describe("AppSidebar on mobile", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/dashboard")
    mockMatchMedia((query) => query.includes("max-width"))
  })

  it("is a closed drawer until the menu button is pressed, then closes after navigating", async () => {
    const user = userEvent.setup()
    renderWithShell(
      <>
        <SidebarTrigger />
        <AppSidebar />
      </>,
    )

    expect(screen.queryByRole("navigation", { name: "Main navigation" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }))
    const drawer = await screen.findByRole("dialog")
    const link = within(drawer).getByRole("link", { name: "Writing" })

    await user.click(link)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
