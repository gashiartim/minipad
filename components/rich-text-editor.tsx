'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { useCallback, useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useToast } from '@/hooks/use-toast'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  ImageIcon,
  Copy,
  Download,
  Maximize2,
  Minimize2,
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onUpdate: (content: string) => void
  placeholder?: string
  editable?: boolean
  slug: string
  secret?: string
  className?: string
}

// Custom image upload function
async function uploadImageFromPaste(file: File, slug: string, secret?: string) {
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
async function copyImageToClipboard(imageSrc: string) {
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
                const item = new (window as any).ClipboardItem({
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

// Helper function to download image
function downloadImage(imageSrc: string, filename: string) {
  const link = document.createElement('a')
  link.href = imageSrc
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Enhanced image extension with resize and context menu support
const createEnhancedImageExtension = (
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
        img.className =
          'max-w-full h-auto rounded-lg border border-border cursor-pointer'
        img.style.width = node.attrs.width ? `${node.attrs.width}px` : 'auto'
        img.style.height = node.attrs.height ? `${node.attrs.height}px` : 'auto'

        // Resize handles
        const resizeHandles = document.createElement('div')
        resizeHandles.className =
          'absolute inset-0 pointer-events-none group-hover:pointer-events-auto'

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

        Object.values(handles).forEach((handle) =>
          resizeHandles.appendChild(handle)
        )

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
          contextMenu.className =
            'fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50'
          contextMenu.style.left = `${e.clientX}px`
          contextMenu.style.top = `${e.clientY}px`

          const copyItem = document.createElement('div')
          copyItem.className =
            'px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2'
          copyItem.innerHTML = '<span>📋</span> Copy Image'
          copyItem.addEventListener('click', async () => {
            await onImageCopy(node.attrs.src)
            document.body.removeChild(contextMenu)
          })

          const downloadItem = document.createElement('div')
          downloadItem.className =
            'px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2'
          downloadItem.innerHTML = '<span>💾</span> Download Image'
          downloadItem.addEventListener('click', () => {
            onImageDownload(node.attrs.src, node.attrs.alt || 'image')
            document.body.removeChild(contextMenu)
          })

          const deleteItem = document.createElement('div')
          deleteItem.className =
            'px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-red-600'
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
const createPasteExtension = (
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

export function RichTextEditor({
  content,
  onUpdate,
  placeholder = 'Start writing...',
  editable = true,
  slug,
  secret,
  className,
}: RichTextEditorProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const { toast } = useToast()

  // Handle image copy
  const handleImageCopy = useCallback(
    async (src: string) => {
      try {
        const success = await copyImageToClipboard(src)
        if (success) {
          toast({
            title: 'Success',
            description: 'Image copied to clipboard',
          })
        } else {
          toast({
            title: 'Copy failed',
            description: 'Failed to copy image to clipboard',
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: 'Copy failed',
          description: 'Failed to copy image to clipboard',
          variant: 'destructive',
        })
      }
    },
    [toast]
  )

  // Handle image download
  const handleImageDownload = useCallback(
    (src: string, filename: string) => {
      try {
        downloadImage(src, filename)
        toast({
          title: 'Success',
          description: 'Image download started',
        })
      } catch (error) {
        toast({
          title: 'Download failed',
          description: 'Failed to download image',
          variant: 'destructive',
        })
      }
    },
    [toast]
  )

  // Create enhanced image extension
  const EnhancedImage = createEnhancedImageExtension(
    handleImageCopy,
    handleImageDownload
  )

  // Handle upload start
  const handleUploadStart = useCallback(() => {
    setIsUploadingImage(true)
  }, [])

  // Handle upload completion
  const handleUploadComplete = useCallback(
    (success: boolean, message?: string) => {
      setIsUploadingImage(false)
      if (success) {
        toast({
          title: 'Success',
          description: message || 'Image pasted successfully',
        })
      } else {
        toast({
          title: 'Upload failed',
          description: message || 'Failed to upload image',
          variant: 'destructive',
        })
      }
    },
    [toast]
  )

  // Create paste extension
  const pasteExtension = createPasteExtension(
    slug,
    secret,
    handleUploadStart,
    handleUploadComplete
  )

  const editor = useEditor({
    extensions: [
      StarterKit,
      EnhancedImage,
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      pasteExtension,
    ],
    content,
    editable,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      try {
        const html = editor.getHTML()
        onUpdate(html)
      } catch (error) {
        console.error('Editor update error:', error)
      }
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-3 border border-border rounded-md',
      },
    },
  })

  // Update content when prop changes (for real-time sync)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  const toggleBold = useCallback(
    () => editor?.chain().focus().toggleBold().run(),
    [editor]
  )
  const toggleItalic = useCallback(
    () => editor?.chain().focus().toggleItalic().run(),
    [editor]
  )
  const toggleStrike = useCallback(
    () => editor?.chain().focus().toggleStrike().run(),
    [editor]
  )
  const toggleCode = useCallback(
    () => editor?.chain().focus().toggleCode().run(),
    [editor]
  )
  const toggleH1 = useCallback(
    () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    [editor]
  )
  const toggleH2 = useCallback(
    () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    [editor]
  )
  const toggleH3 = useCallback(
    () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    [editor]
  )
  const toggleBulletList = useCallback(
    () => editor?.chain().focus().toggleBulletList().run(),
    [editor]
  )
  const toggleOrderedList = useCallback(
    () => editor?.chain().focus().toggleOrderedList().run(),
    [editor]
  )
  const toggleBlockquote = useCallback(
    () => editor?.chain().focus().toggleBlockquote().run(),
    [editor]
  )
  const undo = useCallback(() => editor?.chain().focus().undo().run(), [editor])
  const redo = useCallback(() => editor?.chain().focus().redo().run(), [editor])

  const addImage = useCallback(async () => {
    // Create file input for image selection
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = false

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      handleUploadStart()

      try {
        const uploadedImage = await uploadImageFromPaste(file, slug, secret)

        // Insert the uploaded image into the editor
        editor
          ?.chain()
          .focus()
          .setImage({
            src: `/i/${uploadedImage.path}`,
            alt: file.name,
          })
          .run()

        handleUploadComplete(true, 'Image uploaded successfully')
      } catch (error) {
        console.error('Image upload failed:', error)
        handleUploadComplete(
          false,
          error instanceof Error ? error.message : 'Failed to upload image'
        )
      }
    }

    input.click()
  }, [editor, slug, secret, handleUploadStart, handleUploadComplete])

  if (!editor) {
    return null
  }

  return (
    <div className={className}>
      {editable && (
        <div className="border border-border rounded-t-md p-2 bg-muted/30">
          <div className="flex flex-wrap items-center gap-1">
            <Button
              variant={editor.isActive('bold') ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleBold}
              disabled={!editor.can().chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('italic') ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleItalic}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('strike') ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleStrike}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('code') ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleCode}
              disabled={!editor.can().chain().focus().toggleCode().run()}
            >
              <Code className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant={
                editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'
              }
              size="sm"
              onClick={toggleH1}
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant={
                editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'
              }
              size="sm"
              onClick={toggleH2}
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant={
                editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'
              }
              size="sm"
              onClick={toggleH3}
            >
              <Heading3 className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleBulletList}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleOrderedList}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleBlockquote}
            >
              <Quote className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="ghost"
              size="sm"
              onClick={addImage}
              disabled={isUploadingImage}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!editor.can().chain().focus().undo().run()}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!editor.can().chain().focus().redo().run()}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <EditorContent
        editor={editor}
        className={`${
          editable ? 'border-t-0 rounded-t-none' : ''
        } border border-border rounded-md`}
      />
      {editable && (
        <div className="text-xs text-muted-foreground p-2 border-t border-border bg-muted/30 rounded-b-md">
          {isUploadingImage ? (
            <span className="flex items-center gap-2">
              <div className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />
              Uploading image...
            </span>
          ) : (
            <>
              Paste images directly into the editor • Right-click images to
              copy/resize • Click image + Delete to remove • Use toolbar for
              formatting
            </>
          )}
        </div>
      )}
    </div>
  )
}
