/**
 * Winston Logger Configuration
 *
 * Provides structured logging with multiple transports and formats.
 *
 * Features:
 * - Console logging with color-coded levels
 * - File logging (errors.log, combined.log)
 * - JSON format in production, pretty format in development
 * - Automatic log rotation (handled externally)
 * - Error stack trace capture
 *
 * Log Levels (from highest to lowest priority):
 * - error (0): Critical errors requiring immediate attention
 * - warn (1): Warning messages for potential issues
 * - info (2): General informational messages
 * - http (3): HTTP request logging
 * - debug (4): Detailed debugging information
 *
 * Environment-based Logging:
 * - Development: debug level, colorized console output
 * - Production: info level, JSON format, file output
 */

import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
  }),

  // Error log file
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format,
  }),

  // Combined log file
  new winston.transports.File({
    filename: 'logs/combined.log',
    format,
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create stream for Morgan HTTP logging
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
