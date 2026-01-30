/**
 * Auth Service
 * Handles authentication, JWT tokens, and session management
 */

import { eq, and } from 'drizzle-orm';
import type { Database } from '../db';
import type { Env } from '../types';
import { customers } from '../db/schema/users';
import { merchantUsers } from '../db/schema/merchants';

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    type: 'customer' | 'merchant';
    merchantId?: string;
  };
  error?: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  type: string;
  merchantId?: string;
  iat: number;
  exp: number;
}

export class AuthService {
  constructor(
    private db: Database,
    private env: Env
  ) {}

  /**
   * Login a customer with email and password
   */
  async loginCustomer(email: string, password: string): Promise<LoginResult> {
    try {
      const [customer] = await this.db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.email, email.toLowerCase()),
            eq(customers.status, 'active')
          )
        )
        .limit(1);

      if (!customer) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Verify password
      const isValid = await this.verifyPassword(password, customer.passwordHash || '');
      if (!isValid) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Generate JWT token
      const token = await this.generateToken({
        sub: customer.id,
        email: customer.email || '',
        type: 'customer',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      });

      return {
        success: true,
        token,
        user: {
          id: customer.id,
          email: customer.email || '',
          name: customer.fullName || '',
          type: 'customer',
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Login a merchant user with email and password
   */
  async loginMerchant(email: string, password: string): Promise<LoginResult> {
    try {
      const [user] = await this.db
        .select()
        .from(merchantUsers)
        .where(
          and(
            eq(merchantUsers.email, email.toLowerCase()),
            eq(merchantUsers.status, 'active')
          )
        )
        .limit(1);

      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Verify password
      const isValid = await this.verifyPassword(password, user.passwordHash || '');
      if (!isValid) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Generate JWT token
      const token = await this.generateToken({
        sub: user.id,
        email: user.email || '',
        type: 'merchant',
        merchantId: user.merchantId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email || '',
          name: user.fullName || '',
          type: 'merchant',
          merchantId: user.merchantId,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Register a new customer
   */
  async registerCustomer(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<LoginResult> {
    try {
      // Check if email already exists
      const [existing] = await this.db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.email, data.email.toLowerCase()))
        .limit(1);

      if (existing) {
        return { success: false, error: 'Email already registered' };
      }

      // Hash password
      const passwordHash = await this.hashPassword(data.password);

      // Create customer
      const [customer] = await this.db
        .insert(customers)
        .values({
          phone: data.phone || '',
          email: data.email.toLowerCase(),
          passwordHash,
          fullName: data.name,
          status: 'active',
        })
        .returning();

      // Generate JWT token
      const token = await this.generateToken({
        sub: customer.id,
        email: customer.email || '',
        type: 'customer',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      });

      return {
        success: true,
        token,
        user: {
          id: customer.id,
          email: customer.email || '',
          name: customer.fullName || '',
          type: 'customer',
        },
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  /**
   * Verify a JWT token
   */
  async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.env.JWT_SECRET);
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );

      const [headerB64, payloadB64, signatureB64] = token.split('.');
      if (!headerB64 || !payloadB64 || !signatureB64) {
        return null;
      }

      const signatureData = this.base64UrlDecode(signatureB64);
      const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);

      const isValid = await crypto.subtle.verify(
        'HMAC',
        key,
        signatureData.buffer as ArrayBuffer,
        dataToVerify
      );

      if (!isValid) {
        return null;
      }

      const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return payload as TokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Generate a JWT token
   */
  async generateToken(payload: TokenPayload): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.env.JWT_SECRET);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const header = { alg: 'HS256', typ: 'JWT' };
    const headerB64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadB64 = this.base64UrlEncode(JSON.stringify(payload));

    const dataToSign = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = await crypto.subtle.sign('HMAC', key, dataToSign);
    const signatureB64 = this.base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

    return `${headerB64}.${payloadB64}.${signatureB64}`;
  }

  /**
   * Refresh a token if it's close to expiration
   */
  async refreshToken(token: string): Promise<string | null> {
    const payload = await this.verifyToken(token);
    if (!payload) {
      return null;
    }

    // Only refresh if less than 1 day remaining
    const timeRemaining = payload.exp - Math.floor(Date.now() / 1000);
    if (timeRemaining > 60 * 60 * 24) {
      return token; // Still valid, no need to refresh
    }

    // Generate new token
    return this.generateToken({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    });
  }

  /**
   * Hash a password using PBKDF2
   */
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const hash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const saltB64 = btoa(String.fromCharCode(...salt));
    const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));

    return `${saltB64}:${hashB64}`;
  }

  /**
   * Verify a password against a hash
   */
  private async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    try {
      const [saltB64, hashB64] = storedHash.split(':');
      if (!saltB64 || !hashB64) return false;

      const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
      const expectedHash = Uint8Array.from(atob(hashB64), c => c.charCodeAt(0));

      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      );

      const hash = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        256
      );

      const hashArray = new Uint8Array(hash);
      if (hashArray.length !== expectedHash.length) return false;

      return hashArray.every((byte, i) => byte === expectedHash[i]);
    } catch {
      return false;
    }
  }

  private base64UrlEncode(str: string): string {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private base64UrlDecode(str: string): Uint8Array {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(base64 + padding);
    return Uint8Array.from(binary, c => c.charCodeAt(0));
  }
}
