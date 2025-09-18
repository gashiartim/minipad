import { test, expect } from "@playwright/test"

test.describe("Note Creation", () => {
  test("should create a new note", async ({ page }) => {
    await page.goto("/")

    // Fill in note details
    await page.fill('[data-testid="slug-input"]', "test-note")
    await page.fill('[data-testid="secret-input"]', "test-secret")

    // Create note
    await page.click('[data-testid="create-button"]')

    // Should navigate to note page
    await expect(page).toHaveURL("/test-note")
    await expect(page.locator("h1")).toContainText("test-note")
  })

  test("should create note with generated slug", async ({ page }) => {
    await page.goto("/")

    // Create note without slug
    await page.click('[data-testid="create-button"]')

    // Should navigate to generated slug
    await expect(page.url()).toMatch(/\/[a-zA-Z0-9]{8}$/)
  })

  test("should open existing note", async ({ page }) => {
    await page.goto("/")

    // Enter slug and click open
    await page.fill('[data-testid="slug-input"]', "existing-note")
    await page.click('[data-testid="open-button"]')

    // Should navigate to note page
    await expect(page).toHaveURL("/existing-note")
  })

  test("should validate slug input", async ({ page }) => {
    await page.goto("/")

    // Try to open without slug
    await page.click('[data-testid="open-button"]')

    // Should show error toast
    await expect(page.locator('[role="alert"]')).toContainText("Please enter a slug")
  })
})
