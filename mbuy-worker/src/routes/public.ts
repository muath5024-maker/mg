/**
 * Public Routes Module
 * Routes that don't require authentication
 */

import { Hono } from 'hono';
import { Env } from '../types';
import { getCategories } from '../endpoints/categories';
import { createDropshipOrder } from '../endpoints/dropshipping';
import { getAvailableShortcuts } from '../endpoints/shortcuts';
import { 
  getStoreBySubdomain, 
  getPublicStoreProducts, 
  trackStoreView 
} from '../endpoints/storeSubdomain';
import {
  getStoreBySlug,
  getStoreTheme,
  getStoreBranding,
} from '../endpoints/storeWeb';
import { getPublicFlashSales } from '../endpoints/flash-sales';

// Helper function to safely get UUID param
function getUuidParam(c: any, paramName: string = 'id'): string {
  return c.req.param(paramName) as string;
}

const publicRoutes = new Hono<{ Bindings: Env }>();

// ========================================
// Products Routes
// ========================================

// Get public products (no auth required)
publicRoutes.get('/products', async (c) => {
  try {
    const url = new URL(c.req.url);
    const limit = url.searchParams.get('limit') || '20';
    const offset = url.searchParams.get('offset') || '0';
    const categoryId = url.searchParams.get('category_id');
    const storeId = url.searchParams.get('store_id');
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const desc = url.searchParams.get('desc') === 'true';

    let query = `${c.env.SUPABASE_URL}/rest/v1/products?select=*,merchants\!products_merchant_id_fkey(name,logo_url),product_categories(name)&is_active=eq.true&stock=gt.0&limit=${limit}&offset=${offset}`;
    
    if (categoryId) {
      query += `&category_id=eq.${categoryId}`;
    }
    if (storeId) {
      query += `&store_id=eq.${storeId}`;
    }
    
    query += `&order=${sortBy}.${desc ? 'desc' : 'asc'}`;

    const response = await fetch(query, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ ok: false, error: 'Failed to fetch products', detail: error }, response.status as any);
    }

    const data = await response.json();
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: 'Internal server error', detail: error.message }, 500);
  }
});

// Get product by ID (public)
publicRoutes.get('/products/:id', async (c) => {
  try {
    const productId = c.req.param('id') as string;

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${productId}&select=*,merchants\!products_merchant_id_fkey(name,logo_url),product_categories(name)`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return c.json({ ok: false, error: 'Failed to fetch product', detail: error }, response.status as any);
    }

    const data: any = await response.json();
    if (!data || data.length === 0) {
      return c.json({ ok: false, error: 'Product not found' }, 404);
    }

    return c.json({ ok: true, data: data[0] });
  } catch (error: any) {
    return c.json({ ok: false, error: 'Internal server error', detail: error.message }, 500);
  }
});

// ========================================
// Stores Routes
// ========================================

// Get public stores (no auth required)
publicRoutes.get('/stores', async (c) => {
  try {
    const url = new URL(c.req.url);
    const limit = url.searchParams.get('limit') || '20';
    const offset = url.searchParams.get('offset') || '0';
    const city = url.searchParams.get('city');
    const isVerified = url.searchParams.get('is_verified');
    const isBoosted = url.searchParams.get('is_boosted');
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const desc = url.searchParams.get('desc') === 'true';

    let query = `${c.env.SUPABASE_URL}/rest/v1/merchants?select=*,products\!products_merchant_id_fkey(count)&is_active=eq.true&limit=${limit}&offset=${offset}`;
    
    if (city) {
      query += `&city=eq.${city}`;
    }
    if (isVerified === 'true') {
      query += `&is_verified=eq.true`;
    }
    if (isBoosted === 'true') {
      query += `&is_boosted=eq.true`;
    }
    
    query += `&order=${sortBy}.${desc ? 'desc' : 'asc'}`;

    const response = await fetch(query, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ ok: false, error: 'Failed to fetch stores', detail: error }, response.status as any);
    }

    const data: any = await response.json();
    
    const transformedData = data.map((store: any) => ({
      ...store,
      products_count: store.products?.[0]?.count || 0,
      products: undefined,
    }));
    
    return c.json({ ok: true, data: transformedData });
  } catch (error: any) {
    return c.json({ ok: false, error: 'Internal server error', detail: error.message }, 500);
  }
});

// Get store by ID (public)
publicRoutes.get('/stores/:id', async (c) => {
  try {
    const storeId = getUuidParam(c, 'id');

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${storeId}&select=*`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return c.json({ ok: false, error: 'Failed to fetch store', detail: error }, response.status as any);
    }

    const data: any = await response.json();
    if (!data || data.length === 0) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    return c.json({ ok: true, data: data[0] });
  } catch (error: any) {
    return c.json({ ok: false, error: 'Internal server error', detail: error.message }, 500);
  }
});

// ========================================
// Store Web Routes (for Next.js storefront)
// ========================================

publicRoutes.get('/store/:slug', getStoreBySlug);
publicRoutes.get('/store/:slug/theme', getStoreTheme);
publicRoutes.get('/store/:slug/branding', getStoreBranding);

// ========================================
// Checkout
// ========================================
publicRoutes.post('/checkout', createDropshipOrder);

// ========================================
// Flash Sales (Public)
// ========================================
publicRoutes.get('/flash-sales', getPublicFlashSales);

export default publicRoutes;
