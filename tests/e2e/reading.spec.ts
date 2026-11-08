import { expect, test, type Page } from "@playwright/test"

import { signUpAndConfirm, uniqueEmail } from "./support/auth"

// Uses the sample set from content/practice-sets (loaded by `pnpm content:seed` + `pnpm db:reset`).
const SET_TITLE = "Rooftop gardens in growing cities"
const FULL_TEST_TITLE = "Academic Reading test 1"

// One active attempt per learner and set: each test signs up its own learner so parallel
// projects (desktop, mobile) never share an attempt.
test.use({ storageState: { cookies: [], origins: [] } })

async function openSet(page: Page) {
  await signUpAndConfirm(page, uniqueEmail("reading"))
  await page.goto("/reading")
  await page.getByRole("link", { name: SET_TITLE }).click()
  await expect(page.getByRole("heading", { level: 1, name: SET_TITLE })).toBeVisible()
}

/** Small screens show one panel at a time; open the questions (no-op on desktop). */
async function showQuestions(page: Page) {
  const tab = page.getByRole("tab", { name: "Questions", exact: true })
  if (await tab.isVisible()) await tab.click()
}

test.describe("reading practice", () => {
  test("learn mode: answer, resume after reload, submit and review", async ({ page }) => {
    await openSet(page)
    await page.getByRole("button", { name: "Start learn mode" }).click()
    await expect(page).toHaveURL(/\/reading\/reading-rooftop-gardens\/attempt\/[0-9a-f-]{36}$/)
    const attemptUrl = page.url()

    // Focus mode: no app navigation, a clear exit and the passage.
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0)
    await expect(page.getByRole("link", { name: "Exit" })).toBeVisible()
    await expect(page.getByRole("article", { name: "Reading passage" })).toContainText(
      "flat roofs are among the least used spaces",
    )
    await showQuestions(page)

    await page.getByRole("combobox", { name: "Answer for Question 1" }).click()
    await page.getByRole("option", { name: /A cooler building in hot weather/ }).click()
    await page
      .getByRole("group", { name: /often visited by members of the public/ })
      .getByRole("radio", { name: "FALSE" })
      .click()
    await page.getByRole("textbox", { name: "Answer for question 7" }).fill("  Moisture ")
    await page.getByRole("checkbox", { name: /regular weeding/ }).click()
    await page.getByRole("checkbox", { name: /repairing waterproof layers/ }).click()
    await expect(page.getByText("5 of 11 answered")).toBeVisible()
    await expect(page.getByText("All answers saved")).toBeVisible()

    // Answers are on the server: a reload resumes the same attempt with them.
    await page.reload()
    await expect(page.getByText("5 of 11 answered")).toBeVisible()
    await showQuestions(page)
    // Saved answers are trimmed on the server.
    await expect(page.getByRole("textbox", { name: "Answer for question 7" })).toHaveValue(
      "Moisture",
    )

    await page.getByRole("button", { name: "Submit" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toContainText("You have 6 unanswered questions.")
    await dialog.getByRole("button", { name: "Submit answers" }).click()

    await expect(page).toHaveURL(/\/attempt\/[0-9a-f-]{36}\/review$/)
    // Q1, Q4, Q7 (case and spaces ignored) and both marks of Q9: 5 of 11 marks.
    await expect(page.getByText("5 / 11")).toBeVisible()
    const answers = page.getByRole("list", { name: "Answers and explanations" })
    await expect(answers.getByRole("listitem").first()).toContainText("Correct")
    await expect(answers).toContainText("The most frequently cited benefit is temperature control.")
    await expect(answers.getByRole("listitem").nth(4)).toContainText("Not answered")

    // A submitted attempt cannot be reopened for editing: its URL leads to the results.
    await page.goto(attemptUrl)
    await expect(page).toHaveURL(`${attemptUrl}/review`)

    // The set has no active attempt any more, so both modes can start again.
    await page.goto("/reading/reading-rooftop-gardens")
    await expect(page.getByRole("button", { name: "Start learn mode" })).toBeVisible()
  })

  test("test mode: timer, leave and continue the same attempt", async ({ page }) => {
    await openSet(page)
    await page.getByRole("button", { name: "Start test" }).click()
    await expect(page).toHaveURL(/\/attempt\/[0-9a-f-]{36}$/)
    const attemptUrl = page.url()

    await expect(page.getByText("Time remaining:")).toBeAttached()
    await expect(page.getByText(/^(20:00|19:5\d)$/)).toBeVisible()
    await showQuestions(page)
    await page.getByRole("textbox", { name: "Answer for question 8" }).fill("reinforcement")
    await expect(page.getByText("All answers saved")).toBeVisible()

    await page.getByRole("link", { name: "Exit" }).click()
    await expect(
      page.getByRole("heading", { name: "You have an unfinished attempt" }),
    ).toBeVisible()
    await page.getByRole("link", { name: "Continue" }).click()
    await expect(page).toHaveURL(attemptUrl)
    await expect(page.getByRole("textbox", { name: "Answer for question 8" })).toHaveValue(
      "reinforcement",
    )
  })

  test("library filters by question type and level", async ({ page }) => {
    await signUpAndConfirm(page, uniqueEmail("reading-filters"))
    await page.goto("/reading")
    const main = page.getByRole("main")

    await main
      .getByRole("navigation", { name: "Filter by question type" })
      .getByRole("link", { name: "True / False / Not Given", exact: true })
      .click()
    await expect(page).toHaveURL(/\/reading\?type=true_false_not_given$/)
    await expect(main.getByRole("link", { name: SET_TITLE })).toBeVisible()
    await expect(main.getByRole("link", { name: FULL_TEST_TITLE })).toBeVisible()

    await main
      .getByRole("navigation", { name: "Filter by level" })
      .getByRole("link", { name: "C1", exact: true })
      .click()
    await expect(page).toHaveURL(/type=true_false_not_given&level=C1$/)
    await expect(main.getByText("No sets match these filters")).toBeVisible()

    await main.getByRole("link", { name: "Clear filters" }).first().click()
    await expect(page).toHaveURL(/\/reading$/)
    await expect(main.getByRole("link", { name: FULL_TEST_TITLE })).toBeVisible()
  })

  test("full test: passages, band estimate, evidence and history", async ({ page }, testInfo) => {
    await signUpAndConfirm(page, uniqueEmail("reading-full"))
    await page.goto("/reading")
    await page.getByRole("link", { name: FULL_TEST_TITLE }).click()
    const main = page.getByRole("main")
    await expect(main.getByText("60 minutes, like the real exam.")).toBeVisible()
    await expect(main.getByText(/3 passages · 40 questions/)).toBeVisible()

    await main.getByRole("button", { name: "Start learn mode" }).click()
    await expect(page).toHaveURL(/\/reading\/reading-full-test-1\/attempt\/[0-9a-f-]{36}$/)

    await page.getByRole("tab", { name: "Passage 3" }).click()
    await expect(
      page.getByRole("heading", { name: "Crowded but alone? Cities and loneliness" }),
    ).toBeVisible()

    await showQuestions(page)
    await expect(page.getByRole("region", { name: "Passage 3 · Questions 27–31" })).toBeVisible()
    await page
      .getByRole("group", { name: /much more likely to feel lonely/ })
      .getByRole("radio", { name: "NO", exact: true })
      .click()

    if (testInfo.project.name === "mobile") {
      // One panel at a time on small screens; a typed answer survives switching.
      const answer = page.getByRole("textbox", { name: "Answer for question 36" })
      await answer.fill("belonging")
      await page.getByRole("tab", { name: "Passage", exact: true }).click()
      await expect(answer).toBeHidden()
      await showQuestions(page)
      await expect(answer).toHaveValue("belonging")
    }
    await expect(page.getByText("All answers saved")).toBeVisible()

    await page.getByRole("button", { name: "Submit" }).click()
    await page.getByRole("dialog").getByRole("button", { name: "Submit answers" }).click()
    await expect(page).toHaveURL(/\/review$/)
    const reviewUrl = page.url()
    await expect(main.getByText(/^Estimated band \d/)).toBeVisible()
    await expect(main.getByText(/not an official score/)).toBeVisible()

    const answers = main.getByRole("list", { name: "Answers and explanations" })
    const question27 = answers.getByRole("listitem").filter({ hasText: "Question 27" })
    await expect(question27).toContainText("Correct")
    await question27.getByRole("button", { name: "Show in passage" }).click()
    await expect(
      main.locator("mark", {
        hasText: "people in rural areas report feeling lonely about as often as those in cities",
      }),
    ).toBeVisible()

    await page.goto("/reading/history")
    const history = page.getByRole("list", { name: "Reading attempts" })
    await expect(history.getByRole("listitem")).toHaveCount(1)
    await expect(history).toContainText(FULL_TEST_TITLE)
    await expect(history).toContainText("Learn mode")
    await history.getByRole("link", { name: new RegExp(FULL_TEST_TITLE) }).click()
    await expect(page).toHaveURL(reviewUrl)
  })

  test("highlights stay after a reload and key words go to My words", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Text selection is driven on desktop only")
    await openSet(page)
    await page.getByRole("button", { name: "Start learn mode" }).click()
    await expect(page).toHaveURL(/\/attempt\/[0-9a-f-]{36}$/)

    await expect(page.getByRole("article", { name: "Reading passage" })).toBeVisible()
    // Select the first words of paragraph A, then highlight them.
    await page.evaluate(() => {
      const paragraph = document.querySelector("[data-offset]")
      if (!paragraph) throw new Error("No passage paragraph")
      const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT)
      const text = walker.nextNode()
      if (!text) throw new Error("No passage text")
      const range = document.createRange()
      range.setStart(text, 3)
      range.setEnd(text, 14)
      document.getSelection()?.removeAllRanges()
      document.getSelection()?.addRange(range)
    })
    await page.getByRole("button", { name: "Highlight", exact: true }).click()
    await expect(page.locator("mark", { hasText: "Across many" })).toBeVisible()

    await page.reload()
    await expect(page.locator("mark", { hasText: "Across many" })).toBeVisible()

    await page.getByRole("button", { name: "vegetation", exact: true }).click()
    const popover = page.getByRole("dialog")
    await expect(popover).toContainText("plants in general")
    await popover.getByRole("button", { name: "Add to My words" }).click()
    await expect(popover.getByText("In My words")).toBeVisible()
  })

  // The page shell streams before the data check, so the status stays 200; Next.js renders
  // the not-found page and marks it noindex.
  test("unknown sets, attempts and invalid ids show not found", async ({ page }) => {
    await signUpAndConfirm(page, uniqueEmail("reading-404"))
    for (const path of [
      "/reading/no-such-set",
      "/reading/reading-rooftop-gardens/attempt/00000000-0000-4000-8000-000000000000",
      "/reading/reading-rooftop-gardens/attempt/not-a-uuid/review",
    ]) {
      await page.goto(path)
      await expect(page.getByText("Page not found")).toBeVisible()
    }
  })
})
