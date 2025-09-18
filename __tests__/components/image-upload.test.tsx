import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ImageUpload } from "@/components/image-upload"
import jest from "jest" // Import jest to declare it

// Mock the toast hook
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe("ImageUpload", () => {
  const mockProps = {
    slug: "test-note",
    secret: "test-secret",
    onImageUploaded: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it("should render upload interface", () => {
    render(<ImageUpload {...mockProps} />)

    expect(screen.getByText("Upload Images")).toBeInTheDocument()
    expect(screen.getByText("Drop images here")).toBeInTheDocument()
    expect(screen.getByText("Select Files")).toBeInTheDocument()
  })

  it("should handle file selection", async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "1", path: "test.png" }),
    })

    render(<ImageUpload {...mockProps} />)

    const file = new File(["test"], "test.png", { type: "image/png" })
    const input = screen.getByRole("button", { name: /select files/i })

    await user.click(input)

    // Simulate file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(fileInput, "files", {
      value: [file],
      writable: false,
    })

    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notes/test-note/images", {
        method: "POST",
        body: expect.any(FormData),
      })
    })
  })

  it("should reject invalid file types", async () => {
    const user = userEvent.setup()
    const { useToast } = require("@/hooks/use-toast")
    const mockToast = jest.fn()
    useToast.mockReturnValue({ toast: mockToast })

    render(<ImageUpload {...mockProps} />)

    const file = new File(["test"], "test.txt", { type: "text/plain" })
    const input = screen.getByRole("button", { name: /select files/i })

    await user.click(input)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(fileInput, "files", {
      value: [file],
      writable: false,
    })

    fireEvent.change(fileInput)

    expect(mockToast).toHaveBeenCalledWith({
      title: "Invalid file type",
      description: "Please upload PNG, JPEG, WebP, or GIF images only",
      variant: "destructive",
    })
  })

  it("should reject files that are too large", async () => {
    const user = userEvent.setup()
    const { useToast } = require("@/hooks/use-toast")
    const mockToast = jest.fn()
    useToast.mockReturnValue({ toast: mockToast })

    render(<ImageUpload {...mockProps} />)

    // Create a file larger than 10MB
    const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.png", { type: "image/png" })
    const input = screen.getByRole("button", { name: /select files/i })

    await user.click(input)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(fileInput, "files", {
      value: [largeFile],
      writable: false,
    })

    fireEvent.change(fileInput)

    expect(mockToast).toHaveBeenCalledWith({
      title: "File too large",
      description: "Please upload images smaller than 10MB",
      variant: "destructive",
    })
  })

  it("should handle drag and drop", () => {
    render(<ImageUpload {...mockProps} />)

    const dropZone = screen.getByText("Drop images here").closest("div")

    fireEvent.dragOver(dropZone!)
    expect(dropZone).toHaveClass("border-primary")

    fireEvent.dragLeave(dropZone!)
    expect(dropZone).not.toHaveClass("border-primary")
  })
})
