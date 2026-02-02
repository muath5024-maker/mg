/**
 * Rate Limiter Middleware
 * Protects endpoints from abuse using Cloudflare KV
 */

import { Context } from 'hono';
import { Env } from '../types';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Default: 100 requests per minute
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
};

// Stricter limits for auth endpoints
const AUTH_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
};

export function createRateLimiter(config: RateLimitConfig = DEFAULT_CONFIG) {
  return async (c: Context<{ Bindings: Env }>, next: () => Promise<void>) => {
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const path = c.req.path;
    const key = `ratelimit:${ip}:${path}`;
    
    try {
      const now = Date.now();
      const windowStart = now - config.windowMs;
      
      // Get current request count from KV (if available)
      let requestData: { count: number; resetAt: number } | null = null;
      
      if (c.env.RATE_LIMIT_KV) {
        const stored = await c.env.RATE_LIMIT_KV.get(key);
        if (stored) {
          requestData = JSON.parse(stored);
        }
      }
      
      // If no data or window expired, reset
      if (!requestData || requestData.resetAt < now) {
        requestData = {
          count: 1,
          resetAt: now + config.windowMs,
        };
      } else {
        // Increment count
        requestData.count++;
      }
      
      // Check if limit exceeded
      if (requestData.count > config.maxRequests) {
        const retryAfter = Math.ceil((requestData.resetAt - now) / 1000);
        return c.json(
          {
            ok: false,
            error: 'Rate limit exceeded',
            error_code: 'RATE_LIMIT_EXCEEDED',
            retry_after: retryAfter,
          },
          429,
          {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': requestData.resetAt.toString(),
          }
        );
      }
      
      // Store updated count (if KV available)
      if (c.env.RATE_LIMIT_KV) {
        await c.env.RATE_LIMIT_KV.put(
          key,
          JSON.stringify(requestData),
          { expirationTtl: Math.ceil(config.windowMs / 1000) + 10 }
        );
      }
      
      // Add rate limit headers
      c.header('X-RateLimit-Limit', config.maxRequests.toString());
      c.header('X-RateLimit-Remaining', (config.maxRequests - requestData.count).toString());
      c.header('X-RateLimit-Reset', requestData.resetAt.toString());
      
      await next();
    } catch (error) {
      // If rate limiting fails, log but don't block request
      console.error('Rate limiter error:', error);
      await next();
    }
  };
}

// Export pre-configured limiters
export const defaultRateLimiter = createRateLimiter(DEFAULT_CONFIG);
export const authRateLimiter = createRateLimiter(AUTH_CONFIG);
