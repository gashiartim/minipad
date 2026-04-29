import {
  slugSchema,
  secretSchema,
  contentSchema,
  generateSlug,
  sanitizeContent,
  sanitizeInput,
  isValidImageFilename,
} from "@/lib/validators"

describe("Validators", () => {
  describe("slugSchema", () => {
    it("should accept valid slugs", () => {
      expect(slugSchema.parse("valid-slug")).toBe("valid-slug")
      expect(slugSchema.parse("test_123")).toBe("test_123")
      expect(slugSchema.parse("ABC-def_123")).toBe("ABC-def_123")
    })

    it("should reject invalid slugs", () => {
      expect(() => slugSchema.parse("ab")).toThrow() // too short
      expect(() => slugSchema.parse("a".repeat(65))).toThrow() // too long
      expect(() => slugSchema.parse("invalid slug")).toThrow() // spaces
      expect(() => slugSchema.parse("invalid@slug")).toThrow() // special chars
    })
  })

  describe("secretSchema", () => {
    it("should accept valid secrets", () => {
      expect(secretSchema.parse("123456")).toBe("123456")
      expect(secretSchema.parse("a".repeat(128))).toBe("a".repeat(128))
      expect(secretSchema.parse(undefined)).toBe(undefined)
    })

    it("should reject invalid secrets", () => {
      expect(() => secretSchema.parse("12345")).toThrow() // too short
      expect(() => secretSchema.parse("a".repeat(129))).toThrow() // too long
    })
  })

  describe("contentSchema", () => {
    it("should sanitize and accept valid content", () => {
      const result = contentSchema.parse("Hello <script>alert('xss')</script> world")
      expect(result).toBe("Hello  world")
    })

    it("should reject content that's too long", () => {
      expect(() => contentSchema.parse("a".repeat(200_001))).toThrow()
    })
  })

  describe("generateSlug", () => {
    it("should generate valid slugs", () => {
      const slug = generateSlug()
      expect(slug).toHaveLength(8)
      expect(slugSchema.parse(slug)).toBe(slug)
    })

    it("should generate unique slugs", () => {
      const slugs = Array.from({ length: 100 }, () => generateSlug())
      const uniqueSlugs = new Set(slugs)
      expect(uniqueSlugs.size).toBe(100)
    })
  })

  describe("sanitizeContent", () => {
    it("should remove script tags", () => {
      expect(sanitizeContent("Hello <script>alert('xss')</script> world")).toBe("Hello  world")
    })

    it("should remove iframe tags", () => {
      expect(sanitizeContent("Hello <iframe src='evil.com'></iframe> world")).toBe("Hello  world")
    })

    it("should remove javascript protocols", () => {
      expect(sanitizeContent("Hello javascript:alert('xss') world")).toBe("Hello alert('xss') world")
    })

    it("should remove event handlers", () => {
      expect(sanitizeContent("Hello onclick='alert()' world")).toBe("Hello world")
    })
  })

  describe("sanitizeInput", () => {
    it("should remove HTML tags", () => {
      expect(sanitizeInput("Hello <b>world</b>")).toBe("Hello world")
    })

    it("should trim whitespace", () => {
      expect(sanitizeInput("  hello world  ")).toBe("hello world")
    })
  })

  describe("isValidImageFilename", () => {
    it("should accept valid image filenames", () => {
      expect(isValidImageFilename("1234567890abcdef-abcd.png")).toBe(true)
      expect(isValidImageFilename("abcdef1234567890-xyz1.jpg")).toBe(true)
      expect(isValidImageFilename("0123456789abcdef-test.webp")).toBe(true)
    })

    it("should reject invalid image filenames", () => {
      expect(isValidImageFilename("invalid.png")).toBe(false)
      expect(isValidImageFilename("../../../etc/passwd")).toBe(false)
      expect(isValidImageFilename("1234567890abcdef-abcd.exe")).toBe(false)
    })
  })
})
