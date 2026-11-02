import Image from '@tiptap/extension-image'
import { TIMING } from '@/lib/constants'
import { createContextMenu } from './image-context-menu'

function createResizeHandle(position: string): HTMLDivElement {
  const handle = document.createElement('div')
  handle.className = `absolute w-2 h-2 bg-blue-500 border border-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${position}`
  handle.style.pointerEvents = 'auto'
  return handle
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
