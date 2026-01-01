/**
 * JWT Auth Middleware for MBUY Worker
 * 
 * New authentication system using custom JWT from Worker
 * Replaces the old Supabase Auth system
 * 
 * @module authMiddleware
 */

import { Context, Next } from 'hono';
import { Env, AuthContext, UserType } from '../types';

// JWT Secret - should be set in Wrangler secrets
// TODO: Add JWT_SECRET to wrangler secrets
const JWT_SECRET_ENV_KEY = 'JWT_SECRET';

/**
 * Verify JWT token and extract payload
 * Uses Web Crypto API available in Cloudflare Workers
 */
async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode payload
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('[JWT] Token expired');
      return null;
    }

    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureArray = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify('HMAC', key, signatureArray, data);

    if (!isValid) {
      console.log('[JWT] Invalid signature');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('[JWT] Verification error:', error);
    return null;
  }
}

/**
 * Generate JWT token
 */
export async function generateJWT(
  payload: {
    userId: string;
    userType: UserType;
    email: string;
    merchantId?: string;
    permissions?: string[];
  },
  secret: string,
  expiresInHours: number = 24
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + (expiresInHours * 60 * 60),
  };

  const encoder = new TextEncoder();
  
  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(fullPayload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${headerB64}.${payloadB64}`)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

/**
 * Hash password using bcrypt-like algorithm with Web Crypto
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltB64 = btoa(String.fromCharCode(...salt));
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256
  );

  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return `${saltB64}:${hashB64}`;
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    console.log('[Password] Verifying password, stored hash format:', storedHash ? 'exists' : 'empty', 'hash length:', storedHash?.length);
    
    const [saltB64, hashB64] = storedHash.split(':');
    if (!saltB64 || !hashB64) {
      console.log('[Password] Invalid hash format - missing salt or hash');
      return false;
    }

    console.log('[Password] Salt length:', saltB64.length, 'Hash length:', hashB64.length);

    const encoder = new TextEncoder();
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const hash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      key,
      256
    );

    const computedHashB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
    const isMatch = computedHashB64 === hashB64;
    console.log('[Password] Hash comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('[Password] Verification error:', error);
    return false;
  }
}

/**
 * Main Auth Middleware
 * Verifies JWT and sets user context
 */
export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: AuthContext }>,
  next: Next
) {
  console.log('[Auth] Starting authentication check');

  // Extract token from Authorization header
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      error: 'unauthorized',
      message: 'Missing authentication token'
    }, 401);
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return c.json({
      error: 'unauthorized',
      message: 'Invalid authentication token'
    }, 401);
  }

  // Get JWT secret from environment
  const jwtSecret = (c.env as any)[JWT_SECRET_ENV_KEY];
  if (!jwtSecret) {
    console.error('[Auth] JWT_SECRET not configured');
    return c.json({
      error: 'server_error',
      message: 'Authentication not configured'
    }, 500);
  }

  // Verify JWT
  const payload = await verifyJWT(token, jwtSecret);

  if (!payload) {
    return c.json({
      error: 'unauthorized',
      message: 'Invalid or expired token'
    }, 401);
  }

  // Set context variables
  c.set('userId', payload.userId);
  c.set('userType', payload.userType);
  c.set('email', payload.email);
  
  if (payload.merchantId) {
    c.set('merchantId', payload.merchantId);
  }
  
  if (payload.permissions) {
    c.set('permissions', payload.permissions);
  }

  // Backward compatibility - set old context variables
  c.set('authUserId' as any, payload.userId);
  c.set('profileId' as any, payload.userId);
  c.set('userRole' as any, payload.userType);
  c.set('storeId' as any, payload.merchantId);

  console.log('[Auth] Authentication successful:', {
    userId: payload.userId,
    userType: payload.userType,
  });

  await next();
}

/**
 * Middleware to require specific user type(s)
 */
export function requireUserType(allowedTypes: UserType[]) {
  return async (
    c: Context<{ Bindings: Env; Variables: AuthContext }>,
    next: Next
  ) => {
    const userType = c.get('userType');

    if (!userType) {
      return c.json({
        error: 'forbidden',
        message: 'Authentication required'
      }, 403);
    }

    if (!allowedTypes.includes(userType)) {
      return c.json({
        error: 'forbidden',
        message: `Access denied. Required: ${allowedTypes.join(', ')}`
      }, 403);
    }

    await next();
  };
}

/**
 * Middleware to require merchant access (merchant owner or employee)
 */
export function requireMerchantAccess() {
  return requireUserType(['merchant', 'merchant_user', 'admin', 'owner']);
}

/**
 * Middleware to require admin access
 */
export function requireAdminAccess() {
  return requireUserType(['admin', 'support', 'moderator', 'owner']);
}

/**
 * Middleware to require owner access (highest level)
 */
export function requireOwnerAccess() {
  return requireUserType(['owner']);
}

/**
 * Middleware to check specific permission
 */
export function requirePermission(permission: string) {
  return async (
    c: Context<{ Bindings: Env; Variables: AuthContext }>,
    next: Next
  ) => {
    const userType = c.get('userType');
    const permissions = c.get('permissions') || [];

    // Owner and admin have all permissions
    if (userType === 'owner' || userType === 'admin') {
      await next();
      return;
    }

    if (!permissions.includes(permission)) {
      return c.json({
        error: 'forbidden',
        message: `Missing permission: ${permission}`
      }, 403);
    }

    await next();
  };
}

/**
 * Helper to get auth context from Hono context
 */
export function getAuthContext(c: Context<{ Bindings: Env; Variables: AuthContext }>) {
  return {
    userId: c.get('userId'),
    userType: c.get('userType'),
    email: c.get('email'),
    merchantId: c.get('merchantId'),
    permissions: c.get('permissions'),
  };
}
