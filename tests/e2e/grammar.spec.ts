import { expect, test } from "@playwright/test"

import { signUpAndConfirm, uniqueEmail } from "./support/auth"

// Uses the starter topics from content/grammar-topics (pnpm content:seed + pnpm db:reset).
test.use({ storageState: { cookies: [], origins: [] } })

test.describe("grammar", () => {
  test("read a lesson, check answers instantly, submit and see mastery", async ({ page }) => {
    await signUpAndConfirm(page, uniqueEmail("grammar"))

    await page.goto("/grammar")
    await expect(page.getByRole("main").getByText("Not started")).toHaveCount(4)
    await page.getByRole("link", { name: "Articles: a, an, the" }).click()
    await expect(page.getByRole("heading", { name: "A or an? Listen, don't look" })).toBeVisible()
    await expect(page.getByRole("list", { name: "Common mistakes" })).toContainText(
      "an honest teacher",
    )

    await page.getByRole("button", { name: "Start practice" }).click()
    await expect(page).toHaveURL(/\/grammar\/articles\/practice\/[0-9a-f-]{36}$/)

    // Spot the mistake: tap the wrong word, check it, read why.
    const sentence = page.getByRole("radiogroup", { name: "Tap the wrong word in Question 6" })
    await sentence.getByRole("radio", { name: "a", exact: true }).click()
    await page.getByRole("button", { name: "Check answer 6" }).click()
    const feedback = page.getByRole("status", { name: "Feedback for question 6" })
    await expect(feedback).toContainText("Correct!")
    await expect(feedback).toContainText("He is an honest man.")
    await expect(sentence.getByRole("radio", { name: "honest" })).toBeDisabled()

    // A wrong check shows the right answer.
    await page
      .getByRole("radiogroup", { name: "Answer for Question 1" })
      .getByRole("radio", { name: "a", exact: true })
      .click()
    await page.getByRole("button", { name: "Check answer 1" }).click()
    await expect(page.getByRole("status", { name: "Feedback for question 1" })).toContainText(
      "Not quite",
    )

    await page.getByRole("button", { name: "Submit" }).click()
    await page.getByRole("dialog").getByRole("button", { name: "Submit answers" }).click()
    await expect(page).toHaveURL(/\/review$/)
    await expect(page.getByRole("main").getByText("1 / 8")).toBeVisible()
    await expect(page.getByRole("main").getByText("a → He is an honest man.")).toBeVisible()

    await page.goto("/grammar")
    await expect(page.getByRole("main").getByText("Practising · 13%")).toBeVisible()
  })
})
