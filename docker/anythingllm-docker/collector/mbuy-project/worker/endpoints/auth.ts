/**
 * New Auth Endpoints for MBUY
 * Uses custom JWT from Worker with new database schema
 * 
 * Tables used:
 * - customers (for customer users)
 * - merchants (for merchant/store owners)
 * - merchant_users (for merchant employees)
 * - admin_staff (for platform admins)
 * 
 * Routes:
 * - POST /auth/register
 * - POST /auth/login
 * - POST /auth/logout
 * - POST /auth/refresh
 * - POST /auth/forgot-password
 * - POST /auth/reset-password
 * - GET /auth/me
 */

import { Context } from 'hono';
import { Env, UserType } from '../types';
import { generateJWT, hashPassword, verifyPassword } from '../middleware/authMiddleware';
import { SupabaseClient } from '../types/supabase.client';
import { 
  Customer,
  Merchant,
  MerchantUser,
  AdminStaff,
  CustomerStatus,
  MerchantStatus,
} from '../types/database.types';

// JWT Secret environment key
const JWT_SECRET_KEY = 'JWT_SECRET';

// Table names constants
const TABLES = {
  customers: 'customers',
  merchants: 'merchants',
  merchant_users: 'merchant_users',
  admin_staff: 'admin_staff',
} as const;

// User type to table mapping
const USER_TYPE_TABLE: Record<UserType, string> = {
  customer: TABLES.customers,
  merchant: TABLES.merchants,
  merchant_user: TABLES.merchant_users,
  admin: TABLES.admin_staff,
  support: TABLES.admin_staff,
  moderator: TABLES.admin_staff,
  owner: TABLES.admin_staff,
};

// Type for user found result
type FoundUser = {
  user: Customer | Merchant | MerchantUser | AdminStaff;
  userType: UserType;
  table: string;
};

/**
 * Create Supabase client helper
 */
function createSupabase(env: Env): SupabaseClient {
  return new SupabaseClient(env);
}

/**
 * Find user by email across all user tables
 */
async function findUserByEmail(env: Env, email: string): Promise<FoundUser | null> {
  const supabase = createSupabase(env);
  
  const tables: { table: string; type: UserType }[] = [
    { table: TABLES.customers, type: 'customer' },
    { table: TABLES.merchants, type: 'merchant' },
    { table: TABLES.merchant_users, type: 'merchant_user' },
    { table: TABLES.admin_staff, type: 'admin' },
  ];

  console.log('[Auth] findUserByEmail - searching for:', email, 'in tables:', tables.map(t => t.table).join(', '));

  for (const { table, type } of tables) {
    console.log('[Auth] Checking table:', table);
    const { data: users, error } = await supabase.select<Customer | Merchant | MerchantUser | AdminStaff>(
      table,
      { email: `eq.${email}` },
      { limit: 1 }
    );

    if (error) {
      console.log('[Auth] Error querying table', table, ':', error);
    }

    if (!error && users && users.length > 0) {
      const user = users[0];
      console.log('[Auth] User found in table:', table, 'user_id:', user.id);
      // For admin_staff, check the actual role
      let actualType = type;
      if (table === TABLES.admin_staff && 'role' in user && user.role) {
        actualType = user.role as UserType;
      }
      return { user, userType: actualType, table };
    } else {
      console.log('[Auth] No user found in table:', table, 'users:', users?.length ?? 0);
    }
  }

  console.log('[Auth] User not found in any table');
  return null;
}

/**
 * POST /auth/register
 * Register a new user
 */
