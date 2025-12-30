/**
 * Role & Permission Middleware for MBUY Worker
 * 
 * Provides granular access control based on:
 * - User roles (UserType)
 * - Permissions array
 * - Resource ownership
 * 
 * @module roleMiddleware
 */

import { Context, Next } from 'hono';
import { Env, AuthContext, UserType } from '../types';
import { createClient } from '@supabase/supabase-js';

/**
 * Type for middleware handlers
 */
type MiddlewareHandler = (
  c: Context<{ Bindings: Env; Variables: AuthContext }>,
  next: Next
) => Promise<Response | void>;

/**
 * Require specific user role(s)
 * 
 * @example
 * app.get('/merchant/*', authMiddleware, requireRole(['merchant']), handler);
 * app.get('/admin/*', authMiddleware, requireRole(['admin', 'owner']), handler);
 */
export function requireRole(allowedRoles: UserType[]): MiddlewareHandler {
  return async (c, next) => {
    const userType = c.get('userType');

    if (!userType) {
      return c.json({
        error: 'unauthorized',
        message: 'Authentication required'
      }, 401);
    }

    // Owner has access to everything
    if (userType === 'owner') {
      await next();
      return;
    }

    if (!allowedRoles.includes(userType)) {
      return c.json({
        error: 'forbidden',
        message: 'Insufficient permissions',
        required: allowedRoles.join(' or ')
      }, 403);
    }

    await next();
  };
}

/**
 * Require a specific permission
 * Owner and Admin automatically have all permissions
 * 
 * @example
 * app.post('/products', authMiddleware, requirePermission('products:write'), handler);
 */
export function requirePermission(permission: string): MiddlewareHandler {
  return async (c, next) => {
    const userType = c.get('userType');
    const permissions = c.get('permissions') || [];

    if (!userType) {
      return c.json({
        error: 'unauthorized',
        message: 'Authentication required'
      }, 401);
    }

    // Owner and admin have all permissions
    if (userType === 'owner' || userType === 'admin') {
      await next();
      return;
    }

    // Merchant owner has all merchant permissions
    if (userType === 'merchant') {
      const merchantPermissions = [
        'products:read', 'products:write', 'products:delete',
        'orders:read', 'orders:update',
        'customers:read',
        'inventory:read', 'inventory:write',
        'reports:read',
        'settings:read', 'settings:write',
        'users:read', 'users:write'
      ];
      
      if (merchantPermissions.includes(permission)) {
        await next();
        return;
      }
    }

    // Check explicit permissions for merchant_user
    if (!permissions.includes(permission)) {
      return c.json({
        error: 'forbidden',
        message: 'Missing required permission',
        required: permission
      }, 403);
    }

    await next();
  };
}

/**
 * Require ALL of the specified permissions (AND logic)
 * 
 * @example
 * app.delete('/products/:id', authMiddleware, requireAllPermissions(['products:read', 'products:delete']), handler);
 */
export function requireAllPermissions(requiredPermissions: string[]): MiddlewareHandler {
  return async (c, next) => {
    const userType = c.get('userType');
    const permissions = c.get('permissions') || [];

    if (!userType) {
      return c.json({
        error: 'unauthorized',
        message: 'Authentication required'
      }, 401);
    }

    // Owner and admin have all permissions
    if (userType === 'owner' || userType === 'admin') {
      await next();
      return;
    }

    // Merchant owner has all merchant permissions
    if (userType === 'merchant') {
      await next();
      return;
    }

    // For merchant_user, check all permissions
    const missingPermissions = requiredPermissions.filter(p => !permissions.includes(p));

    if (missingPermissions.length > 0) {
      return c.json({
        error: 'forbidden',
        message: 'Missing required permissions',
        required: requiredPermissions,
        missing: missingPermissions
      }, 403);
    }

    await next();
  };
}

/**
 * Require ANY of the specified permissions (OR logic)
 * 
 * @example
 * app.get('/reports/*', authMiddleware, requireAnyPermission(['reports:read', 'admin:full']), handler);
 */
export function requireAnyPermission(requiredPermissions: string[]): MiddlewareHandler {
  return async (c, next) => {
    const userType = c.get('userType');
    const permissions = c.get('permissions') || [];

    if (!userType) {
      return c.json({
        error: 'unauthorized',
        message: 'Authentication required'
      }, 401);
    }

    // Owner and admin have all permissions
    if (userType === 'owner' || userType === 'admin') {
      await next();
      return;
    }

    // Merchant owner has all merchant permissions
    if (userType === 'merchant') {
      await next();
      return;
    }

    // For merchant_user, check if any permission matches
    const hasAnyPermission = requiredPermissions.some(p => permissions.includes(p));

    if (!hasAnyPermission) {
      return c.json({
        error: 'forbidden',
        message: 'Missing required permission',
        required: `One of: ${requiredPermissions.join(', ')}`
      }, 403);
    }

    await next();
  };
}

