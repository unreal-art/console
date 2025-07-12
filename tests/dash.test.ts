import { test, expect } from "@playwright/test"

test("test", async ({ page }) => {
  await page.goto("http://localhost:8080/")
  await page
    .getByRole("button", { name: "Connect Wallet & Get Started" })
    .click()
  const page1Promise = page.waitForEvent("popup")
  await page.getByRole("button", { name: "View API Docs" }).click()
  const page1 = await page1Promise
})