export async function registerHandler(c: Context<{ Bindings: Env }>) {
  console.log('[Auth] POST /auth/register');

  try {
    const body = await c.req.json();
    const { 
      email, 
      password, 
      phone,
      user_type = 'customer',  // 'customer' | 'merchant'
      // Customer fields
      first_name,
      last_name,
      // Merchant fields
      name: merchantName,
    } = body;

    // Validation
    if (!email || !password) {
      return c.json({
        error: 'BAD_REQUEST',
        message: 'البريد الإلكتروني وكلمة المرور مطلوبان',
      }, 400);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({
        error: 'BAD_REQUEST',
        message: 'صيغة البريد الإلكتروني غير صحيحة',
      }, 400);
    }

    // Password strength
    if (password.length < 6) {
      return c.json({
        error: 'BAD_REQUEST',
        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      }, 400);
    }

    // Validate user type
    if (!['customer', 'merchant'].includes(user_type)) {
      return c.json({
        error: 'BAD_REQUEST',
        message: 'نوع المستخدم غير صحيح',
      }, 400);
    }

    // Check if email already exists
    const existingUser = await findUserByEmail(c.env, email.toLowerCase().trim());
    if (existingUser) {
      return c.json({
        error: 'EMAIL_EXISTS',
        message: 'البريد الإلكتروني مسجل مسبقاً',
      }, 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Prepare user data based on type
    let table: string;
    let userData: Partial<Customer> | Partial<Merchant>;
    let userType: UserType;

    if (user_type === 'merchant') {
      table = TABLES.merchants;
      userType = 'merchant';
      userData = {
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        phone: phone || null,
        name: merchantName || email.split('@')[0],
        status: 'pending' as MerchantStatus, // Requires admin approval
      } as Partial<Merchant>;
    } else {
      table = TABLES.customers;
      userType = 'customer';
      // Build customer data - only include fields with actual values
      const customerData: Partial<Customer> = {
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        status: 'active' as CustomerStatus,
      };
      // Add optional fields only if they have values
      if (phone) customerData.phone = phone;
      if (first_name) customerData.first_name = first_name;
      if (last_name) customerData.last_name = last_name;
      if (first_name && last_name) customerData.full_name = `${first_name} ${last_name}`;
      
      userData = customerData;
    }

    // Insert user using SupabaseClient
    const supabase = createSupabase(c.env);
    const { data: newUser, error: insertError } = await supabase.insertSingle<Customer | Merchant>(
      table,
      userData
    );

    if (insertError || !newUser) {
      console.error('[Auth] Failed to create user:', insertError);
      
      // Check for duplicate email error
      const errorMessage = insertError?.message || insertError?.toString() || '';
      if (errorMessage.toLowerCase().includes('duplicate') || 
          errorMessage.toLowerCase().includes('unique') ||
          errorMessage.toLowerCase().includes('already exists') ||
          errorMessage.includes('23505')) { // PostgreSQL unique violation code
        return c.json({
          error: 'EMAIL_EXISTS',
          message: 'البريد الإلكتروني مسجل مسبقاً',
        }, 409);
      }
      
      return c.json({
        error: 'CREATE_FAILED',
        message: 'فشل في إنشاء الحساب',
        details: insertError?.message,
      }, 500);
    }

    // Generate JWT
    const jwtSecret = (c.env as any)[JWT_SECRET_KEY];
    if (!jwtSecret) {
      console.error('[Auth] JWT_SECRET not configured');
      return c.json({
        error: 'SERVER_ERROR',
        message: 'خطأ في إعداد الخادم',
      }, 500);
    }

    const token = await generateJWT(
      {
        userId: newUser.id,
        userType: userType,
        email: newUser.email,
        merchantId: userType === 'merchant' ? newUser.id : undefined,
      },
      jwtSecret,
      24 // 24 hours
    );

    // Return success
    return c.json({
      success: true,
      message: userType === 'merchant' 
        ? 'تم إنشاء الحساب بنجاح. في انتظار موافقة الإدارة.'
        : 'تم إنشاء الحساب بنجاح',
      token: token,
      access_token: token, // For backwards compatibility
      token_type: 'Bearer',
      expires_in: 86400, // 24 hours in seconds
      user: {
        id: newUser.id,
        email: newUser.email,
        user_type: userType,
        status: newUser.status,
      },
    }, 201);

  } catch (error: any) {
    console.error('[Auth] Registration error:', error);
    return c.json({
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ أثناء التسجيل',
    }, 500);
  }
}

/**
 * POST /auth/login
 * Login user and return JWT
 */
export async function loginHandler(c: Context<{ Bindings: Env }>) {
  console.log('[Auth] POST /auth/login');

  try {
    const body = await c.req.json();
    const { email, password } = body;

    console.log('[Auth] Login attempt for email:', email);

    // Validation
    if (!email || !password) {
      console.log('[Auth] Missing email or password');
      return c.json({
        error: 'BAD_REQUEST',
        message: 'البريد الإلكتروني وكلمة المرور مطلوبان',
      }, 400);
    }

    // Find user
    const normalizedEmail = email.toLowerCase().trim();
    console.log('[Auth] Searching for user with email:', normalizedEmail);
    const result = await findUserByEmail(c.env, normalizedEmail);

    if (!result) {
      console.log('[Auth] User not found with email:', normalizedEmail);
      return c.json({
        error: 'INVALID_CREDENTIALS',
        message: 'بيانات الدخول غير صحيحة',
      }, 401);
    }

    const { user, userType, table } = result;
    console.log('[Auth] User found in table:', table, 'userType:', userType, 'userId:', user.id);

    // Check if user has password_hash
    if (!user.password_hash) {
      console.log('[Auth] User has no password_hash:', user.id);
      return c.json({
        error: 'INVALID_CREDENTIALS',
        message: 'بيانات الدخول غير صحيحة',
      }, 401);
    }

    console.log('[Auth] Verifying password for user:', user.id);
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      console.log('[Auth] Invalid password for user:', user.id);
      return c.json({
        error: 'INVALID_CREDENTIALS',
        message: 'بيانات الدخول غير صحيحة',
      }, 401);
    }

    console.log('[Auth] Password verified successfully for user:', user.id);

    // Check user status (only for types that have status field)
    if ('status' in user) {
      const status = user.status as string;
      if (status === 'suspended' || status === 'banned') {
        return c.json({
          error: 'ACCOUNT_SUSPENDED',
          message: 'تم تعليق الحساب. تواصل مع الدعم.',
        }, 403);
      }

      // Note: pending merchants CAN login to setup their store
      // They just can't sell until approved
    }

    // Check is_active for some tables
    if ('is_active' in user && user.is_active === false) {
      return c.json({
        error: 'ACCOUNT_INACTIVE',
        message: 'الحساب غير مفعّل',
      }, 403);
    }

    // Generate JWT
    const jwtSecret = (c.env as any)[JWT_SECRET_KEY];
    if (!jwtSecret) {
      return c.json({
        error: 'SERVER_ERROR',
        message: 'خطأ في إعداد الخادم',
      }, 500);
    }

    // Determine merchantId
    let merchantId: string | undefined;
    if (userType === 'merchant') {
      merchantId = user.id;
    } else if (userType === 'merchant_user' && 'merchant_id' in user) {
      merchantId = (user as MerchantUser).merchant_id;
    }

    // Get permissions if available
    const permissions = 'permissions' in user ? (user as MerchantUser).permissions : undefined;

    const token = await generateJWT(
      {
        userId: user.id,
        userType: userType,
        email: user.email,
        merchantId: merchantId,
        permissions: permissions || undefined,
      },
      jwtSecret,
      24
    );

    // Update last login using SupabaseClient (fire and forget)
    const supabase = createSupabase(c.env);
    supabase.update(table, { updated_at: new Date().toISOString() }, `id=eq.${user.id}`)
      .catch(() => {}); // Ignore errors

    // Get display name based on user type
    const displayName = 'name' in user ? (user as Merchant).name 
      : 'full_name' in user ? (user as Customer).full_name 
      : 'first_name' in user ? (user as Customer).first_name 
      : null;

    console.log('[Auth] Login successful for user:', user.id, 'type:', userType);

    return c.json({
      success: true,
      token: token,
      access_token: token, // For backwards compatibility
      token_type: 'Bearer',
      expires_in: 86400,
      user: {
        id: user.id,
        email: user.email,
        user_type: userType,
        full_name: displayName,
        name: displayName,
        merchant_id: merchantId,
      },
    });

  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    return c.json({
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ أثناء تسجيل الدخول',
    }, 500);
  }
}

/**
 * POST /auth/logout
 * Logout user (invalidate token - for now just returns success)
 */
export async function logoutHandler(c: Context<{ Bindings: Env }>) {
  // In a stateless JWT system, logout is handled client-side
  // In the future, we could implement token blacklisting using KV
  return c.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح',
  });
}

