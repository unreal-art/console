import { test, expect } from "@playwright/test"

test.describe("Removed Chat route", () => {
  test("navigating to /chat shows 404 Not Found", async ({ page }) => {
    await page.context().clearCookies()
    await page.addInitScript(() => {
      localStorage.removeItem("unreal_token")
    })

    await page.goto("/chat")

    // Should remain on /chat but render the NotFound page
    await expect(page).toHaveURL(/\/chat$/)
    await expect(page.getByText("Page not found")).toBeVisible()
    await expect(page.getByRole("link", { name: "Return to Home" })).toBeVisible()
  })
})
