import { MAX_IMAGE_SIZE_MB } from './image-rules'

export const TIMING = {
  AUTOSAVE_DELAY: 1500,
  SYNC_ANIMATION_DURATION: 500,
  LOCAL_UPDATE_CLEAR_DELAY: 100,
  WEBSOCKET_RECONNECT_BASE_DELAY: 1000,
  WEBSOCKET_RECONNECT_MAX_DELAY: 10000,
  DEBOUNCE_RESIZE_DELAY: 100,
} as const

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: `File size exceeds ${MAX_IMAGE_SIZE_MB}MB limit`,
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