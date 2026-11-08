import { expect, test, type Page } from "@playwright/test"

import { signUpAndConfirm, uniqueEmail } from "./support/auth"

// Uses the starter sets from content/vocabulary-sets (pnpm content:seed + pnpm db:reset).
// Each test signs up its own learner: SRS state and daily limits are per learner.
test.use({ storageState: { cookies: [], origins: [] } })

async function setDailyLimit(page: Page, words: 5 | 10 | 15) {
  await page.goto("/settings")
  await page.getByRole("radio", { name: `${words} words`, exact: true }).click()
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByText("Profile saved")).toBeVisible()
}

/** Plays through the session, answering every game, and returns how many new words it showed. */
async function playSession(page: Page): Promise<number> {
  let newWords = 0
  for (let turn = 0; turn < 60; turn++) {
    if (await page.getByRole("heading", { name: "All done for today" }).isVisible()) return newWords

    const newWord = page.getByRole("region", { name: "New word" })
    if (await newWord.isVisible()) {
      newWords++
      await page.getByRole("button", { name: "Got it" }).click()
      continue
    }
    const recall = page.getByRole("region", { name: "Remember the meaning" })
    if (await recall.isVisible()) {
      await page.getByRole("button", { name: "Show meaning" }).click()
      await page.getByRole("button", { name: "Good", exact: true }).click()
      continue
    }
    const choice = page.getByRole("region", { name: /What does .* mean\?|Perfect pair/ })
    if (await choice.isVisible()) {
      await choice.getByRole("listitem").first().getByRole("button").click()
      await page.getByRole("button", { name: "Continue", exact: true }).click()
      continue
    }
    await page.waitForTimeout(100) // Let the next step render; never reached in a stable session.
  }
  throw new Error("The session did not finish")
}

test.describe("vocabulary", () => {
  test("add a set, learn today's words within the daily limit and see them grow", async ({
    page,
  }) => {
    await signUpAndConfirm(page, uniqueEmail("vocab"))

    await page.goto("/vocabulary")
    await expect(page.getByRole("main").getByText("Add a set to start learning")).toBeVisible()
    await page.getByRole("link", { name: "Browse vocabulary sets" }).click()
    await page.getByRole("link", { name: "Education" }).click()
    await page.getByRole("button", { name: "Start learning this set" }).click()
    await expect(page.getByRole("main").getByText("All words are in My words")).toBeVisible()

    await page.goto("/vocabulary")
    await expect(page.getByRole("main").getByText("10 new words waiting")).toBeVisible()

    await setDailyLimit(page, 5)
    await page.goto("/vocabulary/review")
    // Focus mode: no app navigation.
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0)
    expect(await playSession(page)).toBe(5)
    await expect(page.getByRole("main").getByText(/Nice work|on fire/)).toBeVisible()

    await page.goto("/vocabulary")
    await expect(page.getByRole("main").getByText("1/5 days this week")).toBeVisible()
    const bed = page.getByRole("main").getByRole("list", { name: "Education" })
    await expect(bed.getByText(/: sprout \(learning\)/)).toHaveCount(5)
    await expect(bed.getByText(/: seed \(not introduced yet\)/)).toHaveCount(5)

    // The limit holds for the rest of the day.
    await page.goto("/vocabulary/review")
    await expect(page.getByRole("heading", { name: "All done for today" })).toBeVisible()
    await expect(page.getByRole("region", { name: "New word" })).toHaveCount(0)
  })

  test("a word page explains the word in both languages", async ({ page }) => {
    await signUpAndConfirm(page, uniqueEmail("word"))
    await page.goto("/vocabulary/words/sustainable")
    const card = page.getByRole("article", { name: "Word: sustainable" })
    await expect(card).toContainText("bền vững")
    await expect(card).toContainText(
      "able to continue for a long time without damaging the environment",
    )
    await expect(card).toContainText("Cities need sustainable transport")
    await expect(card).toContainText("sustainable development")
    await page.getByRole("button", { name: "Add to My words" }).click()
    await expect(page.getByRole("main").getByText("In My words")).toBeVisible()
  })
})
