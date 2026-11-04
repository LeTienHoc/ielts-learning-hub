import { mkdirSync } from "node:fs"
import path from "node:path"

import { test as setup } from "@playwright/test"

import { AUTH_STATE } from "../../playwright.config"

import { signUpAndConfirm, uniqueEmail } from "./support/auth"

setup("create and sign in a confirmed learner", async ({ page }) => {
  await signUpAndConfirm(page, uniqueEmail("learner"), "E2E Learner")
  mkdirSync(path.dirname(AUTH_STATE), { recursive: true })
  await page.context().storageState({ path: AUTH_STATE })
})
