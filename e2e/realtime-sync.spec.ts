import { test, expect, Page, BrowserContext } from "@playwright/test"

test.describe("Real-time note synchronization", () => {
  let context1: BrowserContext
  let context2: BrowserContext
  let page1: Page
  let page2: Page
  const testSlug = `test-note-${Date.now()}`

  test.beforeAll(async ({ browser }) => {
    context1 = await browser.newContext()
    context2 = await browser.newContext()
    
    page1 = await context1.newPage()
    page2 = await context2.newPage()
  })

  test.afterAll(async () => {
    await context1.close()
    await context2.close()
  })

  test("should sync content changes across multiple browser instances", async () => {
    await Promise.all([
      page1.goto(`/${testSlug}`),
      page2.goto(`/${testSlug}`)
    ])

    await Promise.all([
      page1.waitForSelector('[data-testid="rich-text-editor"]', { timeout: 10000 }),
      page2.waitForSelector('[data-testid="rich-text-editor"]', { timeout: 10000 })
    ])

    await Promise.all([
      expect(page1.locator('text=Live')).toBeVisible(),
      expect(page2.locator('text=Live')).toBeVisible()
    ])

    const testContent = "Hello from page 1!"
    await page1.locator('[data-testid="rich-text-editor"]').click()
    await page1.locator('[data-testid="rich-text-editor"]').fill(testContent)

    await expect(page1.locator('text=Saved')).toBeVisible({ timeout: 5000 })

    await expect(page2.locator('[data-testid="rich-text-editor"]')).toContainText(testContent, { timeout: 5000 })
  })

  test("should handle concurrent edits with conflict resolution", async () => {
    const newSlug = `concurrent-test-${Date.now()}`
    
    await Promise.all([
      page1.goto(`/${newSlug}`),
      page2.goto(`/${newSlug}`)
    ])

    await Promise.all([
      expect(page1.locator('text=Live')).toBeVisible(),
      expect(page2.locator('text=Live')).toBeVisible()
    ])

    await Promise.all([
      page1.locator('input[type="checkbox"][id="autosave"]').uncheck(),
      page2.locator('input[type="checkbox"][id="autosave"]').uncheck()
    ])

    await page1.locator('[data-testid="rich-text-editor"]').fill("Content from user 1")
    await page2.locator('[data-testid="rich-text-editor"]').fill("Content from user 2")

    await page1.locator('button:has-text("Save")').click()
    await expect(page1.locator('text=Saved')).toBeVisible()

    await page2.locator('button:has-text("Save")').click()
    
    const hasConflictToast = await page2.locator('text=updated by another user').isVisible({ timeout: 2000 })
    const hasUnsavedIndicator = await page2.locator('text=Unsaved').isVisible()
    
    expect(hasConflictToast || hasUnsavedIndicator).toBeTruthy()
  })

  test("should maintain connection across page refreshes", async () => {
    const refreshSlug = `refresh-test-${Date.now()}`
    
    await page1.goto(`/${refreshSlug}`)
    await expect(page1.locator('text=Live')).toBeVisible()

    await page1.locator('[data-testid="rich-text-editor"]').fill("Content before refresh")
    await expect(page1.locator('text=Saved')).toBeVisible()

    await page1.reload()
    
    await expect(page1.locator('text=Live')).toBeVisible({ timeout: 10000 })
    await expect(page1.locator('[data-testid="rich-text-editor"]')).toContainText("Content before refresh")
  })

  test("should show connection status accurately", async () => {
    const statusSlug = `status-test-${Date.now()}`
    
    await page1.goto(`/${statusSlug}`)
    
    await expect(page1.locator('text=Live')).toBeVisible({ timeout: 10000 })
    
    await expect(page1.locator('.bg-green-500')).toBeVisible()
  })

  test("should handle note updates from API correctly", async () => {
    const apiSlug = `api-test-${Date.now()}`
    
    await page1.goto(`/${apiSlug}`)
    await expect(page1.locator('text=Live')).toBeVisible()

    const response = await page1.request.put(`/api/notes/${apiSlug}`, {
      data: {
        contentRich: "<p>Content updated via API</p>",
        contentFormat: "rich"
      },
      headers: {
        "Content-Type": "application/json"
      }
    })

    expect(response.status()).toBe(200)

    await expect(page1.locator('[data-testid="rich-text-editor"]')).toContainText("Content updated via API", { timeout: 5000 })
  })

  test("should handle multiple users editing simultaneously", async () => {
    const multiUserSlug = `multi-user-${Date.now()}`
    
    const context3 = await page1.context().browser()!.newContext()
    const page3 = await context3.newPage()

    try {
      await Promise.all([
        page1.goto(`/${multiUserSlug}`),
        page2.goto(`/${multiUserSlug}`),
        page3.goto(`/${multiUserSlug}`)
      ])

      await Promise.all([
        expect(page1.locator('text=Live')).toBeVisible(),
        expect(page2.locator('text=Live')).toBeVisible(),
        expect(page3.locator('text=Live')).toBeVisible()
      ])

      await page1.locator('[data-testid="rich-text-editor"]').fill("User 1 content")
      await expect(page1.locator('text=Saved')).toBeVisible()

      await Promise.all([
        expect(page2.locator('[data-testid="rich-text-editor"]')).toContainText("User 1 content", { timeout: 5000 }),
        expect(page3.locator('[data-testid="rich-text-editor"]')).toContainText("User 1 content", { timeout: 5000 })
      ])

      await page2.locator('[data-testid="rich-text-editor"]').fill("User 1 content\\nUser 2 addition")
      await expect(page2.locator('text=Saved')).toBeVisible()

      await Promise.all([
        expect(page1.locator('[data-testid="rich-text-editor"]')).toContainText("User 2 addition", { timeout: 5000 }),
        expect(page3.locator('[data-testid="rich-text-editor"]')).toContainText("User 2 addition", { timeout: 5000 })
      ])

    } finally {
      await context3.close()
    }
  })
})