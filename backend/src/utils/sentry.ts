import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Express } from 'express';
import logger from './logger';

/**
 * Sentry Configuration
 * Error tracking and performance monitoring
 */

export function initSentry(app: Express): void {
  // Only initialize Sentry if DSN is provided
  if (!process.env.SENTRY_DSN) {
    logger.info('Sentry DSN not found - error tracking disabled');
    logger.info('To enable Sentry: Set SENTRY_DSN environment variable');
    logger.info('Get your DSN at: https://sentry.io');
    return;
  }

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',

      // Set sample rate for performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Profiling
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      integrations: [
        // Enable profiling
        nodeProfilingIntegration(),
      ],

      // Filter out sensitive data
      beforeSend(event, hint) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }

        // Remove password fields from event data
        if (event.extra) {
          removePasswordFields(event.extra);
        }

        return event;
      },
    });

    logger.info('✅ Sentry error tracking initialized');
  } catch (error) {
    logger.error('Failed to initialize Sentry:', error);
  }
}

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

/**
 * Recursively remove password fields from objects
 */
function removePasswordFields(obj: any): void {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }

  for (const key in obj) {
    if (key.toLowerCase().includes('password')) {
      obj[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object') {
      removePasswordFields(obj[key]);
    }
  }
}
