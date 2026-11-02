import { validateImage } from '@/lib/client-validation'
import { ERROR_MESSAGES } from '@/lib/constants'
import { MAX_IMAGE_SIZE_BYTES } from '@/lib/image-rules'
import { notesApi } from '@/lib/api-client'

export async function uploadImageFromPaste(
  file: File,
  slug: string,
  secret?: string
) {
  const validation = await validateImage(file)
  if (!validation.isValid) {
    throw new Error(validation.error || ERROR_MESSAGES.INVALID_FILE_TYPE)
  }

  const result = await notesApi.uploadImage(slug, file, secret)
  if (!result.ok) {
    throw new Error(result.error)
  }

  return result.data
}

export async function copyImageToClipboard(imageSrc: string): Promise<boolean> {
  try {
    const url = new URL(imageSrc, window.location.origin)
    if (!url.pathname.startsWith('/i/')) {
      throw new Error('Invalid image source')
    }

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error('Failed to fetch image')
    }

    const blob = await response.blob()

    if (blob.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('Image too large to copy')
    }

    if (navigator.clipboard && 'ClipboardItem' in window) {
      const clipboardItem = new ClipboardItem({
        [blob.type]: blob,
      })
      await navigator.clipboard.write([clipboardItem])
      return true
    } else {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new window.Image()

      return new Promise<boolean>((resolve) => {
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx?.drawImage(img, 0, 0)

          canvas.toBlob((blob) => {
            if (blob) {
              if ('ClipboardItem' in window) {
                const item = new ClipboardItem({
                  [blob.type]: blob,
                })
                navigator.clipboard.write([item]).then(() => resolve(true))
              } else {
                resolve(false)
              }
            } else {
              resolve(false)
            }
          })
        }
        img.src = imageSrc
      })
    }
  } catch (error) {
    console.error('Failed to copy image:', error)
    return false
  }
}

export function downloadImage(imageSrc: string, filename: string) {
  const link = document.createElement('a')
  link.href = imageSrc
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
