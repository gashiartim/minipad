import { test, expect, Page, BrowserContext } from "@playwright/test"

test.describe("Real-time note synchronization", () => {
  let context1: BrowserContext
  let context2: BrowserContext
  let page1: Page
  let page2: Page
  const testSlug = `test-note-${Date.now()}`

  test.beforeAll(async ({ browser }) => {
    // Create two separate browser contexts to simulate different users
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
    // Navigate both pages to the same note
    await Promise.all([
      page1.goto(`/${testSlug}`),
      page2.goto(`/${testSlug}`)
    ])

    // Wait for both pages to load and connect
    await Promise.all([
      page1.waitForSelector('[data-testid="rich-text-editor"]', { timeout: 10000 }),
      page2.waitForSelector('[data-testid="rich-text-editor"]', { timeout: 10000 })
    ])

    // Check that both pages show "Live" connection status
    await Promise.all([
      expect(page1.locator('text=Live')).toBeVisible(),
      expect(page2.locator('text=Live')).toBeVisible()
    ])

    // Type content in page1's editor
    const testContent = "Hello from page 1!"
    await page1.locator('[data-testid="rich-text-editor"]').click()
    await page1.locator('[data-testid="rich-text-editor"]').fill(testContent)

    // Wait for auto-save to complete on page1
    await expect(page1.locator('text=Saved')).toBeVisible({ timeout: 5000 })

    // Verify content appears in page2 within reasonable time
    await expect(page2.locator('[data-testid="rich-text-editor"]')).toContainText(testContent, { timeout: 5000 })
  })

  test("should handle concurrent edits with conflict resolution", async () => {
    const newSlug = `concurrent-test-${Date.now()}`
    
    await Promise.all([
      page1.goto(`/${newSlug}`),
      page2.goto(`/${newSlug}`)
    ])

    // Wait for connection
    await Promise.all([
      expect(page1.locator('text=Live')).toBeVisible(),
      expect(page2.locator('text=Live')).toBeVisible()
    ])

    // Disable auto-save temporarily to create conflict scenario
    await Promise.all([
      page1.locator('input[type="checkbox"][id="autosave"]').uncheck(),
      page2.locator('input[type="checkbox"][id="autosave"]').uncheck()
    ])

    // Both users type different content
    await page1.locator('[data-testid="rich-text-editor"]').fill("Content from user 1")
    await page2.locator('[data-testid="rich-text-editor"]').fill("Content from user 2")

    // User 1 saves first
    await page1.locator('button:has-text("Save")').click()
    await expect(page1.locator('text=Saved')).toBeVisible()

    // User 2 should see conflict notification when trying to save
    await page2.locator('button:has-text("Save")').click()
    
    // Check if conflict is handled (either by toast notification or content preservation)
    const hasConflictToast = await page2.locator('text=updated by another user').isVisible({ timeout: 2000 })
    const hasUnsavedIndicator = await page2.locator('text=Unsaved').isVisible()
    
    expect(hasConflictToast || hasUnsavedIndicator).toBeTruthy()
  })

  test("should maintain connection across page refreshes", async () => {
    const refreshSlug = `refresh-test-${Date.now()}`
    
    await page1.goto(`/${refreshSlug}`)
    await expect(page1.locator('text=Live')).toBeVisible()

    // Add some content
    await page1.locator('[data-testid="rich-text-editor"]').fill("Content before refresh")
    await expect(page1.locator('text=Saved')).toBeVisible()

    // Refresh the page
    await page1.reload()
    
    // Should reconnect and preserve content
    await expect(page1.locator('text=Live')).toBeVisible({ timeout: 10000 })
    await expect(page1.locator('[data-testid="rich-text-editor"]')).toContainText("Content before refresh")
  })

  test("should show connection status accurately", async () => {
    const statusSlug = `status-test-${Date.now()}`
    
    await page1.goto(`/${statusSlug}`)
    
    // Should start with connecting/offline state, then show Live
    await expect(page1.locator('text=Live')).toBeVisible({ timeout: 10000 })
    
    // Check that the connection indicator is green
    await expect(page1.locator('.bg-green-500')).toBeVisible()
  })

  test("should handle note updates from API correctly", async () => {
    const apiSlug = `api-test-${Date.now()}`
    
    // Open note in browser
    await page1.goto(`/${apiSlug}`)
    await expect(page1.locator('text=Live')).toBeVisible()

    // Simulate API update via direct HTTP request
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

    // Content should appear in the browser via Socket.IO
    await expect(page1.locator('[data-testid="rich-text-editor"]')).toContainText("Content updated via API", { timeout: 5000 })
  })

  test("should handle multiple users editing simultaneously", async () => {
    const multiUserSlug = `multi-user-${Date.now()}`
    
    // Create a third context for this test
    const context3 = await page1.context().browser()!.newContext()
    const page3 = await context3.newPage()

    try {
      // All three pages navigate to the same note
      await Promise.all([
        page1.goto(`/${multiUserSlug}`),
        page2.goto(`/${multiUserSlug}`),
        page3.goto(`/${multiUserSlug}`)
      ])

      // Wait for all to connect
      await Promise.all([
        expect(page1.locator('text=Live')).toBeVisible(),
        expect(page2.locator('text=Live')).toBeVisible(),
        expect(page3.locator('text=Live')).toBeVisible()
      ])

      // User 1 adds content
      await page1.locator('[data-testid="rich-text-editor"]').fill("User 1 content")
      await expect(page1.locator('text=Saved')).toBeVisible()

      // Both other users should see the update
      await Promise.all([
        expect(page2.locator('[data-testid="rich-text-editor"]')).toContainText("User 1 content", { timeout: 5000 }),
        expect(page3.locator('[data-testid="rich-text-editor"]')).toContainText("User 1 content", { timeout: 5000 })
      ])

      // User 2 adds more content
      await page2.locator('[data-testid="rich-text-editor"]').fill("User 1 content\\nUser 2 addition")
      await expect(page2.locator('text=Saved')).toBeVisible()

      // User 1 and 3 should see the update
      await Promise.all([
        expect(page1.locator('[data-testid="rich-text-editor"]')).toContainText("User 2 addition", { timeout: 5000 }),
        expect(page3.locator('[data-testid="rich-text-editor"]')).toContainText("User 2 addition", { timeout: 5000 })
      ])

    } finally {
      await context3.close()
    }
  })
})