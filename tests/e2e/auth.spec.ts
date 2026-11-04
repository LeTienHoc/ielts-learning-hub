import { expect, test } from "@playwright/test"

import {
  getEmailLink,
  signIn,
  signOut,
  signUp,
  signUpAndConfirm,
  TEST_PASSWORD,
  uniqueEmail,
} from "./support/auth"

test.describe("authentication", () => {
  test("sign up, confirm email, sign out, then sign back in to the requested page", async ({
    page,
  }) => {
    const email = uniqueEmail("signup")
    await signUpAndConfirm(page, email, "Linh Tran")

    await page.getByRole("button", { name: "Account menu" }).click()
    await expect(page.getByRole("menu")).toContainText("Linh Tran")
    await expect(page.getByRole("menu")).toContainText(email)
    await page.keyboard.press("Escape")

    await signOut(page)

    await page.goto("/writing")
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fwriting$/)
    await signIn(page, email)
    await expect(page).toHaveURL(/\/writing$/)
    await expect(page.getByRole("heading", { level: 1, name: "Writing" })).toBeVisible()
  })

  test("signed-out users are sent to sign-in from every app route", async ({ page }) => {
    for (const path of ["/dashboard", "/settings", "/ai-tutor"]) {
      await page.goto(path)
      await expect(page).toHaveURL(new RegExp(`/sign-in\\?next=${encodeURIComponent(path)}$`))
    }
  })

  test("unconfirmed accounts cannot sign in", async ({ page }) => {
    const email = uniqueEmail("unconfirmed")
    await signUp(page, email)
    await page.goto("/sign-in")
    await signIn(page, email)
    await expect(page.getByRole("alert")).toContainText("confirm your email")
  })

  test("a wrong password shows a generic error", async ({ page }) => {
    const email = uniqueEmail("wrongpw")
    await signUpAndConfirm(page, email)
    await signOut(page)
    await signIn(page, email, "not the password")
    await expect(page.getByRole("alert")).toHaveText("Email or password is incorrect.")
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test("an unknown email gets the same answer on password reset", async ({ page }) => {
    await page.goto("/forgot-password")
    await page.getByLabel("Email").fill(uniqueEmail("nobody"))
    await page.getByRole("button", { name: "Send reset link" }).click()
    await expect(page.getByRole("alert")).toContainText("If an account exists")
  })

  test("reset the password through the emailed link", async ({ page }) => {
    const email = uniqueEmail("reset")
    const newPassword = "a brand new passphrase"
    await signUpAndConfirm(page, email)
    await signOut(page)

    await page.goto("/forgot-password")
    await page.getByLabel("Email").fill(email)
    await page.getByRole("button", { name: "Send reset link" }).click()
    await expect(page.getByRole("alert")).toContainText("If an account exists")

    await page.goto(await getEmailLink(page, email, "Reset your"))
    await expect(page).toHaveURL(/\/reset-password$/)
    await page.getByLabel("New password", { exact: true }).fill(newPassword)
    await page.getByLabel("Confirm new password").fill(newPassword)
    await page.getByRole("button", { name: "Save new password" }).click()
    await expect(page).toHaveURL(/\/dashboard$/)

    await signOut(page)
    await signIn(page, email, TEST_PASSWORD)
    await expect(page.getByRole("alert")).toHaveText("Email or password is incorrect.")
    await signIn(page, email, newPassword)
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test("an invalid email link is rejected", async ({ page }) => {
    await page.goto("/auth/confirm?token_hash=not-a-real-token&type=email&next=//evil.example")
    await expect(page).toHaveURL(/\/sign-in\?error=link_invalid$/)
    await expect(page.getByRole("alert")).toContainText("invalid or has expired")
  })

  test("update the profile, then delete the account", async ({ page }) => {
    const email = uniqueEmail("settings")
    await signUpAndConfirm(page, email)

    await page.goto("/settings")
    await page.getByLabel("Display name").fill("Minh Nguyen")
    await page.getByRole("combobox", { name: "Explanation language" }).click()
    await page.getByRole("option", { name: "Tiếng Việt" }).click()
    await page.getByRole("button", { name: "Save changes" }).click()
    await expect(page.getByText("Profile saved")).toBeVisible()

    await page.reload()
    await expect(page.getByLabel("Display name")).toHaveValue("Minh Nguyen")
    await expect(page.getByRole("combobox", { name: "Explanation language" })).toHaveText(
      "Tiếng Việt",
    )
    await expect(page.getByRole("button", { name: "Account menu" })).toHaveText("MN")

    await page.getByRole("button", { name: "Delete account" }).click()
    const dialog = page.getByRole("dialog")
    const confirm = dialog.getByRole("button", { name: "Delete permanently" })
    await expect(confirm).toBeDisabled()
    await dialog.getByLabel("Type DELETE to confirm").fill("DELETE")
    await confirm.click()
    await expect(page).toHaveURL(/\/$/)

    await page.goto("/sign-in")
    await signIn(page, email)
    await expect(page.getByRole("alert")).toHaveText("Email or password is incorrect.")
  })
})
