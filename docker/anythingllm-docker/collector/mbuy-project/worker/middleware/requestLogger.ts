/**
 * Request Logger Middleware
 * Adds request ID and basic logging to all requests
 */

import { MiddlewareHandler } from 'hono';
import { generateRequestId } from '../utils/logging';

export const requestLogger: MiddlewareHandler = async (c, next) => {
  // Generate unique request ID
  const requestId = generateRequestId();
  c.set('requestId', requestId);

  // Log request start
  console.log(JSON.stringify({
    level: 'info',
    timestamp: new Date().toISOString(),
    endpoint: c.req.path,
    method: c.req.method,
    requestId,
    message: 'Request started',
  }));

  const startTime = Date.now();

  await next();

  const duration = Date.now() - startTime;

  // Log request completion
  console.log(JSON.stringify({
    level: 'info',
    timestamp: new Date().toISOString(),
    endpoint: c.req.path,
    method: c.req.method,
    requestId,
    statusCode: c.res.status,
    duration: `${duration}ms`,
    message: 'Request completed',
  }));
};