/**
 * Resource ownership types
 */
type ResourceType = 'product' | 'order' | 'store' | 'customer_data';

/**
 * Require ownership of the resource being accessed
 * Checks that the resource belongs to the current user's merchant/customer
 * 
 * @example
 * app.put('/products/:id', authMiddleware, requireOwnership('product'), handler);
 * app.get('/orders/:id', authMiddleware, requireOwnership('order'), handler);
 */
export function requireOwnership(resourceType: ResourceType): MiddlewareHandler {
  return async (c, next) => {
    const userType = c.get('userType');
    const userId = c.get('userId');
    const merchantId = c.get('merchantId');

    if (!userType || !userId) {
      return c.json({
        error: 'unauthorized',
        message: 'Authentication required'
      }, 401);
    }

    // Owner and admin can access any resource
    if (userType === 'owner' || userType === 'admin') {
      await next();
      return;
    }

    // Get resource ID from URL params
    const resourceId = c.req.param('id');
    
    if (!resourceId) {
      return c.json({
        error: 'bad_request',
        message: 'Resource ID required'
      }, 400);
    }

    // Create Supabase client
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let isOwner = false;

    try {
      switch (resourceType) {
        case 'product': {
          // Check if product belongs to merchant
          if (!merchantId) {
            return c.json({
              error: 'forbidden',
              message: 'Merchant access required'
            }, 403);
          }
          
          const { data: product } = await supabase
            .from('products')
            .select('merchant_id')
            .eq('id', resourceId)
            .single();
          
          isOwner = product?.merchant_id === merchantId;
          break;
        }

        case 'order': {
          const { data: order } = await supabase
            .from('orders')
            .select('customer_id, merchant_id')
            .eq('id', resourceId)
            .single();

          if (userType === 'customer') {
            // Customer can only access their own orders
            isOwner = order?.customer_id === userId;
          } else if (userType === 'merchant' || userType === 'merchant_user') {
            // Merchant can access orders for their store
            isOwner = order?.merchant_id === merchantId;
          }
          break;
        }

        case 'store': {
          // Check if store belongs to merchant
          if (!merchantId) {
            return c.json({
              error: 'forbidden',
              message: 'Merchant access required'
            }, 403);
          }
          
          // merchant_id IS the store id in our schema
          isOwner = merchantId === resourceId;
          break;
        }

        case 'customer_data': {
          // Customer can only access their own data
          if (userType !== 'customer') {
            isOwner = false;
          } else {
            isOwner = resourceId === userId;
          }
          break;
        }
      }
    } catch (error) {
      console.error('[Ownership] Check failed:', error);
      return c.json({
        error: 'server_error',
        message: 'Failed to verify ownership'
      }, 500);
    }

    if (!isOwner) {
      return c.json({
        error: 'forbidden',
        message: 'You do not have access to this resource'
      }, 403);
    }

    await next();
  };
}

/**
 * Require that the request is for the user's own merchant
 * Used for merchant-specific routes
 * 
 * @example
 * app.get('/merchant/:merchantId/settings', authMiddleware, requireOwnMerchant(), handler);
 */
export function requireOwnMerchant(): MiddlewareHandler {
  return async (c, next) => {
    const userType = c.get('userType');
    const currentMerchantId = c.get('merchantId');

    if (!userType) {
      return c.json({
        error: 'unauthorized',
        message: 'Authentication required'
      }, 401);
    }

    // Owner and admin can access any merchant
    if (userType === 'owner' || userType === 'admin') {
      await next();
      return;
    }

    // Get merchant ID from URL params
    const requestedMerchantId = c.req.param('merchantId');
    
    if (!requestedMerchantId) {
      await next();
      return;
    }

    // Check if requesting own merchant data
    if (requestedMerchantId !== currentMerchantId) {
      return c.json({
        error: 'forbidden',
        message: 'You can only access your own merchant data'
      }, 403);
    }

    await next();
  };
}

/**
 * Helper middleware: Require authenticated user (any type)
 */
export function requireAuth(): MiddlewareHandler {
  return async (c, next) => {
    const userId = c.get('userId');
    
    if (!userId) {
      return c.json({
        error: 'unauthorized',
        message: 'Authentication required'
      }, 401);
    }

    await next();
  };
}

/**
 * Convenience exports for common role combinations
 */
export const requireMerchantRole = () => requireRole(['merchant', 'merchant_user']);
export const requireAdminRole = () => requireRole(['admin', 'support', 'moderator', 'owner']);
export const requireOwnerRole = () => requireRole(['owner']);
export const requireCustomerRole = () => requireRole(['customer']);
