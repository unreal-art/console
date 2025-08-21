import { test, expect } from "@playwright/test"

 test.describe("Settings page", () => {
  test("shows inline auth-required panel when unauthenticated and does not redirect", async ({ page }) => {
    // Ensure clean auth state
    await page.context().clearCookies()
    await page.addInitScript(() => {
      localStorage.removeItem("unreal_token")
    })

    await page.goto("/settings")

    await expect(page).toHaveURL(/\/settings$/)
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible()
    await expect(page.getByText("Wallet connection required")).toBeVisible()
    await expect(page.getByRole("button", { name: "Connect Wallet" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Go to Sign In" })).toBeVisible()
  })
})