/**
 * POST /auth/refresh
 * Refresh JWT token
 */
export async function refreshHandler(c: Context<{ Bindings: Env }>) {
  console.log('[Auth] POST /auth/refresh');

  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        error: 'UNAUTHORIZED',
        message: 'التوكن مطلوب',
      }, 401);
    }

    const token = authHeader.substring(7).trim();
    const jwtSecret = (c.env as any)[JWT_SECRET_KEY];

    // Decode token (even if expired, we need the payload)
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

      // Check if token is not too old (max 7 days for refresh)
      const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
      const now = Math.floor(Date.now() / 1000);
      if (payload.iat && (now - payload.iat) > maxAge) {
        return c.json({
          error: 'TOKEN_EXPIRED',
          message: 'انتهت صلاحية التوكن. يرجى تسجيل الدخول مرة أخرى.',
        }, 401);
      }

      // Verify user still exists and is active using SupabaseClient
      const table = USER_TYPE_TABLE[payload.userType as UserType] || TABLES.customers;
      const supabase = createSupabase(c.env);
      
      const { data: user, error } = await supabase.selectSingle<Customer | Merchant | MerchantUser | AdminStaff>(
        table,
        { id: `eq.${payload.userId}` }
      );

      if (error || !user) {
        return c.json({
          error: 'USER_NOT_FOUND',
          message: 'المستخدم غير موجود',
        }, 401);
      }

      // Check status (only for types that have status field)
      if ('status' in user) {
        const status = user.status as string;
        if (status === 'suspended' || status === 'banned') {
          return c.json({
            error: 'ACCOUNT_SUSPENDED',
            message: 'تم تعليق الحساب',
          }, 403);
        }
      }

      // Get permissions if available
      const permissions = 'permissions' in user ? (user as MerchantUser).permissions : undefined;

      // Generate new token
      const newToken = await generateJWT(
        {
          userId: payload.userId,
          userType: payload.userType,
          email: payload.email,
          merchantId: payload.merchantId,
          permissions: permissions || payload.permissions,
        },
        jwtSecret,
        24
      );

      return c.json({
        success: true,
        access_token: newToken,
        token_type: 'Bearer',
        expires_in: 86400,
      });

    } catch (decodeError) {
      return c.json({
        error: 'INVALID_TOKEN',
        message: 'التوكن غير صالح',
      }, 401);
    }

  } catch (error: any) {
    console.error('[Auth] Refresh error:', error);
    return c.json({
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ',
    }, 500);
  }
}

