export function createContextMenu(
  x: number,
  y: number,
  imageSrc: string,
  imageAlt: string,
  onCopy: (src: string) => Promise<void>,
  onDownload: (src: string, filename: string) => void,
  onDelete: () => void
): HTMLDivElement {
  const contextMenu = document.createElement('div')
  contextMenu.className =
    'fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50'
  contextMenu.style.left = `${x}px`
  contextMenu.style.top = `${y}px`

  const copyItem = document.createElement('div')
  copyItem.className =
    'px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2'
  copyItem.innerHTML = '<span>📋</span> Copy Image'
  copyItem.addEventListener('click', async () => {
    await onCopy(imageSrc)
    document.body.removeChild(contextMenu)
  })

  const downloadItem = document.createElement('div')
  downloadItem.className =
    'px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2'
  downloadItem.innerHTML = '<span>💾</span> Download Image'
  downloadItem.addEventListener('click', () => {
    onDownload(imageSrc, imageAlt || 'image')
    document.body.removeChild(contextMenu)
  })

  const deleteItem = document.createElement('div')
  deleteItem.className =
    'px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-red-600'
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
