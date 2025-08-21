import { test, expect } from "@playwright/test"

 test.describe("Chat page", () => {
  test("unauthenticated users are redirected away from /chat", async ({ page }) => {
    await page.context().clearCookies()
    await page.addInitScript(() => {
      localStorage.removeItem("unreal_token")
    })

    await page.goto("/chat")

    // The Chat page redirects to /login, which immediately redirects to /sign-in.
    await expect(page).toHaveURL(/\/sign-in$/)

    // Basic sanity: should not be on /chat anymore
    await expect(page).not.toHaveURL(/\/chat$/)
  })
})
