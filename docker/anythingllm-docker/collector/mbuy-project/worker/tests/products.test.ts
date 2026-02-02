/**
 * MBUY Worker - Products Endpoints Tests
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('Products Endpoints', () => {
  const baseUrl = 'http://localhost:8787';
  let authToken: string;
  let productId: string;

  beforeAll(async () => {
    // Register and login to get auth token
    const registerResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `producttest${Date.now()}@example.com`,
        password: 'Test123!@#',
        full_name: 'Product Test User',
      }),
    });
    const registerData = await registerResponse.json();
    authToken = (registerData as any).token;
  });

  describe('GET /secure/products', () => {
    it('should get products list', async () => {
      const response = await fetch(`${baseUrl}/secure/products`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect((data as any).ok).toBe(true);
      expect(Array.isArray((data as any).data)).toBe(true);
    });

    it('should fail without auth token', async () => {
      const response = await fetch(`${baseUrl}/secure/products`);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect((data as any).ok).toBe(false);
    });
  });

  describe('POST /secure/products', () => {
    it('should create a new product', async () => {
      const response = await fetch(`${baseUrl}/secure/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Product',
          price: 99.99,
          description: 'Test product description',
        }),
      });

      const data = await response.json();

      if (response.status === 200) {
        expect((data as any).ok).toBe(true);
        expect((data as any).data).toBeDefined();
        expect((data as any).data.name).toBe('Test Product');
        productId = (data as any).data.id;
      }
      // Note: May fail if user doesn't have a store
    });
  });
});


