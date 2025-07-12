// playwright.config.ts
import { chromium, defineConfig, devices } from "@playwright/test"

const PORT = process.env.PORT ?? "8080"
export const u = `http://localhost:${PORT}`

const CI = process.env.CI ?? false

/**NOP: no parallel tests */
const FULLY_PARALLEL = process.env.NOP ? false : true

console.log({ fullyParallel: FULLY_PARALLEL })
console.log({ u })
console.log({ CI })

let runners = []

if (CI) {
  runners = [
    ...runners,

    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // viewport: { width: 1920, height: 1080 },
      // https://www.lambdatest.com/support/docs/playwright-test-execution-setup/ : expected values
    },
  ]
}

export default defineConfig({
  testDir: "./tests",
  testIgnore: "**/ignore/**",
  // testMatch: '*todo-tests/*.spec.ts',
  timeout: 30 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: FULLY_PARALLEL,
  forbidOnly: !!CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: [["html", { outputFolder: "playwright-report" }]],
  use: {
    actionTimeout: 0,
    baseURL: u,
    trace: "on-first-retry",
    viewport: { width: 360, height: 600 },
    colorScheme: "dark",
    offline: false,
    javaScriptEnabled: true,
    isMobile: true,
    // https://playwright.dev/docs/emulation#javascript-enabled
  },
  // Run your local dev server before starting the tests.
  webServer: {
    reuseExistingServer: ["5173", PORT].includes(PORT),
    command: process.env.WEB_CMD || "bun dev ",
    url: u,
  },
  projects: [
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    ...runners,
    // {
    // 	name: "webkit",
    // 	use: { ...devices["Desktop Safari"] },
    // },
  ],
})

const capabilities = {
  browserName: "Chrome", // Browsers allowed: `Chrome`, `MicrosoftEdge`, `pw-chromium`, `pw-firefox` and `pw-webkit`
  browserVersion: "latest",
  "LT:Options": {
    platform: "Windows 10",
    build: "Playwright Sample Build",
    name: "Playwright Sample Test",
    user: process.env.LT_USERNAME,
    accessKey: process.env.LT_ACCESS_KEY,
    "ms:edgeOptions": ["--user-agent=<Any custom user agent>"],
  },
}

// const browser = await chromium.connect({
//   wsEndpoint: `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify(capabilities))}`
// })

// let response = JSON.parse(await page.evaluate(_ => {}, `lambdatest_action: ${JSON.stringify({ action: 'getTestDetails' })}`))
// console.log(response);
// https://www.lambdatest.com/support/docs/playwright-test-execution-setup/
