import { validatePastedContent } from '@/lib/validation'

describe('validatePastedContent', () => {
  it('returns original content when it contains angle brackets', () => {
    const codeSnippet =
      "const populateStateFromApi = (value: string) => value === '<tag>' ? '<>' : value"

    const result = validatePastedContent(codeSnippet)

    expect(result.isValid).toBe(true)
    expect(result.sanitized).toBe(codeSnippet)
  })

  it('strips control characters but keeps printable ones', () => {
    const withControlChars = 'line one\u0000\r\nline two\u0007'

    const result = validatePastedContent(withControlChars)

    expect(result.sanitized).toBe('line one\nline two')
  })
})

