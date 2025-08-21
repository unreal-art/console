import { test, expect } from "@playwright/test"

 test.describe("Playground", () => {
  test("reads prompt and autorun; shows unauthenticated error", async ({ page }) => {
    await page.context().clearCookies()
    await page.addInitScript(() => {
      localStorage.removeItem("unreal_token")
    })

    // Ensure md breakpoint so prompt preview is visible
    await page.setViewportSize({ width: 1200, height: 800 })

    const prompt = "Hello from tests"
    await page.goto(`/playground?prompt=${encodeURIComponent(prompt)}&autorun=1`)

    await expect(page.getByRole("heading", { name: "Streaming Playground" })).toBeVisible()

    // Prompt preview (visible on >= md)
    await expect(page.getByText(`Prompt: ${prompt}`)).toBeVisible()

    // Autorun should attempt and fail due to unauthenticated state
    await expect(page.getByText("You need to connect your wallet first to run this demo.")).toBeVisible()

    // Error actions present
    await expect(page.getByRole("button", { name: "Go to Settings" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible()
  })
})
