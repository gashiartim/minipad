import { validatePastedContent } from '@/lib/client-validation'
import { CODE_DETECTION } from '@/lib/constants'

export function isLikelyCode(text: string): {
  isCode: boolean
  language: string | null
} {
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
    {
      pattern: /^(import|export|const|let|var|function|class)\s/m,
      language: 'javascript',
    },
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

  const hasCodePatterns = codeIndicators.some((pattern) =>
    pattern.test(trimmedText)
  )

  const lines = trimmedText.split('\n')
  const hasIndentation = lines.some((line) => /^\s{2,}/.test(line))
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
