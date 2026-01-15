/**
 * Public Routes Module
 * Routes that don't require authentication
 */

import { Hono } from 'hono';
import { Env } from '../types';
import { listPublicCategories } from '../endpoints/categories-crud';
import { listPublicProducts, getPublicProduct } from '../endpoints/products-crud';
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
import {
  listPlatformCategories,
  getPlatformCategoryBySlug,
  getCategoryProducts,
} from '../endpoints/platform-categories';
import {
  getBoostedProducts,
  getBoostedStores,
} from '../endpoints/boost';

// Helper function to safely get UUID param
function getUuidParam(c: any, paramName: string = 'id'): string {
  return c.req.param(paramName) as string;
}

const publicRoutes = new Hono<{ Bindings: Env }>();

// ========================================
// Search Routes (for /api/public/search/*)
// ========================================

// Search products - /api/public/search/products
publicRoutes.get('/search/products', async (c) => {
  const url = new URL(c.req.url);
  const query = url.searchParams.get('q') || '';
  const limit = url.searchParams.get('limit') || '20';
  const offset = url.searchParams.get('offset') || '0';
  
  try {
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?or=(name.ilike.*${query}*,description.ilike.*${query}*)&is_active=eq.true&select=id,name,price,images,rating&order=created_at.desc&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await response.json();
    return c.json({ ok: true, data: data || [] });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// Search suggestions - /api/public/search/suggestions
publicRoutes.get('/search/suggestions', async (c) => {
  const url = new URL(c.req.url);
  const query = url.searchParams.get('q') || '';
  
  try {
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?name=ilike.*${query}*&is_active=eq.true&select=name&limit=10`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const data: any[] = await response.json();
    const suggestions = [...new Set(data.map(p => p.name))].slice(0, 10);
    return c.json({ ok: true, data: suggestions });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// Trending searches - /api/public/search/trending
publicRoutes.get('/search/trending', async (c) => {
  // Return static trending for now
  return c.json({ 
    ok: true, 
    data: ['ملابس', 'أحذية', 'إلكترونيات', 'عطور', 'ساعات', 'مجوهرات', 'أجهزة منزلية', 'ألعاب']
  });
});

// Search stores - /api/public/search/stores
publicRoutes.get('/search/stores', async (c) => {
  const url = new URL(c.req.url);
  const query = url.searchParams.get('q') || '';
  const limit = url.searchParams.get('limit') || '20';
  
  try {
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?business_name=ilike.*${query}*&is_active=eq.true&select=id,business_name,logo_url,rating,city&limit=${limit}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const data: any[] = await response.json();
    const stores = (data || []).map(s => ({
      id: s.id,
      name: s.business_name,
      logo_url: s.logo_url,
      rating: s.rating,
      city: s.city,
    }));
    return c.json({ ok: true, data: stores });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ========================================
// Categories Routes
// ========================================

// Get all categories - /api/public/categories/all
publicRoutes.get('/categories/all', async (c) => {
  try {
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/product_categories?select=id,name,image_url,parent_id&order=sort_order.asc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await response.json();
    return c.json({ ok: true, data: data || [] });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// Get category products - /api/public/categories/:id/products
publicRoutes.get('/categories/:id/products', async (c) => {
  const categoryId = c.req.param('id');
  const url = new URL(c.req.url);
  const limit = url.searchParams.get('limit') || '20';
  const offset = url.searchParams.get('offset') || '0';
  
  try {
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?category_id=eq.${categoryId}&is_active=eq.true&select=*&order=created_at.desc&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await response.json();
    return c.json({ ok: true, data: data || [] });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ========================================
// Banners Route
// ========================================

// Get banners - /api/public/banners
publicRoutes.get('/banners', async (c) => {
  // Return static banners for now or fetch from table if exists
  return c.json({ 
    ok: true, 
    data: [] 
  });
});

// ========================================
// Products Routes
// ========================================

// Flash deals - /api/public/products/flash-deals
publicRoutes.get('/products/flash-deals', async (c) => {
  const url = new URL(c.req.url);
  const limit = url.searchParams.get('limit') || '20';
  
  try {
    // Get products with discount
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?discount_percent=gt.0&is_active=eq.true&select=*&order=discount_percent.desc&limit=${limit}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await response.json();
    return c.json({ ok: true, data: data || [] });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// Trending products - /api/public/products/trending
publicRoutes.get('/products/trending', async (c) => {
  const url = new URL(c.req.url);
  const limit = url.searchParams.get('limit') || '20';
  
  try {
    // Get popular products by views/orders
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?is_active=eq.true&select=*&order=views_count.desc.nullslast,created_at.desc&limit=${limit}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await response.json();
    return c.json({ ok: true, data: data || [] });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

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

// Get featured stores - /api/public/stores/featured
publicRoutes.get('/stores/featured', async (c) => {
  try {
    const url = new URL(c.req.url);
    const limit = url.searchParams.get('limit') || '10';
    
    // Get stores that are boosted with 'featured' type or verified stores
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?or=(boost_type.eq.featured,is_verified.eq.true)&is_active=eq.true&select=id,business_name,logo_url,boost_points,is_verified,rating,city&order=boost_points.desc.nullslast,rating.desc.nullslast&limit=${limit}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return c.json({ ok: false, error: 'Failed to fetch featured stores', detail: error }, response.status as any);
    }

    const stores: any[] = await response.json();
    
    // Transform to match expected format
    const transformedStores = (stores || []).map((store: any) => ({
      id: store.id,
      name: store.business_name,
      logo_url: store.logo_url,
      is_verified: store.is_verified || false,
      is_boosted: !!store.boost_points,
      rating: store.rating,
      city: store.city,
    }));
    
    return c.json({ ok: true, data: transformedStores });
  } catch (error: any) {
    return c.json({ ok: false, error: 'Internal server error', detail: error.message }, 500);
  }
});

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

// Get store products - /api/public/stores/:id/products
publicRoutes.get('/stores/:id/products', async (c) => {
  try {
    const storeId = getUuidParam(c, 'id');
    const url = new URL(c.req.url);
    const limit = url.searchParams.get('limit') || '20';
    const offset = url.searchParams.get('offset') || '0';

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?merchant_id=eq.${storeId}&is_active=eq.true&select=*&order=created_at.desc&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return c.json({ ok: false, error: 'Failed to fetch store products', detail: error }, response.status as any);
    }

    const data = await response.json();
    return c.json({ ok: true, data: data || [] });
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

// ========================================
// Platform Categories (فئات المنصة)
// ========================================
publicRoutes.get('/platform-categories', listPlatformCategories);
publicRoutes.get('/platform-categories/:slug', getPlatformCategoryBySlug);
publicRoutes.get('/platform-categories/:slug/products', getCategoryProducts);

// ========================================
// Boosted Content (المحتوى المدعوم)
// ========================================
publicRoutes.get('/boosted-products', getBoostedProducts);
publicRoutes.get('/boosted-stores', getBoostedStores);

export default publicRoutes;
