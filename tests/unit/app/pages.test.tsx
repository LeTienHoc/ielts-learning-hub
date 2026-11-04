import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import DashboardPage from "@/app/(app)/dashboard/page"
import ReadingPage from "@/app/(app)/reading/page"
import SettingsPage from "@/app/(app)/settings/page"

import { renderWithProviders } from "../test-utils"

describe("route pages", () => {
  it("renders the dashboard with its title and an empty state, not fake data", () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument()
    expect(screen.getByText("Your dashboard is ready")).toBeInTheDocument()
  })

  it("renders a practice page from the navigation config", () => {
    renderWithProviders(<ReadingPage />)
    expect(screen.getByRole("heading", { level: 1, name: "Reading" })).toBeInTheDocument()
    expect(
      screen.getByText("Practise IELTS Reading passages and question types."),
    ).toBeInTheDocument()
  })

  it("renders the settings page with the appearance control", () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Change theme" })).toBeInTheDocument()
  })
})
