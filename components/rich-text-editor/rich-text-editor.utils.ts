import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import Image from '@tiptap/extension-image'
import { validateImage, validatePastedContent } from '@/lib/validation'
import { TIMING, CODE_DETECTION, ERROR_MESSAGES } from '@/lib/constants'

export async function uploadImageFromPaste(
  file: File,
  slug: string,
  secret?: string
) {
  const validation = await validateImage(file)
  if (!validation.isValid) {
    throw new Error(validation.error || ERROR_MESSAGES.INVALID_FILE_TYPE)
  }

  const formData = new FormData()
  formData.append('file', file)
  if (secret) {
    formData.append('secret', secret)
  }

  const response = await fetch(`/api/notes/${slug}/images`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { error?: string }
    let errorMessage: string = ERROR_MESSAGES.UPLOAD_FAILED

    if (response.status === 403) {
      errorMessage = ERROR_MESSAGES.AUTH_EXPIRED
    } else if (response.status === 413) {
      errorMessage = ERROR_MESSAGES.FILE_TOO_LARGE
    } else if (response.status === 415) {
      errorMessage = ERROR_MESSAGES.INVALID_FILE_TYPE
    } else if (response.status === 429) {
      errorMessage = 'Too many requests - please wait'
    } else if (errorData.error) {
      errorMessage = errorData.error
    }

    throw new Error(errorMessage)
  }

  return await response.json()
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
    
    if (blob.size > 10 * 1024 * 1024) {
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

function createResizeHandle(position: string): HTMLDivElement {
  const handle = document.createElement('div')
  handle.className = `absolute w-2 h-2 bg-blue-500 border border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${position}`
  handle.style.pointerEvents = 'auto'
  return handle
}

function createContextMenu(
  x: number,
  y: number,
  imageSrc: string,
  imageAlt: string,
  onCopy: (src: string) => Promise<void>,
  onDownload: (src: string, filename: string) => void,
  onDelete: () => void
): HTMLDivElement {
  const contextMenu = document.createElement('div')
  contextMenu.className = 'fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50'
  contextMenu.style.left = `${x}px`
  contextMenu.style.top = `${y}px`

  const copyItem = document.createElement('div')
  copyItem.className = 'px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2'
  copyItem.innerHTML = '<span>📋</span> Copy Image'
  copyItem.addEventListener('click', async () => {
    await onCopy(imageSrc)
    document.body.removeChild(contextMenu)
  })

  const downloadItem = document.createElement('div')
  downloadItem.className = 'px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2'
  downloadItem.innerHTML = '<span>💾</span> Download Image'
  downloadItem.addEventListener('click', () => {
    onDownload(imageSrc, imageAlt || 'image')
    document.body.removeChild(contextMenu)
  })

  const deleteItem = document.createElement('div')
  deleteItem.className = 'px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-red-600'
  deleteItem.innerHTML = '<span>🗑️</span> Delete Image'
  deleteItem.addEventListener('click', () => {
    onDelete()
    document.body.removeChild(contextMenu)
  })

  contextMenu.appendChild(copyItem)
  contextMenu.appendChild(downloadItem)
  contextMenu.appendChild(deleteItem)

  return contextMenu
}

export const createEnhancedImageExtension = (
  onImageCopy: (src: string) => Promise<void>,
  onImageDownload: (src: string, filename: string) => void
) => {
  return Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: null,
          renderHTML: (attributes) => {
            if (!attributes.width) return {}
            return {
              width: attributes.width,
            }
          },
        },
        height: {
          default: null,
          renderHTML: (attributes) => {
            if (!attributes.height) return {}
            return {
              height: attributes.height,
            }
          },
        },
      }
    },

    addNodeView() {
      return ({ node, view, getPos }) => {
        const container = document.createElement('div')
        container.className = 'relative inline-block group'

        const img = document.createElement('img')
        img.src = node.attrs.src
        img.alt = node.attrs.alt || ''
        img.className =
          'max-w-full h-auto rounded-lg border border-border cursor-pointer'
        img.style.width = node.attrs.width ? `${node.attrs.width}px` : 'auto'
        img.style.height = node.attrs.height ? `${node.attrs.height}px` : 'auto'

        const resizeHandles = document.createElement('div')
        resizeHandles.className =
          'absolute inset-0 pointer-events-none group-hover:pointer-events-auto'

        const handles = {
          se: createResizeHandle('bottom-0 right-0 cursor-se-resize'),
          sw: createResizeHandle('bottom-0 left-0 cursor-sw-resize'),
          ne: createResizeHandle('top-0 right-0 cursor-ne-resize'),
          nw: createResizeHandle('top-0 left-0 cursor-nw-resize'),
        }

        Object.values(handles).forEach((handle) =>
          resizeHandles.appendChild(handle)
        )

        let isResizing = false
        let startX = 0
        let startY = 0
        let startWidth = 0
        let startHeight = 0
        let resizeTimeout: ReturnType<typeof setTimeout> | null = null

        const startResize = (e: MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          isResizing = true
          startX = e.clientX
          startY = e.clientY
          startWidth = img.offsetWidth
          startHeight = img.offsetHeight

          document.addEventListener('mousemove', handleResize)
          document.addEventListener('mouseup', stopResize)
        }

        const handleResize = (e: MouseEvent) => {
          if (!isResizing) return

          const deltaX = e.clientX - startX
          const deltaY = e.clientY - startY

          let newWidth = startWidth
          let newHeight = startHeight

          if (handles.se || handles.ne) {
            newWidth = startWidth + deltaX
          } else {
            newWidth = startWidth - deltaX
          }

          if (handles.se || handles.sw) {
            newHeight = startHeight + deltaY
          } else {
            newHeight = startHeight - deltaY
          }

          const aspectRatio = startWidth / startHeight
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newHeight = newWidth / aspectRatio
          } else {
            newWidth = newHeight * aspectRatio
          }

          newWidth = Math.max(50, newWidth)
          newHeight = Math.max(50, newHeight)

          img.style.width = `${newWidth}px`
          img.style.height = `${newHeight}px`
        }

        const stopResize = () => {
          isResizing = false
          document.removeEventListener('mousemove', handleResize)
          document.removeEventListener('mouseup', stopResize)

          if (resizeTimeout) {
            clearTimeout(resizeTimeout)
          }

          resizeTimeout = setTimeout(() => {
            const pos = getPos()
            if (pos !== undefined) {
              view.dispatch(
                view.state.tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  width: img.offsetWidth,
                  height: img.offsetHeight,
                })
              )
            }
          }, TIMING.DEBOUNCE_RESIZE_DELAY)
        }

        handles.se.addEventListener('mousedown', (e) => startResize(e))
        handles.sw.addEventListener('mousedown', (e) => startResize(e))
        handles.ne.addEventListener('mousedown', (e) => startResize(e))
        handles.nw.addEventListener('mousedown', (e) => startResize(e))

        img.addEventListener('keydown', (e) => {
          if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault()
            const pos = getPos()
            if (pos !== undefined) {
              view.dispatch(view.state.tr.delete(pos, pos + 1))
            }
          }
        })

        img.tabIndex = 0

        img.addEventListener('click', () => {
          img.focus()
        })

        img.addEventListener('contextmenu', (e) => {
          e.preventDefault()
          
          const contextMenu = createContextMenu(
            e.clientX,
            e.clientY,
            node.attrs.src,
            node.attrs.alt || 'image',
            onImageCopy,
            onImageDownload,
            () => {
              const pos = getPos()
              if (pos !== undefined) {
                view.dispatch(view.state.tr.delete(pos, pos + 1))
              }
            }
          )

          document.body.appendChild(contextMenu)

          const removeMenu = () => {
            if (document.body.contains(contextMenu)) {
              document.body.removeChild(contextMenu)
            }
            document.removeEventListener('click', removeMenu)
          }

          setTimeout(() => document.addEventListener('click', removeMenu), 0)
        })

        container.appendChild(img)
        container.appendChild(resizeHandles)

        return {
          dom: container,
          contentDOM: null,
        }
      }
    },
  })
}

