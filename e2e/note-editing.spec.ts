import { test, expect } from "@playwright/test"

test.describe("Note Editing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.fill('[data-testid="slug-input"]', "test-edit-note")
    await page.click('[data-testid="create-button"]')
    await expect(page).toHaveURL("/test-edit-note")
  })

  test("should edit note content", async ({ page }) => {
    await page.fill('[data-testid="content-textarea"]', "This is my test content")

    await page.click('[data-testid="save-button"]')

    await expect(page.locator('[role="alert"]')).toContainText("Note saved successfully")
  })

  test("should show unsaved changes indicator", async ({ page }) => {
    await page.fill('[data-testid="content-textarea"]', "Modified content")

    await expect(page.locator('[data-testid="unsaved-indicator"]')).toBeVisible()
  })

  test("should auto-save when enabled", async ({ page }) => {
    await page.check('[data-testid="autosave-checkbox"]')

    await page.fill('[data-testid="content-textarea"]', "Auto-saved content")

    await page.waitForTimeout(2000)

    await expect(page.locator('[role="alert"]')).toContainText("Note saved successfully")
  })

  test("should use keyboard shortcuts", async ({ page }) => {
    await page.fill('[data-testid="content-textarea"]', "Keyboard shortcut test")

    await page.keyboard.press("Control+s")

    await expect(page.locator('[role="alert"]')).toContainText("Note saved successfully")
  })
})
