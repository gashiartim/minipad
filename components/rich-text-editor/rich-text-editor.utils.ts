import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import Image from '@tiptap/extension-image'

// Custom image upload function
export async function uploadImageFromPaste(file: File, slug: string, secret?: string) {
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
    const errorData = await response.json().catch(() => ({}))
    let errorMessage = 'Failed to upload image'

    if (response.status === 403) {
      errorMessage = 'Access denied - check your secret'
    } else if (response.status === 413) {
      errorMessage = 'File too large'
    } else if (response.status === 415) {
      errorMessage = 'Invalid file type'
    } else if (response.status === 429) {
      errorMessage = 'Too many requests - please wait'
    } else if (errorData.error) {
      errorMessage = errorData.error
    }

    throw new Error(errorMessage)
  }

  return await response.json()
}

// Helper function to copy image to clipboard
export async function copyImageToClipboard(imageSrc: string) {
  try {
    const response = await fetch(imageSrc)
    const blob = await response.blob()
    
    if (navigator.clipboard && 'ClipboardItem' in window) {
      const clipboardItem = new (window as any).ClipboardItem({
        [blob.type]: blob,
      })
      await navigator.clipboard.write([clipboardItem])
      return true
    } else {
      // Fallback for browsers that don't support ClipboardItem
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new window.Image()
      
      return new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx?.drawImage(img, 0, 0)
          
          canvas.toBlob((blob) => {
            if (blob) {
            if ('ClipboardItem' in window) {
              const item = new (window as any).ClipboardItem({ [blob.type]: blob })
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

// Helper function to download image
export function downloadImage(imageSrc: string, filename: string) {
  const link = document.createElement('a')
  link.href = imageSrc
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Enhanced image extension with resize and context menu support
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
      return ({ node, view, getPos, HTMLAttributes }) => {
        const container = document.createElement('div')
        container.className = 'relative inline-block group'
        
        const img = document.createElement('img')
        img.src = node.attrs.src
        img.alt = node.attrs.alt || ''
        img.className = 'max-w-full h-auto rounded-lg border border-border cursor-pointer'
        img.style.width = node.attrs.width ? `${node.attrs.width}px` : 'auto'
        img.style.height = node.attrs.height ? `${node.attrs.height}px` : 'auto'
        
        // Resize handles
        const resizeHandles = document.createElement('div')
        resizeHandles.className = 'absolute inset-0 pointer-events-none group-hover:pointer-events-auto'
        
        // Create resize handles
        const createHandle = (position: string) => {
          const handle = document.createElement('div')
          handle.className = `absolute w-2 h-2 bg-blue-500 border border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${position}`
          handle.style.pointerEvents = 'auto'
          return handle
        }
        
        const handles = {
          se: createHandle('bottom-0 right-0 cursor-se-resize'),
          sw: createHandle('bottom-0 left-0 cursor-sw-resize'),
          ne: createHandle('top-0 right-0 cursor-ne-resize'),
          nw: createHandle('top-0 left-0 cursor-nw-resize'),
        }
        
        Object.values(handles).forEach(handle => resizeHandles.appendChild(handle))
        
        // Resize functionality
        let isResizing = false
        let startX = 0
        let startY = 0
        let startWidth = 0
        let startHeight = 0
        
        const startResize = (e: MouseEvent, direction: string) => {
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
          
          // Calculate new dimensions based on direction
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
          
          // Maintain aspect ratio
          const aspectRatio = startWidth / startHeight
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newHeight = newWidth / aspectRatio
          } else {
            newWidth = newHeight * aspectRatio
          }
          
          // Apply minimum size
          newWidth = Math.max(50, newWidth)
          newHeight = Math.max(50, newHeight)
          
          img.style.width = `${newWidth}px`
          img.style.height = `${newHeight}px`
        }
        
        const stopResize = () => {
          isResizing = false
          document.removeEventListener('mousemove', handleResize)
          document.removeEventListener('mouseup', stopResize)
          
          // Update the node attributes
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
        }
        
        // Add event listeners to handles
        handles.se.addEventListener('mousedown', (e) => startResize(e, 'se'))
        handles.sw.addEventListener('mousedown', (e) => startResize(e, 'sw'))
        handles.ne.addEventListener('mousedown', (e) => startResize(e, 'ne'))
        handles.nw.addEventListener('mousedown', (e) => startResize(e, 'nw'))
        
        // Keyboard shortcuts
        img.addEventListener('keydown', (e) => {
          if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault()
            const pos = getPos()
            if (pos !== undefined) {
              view.dispatch(view.state.tr.delete(pos, pos + 1))
            }
          }
        })
        
        // Make image focusable for keyboard shortcuts
        img.tabIndex = 0
        
        // Click to focus
        img.addEventListener('click', () => {
          img.focus()
        })
        
        // Context menu
        img.addEventListener('contextmenu', (e) => {
          e.preventDefault()
          const contextMenu = document.createElement('div')
          contextMenu.className = 'fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50'
          contextMenu.style.left = `${e.clientX}px`
          contextMenu.style.top = `${e.clientY}px`
          
          const copyItem = document.createElement('div')
          copyItem.className = 'px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2'
          copyItem.innerHTML = '<span>📋</span> Copy Image'
          copyItem.addEventListener('click', async () => {
            await onImageCopy(node.attrs.src)
            document.body.removeChild(contextMenu)
          })
          
          const downloadItem = document.createElement('div')
          downloadItem.className = 'px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2'
          downloadItem.innerHTML = '<span>💾</span> Download Image'
          downloadItem.addEventListener('click', () => {
            onImageDownload(node.attrs.src, node.attrs.alt || 'image')
            document.body.removeChild(contextMenu)
          })
          
          const deleteItem = document.createElement('div')
          deleteItem.className = 'px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-red-600'
          deleteItem.innerHTML = '<span>🗑️</span> Delete Image'
          deleteItem.addEventListener('click', () => {
            const pos = getPos()
            if (pos !== undefined) {
              view.dispatch(view.state.tr.delete(pos, pos + 1))
            }
            document.body.removeChild(contextMenu)
          })
          
          contextMenu.appendChild(copyItem)
          contextMenu.appendChild(downloadItem)
          contextMenu.appendChild(deleteItem)
          
          document.body.appendChild(contextMenu)
          
          // Remove context menu when clicking elsewhere
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

// Custom paste extension for handling image uploads
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
                event.clipboardData || (window as any).clipboardData
              if (!clipboardData) return false

              const items = Array.from(
                clipboardData.items
              ) as DataTransferItem[]
              const imageItems = items.filter((item) =>
                item.type.startsWith('image/')
              )

              if (imageItems.length === 0) return false

              // Handle multiple images
              imageItems.forEach(async (item) => {
                const file = item.getAsFile()
                if (!file) return

                onUploadStart()

                try {
                  const uploadedImage = await uploadImageFromPaste(
                    file,
                    slug,
                    secret
                  )

                  // Insert the uploaded image into the editor
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
                      : 'Failed to upload image'
                  )
                }
              })

              return true // Prevent default paste behavior
            },
          },
        }),
      ]
    },
  })
}
