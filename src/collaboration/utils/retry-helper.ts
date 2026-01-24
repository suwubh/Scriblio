// src/collaboration/utils/retry-helper.ts

export interface RetryOptions {
  maxAttempts: number
  delayMs: number
  backoffFactor: number
  onRetry?: (attempt: number, error: Error) => void
}

const defaultOptions: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffFactor: 2,
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options }
  let lastError: Error

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === opts.maxAttempts) {
        throw lastError
      }

      opts.onRetry?.(attempt, lastError)
      
      const delay = opts.delayMs * Math.pow(opts.backoffFactor, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

export class ConnectionError extends Error {
  constructor(
    message: string,
    public readonly recoverable: boolean = true
  ) {
    super(message)
    this.name = 'ConnectionError'
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}