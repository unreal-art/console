import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
	await page.goto("http://localhost:5173/");
	await page.goto("http://localhost:5173/onboarding/");
	await page.getByRole("button", { name: "Get Started" }).click();
	await page.getByPlaceholder("Enter password").click();
	await page.getByPlaceholder("Enter password").fill("Ikfjns=-?3");
	await page.getByRole("button", { name: "Create Password" }).click();
	await page.getByRole("button", { name: "Complete" }).click();
	await page.getByRole("button", { name: "Close" }).click();
	await page.getByText("Kaggle").click();
	await page.getByRole("option", { name: "X/Twitter @X" }).click();
	await page.locator("#RyiLqbRGbp").click();
	await page.getByText("X/Twitter").click();
	await page.getByRole("option", { name: "Kaggle @kaggle" }).click();
});
