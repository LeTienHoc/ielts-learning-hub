import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import DashboardPage from "@/app/(app)/dashboard/page"
import ReadingPage from "@/app/(app)/reading/page"
import SettingsPage from "@/app/(app)/settings/page"

import { renderWithProviders } from "../test-utils"

// Server-only data sections are covered by E2E tests; stub them here.
vi.mock("@/features/settings", () => ({
  ProfileSection: () => <p>Profile section</p>,
  DeleteAccountDialog: () => <button type="button">Delete account</button>,
}))
vi.mock("@/features/reading", () => ({
  ReadingLibrary: () => <p>Reading library</p>,
}))

describe("route pages", () => {
  it("renders the dashboard with its title and an empty state, not fake data", () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument()
    expect(screen.getByText("Your dashboard is ready")).toBeInTheDocument()
  })

  it("renders a practice page from the navigation config", () => {
    renderWithProviders(
      <ReadingPage params={Promise.resolve({})} searchParams={Promise.resolve({})} />,
    )
    expect(screen.getByRole("heading", { level: 1, name: "Reading" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "History" })).toHaveAttribute(
      "href",
      "/reading/history",
    )
    expect(
      screen.getByText("Practise IELTS Reading passages and question types."),
    ).toBeInTheDocument()
    expect(screen.getByText("Reading library")).toBeInTheDocument()
  })

  it("renders the settings sections", () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument()
    expect(screen.getByText("Profile section")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Change theme" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Delete account" })).toBeInTheDocument()
  })
})
