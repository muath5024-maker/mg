/**
 * MBUY Custom Auth Utilities
 * Handles JWT signing/verification and password hashing
 */

import { Env } from '../types';

// ========================================
// JWT Utilities
// ========================================

interface JWTPayload {
  sub: string; // user.id
  email: string;
  type: 'user' | 'merchant' | 'admin';
  iat?: number;
  exp?: number;
}

/**
 * Sign JWT token for MBUY
 */
export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + (30 * 24 * 60 * 60), // 30 days
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));

  const signature = await hmacSHA256(`${encodedHeader}.${encodedPayload}`, secret);
  const encodedSignature = base64UrlEncode(new Uint8Array(signature).reduce((s, byte) => s + String.fromCharCode(byte), ''));

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Verify JWT token
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    // Verify signature
    const signature = await hmacSHA256(`${encodedHeader}.${encodedPayload}`, secret);
    const expectedSignature = base64UrlEncode(new Uint8Array(signature).reduce((s, byte) => s + String.fromCharCode(byte), ''));

    if (encodedSignature !== expectedSignature) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('[Auth] JWT verification error:', error);
    return null;
  }
}

/**
 * Extract JWT from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// ========================================
// Password Hashing (using Web Crypto API)
// ========================================

/**
 * Hash password using PBKDF2 (Web Crypto API)
 * Note: In production, consider using bcrypt or argon2 via WASM
 */
export async function hashPassword(password: string, rounds: number = 100000): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const key = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: rounds,
      hash: 'SHA-256',
    },
    key,
    256
  );

  const hashArray = Array.from(new Uint8Array(hash));
  const saltArray = Array.from(salt);

  // Format: rounds:salt:hash (all base64)
  const saltB64 = btoa(String.fromCharCode(...saltArray));
  const hashB64 = btoa(String.fromCharCode(...hashArray));

  return `${rounds}:${saltB64}:${hashB64}`;
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [roundsStr, saltB64, hashB64] = hash.split(':');
    const rounds = parseInt(roundsStr, 10);

    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    const expectedHash = Uint8Array.from(atob(hashB64), c => c.charCodeAt(0));

    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    const key = await crypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedHash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: rounds,
        hash: 'SHA-256',
      },
      key,
      256
    );

    const derivedHashArray = new Uint8Array(derivedHash);
    
    // Constant-time comparison
    if (derivedHashArray.length !== expectedHash.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < derivedHashArray.length; i++) {
      result |= derivedHashArray[i] ^ expectedHash[i];
    }

    return result === 0;
  } catch (error) {
    console.error('[Auth] Password verification error:', error);
    return false;
  }
}

// ========================================
// Helper Functions
// ========================================

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

async function hmacSHA256(message: string, secret: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return await crypto.subtle.sign('HMAC', key, encoder.encode(message));
}

/**
 * Hash token for session tracking
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

