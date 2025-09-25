import { createLowlight } from 'lowlight'

// Create lowlight instance
export const lowlight = createLowlight()

// Language loaders for lazy loading
const languageLoaders: Record<string, () => Promise<any>> = {
  javascript: () => import('highlight.js/lib/languages/javascript'),
  typescript: () => import('highlight.js/lib/languages/typescript'),
  python: () => import('highlight.js/lib/languages/python'),
  java: () => import('highlight.js/lib/languages/java'),
  cpp: () => import('highlight.js/lib/languages/cpp'),
  c: () => import('highlight.js/lib/languages/c'),
  csharp: () => import('highlight.js/lib/languages/csharp'),
  php: () => import('highlight.js/lib/languages/php'),
  ruby: () => import('highlight.js/lib/languages/ruby'),
  go: () => import('highlight.js/lib/languages/go'),
  rust: () => import('highlight.js/lib/languages/rust'),
  swift: () => import('highlight.js/lib/languages/swift'),
  kotlin: () => import('highlight.js/lib/languages/kotlin'),
  xml: () => import('highlight.js/lib/languages/xml'),
  css: () => import('highlight.js/lib/languages/css'),
  scss: () => import('highlight.js/lib/languages/scss'),
  json: () => import('highlight.js/lib/languages/json'),
  yaml: () => import('highlight.js/lib/languages/yaml'),
  markdown: () => import('highlight.js/lib/languages/markdown'),
  bash: () => import('highlight.js/lib/languages/bash'),
  sql: () => import('highlight.js/lib/languages/sql'),
}

// Cache for loaded languages
const loadedLanguages = new Set<string>()

// Load core languages immediately (commonly used)
const coreLanguages = ['javascript', 'typescript', 'python', 'json']

// Load a language dynamically
export async function loadLanguage(language: string): Promise<void> {
  if (loadedLanguages.has(language)) {
    return
  }

  const loader = languageLoaders[language]
  if (!loader) {
    console.warn(`Unknown language: ${language}`)
    return
  }

  try {
    const module = await loader()
    const languageDefinition = module.default

    // Register with lowlight
    if (language === 'xml') {
      lowlight.register({ html: languageDefinition })
    } else {
      lowlight.register({ [language]: languageDefinition })
    }

    loadedLanguages.add(language)
  } catch (error) {
    console.error(`Failed to load language ${language}:`, error)
  }
}

// Load core languages immediately
Promise.all(coreLanguages.map(loadLanguage)).catch(console.error)

// Language options with lazy loading
export const LANGUAGE_OPTIONS = [
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