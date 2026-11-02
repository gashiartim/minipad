import { IMAGE_VALIDATION, FILE_SIGNATURES, ERROR_MESSAGES } from './constants'

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export interface ImageValidationResult extends ValidationResult {
  dimensions?: { width: number; height: number }
  actualType?: string
}

export function validateFileSize(file: File): ValidationResult {
  if (file.size > IMAGE_VALIDATION.MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.FILE_TOO_LARGE,
    }
  }
  return { isValid: true }
}

export function validateFileType(file: File): ValidationResult {
  const mimeType = file.type.toLowerCase()
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf('.'))

  if (
    !IMAGE_VALIDATION.ALLOWED_MIME_TYPES.includes(
      mimeType as (typeof IMAGE_VALIDATION.ALLOWED_MIME_TYPES)[number]
    )
  ) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_FILE_TYPE,
    }
  }

  if (
    !IMAGE_VALIDATION.ALLOWED_EXTENSIONS.includes(
      extension as (typeof IMAGE_VALIDATION.ALLOWED_EXTENSIONS)[number]
    )
  ) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_FILE_TYPE,
    }
  }

  return { isValid: true }
}

export async function validateFileSignature(
  file: File
): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer
        if (!buffer) {
          resolve({ isValid: false, error: 'Could not read file' })
          return
        }

        const bytes = new Uint8Array(buffer.slice(0, 12))
        const mimeType = file.type.toLowerCase() as keyof typeof FILE_SIGNATURES

        if (!FILE_SIGNATURES[mimeType]) {
          resolve(validateFileType(file))
          return
        }

        const signature = FILE_SIGNATURES[mimeType]
        const isValid = signature.every((byte, index) => bytes[index] === byte)

        if (!isValid) {
          resolve({
            isValid: false,
            error: ERROR_MESSAGES.INVALID_FILE_TYPE,
          })
          return
        }

        resolve({ isValid: true })
      } catch {
        resolve({ isValid: false, error: 'File validation failed' })
      }
    }

    reader.onerror = () => {
      resolve({ isValid: false, error: 'Could not read file' })
    }

    reader.readAsArrayBuffer(file.slice(0, 12))
  })
}

export async function validateImageDimensions(
  file: File
): Promise<ImageValidationResult> {
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

      if (
        width < MIN_DIMENSIONS.width ||
        height < MIN_DIMENSIONS.height ||
        width > MAX_DIMENSIONS.width ||
        height > MAX_DIMENSIONS.height
      ) {
        resolve({
          isValid: false,
          error: ERROR_MESSAGES.INVALID_DIMENSIONS,
          dimensions: { width, height },
        })
        return
      }

      resolve({
        isValid: true,
        dimensions: { width, height },
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ isValid: false, error: ERROR_MESSAGES.INVALID_FILE_TYPE })
    }

    img.src = url
  })
}

export async function validateImage(
  file: File
): Promise<ImageValidationResult> {
  const sizeCheck = validateFileSize(file)
  if (!sizeCheck.isValid) return sizeCheck

  const typeCheck = validateFileType(file)
  if (!typeCheck.isValid) return typeCheck

  const signatureCheck = await validateFileSignature(file)
  if (!signatureCheck.isValid) return signatureCheck

  const dimensionsCheck = await validateImageDimensions(file)
  return dimensionsCheck
}

export function sanitizeHtmlContent(html: string): string {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  const scripts = tempDiv.querySelectorAll('script')
  scripts.forEach((script) => script.remove())

  const allElements = tempDiv.querySelectorAll('*')
  allElements.forEach((element) => {
    Array.from(element.attributes).forEach((attr) => {
      if (attr.name.startsWith('on') || attr.name === 'javascript:') {
        element.removeAttribute(attr.name)
      }
    })
  })

  return tempDiv.innerHTML
}

export function validatePastedContent(content: string): {
  isValid: boolean
  sanitized: string
  error?: string
} {
  if (!content || content.length === 0) {
    return { isValid: true, sanitized: '' }
  }

  if (content.length > 1000000) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Content too large',
    }
  }

  const sanitized = content
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')

  return { isValid: true, sanitized }
}
