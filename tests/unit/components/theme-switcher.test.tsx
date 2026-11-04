import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { ThemeSwitcher } from "@/components/shared/theme-switcher"
import { THEME_STORAGE_KEY } from "@/config/theme"

import { mockMatchMedia } from "../../setup"
import { renderWithProviders } from "../test-utils"

async function chooseTheme(name: "Light" | "Dark" | "System") {
  const user = userEvent.setup()
  await user.click(screen.getByRole("button", { name: "Change theme" }))
  await user.click(await screen.findByRole("menuitemradio", { name: name }))
}

describe("ThemeSwitcher", () => {
  it("defaults to the system theme", async () => {
    renderWithProviders(<ThemeSwitcher />)
    await userEvent.setup().click(screen.getByRole("button", { name: "Change theme" }))

    expect(await screen.findByRole("menuitemradio", { name: "System" })).toBeChecked()
    expect(document.documentElement).not.toHaveClass("dark")
  })

  it("applies and persists the dark theme", async () => {
    renderWithProviders(<ThemeSwitcher />)
    await chooseTheme("Dark")

    expect(document.documentElement).toHaveClass("dark")
    expect(document.documentElement.style.colorScheme).toBe("dark")
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
  })

  it("switches back to light", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark")
    renderWithProviders(<ThemeSwitcher />)
    expect(document.documentElement).toHaveClass("dark")

    await chooseTheme("Light")
    expect(document.documentElement).not.toHaveClass("dark")
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light")
  })

  it("follows the operating system preference in system mode", async () => {
    mockMatchMedia((query) => query === "(prefers-color-scheme: dark)")
    renderWithProviders(<ThemeSwitcher />)

    await chooseTheme("System")
    expect(document.documentElement).toHaveClass("dark")
  })
})
