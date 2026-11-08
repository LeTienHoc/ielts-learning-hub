import { expect, type Page } from "@playwright/test"

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324"

export const TEST_PASSWORD = "correct horse battery staple"

/**
 * The form's alert message. Next.js also renders an empty `role="alert"` route announcer,
 * so the role alone is ambiguous; keep the role check and narrow to the Alert component.
 */
export function formAlert(page: Page) {
  return page.getByRole("alert").and(page.locator('[data-slot="alert"]'))
}

/** A unique address per test so runs never collide. Mail goes to the local Mailpit inbox. */
export function uniqueEmail(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`
}

type MailpitMessage = { ID: string; Subject: string }

/**
 * Waits for the newest email to `to` whose subject contains `subject`, and returns the
 * /auth/confirm link it contains, rewritten to the app under test (emails use the site URL).
 */
export async function getEmailLink(page: Page, to: string, subject: string): Promise<string> {
  let link: string | undefined

  await expect
    .poll(
      async () => {
        const search = await fetch(
          `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
        )
        const { messages } = (await search.json()) as { messages: MailpitMessage[] }
        const message = messages.find((candidate) => candidate.Subject.includes(subject))
        if (!message) return undefined

        const detail = await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`)
        const { HTML } = (await detail.json()) as { HTML: string }
        const href = HTML.match(/href="([^"]*\/auth\/confirm\?[^"]*)"/)?.[1]
        link = href?.replaceAll("&amp;", "&")
        return link
      },
      { message: `email "${subject}" to ${to}`, timeout: 20_000 },
    )
    .toBeDefined()

  const url = new URL(link ?? "")
  const app = new URL(page.url() === "about:blank" ? "http://localhost:3100" : page.url())
  return `${app.origin}${url.pathname}${url.search}`
}

export async function signUp(page: Page, email: string, name = "") {
  await page.goto("/sign-up")
  if (name) await page.getByLabel("Name (optional)").fill(name)
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(TEST_PASSWORD)
  await page.getByRole("checkbox", { name: "I am 16 years or older" }).check()
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByRole("status")).toContainText("Check your email")
}

/** Signs up, confirms the email and ends signed in on the dashboard. */
export async function signUpAndConfirm(page: Page, email: string, name = "") {
  await signUp(page, email, name)
  await page.goto(await getEmailLink(page, email, "Confirm your"))
  await expect(page).toHaveURL(/\/dashboard$/)
}

export async function signIn(page: Page, email: string, password = TEST_PASSWORD) {
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Account menu" }).click()
  await page.getByRole("menuitem", { name: "Sign out" }).click()
  await expect(page).toHaveURL(/\/sign-in$/)
}