function isLikelyCode(text: string): { isCode: boolean; language: string | null } {
  const trimmedText = text.trim()
  
  if (trimmedText.length < CODE_DETECTION.MIN_LENGTH) {
    return { isCode: false, language: null }
  }
  
  const validation = validatePastedContent(trimmedText)
  if (!validation.isValid) {
    return { isCode: false, language: null }
  }
  
  const codeIndicators = [
    /^(import|export|const|let|var|function|class|interface|type)\s/m,
    /=>\s*\{/,
    /console\.(log|error|warn)/,
    /\.then\s*\(/,
    /Promise\./,
    
    /^(def|class|import|from|if __name__|print\s*\()/m,
    /:\s*\n\s{4,}/,
    
    /public\s+(static\s+)?void\s+main/,
    /public\s+class\s+\w+/,
    /System\.out\.print/,
    
    /#include\s*<\w+>/,
    /int\s+main\s*\(/,
    /printf\s*\(/,
    
    /^<(!DOCTYPE|html|head|body|div|span|p|a|img)/im,
    /<\/\w+>/,
    
    /\{\s*\n\s*[\w-]+\s*:\s*[^;]+;/,
    /^[\w\-\.#]+\s*\{/m,
    
    /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/im,
    
    /^(#!\/bin\/|sudo|npm|git|docker|cd|ls|mkdir)/m,
    
    /^\s*\{\s*"[\w-]+"\s*:\s*["\{\[]]/,
  ]
  
  const languagePatterns = [
    { pattern: /^(import|export|const|let|var|function|class)\s/m, language: 'javascript' },
    { pattern: /(interface|type\s+\w+\s*=|as\s+\w+)/m, language: 'typescript' },
    { pattern: /^(def|class|import|from|if __name__)/m, language: 'python' },
    { pattern: /public\s+(static\s+)?void\s+main/m, language: 'java' },
    { pattern: /#include\s*<\w+>/m, language: 'cpp' },
    { pattern: /^<(!DOCTYPE|html|head|body)/im, language: 'html' },
    { pattern: /\{\s*\n\s*[\w-]+\s*:\s*[^;]+;/m, language: 'css' },
    { pattern: /^(SELECT|INSERT|UPDATE|DELETE|CREATE)/im, language: 'sql' },
    { pattern: /^(#!\/bin\/|npm|git|docker)\s/m, language: 'bash' },
    { pattern: /^\s*\{\s*"[\w-]+"\s*:/m, language: 'json' },
  ]
  
  const hasCodePatterns = codeIndicators.some(pattern => pattern.test(trimmedText))
  
  const lines = trimmedText.split('\n')
  const hasIndentation = lines.some(line => /^\s{2,}/.test(line))
  const hasBraces = /[\{\}]/.test(trimmedText)
  const hasSemicolons = trimmedText.split(';').length > 2
  const hasSpecialChars = /[{}()[\]<>=&|!]/.test(trimmedText)
  
  const codeScore = [
    hasCodePatterns ? 3 : 0,
    hasIndentation ? 1 : 0,
    hasBraces ? 1 : 0,
    hasSemicolons ? 1 : 0,
    hasSpecialChars ? 1 : 0,
  ].reduce((a, b) => a + b, 0)
  
  const isCode = codeScore >= CODE_DETECTION.SCORE_THRESHOLD
  
  let language = null
  if (isCode) {
    for (const { pattern, language: lang } of languagePatterns) {
      if (pattern.test(trimmedText)) {
        language = lang
        break
      }
    }
  }
  
  return { isCode, language }
}

export const createPasteExtension = (
  slug: string,
  secret: string | undefined,
  onUploadStart: () => void,
  onUploadComplete: (success: boolean, message?: string) => void
) => {
  return Extension.create({
    name: 'pasteHandler',

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('pasteHandler'),
          props: {
            handlePaste: (view, event) => {
              const clipboardData =
                event.clipboardData ||
                (window as Window & { clipboardData?: DataTransfer })
                  .clipboardData
              if (!clipboardData) return false

              const items = Array.from(
                clipboardData.items
              ) as DataTransferItem[]
              const imageItems = items.filter((item) =>
                item.type.startsWith('image/')
              )

              if (imageItems.length > 0) {
                const maxUploads = Math.min(imageItems.length, 5)
                const uploadPromises: Promise<void>[] = []

                for (let i = 0; i < maxUploads; i++) {
                  const item = imageItems[i]
                  if (!item) continue
                  const uploadPromise = (async () => {
                    const file = item.getAsFile()
                    if (!file) return

                    onUploadStart()

                    try {
                      const validation = await validateImage(file)
                      if (!validation.isValid) {
                        throw new Error(validation.error || ERROR_MESSAGES.INVALID_FILE_TYPE)
                      }

                      const uploadedImage = await uploadImageFromPaste(
                        file,
                        slug,
                        secret
                      )

                    const { tr } = view.state
                    const imageNode = view.state.schema.nodes.image?.create({
                      src: `/i/${uploadedImage.path}`,
                      alt: file.name,
                    })

                    if (imageNode) {
                      const insertPos = view.state.selection.from
                      tr.insert(insertPos, imageNode)
                      view.dispatch(tr)
                    }

                      onUploadComplete(true, 'Image pasted successfully')
                    } catch (error) {
                      console.error('Image upload failed:', error)
                      onUploadComplete(
                        false,
                        error instanceof Error
                          ? error.message
                          : ERROR_MESSAGES.UPLOAD_FAILED
                      )
                    }
                  })()
                  uploadPromises.push(uploadPromise)
                }

                Promise.all(uploadPromises).catch(console.error)

                return true
              }

              const text = clipboardData.getData('text/plain')
              if (text && text.length > 0) {
                const validation = validatePastedContent(text)
                if (!validation.isValid) {
                  console.warn('Invalid pasted content:', validation.error)
                  return false
                }

                const { isCode, language } = isLikelyCode(validation.sanitized)
                
                if (isCode) {
                  const { tr } = view.state
                  const codeBlockNode = view.state.schema.nodes.codeBlock?.create(
                    language ? { language } : {},
                    view.state.schema.text(validation.sanitized)
                  )
                  
                  if (codeBlockNode) {
                    const insertPos = view.state.selection.from
                    tr.replaceWith(insertPos, insertPos, codeBlockNode)
                    view.dispatch(tr)
                    return true
                  }
                }
              }

              return false
            },
          },
        }),
      ]
    },
  })
}
