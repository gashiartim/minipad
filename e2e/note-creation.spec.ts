import { test, expect } from "@playwright/test"

test.describe("Note Creation", () => {
  test("should create a new note", async ({ page }) => {
    const slug = `test-note-${Date.now()}`
    await page.goto("/")

    await page.getByRole("textbox", { name: "Note Name" }).fill(slug)
    await page.getByRole("button", { name: /^Create/i }).click()

    // Should navigate to note page
    await page.waitForURL(new RegExp(`/${slug}$`), { timeout: 15000 })
    await page.waitForSelector('[data-testid="rich-text-editor"]', {
      timeout: 15000,
    })
    await expect(page.locator("text=Live")).toBeVisible({ timeout: 15000 })
  })

  test("should create note with generated slug", async ({ page }) => {
    await page.goto("/")

    await page.getByRole("button", { name: /^Create/i }).click()

    // Should navigate to generated slug
    await page.waitForURL(/\/[a-zA-Z0-9]{8}$/, { timeout: 15000 })
  })

  test("should open existing note", async ({ page, request }) => {
    const slug = `existing-note-${Date.now()}`
    await request.post("/api/notes", {
      data: { slug: "existing-note" },
    })

    await page.goto("/")

    await page
      .getByRole("textbox", { name: "Note Name" })
      .fill(slug)
    await page.getByRole("button", { name: /Open Existing Note/i }).click()

    // Should navigate to note page
    await page.waitForURL(new RegExp(`/${slug}$`), { timeout: 15000 })
  })

  test("should validate slug input", async ({ page }) => {
    await page.goto("/")

    // Open button should be disabled when slug is empty
    await expect(
      page.getByRole("button", {
        name: /Enter a note name above to open existing note/i,
      })
    ).toBeDisabled()
  })
})
