import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { validatePastedContent } from '@/lib/client-validation'
import { ERROR_MESSAGES } from '@/lib/constants'
import { isLikelyCode } from '@/lib/code-detection'
import { uploadImageFromPaste } from '../image-actions'

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
                  const codeBlockNode =
                    view.state.schema.nodes.codeBlock?.create(
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
