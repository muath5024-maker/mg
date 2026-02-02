/**
 * Structured Logging Utilities for MBUY Worker
 * Provides consistent JSON logging across all endpoints
 */

import { Context } from 'hono';

export interface LogMeta {
  userId?: string;
  mbuyUserId?: string;
  requestId?: string;
  code?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: 'info' | 'error';
  timestamp: string;
  endpoint: string;
  method: string;
  userId?: string;
  mbuyUserId?: string;
  requestId?: string;
  code?: string;
  message: string;
  meta?: LogMeta;
  error?: string;
}

/**
 * Generate a unique request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract user information from context
 */
export function extractUserInfo(c: Context): { userId?: string; mbuyUserId?: string } {
  const userId = c.get('userId') as string;
  const mbuyUserId = c.get('mbuyUserId') as string;
  return { userId, mbuyUserId };
}

/**
 * Create structured log entry
 */
function createLogEntry(
  level: 'info' | 'error',
  c: Context,
  message: string,
  meta?: LogMeta,
  error?: Error
): LogEntry {
  const { userId, mbuyUserId } = extractUserInfo(c);
  const requestId = c.get('requestId') as string || generateRequestId();

  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    endpoint: c.req.path,
    method: c.req.method,
    userId,
    mbuyUserId,
    requestId,
    message,
    meta,
  };

  if (error) {
    entry.error = error.message;
  }

  return entry;
}

/**
 * Log info message with structured JSON
 */
export function logInfo(c: Context, message: string, meta?: LogMeta): void {
  const entry = createLogEntry('info', c, message, meta);
  console.log(JSON.stringify(entry));
}

/**
 * Log error message with structured JSON
 */
export function logError(c: Context, message: string, error?: Error, meta?: LogMeta): void {
  const entry = createLogEntry('error', c, message, meta, error);
  console.error(JSON.stringify(entry));
}

/**
 * Log endpoint start
 */
export function logEndpointStart(c: Context, endpointName: string): void {
  const { userId, mbuyUserId } = extractUserInfo(c);
  logInfo(c, `Endpoint ${endpointName} started`, {
    userId,
    mbuyUserId,
    endpointName,
  });
}

/**
 * Log endpoint success
 */
export function logEndpointSuccess(c: Context, endpointName: string, meta?: LogMeta): void {
  logInfo(c, `Endpoint ${endpointName} completed successfully`, meta);
}

/**
 * Log endpoint error with code
 */
export function logEndpointError(
  c: Context,
  endpointName: string,
  code: string,
  message: string,
  statusCode: number,
  error?: Error,
  meta?: LogMeta
): void {
  logError(c, `Endpoint ${endpointName} failed: ${message}`, error, {
    code,
    statusCode,
    endpointName,
    ...meta,
  });
}