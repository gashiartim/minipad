import { ERROR_MESSAGES } from '@/lib/constants'

export interface NoteImageDto {
  id: string
  path: string
  mime: string
  width: number | null
  height: number | null
  sizeBytes: number
  createdAt: string
}

export interface NoteDto {
  id: string
  slug: string
  content: string
  contentRich: string | null
  contentFormat: string
  createdAt: string
  updatedAt: string
  images: NoteImageDto[]
}

export interface UpdateNoteResponse {
  ok: true
  updatedAt: string
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string }

const NETWORK_ERROR_STATUS = 0

type StatusMessages = Readonly<Record<number, string>>

const COMMON_STATUS_MESSAGES: StatusMessages = {
  429: 'Too many requests - please wait',
}

const UPLOAD_STATUS_MESSAGES: StatusMessages = {
  ...COMMON_STATUS_MESSAGES,
  403: ERROR_MESSAGES.AUTH_EXPIRED,
  413: ERROR_MESSAGES.FILE_TOO_LARGE,
  415: ERROR_MESSAGES.INVALID_FILE_TYPE,
}

async function request<T>(
  url: string,
  init: RequestInit | undefined,
  fallbackError: string,
  statusMessages: StatusMessages = COMMON_STATUS_MESSAGES
): Promise<ApiResult<T>> {
  let response: Response
  try {
    response = init ? await fetch(url, init) : await fetch(url)
  } catch {
    return {
      ok: false,
      status: NETWORK_ERROR_STATUS,
      error: ERROR_MESSAGES.NETWORK_ERROR,
    }
  }

  const body = (await response.json().catch(() => ({}))) as { error?: string }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: statusMessages[response.status] ?? body.error ?? fallbackError,
    }
  }

  return { ok: true, data: body as T }
}

function jsonRequest(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export const notesApi = {
  create(input: { slug?: string | undefined; secret?: string | undefined }) {
    return request<{ slug: string }>(
      '/api/notes',
      jsonRequest('POST', input),
      'Failed to create note'
    )
  },

  get(slug: string, secret?: string) {
    const params = secret ? `?${new URLSearchParams({ secret })}` : ''
    return request<NoteDto>(
      `/api/notes/${encodeURIComponent(slug)}${params}`,
      undefined,
      'Failed to load note'
    )
  },

  update(
    slug: string,
    input: {
      content: string
      contentRich: string
      contentFormat: 'rich'
      secret?: string | undefined
    }
  ) {
    return request<UpdateNoteResponse>(
      `/api/notes/${encodeURIComponent(slug)}`,
      jsonRequest('PUT', input),
      'Failed to save note'
    )
  },

  uploadImage(slug: string, file: File, secret?: string) {
    const formData = new FormData()
    formData.append('file', file)
    if (secret) formData.append('secret', secret)

    return request<NoteImageDto>(
      `/api/notes/${encodeURIComponent(slug)}/images`,
      { method: 'POST', body: formData },
      ERROR_MESSAGES.UPLOAD_FAILED,
      UPLOAD_STATUS_MESSAGES
    )
  },
}
