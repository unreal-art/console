// example.spec.js
import { test, expect } from "@playwright/test";

test.use({ javaScriptEnabled: false });

test("basic test", async ({ page }) => {
	await page.goto("https://example.com");
	const title = await page.title();
	expect(title).toBe("Example Domain");
});
