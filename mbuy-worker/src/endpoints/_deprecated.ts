/**
 * DEPRECATED ENDPOINTS HANDLER
 * ============================
 * This file provides a unified handler for all deprecated endpoints
 * that use the old database schema.
 * 
 * The following old tables have been deleted:
 * - stores (replaced by: merchants)
 * - user_profiles (replaced by: customers, merchants, merchant_users, admin_staff)
 * - store_followers
 * - store_products
 * - store_orders
 * - store_customers
 * - store_analytics
 * - store_settings
 * 
 * All endpoints in these files are deprecated:
 * - supabaseAuth.ts (use auth.ts instead)
 * - dropshipping.ts (to be rebuilt)
 * - store.ts (use merchant.ts instead)
 * - products.ts (use merchant.ts endpoints)
 * - products-new.ts (use merchant.ts endpoints)
 * 
 * @deprecated Since v2.0.0 - Migration to new 143-table schema
 */

import { Context } from 'hono';
import { Env } from '../types';

/**
 * Standard response for deprecated endpoints
 */
export function deprecatedHandler(endpointName: string) {
  return async (c: Context<{ Bindings: Env }>) => {
    console.log(`[DEPRECATED] Endpoint called: ${endpointName}`);
    
    return c.json({
      error: 'DEPRECATED',
      message: 'هذا الـ Endpoint قديم ولم يعد متاحاً',
      message_en: 'This endpoint is deprecated and no longer available',
      deprecated_endpoint: endpointName,
      migration_info: {
        status: 'IN_PROGRESS',
        new_api_version: '2.0.0',
        alternatives: getAlternativeEndpoint(endpointName),
      }
    }, 410); // 410 Gone
  };
}

/**
 * Get alternative endpoint suggestions
 */
function getAlternativeEndpoint(oldEndpoint: string): string | null {
  const alternatives: Record<string, string> = {
    // Auth
    '/auth/supabase/register': 'POST /auth/register',
    '/auth/supabase/login': 'POST /auth/login',
    '/auth/supabase/logout': 'POST /auth/logout',
    '/auth/supabase/refresh': 'POST /auth/refresh',
    
    // Store/Merchant
    '/secure/store': 'GET /merchant/store',
    '/secure/store/settings': 'GET /merchant/settings',
    '/store/*': '/merchant/*',
    
    // Products
    '/secure/products': 'POST /merchant/products',
    '/secure/products/:id': 'GET/PUT/DELETE /merchant/products/:id',
    
    // Dropshipping
    '/secure/dropship/*': 'Coming soon in v2.0',
  };
  
  // Find closest match
  for (const [key, value] of Object.entries(alternatives)) {
    if (oldEndpoint.includes(key.replace('/*', '').replace('/:id', ''))) {
      return value;
    }
  }
  
  return null;
}

/**
 * Middleware to deprecate entire route groups
 */
export async function deprecatedRouteGroup(c: Context<{ Bindings: Env }>) {
  const path = c.req.path;
  const method = c.req.method;
  
  console.log(`[DEPRECATED ROUTE] ${method} ${path}`);
  
  return c.json({
    error: 'DEPRECATED_ROUTE_GROUP',
    message: 'مجموعة المسارات هذه قديمة',
    message_en: 'This route group is deprecated',
    path,
    method,
    migration_status: 'IN_PROGRESS',
    expected_completion: '2025-Q1',
  }, 410);
}

/**
 * List of deprecated endpoint files and their status
 */
export const DEPRECATED_FILES = {
  'supabaseAuth.ts': {
    status: 'FULLY_DEPRECATED',
    replacement: 'auth.ts',
    reason: 'Migrated to custom JWT from Worker',
  },
  'dropshipping.ts': {
    status: 'PENDING_REBUILD',
    replacement: null,
    reason: 'Uses old user_profiles and stores tables',
  },
  'store.ts': {
    status: 'FULLY_DEPRECATED',
    replacement: 'merchant.ts',
    reason: 'stores table replaced by merchants table',
  },
  'products.ts': {
    status: 'PARTIALLY_DEPRECATED',
    replacement: 'merchant.ts (inline endpoints)',
    reason: 'Uses old user_profiles table',
  },
  'products-new.ts': {
    status: 'PARTIALLY_DEPRECATED',
    replacement: 'merchant.ts (inline endpoints)',
    reason: 'Uses old user_profiles table',
  },
} as const;

/**
 * Export all deprecated handlers for easy routing
 */
export const deprecatedHandlers = {
  // Supabase Auth (deprecated)
  supabaseRegister: deprecatedHandler('/auth/supabase/register'),
  supabaseLogin: deprecatedHandler('/auth/supabase/login'),
  supabaseLogout: deprecatedHandler('/auth/supabase/logout'),
  supabaseRefresh: deprecatedHandler('/auth/supabase/refresh'),
  
  // Old Store endpoints
  getStore: deprecatedHandler('/secure/store'),
  updateStore: deprecatedHandler('/secure/store'),
  getStoreSettings: deprecatedHandler('/secure/store/settings'),
  
  // Dropshipping
  dropshipping: deprecatedHandler('/secure/dropship/*'),
  
  // Old products (that use user_profiles)
  createProduct: deprecatedHandler('/secure/products (old)'),
};


