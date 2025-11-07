/**
 * Sentry Error Tracking Utilities
 *
 * Integrates Sentry error monitoring and performance tracking.
 *
 * Features:
 * - Automatic error capture and reporting
 * - Express middleware integration
 * - Performance monitoring and tracing
 * - Graceful degradation when SENTRY_DSN not set
 *
 * Setup Order (Important!):
 * 1. Sentry.init() runs in sentry-init.ts (before Express import)
 * 2. Request/tracing handlers attach to Express app
 * 3. Error handler runs LAST in middleware chain
 *
 * Environment Variables:
 * - SENTRY_DSN (optional): Sentry project DSN for error reporting
 * - If not set, all functions become no-ops (development mode)
 *
 * Note: Modern Sentry auto-instruments Express, so request/tracing
 * handlers return no-ops but are kept for future customization.
 */

import * as Sentry from '@sentry/node';
import { Express } from 'express';

/**
 * Get Sentry request handler middleware
 *
 * Auto-instrumented by modern Sentry, returns no-op.
 *
 * @returns Express middleware (no-op if SENTRY_DSN not set)
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
