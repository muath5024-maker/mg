/**
 * Merchant Endpoints - إدارة المتاجر
 * NEW: Uses merchants table instead of stores
 * Updated: Uses SupabaseClient with typed responses
 * 
 * Tables:
 * - merchants (main merchant/store data)
 * - merchant_users (merchant employees)
 * - merchant_settings (merchant configuration)
 */

import { Context } from 'hono';
import { Env, AuthContext, UserType } from '../types';
import { SupabaseClient } from '../types/supabase.client';
import { Merchant, MerchantUser } from '../types/database.types';

// Table names
const TABLES = {
  merchants: 'merchants',
  merchant_users: 'merchant_users',
  merchant_settings: 'merchant_settings',
} as const;

/**
 * Create Supabase client helper
 */
function createSupabase(env: Env): SupabaseClient {
  return new SupabaseClient(env);
}

/**
 * GET /secure/merchant/store
 * Get current merchant's store info
 */
export async function getMerchantStore(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const userId = c.get('userId' as any) as string;
    const userType = c.get('userType' as any) as UserType;
    const merchantId = c.get('merchantId' as any) as string;

    if (!userId) {
      return c.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    // Check if user is merchant or merchant_user
    if (!['merchant', 'merchant_user', 'admin', 'owner'].includes(userType)) {
      return c.json({
        ok: false,
        error: 'FORBIDDEN',
        message: 'Only merchants can access store information',
      }, 403);
    }

    // Get merchant ID
    const targetMerchantId = merchantId || (userType === 'merchant' ? userId : null);
    
    if (!targetMerchantId) {
      return c.json({
        ok: true,
        data: null,
        message: 'No store found',
      });
    }

    // Fetch merchant using SupabaseClient
    const supabase = createSupabase(c.env);
    const { data: merchant, error } = await supabase.selectSingle<Merchant>(
      TABLES.merchants,
      { id: `eq.${targetMerchantId}` }
    );

    if (error) {
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch store',
      }, 500);
    }

    // Remove sensitive fields
    if (merchant) {
      const { password_hash, ...safeMerchant } = merchant;
      return c.json({
        ok: true,
        data: safeMerchant,
      });
    }

    return c.json({
      ok: true,
      data: null,
    });

  } catch (error: any) {
    console.error('[getMerchantStore] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * PUT /secure/merchant/store
 * Update merchant store info
 */
export async function updateMerchantStore(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const userId = c.get('userId' as any) as string;
    const userType = c.get('userType' as any) as UserType;
    const merchantId = c.get('merchantId' as any) as string;

    if (!userId) {
      return c.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    // Only merchant owner can update store
    if (userType !== 'merchant' && userType !== 'admin' && userType !== 'owner') {
      return c.json({
        ok: false,
        error: 'FORBIDDEN',
        message: 'Only merchant owner can update store',
      }, 403);
    }

    const targetMerchantId = userType === 'merchant' ? userId : merchantId;
    
    if (!targetMerchantId) {
      return c.json({
        ok: false,
        error: 'NOT_FOUND',
        message: 'No store to update',
      }, 404);
    }

    // Get request body
    const body = await c.req.json();
    const { name, phone, logo_url } = body;

    // Build update data with proper typing
    const updateData: Partial<Merchant> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (logo_url !== undefined) updateData.logo_url = logo_url;

    // Update merchant using SupabaseClient
    const supabase = createSupabase(c.env);
    const { data: merchant, error } = await supabase.updateSingle<Merchant>(
      TABLES.merchants,
      targetMerchantId,
      updateData
    );

    if (error) {
      console.error('[updateMerchantStore] Update failed:', error.message);
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to update store',
      }, 500);
    }

    // Remove sensitive fields
    if (merchant) {
      const { password_hash, ...safeMerchant } = merchant;
      return c.json({
        ok: true,
        data: safeMerchant,
      });
    }

    return c.json({
      ok: true,
      data: null,
    });

  } catch (error: any) {
    console.error('[updateMerchantStore] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * GET /secure/merchant/settings
 * Get merchant settings
 */
export async function getMerchantSettings(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const userId = c.get('userId' as any) as string;
    const userType = c.get('userType' as any) as UserType;
    const merchantId = c.get('merchantId' as any) as string;

    if (!userId) {
      return c.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    const targetMerchantId = merchantId || (userType === 'merchant' ? userId : null);
    
    if (!targetMerchantId) {
      return c.json({
        ok: true,
        data: null,
      });
    }

    // Fetch merchant settings using SupabaseClient
    const supabase = createSupabase(c.env);
    const { data: settings, error } = await supabase.selectSingle<Record<string, any>>(
      TABLES.merchant_settings,
      { merchant_id: `eq.${targetMerchantId}` }
    );

    if (error) {
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch settings',
      }, 500);
    }

    return c.json({
      ok: true,
      data: settings || null,
    });

  } catch (error: any) {
    console.error('[getMerchantSettings] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * GET /secure/merchant/users
 * Get merchant employees
 */
export async function getMerchantUsers(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const userId = c.get('userId' as any) as string;
    const userType = c.get('userType' as any) as UserType;
    const merchantId = c.get('merchantId' as any) as string;

    if (!userId) {
      return c.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    // Only merchant owner can see employees
    if (userType !== 'merchant' && userType !== 'admin' && userType !== 'owner') {
      return c.json({
        ok: false,
        error: 'FORBIDDEN',
        message: 'Only merchant owner can view employees',
      }, 403);
    }

    const targetMerchantId = userType === 'merchant' ? userId : merchantId;
    
    if (!targetMerchantId) {
      return c.json({
        ok: true,
        data: [],
      });
    }

    // Fetch merchant users using SupabaseClient
    const supabase = createSupabase(c.env);
    const { data: users, error } = await supabase.select<MerchantUser>(
      TABLES.merchant_users,
      { merchant_id: `eq.${targetMerchantId}` },
      { select: 'id,email,name,phone,role,permissions,is_active,created_at' }
    );

    if (error) {
      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch employees',
      }, 500);
    }

    return c.json({
      ok: true,
      data: users || [],
    });

  } catch (error: any) {
    console.error('[getMerchantUsers] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}

/**
 * POST /secure/merchant/users
 * Add merchant employee
 */
export async function addMerchantUser(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  try {
    const userId = c.get('userId' as any) as string;
    const userType = c.get('userType' as any) as UserType;

    if (!userId) {
      return c.json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      }, 401);
    }

    // Only merchant owner can add employees
    if (userType !== 'merchant') {
      return c.json({
        ok: false,
        error: 'FORBIDDEN',
        message: 'Only merchant owner can add employees',
      }, 403);
    }

    const body = await c.req.json();
    const { email, name, phone, role, permissions } = body;

    if (!email) {
      return c.json({
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Email is required',
      }, 400);
    }

    // Import hash function
    const { hashPassword } = await import('../middleware/authMiddleware');

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await hashPassword(tempPassword);

    // Create merchant user data with proper typing
    const newUserData: Partial<MerchantUser> = {
      merchant_id: userId, // merchant owner's ID
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      name: name || null,
      phone: phone || null,
      role: role || 'staff',
      permissions: permissions || [],
      is_active: true,
      invited_at: new Date().toISOString(),
    };

    // Create merchant user using SupabaseClient
    const supabase = createSupabase(c.env);
    const { data: newUser, error } = await supabase.insertSingle<MerchantUser>(
      TABLES.merchant_users,
      newUserData
    );

    if (error) {
      console.error('[addMerchantUser] Insert failed:', error.message);
      
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return c.json({
          ok: false,
          error: 'EMAIL_EXISTS',
          message: 'Email already registered',
        }, 409);
      }

      return c.json({
        ok: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to add employee',
      }, 500);
    }

    // Remove sensitive fields
    if (newUser) {
      const { password_hash, ...safeUser } = newUser;
      
      // TODO: Send invitation email with temp password

      return c.json({
        ok: true,
        data: safeUser,
        temp_password: tempPassword, // In production, send via email instead
        message: 'Employee added. Please share the temporary password securely.',
      }, 201);
    }

    return c.json({
      ok: false,
      error: 'CREATE_FAILED',
      message: 'Failed to create employee',
    }, 500);

  } catch (error: any) {
    console.error('[addMerchantUser] Error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    }, 500);
  }
}


