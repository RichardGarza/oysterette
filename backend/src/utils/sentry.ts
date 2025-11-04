import * as Sentry from '@sentry/node';
import { Express } from 'express';

/**
 * Sentry Middleware Configuration
 * Note: Sentry.init() is called in sentry-init.ts BEFORE express is imported
 */

/**
 * Get Sentry request handler middleware
 */
export function getSentryRequestHandler() {
  if (!process.env.SENTRY_DSN) {
    return (req: any, res: any, next: any) => next();
  }
  // No-op for now - Sentry auto-instruments Express in newer versions
  return (req: any, res: any, next: any) => next();
}

/**
 * Get Sentry tracing middleware
 */
export function getSentryTracingHandler() {
  if (!process.env.SENTRY_DSN) {
    return (req: any, res: any, next: any) => next();
  }
  // No-op for now - Sentry auto-instruments Express in newer versions
  return (req: any, res: any, next: any) => next();
}

/**
 * Setup Sentry error handler
 */
export function setupSentryErrorHandler(app: Express) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.setupExpressErrorHandler(app);
}

/**
 * Manually capture exception
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  if (context) {
    Sentry.captureException(error, { extra: context });
  } else {
    Sentry.captureException(error);
  }
}
