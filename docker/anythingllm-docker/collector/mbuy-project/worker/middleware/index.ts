/**
 * Middleware Exports - MBUY Worker
 * 
 * Central export for all middleware functions
 */

// Auth Middleware
export {
  authMiddleware,
  generateJWT,
  hashPassword,
  verifyPassword,
  requireUserType,
  requireMerchantAccess,
  requireAdminAccess,
  requireOwnerAccess,
  requirePermission as requirePermissionLegacy,
  getAuthContext
} from './authMiddleware';

// Role Middleware (New)
export {
  requireRole,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireOwnership,
  requireOwnMerchant,
  requireAuth,
  requireMerchantRole,
  requireAdminRole,
  requireOwnerRole,
  requireCustomerRole
} from './roleMiddleware';

// Error Handler
export { errorHandler, ApiError, ApiErrorHandler, createApiResponse, withErrorHandling } from './errorHandler';

// Rate Limiter
export { createRateLimiter, defaultRateLimiter, authRateLimiter } from './rateLimiter';

// Request Logger
export { requestLogger } from './requestLogger';

// Validation
export { validateBody, validateQuery } from './validation';

// Admin Auth
export { adminAuthMiddleware } from './adminAuth';

// Supabase Auth (Legacy - will be deprecated)
export { supabaseAuthMiddleware } from './supabaseAuthMiddleware';
