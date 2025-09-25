import { IMAGE_VALIDATION, FILE_SIGNATURES, ERROR_MESSAGES } from './constants'

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export interface ImageValidationResult extends ValidationResult {
  dimensions?: { width: number; height: number }
  actualType?: string
}

/**
 * Validates file size
 */
export function validateFileSize(file: File): ValidationResult {
  if (file.size > IMAGE_VALIDATION.MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.FILE_TOO_LARGE
    }
  }
  return { isValid: true }
}

/**
 * Validates file type based on MIME type and extension
 */
export function validateFileType(file: File): ValidationResult {
  const mimeType = file.type.toLowerCase()
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

  if (!IMAGE_VALIDATION.ALLOWED_MIME_TYPES.includes(mimeType as any)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_FILE_TYPE
    }
  }

  if (!IMAGE_VALIDATION.ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_FILE_TYPE
    }
  }

  return { isValid: true }
}

/**
 * Validates file signature to prevent MIME type spoofing
 */
export async function validateFileSignature(file: File): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer
        if (!buffer) {
          resolve({ isValid: false, error: 'Could not read file' })
          return
        }

        const bytes = new Uint8Array(buffer.slice(0, 12)) // Read first 12 bytes
        const mimeType = file.type.toLowerCase() as keyof typeof FILE_SIGNATURES

        if (!FILE_SIGNATURES[mimeType]) {
          // For unsupported types, just validate MIME type
          resolve(validateFileType(file))
          return
        }

        const signature = FILE_SIGNATURES[mimeType]
        const isValid = signature.every((byte, index) => bytes[index] === byte)

        if (!isValid) {
          resolve({
            isValid: false,
            error: ERROR_MESSAGES.INVALID_FILE_TYPE
          })
          return
        }

        resolve({ isValid: true })
      } catch (error) {
        resolve({ isValid: false, error: 'File validation failed' })
      }
    }

    reader.onerror = () => {
      resolve({ isValid: false, error: 'Could not read file' })
    }

    reader.readAsArrayBuffer(file.slice(0, 12))
  })
}

/**
 * Validates image dimensions
 */
export async function validateImageDimensions(file: File): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({ isValid: false, error: ERROR_MESSAGES.INVALID_FILE_TYPE })
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      
      const { width, height } = img
      const { MIN_DIMENSIONS, MAX_DIMENSIONS } = IMAGE_VALIDATION

      if (width < MIN_DIMENSIONS.width || height < MIN_DIMENSIONS.height ||
          width > MAX_DIMENSIONS.width || height > MAX_DIMENSIONS.height) {
        resolve({
          isValid: false,
          error: ERROR_MESSAGES.INVALID_DIMENSIONS,
          dimensions: { width, height }
        })
        return
      }

      resolve({
        isValid: true,
        dimensions: { width, height }
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ isValid: false, error: ERROR_MESSAGES.INVALID_FILE_TYPE })
    }

    img.src = url
  })
}

/**
 * Comprehensive image validation
 */
export async function validateImage(file: File): Promise<ImageValidationResult> {
  // Quick validations first
  const sizeCheck = validateFileSize(file)
  if (!sizeCheck.isValid) return sizeCheck

  const typeCheck = validateFileType(file)
  if (!typeCheck.isValid) return typeCheck

  // Async validations
  const signatureCheck = await validateFileSignature(file)
  if (!signatureCheck.isValid) return signatureCheck

  const dimensionsCheck = await validateImageDimensions(file)
  return dimensionsCheck
}

/**
 * Sanitizes HTML content to prevent XSS
 */
export function sanitizeHtmlContent(html: string): string {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  // Remove script tags and event handlers
  const scripts = tempDiv.querySelectorAll('script')
  scripts.forEach(script => script.remove())

  // Remove dangerous attributes
  const allElements = tempDiv.querySelectorAll('*')
  allElements.forEach(element => {
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('on') || attr.name === 'javascript:') {
        element.removeAttribute(attr.name)
      }
    })
  })

  return tempDiv.innerHTML
}

/**
 * Validates and sanitizes pasted content
 */
export function validatePastedContent(content: string): { isValid: boolean; sanitized: string; error?: string } {
  if (!content || content.length === 0) {
    return { isValid: true, sanitized: '' }
  }

  if (content.length > 1000000) { // 1MB text limit
    return {
      isValid: false,
      sanitized: '',
      error: 'Content too large'
    }
  }

  const sanitized = sanitizeHtmlContent(content)
  return { isValid: true, sanitized }
}