/**
 * GET /auth/me
 * Get current user profile
 */
export async function getMeHandler(c: Context<{ Bindings: Env }>) {
  console.log('[Auth] GET /auth/me');

  try {
    // This endpoint should be protected by authMiddleware
    // Use any type assertion for context variables
    const ctx = c as any;
    const userId = ctx.get('userId') as string;
    const userType = ctx.get('userType') as UserType;
    const merchantId = ctx.get('merchantId') as string | undefined;

    if (!userId || !userType) {
      return c.json({
        error: 'UNAUTHORIZED',
        message: 'غير مصرح',
      }, 401);
    }

    // Get user from database using SupabaseClient
    const table = USER_TYPE_TABLE[userType] || TABLES.customers;
    const supabase = createSupabase(c.env);
    
    const { data: user, error } = await supabase.selectSingle<Customer | Merchant | MerchantUser | AdminStaff>(
      table,
      { id: `eq.${userId}` }
    );

    if (error || !user) {
      return c.json({
        error: 'USER_NOT_FOUND',
        message: 'المستخدم غير موجود',
      }, 404);
    }

    // Create safe user object without password_hash
    const { password_hash, ...safeUser } = user;

    return c.json({
      success: true,
      user: {
        ...safeUser,
        user_type: userType,
        merchant_id: merchantId,
      },
    });

  } catch (error: any) {
    console.error('[Auth] GetMe error:', error);
    return c.json({
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ',
    }, 500);
  }
}

/**
 * POST /auth/forgot-password
 * Request password reset
 */
export async function forgotPasswordHandler(c: Context<{ Bindings: Env }>) {
  console.log('[Auth] POST /auth/forgot-password');

  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({
        error: 'BAD_REQUEST',
        message: 'البريد الإلكتروني مطلوب',
      }, 400);
    }

    // Always return success to prevent email enumeration
    // In production, send actual reset email here

    // Find user (but don't reveal if they exist)
    const result = await findUserByEmail(c.env, email.toLowerCase().trim());
    
    if (result) {
      // TODO: Generate reset token and send email
      // For now, just log
      console.log('[Auth] Password reset requested for:', email);
    }

    return c.json({
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور',
    });

  } catch (error: any) {
    console.error('[Auth] Forgot password error:', error);
    return c.json({
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ',
    }, 500);
  }
}

/**
 * POST /auth/reset-password
 * Reset password with token
 */
export async function resetPasswordHandler(c: Context<{ Bindings: Env }>) {
  console.log('[Auth] POST /auth/reset-password');

  // TODO: Implement password reset with token
  return c.json({
    error: 'NOT_IMPLEMENTED',
    message: 'هذه الميزة قيد التطوير',
  }, 501);
}


