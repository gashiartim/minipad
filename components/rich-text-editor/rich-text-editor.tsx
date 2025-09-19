'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
} from 'lucide-react'
import {
  uploadImageFromPaste,
  copyImageToClipboard,
  downloadImage,
  createEnhancedImageExtension,
  createPasteExtension,
} from './rich-text-editor.utils'

export interface RichTextEditorProps {
  content: string
  onUpdate: (content: string) => void
  placeholder?: string
  editable?: boolean
  slug: string
  secret?: string
  className?: string
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
  const handleImageCopy = useCallback(async (src: string) => {
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
  }, [toast])

  // Handle image download
  const handleImageDownload = useCallback((src: string, filename: string) => {
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
  }, [toast])

  // Create enhanced image extension
  const EnhancedImage = createEnhancedImageExtension(handleImageCopy, handleImageDownload)

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
      editor.commands.setContent(content, false)
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
              copy/resize • Click image + Delete to remove • Use toolbar for formatting
            </>
          )}
        </div>
      )}
    </div>
  )
}
