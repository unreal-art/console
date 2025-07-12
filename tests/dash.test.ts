import { test, expect } from "@playwright/test"
import { u } from "../playwright.config"

test.describe('Unreal Console E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application before each test
    await page.goto(u)
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle')
  })

  test('should load the homepage correctly', async ({ page }) => {
    // Verify the page title
    await expect(page).toHaveTitle(/Unreal AI/)
    
    // Verify key UI elements are visible
    await expect(page.getByText('The Open, On-Chain')).toBeVisible()
    await expect(page.getByText('AI API for Builders')).toBeVisible()
    
    // Verify the logo is visible
    await expect(page.locator('img[alt="Unreal AI Logo"]')).toBeVisible()
  })

  test('should open API docs in a new tab', async ({ page, context }) => {
    // Wait for the new page event
    const pagePromise = context.waitForEvent('page')
    
    // Click the API docs button
    await page.getByRole('button', { name: 'View API Docs' }).click()
    
    // Get the new page
    const newPage = await pagePromise
    await newPage.waitForLoadState()
    
    // Verify the URL contains the docs URL
    const url = newPage.url()
    expect(url).toContain('docs.unreal.art')
  })

  test('should show wallet connect button in nav bar', async ({ page }) => {
    // Verify the connect wallet button is visible in the nav bar
    const navButton = page.locator('.fixed.top-0 button:has-text("Connect Wallet")')
    await expect(navButton).toBeVisible()
  })

  test('should show wallet connect button in hero section', async ({ page }) => {
    // Verify the connect wallet button is visible in the hero section
    const heroButton = page.locator('.container.mx-auto.px-6.text-center button:has-text("Connect Wallet")')
    await expect(heroButton).toBeVisible()
  })

  test('should scroll to onboarding section when wallet button is clicked', async ({ page }) => {
    // Click the connect wallet button
    await page.getByRole('button', { name: 'Connect Wallet & Get Started' }).click()
    
    // Wait for scroll animation to complete
    await page.waitForTimeout(1000)
    
    // Verify we've scrolled down (this is a simple check - in a real test you might want to check the actual section is visible)
    const scrollPosition = await page.evaluate(() => window.scrollY)
    expect(scrollPosition).toBeGreaterThan(0)
  })
})
