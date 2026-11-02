export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export function plainTextToHtml(text: string): string {
  return text ? `<p>${text.replace(/\n/g, '</p><p>')}</p>` : ''
}

export function toRichContent(note: {
  content: string
  contentRich: string | null
}): string {
  return note.contentRich || plainTextToHtml(note.content)
}

export function hasSameText(a: string, b: string): boolean {
  return stripHtml(a).trim() === stripHtml(b).trim()
}
