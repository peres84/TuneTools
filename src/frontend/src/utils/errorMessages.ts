// User-friendly error message mapping

export interface ErrorResponse {
  message: string
  code?: string
  status?: number
}

export function getUserFriendlyErrorMessage(error: unknown): string {
  // Handle different error types
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.'
    }

    // Check for timeout errors
    if (error.message.includes('timeout')) {
      return 'The request took too long. Please try again.'
    }

    return error.message
  }

  // Handle API error responses
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as ErrorResponse

    // Rate limit errors
    if (errorObj.status === 429 || errorObj.code === 'RATE_LIMIT_EXCEEDED') {
      return 'You\'ve made too many requests. Please wait a moment and try again.'
    }

    // Authentication errors
    if (errorObj.status === 401 || errorObj.code === 'UNAUTHORIZED') {
      return 'Your session has expired. Please log in again.'
    }

    // Permission errors
    if (errorObj.status === 403 || errorObj.code === 'FORBIDDEN') {
      return 'You don\'t have permission to perform this action.'
    }

    // Not found errors
    if (errorObj.status === 404 || errorObj.code === 'NOT_FOUND') {
      // Return custom message if available (e.g., "Please complete onboarding")
      return errorObj.message || 'The requested resource was not found.'
    }

    // Server errors
    if (errorObj.status && errorObj.status >= 500) {
      return 'Something went wrong on our end. Please try again later.'
    }

    // Validation errors
    if (errorObj.status === 400 || errorObj.code === 'VALIDATION_ERROR') {
      return errorObj.message || 'Please check your input and try again.'
    }

    // Return custom message if available
    if (errorObj.message) {
      return errorObj.message
    }
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.'
}

// Specific error messages for common scenarios
export const ERROR_MESSAGES = {
  SONG_GENERATION_FAILED: 'Failed to generate your song. Please try again or adjust your preferences.',
  SONG_ALREADY_EXISTS: 'You\'ve already generated a song today. Come back tomorrow for a new one!',
  AUDIO_LOAD_FAILED: 'Unable to load the audio file. Please try again.',
  IMAGE_UPLOAD_FAILED: 'Failed to upload the image. Please try a different file.',
  SETTINGS_SAVE_FAILED: 'Unable to save your settings. Please try again.',
  NEWS_FETCH_FAILED: 'Unable to fetch news articles. Please try again later.',
  WEATHER_FETCH_FAILED: 'Unable to fetch weather data. Please try again later.',
  CALENDAR_FETCH_FAILED: 'Unable to fetch calendar events. Please check your connection.',
  PROFILE_UPDATE_FAILED: 'Unable to update your profile. Please try again.',
  LOGIN_FAILED: 'Invalid email or password. Please try again.',
  SIGNUP_FAILED: 'Unable to create your account. Please try again.',
  LOGOUT_FAILED: 'Unable to log out. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  OFFLINE: 'You appear to be offline. Some features may not be available.',
} as const

// Error logging utility
export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString()
  const errorMessage = getUserFriendlyErrorMessage(error)
  
  console.error(`[${timestamp}] ${context ? `[${context}] ` : ''}`, {
    message: errorMessage,
    error,
    userAgent: navigator.userAgent,
    url: window.location.href,
  })

  // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
  // sendToErrorTracking({ timestamp, context, error, errorMessage })
}
