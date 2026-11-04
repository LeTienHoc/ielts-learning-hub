import { expect, test, type Page } from "@playwright/test"

const ROUTES = [
  ["/dashboard", "Dashboard"],
  ["/learning", "Learning Roadmap"],
  ["/vocabulary", "Vocabulary"],
  ["/grammar", "Grammar"],
  ["/reading", "Reading"],
  ["/listening", "Listening"],
  ["/writing", "Writing"],
  ["/speaking", "Speaking"],
  ["/ai-tutor", "AI Tutor"],
  ["/progress", "Progress"],
  ["/settings", "Settings"],
] as const

const mainNav = (page: Page) => page.getByRole("navigation", { name: "Main navigation" })
/** The header button (the sidebar also has a resize rail with the same label). */
const sidebarTrigger = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: "Toggle Sidebar" })

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

test.describe("routes", () => {
  for (const [path, title] of ROUTES) {
    test(`${path} renders inside the app shell`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible()
      await expect(page.getByRole("navigation", { name: "breadcrumb" })).toContainText(title)
      await expect(page).toHaveTitle(new RegExp(`^${title} · IELTS Learning Hub$`))
      await expectNoHorizontalOverflow(page)
    })
  }

  test("unknown routes show the not-found page", async ({ page }) => {
    const response = await page.goto("/does-not-exist")
    expect(response?.status()).toBe(404)
    await expect(page.getByText("Page not found")).toBeVisible()
  })
})

test.describe("desktop navigation", () => {
  test.skip(({ isMobile }) => isMobile, "Desktop sidebar only")

  test("navigates with the sidebar and highlights the active route", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(mainNav(page).getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    )

    await mainNav(page).getByRole("link", { name: "Reading" }).click()
    await expect(page).toHaveURL(/\/reading$/)
    await expect(page.getByRole("heading", { level: 1, name: "Reading" })).toBeVisible()
    await expect(mainNav(page).getByRole("link", { name: "Reading" })).toHaveAttribute(
      "aria-current",
      "page",
    )
    await expect(mainNav(page).getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    )
  })

  test("breadcrumb links back to the dashboard", async ({ page }) => {
    await page.goto("/writing")
    await page
      .getByRole("navigation", { name: "breadcrumb" })
      .getByRole("link", { name: "Dashboard" })
      .click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test("sidebar collapses to icons and expands again", async ({ page }) => {
    await page.goto("/dashboard")
    const sidebar = page.locator('[data-slot="sidebar"]')
    await expect(sidebar).toHaveAttribute("data-state", "expanded")

    await sidebarTrigger(page).click()
    await expect(sidebar).toHaveAttribute("data-state", "collapsed")
    // Links keep their accessible names when collapsed.
    await expect(mainNav(page).getByRole("link", { name: "Speaking" })).toBeVisible()

    await page.keyboard.press("Control+b")
    await expect(sidebar).toHaveAttribute("data-state", "expanded")
  })

  test("skip link moves focus to the main content", async ({ page }) => {
    await page.goto("/dashboard")
    await page.keyboard.press("Tab")
    const skipLink = page.getByRole("link", { name: "Skip to main content" })
    await expect(skipLink).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(page.locator("#main-content")).toBeFocused()
  })
})

test.describe("mobile navigation", () => {
  test.skip(({ isMobile }) => !isMobile, "Mobile drawer only")

  test("opens the drawer, navigates and closes it", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(mainNav(page)).toBeHidden()

    await sidebarTrigger(page).click()
    const drawer = page.getByRole("dialog")
    await expect(drawer).toBeVisible()

    await drawer.getByRole("link", { name: "Listening" }).click()
    await expect(page).toHaveURL(/\/listening$/)
    await expect(drawer).toBeHidden()
    await expect(page.getByRole("heading", { level: 1, name: "Listening" })).toBeVisible()
  })

  test("drawer closes with Escape", async ({ page }) => {
    await page.goto("/dashboard")
    await sidebarTrigger(page).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toBeHidden()
  })
})

test.describe("theme", () => {
  test("switches to dark, persists across reloads and back to light", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" })
    await page.goto("/settings")
    const html = page.locator("html")
    await expect(html).not.toHaveClass(/dark/)

    await page.getByRole("button", { name: "Change theme" }).first().click()
    await page.getByRole("menuitemradio", { name: "Dark" }).click()
    await expect(html).toHaveClass(/dark/)

    await page.reload()
    await expect(html).toHaveClass(/dark/)

    await page.getByRole("button", { name: "Change theme" }).first().click()
    await page.getByRole("menuitemradio", { name: "Light" }).click()
    await expect(html).not.toHaveClass(/dark/)
  })

  test("follows the system preference by default", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" })
    await page.goto("/dashboard")
    await expect(page.locator("html")).toHaveClass(/dark/)
  })
})
