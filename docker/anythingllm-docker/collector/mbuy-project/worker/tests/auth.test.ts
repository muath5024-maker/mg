/**
 * MBUY Worker - Auth Endpoints Tests
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('Auth Endpoints', () => {
  const baseUrl = 'http://localhost:8787';
  let authToken: string;
  let testUserId: string;

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: 'Test123!@#',
          full_name: 'Test User',
        }),
      });

      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.token).toBeDefined();
      expect(data.user.email).toContain('@example.com');

      // Save for other tests
      authToken = data.token;
      testUserId = data.user.id;
    });

    it('should fail with duplicate email', async () => {
      const email = `duplicate${Date.now()}@example.com`;

      // First registration
      await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'Test123!@#',
          full_name: 'Test User',
        }),
      });

      // Duplicate registration
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'Test123!@#',
          full_name: 'Test User 2',
        }),
      });

      const data = await response.json() as any;

      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
      expect(data.code).toBe('EMAIL_EXISTS');
    });

    it('should fail with missing fields', async () => {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'incomplete@example.com',
          // Missing password
        }),
      });

      const data = await response.json() as any;

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.ok).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      // Register a test user
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `logintest${Date.now()}@example.com`,
          password: 'Test123!@#',
          full_name: 'Login Test User',
        }),
      });
      const data = await response.json() as any;
      authToken = data.token;
    });

    it('should login with valid credentials', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'logintest@example.com',
          password: 'Test123!@#',
        }),
      });

      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.token).toBeDefined();
    });

    it('should fail with invalid credentials', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'WrongPassword123',
        }),
      });

      const data = await response.json() as any;

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /auth/me', () => {
    it('should return user profile with valid token', async () => {
      const response = await fetch(`${baseUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBeDefined();
    });

    it('should fail without token', async () => {
      const response = await fetch(`${baseUrl}/auth/me`);
      const data = await response.json() as any;

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('should fail with invalid token', async () => {
      const response = await fetch(`${baseUrl}/auth/me`, {
        headers: {
          'Authorization': 'Bearer invalid_token',
        },
      });

      const data = await response.json() as any;

      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });
  });
});

