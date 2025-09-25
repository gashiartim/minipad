// Application constants
export const TIMING = {
  AUTOSAVE_DELAY: 1500,
  SYNC_ANIMATION_DURATION: 500,
  LOCAL_UPDATE_CLEAR_DELAY: 100,
  WEBSOCKET_RECONNECT_BASE_DELAY: 1000,
  WEBSOCKET_RECONNECT_MAX_DELAY: 10000,
  DEBOUNCE_RESIZE_DELAY: 100,
} as const

export const IMAGE_VALIDATION = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_DIMENSIONS: { width: 1, height: 1 },
  MAX_DIMENSIONS: { width: 4000, height: 4000 },
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
} as const

export const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // First 4 bytes, followed by "WEBP"
} as const

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds 10MB limit',
  INVALID_FILE_TYPE: 'Invalid file type. Only images are allowed.',
  INVALID_DIMENSIONS: 'Image dimensions are invalid',
  UPLOAD_FAILED: 'Failed to upload image',
  NETWORK_ERROR: 'Network connection failed',
  AUTH_EXPIRED: 'Authentication expired. Please refresh and try again.',
  CONTENT_SYNC_CONFLICT: 'Content was updated by another user. Your changes are preserved.',
} as const

export const CODE_DETECTION = {
  MIN_LENGTH: 10,
  SCORE_THRESHOLD: 2,
} as const