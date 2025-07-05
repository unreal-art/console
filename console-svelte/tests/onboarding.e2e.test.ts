import { test, expect } from "@playwright/test";
import { u } from "../playwright.config.cjs";
import sleep from "../utils/sleep";
import path from "path";
import { testData } from "./testData";
import moment from "moment";
import { tag } from "../svelte.config";

test("onboarding: new wallet creation", async ({ page }) => {
	await page.goto(`${u}`);
	await page.goto(`${u}/onboarding/`);
	await page.goto(`${u}/onboarding`);
	await page.locator("html").click();
	await page.getByRole("button", { name: "Get Started" }).click();
	await page.locator("body").press("Escape");
	await page.getByRole("button", { name: "Create Wallet" }).click();
	await page.getByPlaceholder("Enter password").dblclick();
	await page.getByPlaceholder("Enter password").fill("Hiro");
	await page.getByPlaceholder("Enter password").press("Enter");
	await page.getByPlaceholder("Enter password").press("Escape");
	await page.getByPlaceholder("Enter password").click({
		clickCount: 4,
	});
	await page.getByPlaceholder("Enter password").fill("Hiro@123");
	await page.getByPlaceholder("Enter password").press("Enter");
	await page.locator("body").press("Escape");
	await page.getByRole("button", { name: "Complete" }).click();
});

test("onboarding: import of existing wallet", async ({ page, browser, browserName }) => {
	console.log({ screenSize: page.viewportSize() });

	await page.setViewportSize({ width: 360, height: 600 });

	// await page.goto(`${u}`);
	await page.goto(`${u}/onboarding`);

	// await page.getByRole("button", { name: "Get Started" }).click();
	await page.getByTestId("get-started").click();

	console.log({ screenSize: page.viewportSize() });

	if (browserName === "chromium") {
		// FIXME: the issue is not with chromium but concurrency , vite dev is rerendering on concurrent requests
		const screenshotPath = path.join(
			testData,
			// `onboarding-flow-${browserName}-${moment().format("DD-MM-HH:mm")}.jpg`,
			`onboarding-flow-${browserName}-${tag}.jpg`,
		);

		console.log({ screenshotPath });

		await sleep(2000);

		await page.screenshot({ path: screenshotPath });

		// return; // Exit the test early
	}

	await page.getByTestId("import-wallet").click();

	// await page.getByRole("button", { name: "Import Wallet" }).click();
	// await page.getByText("Import Wallet").click();

	await page
		.getByPlaceholder("Type your secret phrase here.")
		.fill("crisp elegant stool adapt critic unusual wheel water loyal clinic viable trip\n");
	// await page.getByRole("button", { name: "Import Wallet" }).click();
	await page.getByTestId("import-wallet-submit").click();
	await page.getByPlaceholder("Enter password").click();
	await page.getByPlaceholder("Enter password").fill("Hiro@123");
	// await page.getByPlaceholder("Enter password").press("Enter");
	// either do enter or create password not
	await page.getByRole("button", { name: "Create Password" }).click();
	await page.getByRole("button", { name: "Close" }).click();
});
