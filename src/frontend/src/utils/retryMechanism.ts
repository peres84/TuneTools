// Retry mechanism for failed requests

export interface RetryOptions {
  maxRetries?: number
  delayMs?: number
  backoff?: boolean
  onRetry?: (attempt: number, error: unknown) => void
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoff = true,
    onRetry,
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error)
      }

      // Calculate delay with optional exponential backoff
      const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Check if error is retryable
export function isRetryableError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as { status?: number; code?: string }

    // Don't retry client errors (except 429)
    if (errorObj.status && errorObj.status >= 400 && errorObj.status < 500) {
      return errorObj.status === 429 // Only retry rate limits
    }

    // Retry server errors
    if (errorObj.status && errorObj.status >= 500) {
      return true
    }

    // Retry network errors
    if (errorObj.code === 'NETWORK_ERROR' || errorObj.code === 'TIMEOUT') {
      return true
    }
  }

  // Retry on network/fetch errors
  if (error instanceof Error) {
    return error.message.includes('fetch') || 
           error.message.includes('network') || 
           error.message.includes('timeout')
  }

  return false
}

// Retry with conditional logic
export async function withConditionalRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(fn, {
    ...options,
    onRetry: (attempt, error) => {
      if (!isRetryableError(error)) {
        throw error // Stop retrying if error is not retryable
      }
      options.onRetry?.(attempt, error)
    },
  })
}
