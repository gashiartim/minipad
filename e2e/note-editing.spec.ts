import { test, expect } from "@playwright/test"

test.describe("Note Editing", () => {
  const savedIndicator = (page: import("@playwright/test").Page) =>
    page.locator(".sticky").locator('text=/^Saved\\s/i').first()

  const editor = (page: import("@playwright/test").Page) =>
    page.locator('[data-testid="rich-text-editor"] .ProseMirror')

  const slugFor = (testId: string) => `test-edit-note-${testId}`

  test.beforeEach(async ({ page, request }, testInfo) => {
    const slug = slugFor(testInfo.testId)
    await request.post("/api/notes", { data: { slug } })

    await page.goto(`/${slug}`)
    await page.waitForSelector('[data-testid="rich-text-editor"]', {
      timeout: 15000,
    })
    await expect(page.locator("h1")).toContainText(slug)
  })

  test("should edit note content", async ({ page }) => {
    // Edit content (TipTap)
    await editor(page).click()
    await page.keyboard.type("This is my test content")

    // Save note
    await page.getByRole("button", { name: /save/i }).click()

    // Should show saved indicator in header
    await expect(savedIndicator(page)).toBeVisible({
      timeout: 15000,
    })
  })

  test("should show unsaved changes indicator", async ({ page }) => {
    // Edit content
    await editor(page).click()
    await page.keyboard.type("Modified content")

    // Should show unsaved changes
    await expect(page.locator("text=Unsaved")).toBeVisible()
  })

  test("should auto-save when enabled", async ({ page }) => {
    // Ensure auto-save is enabled
    await page.locator("#autosave").check()

    // Edit content
    await editor(page).click()
    await page.keyboard.type("Auto-saved content")

    // Wait for auto-save (1.5s + buffer)
    await page.waitForTimeout(2000)

    // Should show saved indicator
    await expect(savedIndicator(page)).toBeVisible({
      timeout: 15000,
    })
  })

  test("should use keyboard shortcuts", async ({ page }) => {
    // Edit content
    await editor(page).click()
    await page.keyboard.type("Keyboard shortcut test")

    // Use Ctrl+S to save
    await page.keyboard.press("Control+s")

    await expect(savedIndicator(page)).toBeVisible({
      timeout: 15000,
    })
  })
})
