'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  ImageIcon,
  ChevronDown,
} from 'lucide-react'
import {
  uploadImageFromPaste,
  copyImageToClipboard,
  downloadImage,
  createEnhancedImageExtension,
  createPasteExtension,
} from './rich-text-editor.utils'

// Register common programming languages for syntax highlighting
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import c from 'highlight.js/lib/languages/c'
import csharp from 'highlight.js/lib/languages/csharp'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import swift from 'highlight.js/lib/languages/swift'
import kotlin from 'highlight.js/lib/languages/kotlin'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import scss from 'highlight.js/lib/languages/scss'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'

// Create lowlight instance and register languages
const lowlight = createLowlight()
lowlight.register({
  javascript,
  typescript,
  python,
  java,
  cpp,
  c,
  csharp,
  php,
  ruby,
  go,
  rust,
  swift,
  kotlin,
  html: xml,
  css,
  scss,
  json,
  yaml,
  markdown,
  bash,
  sql,
})

// Language options for the dropdown
const LANGUAGE_OPTIONS = [
  { value: null, label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'sql', label: 'SQL' },
]

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
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        codeBlock: false, // Disable default code block to use CodeBlockLowlight
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: null,
      }),
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
          'prose prose-sm prose-slate max-w-none focus:outline-none min-h-[200px] p-4 border-0 rounded-none bg-transparent prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4',
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
  const toggleCodeBlock = useCallback(
    () => editor?.chain().focus().toggleCodeBlock().run(),
    [editor]
  )
  const setCodeBlockLanguage = useCallback(
    (language: string | null) => {
      if (language) {
        editor?.chain().focus().setCodeBlock({ language }).run()
      } else {
        editor?.chain().focus().setCodeBlock().run()
      }
    },
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
        <div className="border-b border-border/30 px-4 py-2 bg-background/50 backdrop-blur">
          <div className="flex flex-wrap items-center gap-1">
            <Button
              variant={editor.isActive('bold') ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleBold}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className="transition-all hover:bg-accent/50 focus:ring-2 focus:ring-primary/20"
              aria-label="Bold text"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('italic') ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleItalic}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className="transition-all hover:bg-accent/50 focus:ring-2 focus:ring-primary/20"
              aria-label="Italic text"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('strike') ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleStrike}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              className="transition-all hover:bg-accent/50 focus:ring-2 focus:ring-primary/20"
              aria-label="Strikethrough text"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('code') ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleCode}
              disabled={!editor.can().chain().focus().toggleCode().run()}
              className="transition-all hover:bg-accent/50 focus:ring-2 focus:ring-primary/20"
              aria-label="Inline code"
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
              disabled={!editor.can().chain().focus().toggleHeading({ level: 1 }).run()}
              className="transition-all hover:bg-accent/50 focus:ring-2 focus:ring-primary/20"
              aria-label="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant={
                editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'
              }
              size="sm"
              onClick={toggleH2}
              disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()}
              className="transition-all hover:bg-accent/50 focus:ring-2 focus:ring-primary/20"
              aria-label="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant={
                editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'
              }
              size="sm"
              onClick={toggleH3}
              disabled={!editor.can().chain().focus().toggleHeading({ level: 3 }).run()}
              className="transition-all hover:bg-accent/50 focus:ring-2 focus:ring-primary/20"
              aria-label="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleBulletList}
              disabled={!editor.can().chain().focus().toggleBulletList().run()}
              className="transition-all hover:bg-accent/50 focus:ring-2 focus:ring-primary/20"
              aria-label="Bullet list"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleOrderedList}
              disabled={!editor.can().chain().focus().toggleOrderedList().run()}
              className="transition-all hover:bg-accent/50 focus:ring-2 focus:ring-primary/20"
              aria-label="Numbered list"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleBlockquote}
              className="transition-all hover:bg-accent/50 focus:ring-2 focus:ring-primary/20"
              aria-label="Blockquote"
            >
              <Quote className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
                  size="sm"
                  className="transition-all hover:bg-accent/50 focus:ring-2 focus:ring-primary/20 flex items-center gap-1"
                  aria-label="Code block"
                >
                  <Code2 className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
                {!editor.isActive('codeBlock') ? (
                  <DropdownMenuItem
                    onClick={toggleCodeBlock}
                    className="cursor-pointer"
                  >
                    Insert Code Block
                  </DropdownMenuItem>
                ) : (
                  <>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <DropdownMenuItem
                        key={lang.value || 'plain'}
                        onClick={() => setCodeBlockLanguage(lang.value)}
                        className="cursor-pointer"
                      >
                        {lang.label}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="ghost"
              size="sm"
              onClick={addImage}
              disabled={isUploadingImage}
              className="transition-all hover:bg-accent/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              aria-label="Insert image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!editor.can().chain().focus().undo().run()}
              className="transition-all hover:bg-accent/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-30"
              aria-label="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!editor.can().chain().focus().redo().run()}
              className="transition-all hover:bg-accent/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-30"
              aria-label="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <div className="relative">
        <EditorContent
          editor={editor}
          className="border-0 rounded-none focus-within:bg-background/50 transition-colors duration-200"
          data-testid="rich-text-editor"
        />
      </div>
      {editable && (
        <div className="text-xs text-muted-foreground/80 px-4 py-2 border-t border-border/20 bg-muted/20">
          {isUploadingImage ? (
            <span className="flex items-center gap-2 text-blue-600">
              <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Uploading image...
            </span>
          ) : (
            <div className="flex items-center justify-between">
              <span>Paste images directly • Code auto-detects language • Right-click images to copy/resize</span>
              <span className="text-muted-foreground/60">Use ⌘+formatting keys for quick styling</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
