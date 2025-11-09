/**
 * Retry Utility with Exponential Backoff
 *
 * Handles transient failures in serverless environments (Railway + Neon)
 * Implements exponential backoff to avoid overwhelming the database during cold starts
 */

import pRetry, { AbortError } from 'p-retry';

export interface RetryOptions {
  retries?: number;
  minTimeout?: number;
  maxTimeout?: number;
  factor?: number;
  onFailedAttempt?: (error: any) => void;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  retries: 3,
  minTimeout: 1000, // 1 second
  maxTimeout: 5000, // 5 seconds
  factor: 2, // exponential backoff factor
};

/**
 * Wraps a database operation with retry logic
 *
 * @param operation - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise with the operation result
 *
 * @example
 * const user = await withRetry(() => prisma.user.findUnique({ where: { id } }));
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const mergedOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };

  return pRetry(
    async () => {
      try {
        return await operation();
      } catch (error: any) {
        // Don't retry on client errors (400-499)
        if (error.status >= 400 && error.status < 500) {
          throw new AbortError(error);
        }

        // Don't retry on validation errors
        if (error.name === 'ValidationError' || error.code === 'P2002') {
          throw new AbortError(error);
        }

        // Retry on database connection errors
        if (
          error.code === 'P1001' || // Can't reach database
          error.code === 'P1002' || // Connection timeout
          error.code === 'P1008' || // Operations timed out
          error.code === 'P1017' || // Server has closed the connection
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('ETIMEDOUT') ||
          error.message?.includes('Connection terminated unexpectedly')
        ) {
          console.warn(`⚠️ [Retry] Database connection error (${error.code}), retrying...`);
          throw error; // Will be retried
        }

        // Retry on 5xx server errors
        if (error.status >= 500) {
          console.warn(`⚠️ [Retry] Server error (${error.status}), retrying...`);
          throw error;
        }

        // Don't retry on unknown errors
        throw new AbortError(error);
      }
    },
    {
      retries: mergedOptions.retries,
      minTimeout: mergedOptions.minTimeout,
      maxTimeout: mergedOptions.maxTimeout,
      factor: mergedOptions.factor,
      onFailedAttempt: (error) => {
        console.warn(
          `⚠️ [Retry] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
        );
        mergedOptions.onFailedAttempt?.(error);
      },
    }
  );
}

/**
 * Wraps multiple database operations with retry logic
 * Executes all operations in parallel with retry support
 *
 * @example
 * const [users, posts] = await withRetryAll([
 *   () => prisma.user.findMany(),
 *   () => prisma.post.findMany()
 * ]);
 */
export async function withRetryAll<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<T[]> {
  return Promise.all(operations.map((op) => withRetry(op, options)));
}
