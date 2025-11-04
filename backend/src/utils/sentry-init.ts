import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import logger from './logger';

/**
 * Sentry Early Initialization
 * MUST be imported before Express to properly instrument it
 */

// Only initialize Sentry if DSN is provided
if (!process.env.SENTRY_DSN) {
  logger.info('Sentry DSN not found - error tracking disabled');
  logger.info('To enable Sentry: Set SENTRY_DSN environment variable');
  logger.info('Get your DSN at: https://sentry.io');
} else {
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
