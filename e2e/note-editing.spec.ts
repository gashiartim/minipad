import { test, expect } from "@playwright/test"

test.describe("Note Editing", () => {
  test.beforeEach(async ({ page }) => {
    // Create a test note first
    await page.goto("/")
    await page.fill('[data-testid="slug-input"]', "test-edit-note")
    await page.click('[data-testid="create-button"]')
    await expect(page).toHaveURL("/test-edit-note")
  })

  test("should edit note content", async ({ page }) => {
    // Edit content
    await page.fill('[data-testid="content-textarea"]', "This is my test content")

    // Save note
    await page.click('[data-testid="save-button"]')

    // Should show success toast
    await expect(page.locator('[role="alert"]')).toContainText("Note saved successfully")
  })

  test("should show unsaved changes indicator", async ({ page }) => {
    // Edit content
    await page.fill('[data-testid="content-textarea"]', "Modified content")

    // Should show unsaved changes
    await expect(page.locator('[data-testid="unsaved-indicator"]')).toBeVisible()
  })

  test("should auto-save when enabled", async ({ page }) => {
    // Ensure auto-save is enabled
    await page.check('[data-testid="autosave-checkbox"]')

    // Edit content
    await page.fill('[data-testid="content-textarea"]', "Auto-saved content")

    // Wait for auto-save (1.5s + buffer)
    await page.waitForTimeout(2000)

    // Should show saved indicator
    await expect(page.locator('[role="alert"]')).toContainText("Note saved successfully")
  })

  test("should use keyboard shortcuts", async ({ page }) => {
    // Edit content
    await page.fill('[data-testid="content-textarea"]', "Keyboard shortcut test")

    // Use Ctrl+S to save
    await page.keyboard.press("Control+s")

    // Should show success toast
    await expect(page.locator('[role="alert"]')).toContainText("Note saved successfully")
  })
})
