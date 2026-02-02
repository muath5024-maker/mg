/**
 * @deprecated This middleware is deprecated. Use authMiddleware from './authMiddleware' instead.
 * 
 * Supabase Auth Middleware for MBUY Worker
 * 
 * This file is kept for backward compatibility during migration.
 * All new code should use the new authMiddleware.
 * 
 * @module supabaseAuthMiddleware
 */

import { Context, Next } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

// Re-export from new auth middleware for compatibility
export { 
  authMiddleware, 
  requireUserType, 
  requireMerchantAccess, 
  requireAdminAccess,
  getAuthContext as getNewAuthContext 
} from './authMiddleware';

/**
 * @deprecated Use authMiddleware from './authMiddleware' instead
 * 
 * This middleware now returns a 503 error indicating migration is in progress.
 * Once migration is complete, all routes using this middleware should switch to authMiddleware.
 */
export async function supabaseAuthMiddleware(
  c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>, 
  next: Next
) {
  console.warn('[Supabase Auth] DEPRECATED: This middleware is deprecated. Use authMiddleware instead.');
  
  return c.json({
    error: 'auth_migration',
    message: 'Authentication system is being migrated. Please use new auth endpoints.',
    migration_status: 'in_progress'
  }, 503);
}

/**
 * @deprecated Use requireUserType from './authMiddleware' instead
 */
export function requireRole(allowedRoles: Array<'customer' | 'merchant' | 'admin'>) {
  return async (c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>, next: Next) => {
    console.warn('[Role Check] DEPRECATED: Use requireUserType from authMiddleware instead');
    
    return c.json({
      error: 'auth_migration',
      message: 'Role check is being migrated. Please use new auth system.',
    }, 503);
  };
}

/**
 * @deprecated Use getAuthContext from './authMiddleware' instead
 */
export function getAuthContext(c: Context<{ Bindings: Env; Variables: SupabaseAuthContext }>) {
  console.warn('[Auth Context] DEPRECATED: Use getAuthContext from authMiddleware instead');
  
  return {
    userId: c.get('authUserId') as string,
    profileId: c.get('profileId') as string,
    role: c.get('userRole') as string,
    userClient: c.get('userClient'),
    authProvider: c.get('authProvider') as string,
  };
}
