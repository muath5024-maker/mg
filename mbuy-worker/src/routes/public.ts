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
    // NEW SCHEMA: Get products with compare_at_price > base_price (discounted)
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?select=id,name,slug,description,merchant_id,is_featured,created_at,product_pricing(base_price,compare_at_price,currency),product_media(url,alt,type,position)&status=eq.active&is_published=eq.true&limit=${limit}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const rawData: any[] = await response.json();
    
    // Filter and transform products with discounts
    const data = rawData
      .filter((p: any) => {
        const pricing = p.product_pricing?.[0];
        return pricing && pricing.compare_at_price && pricing.compare_at_price > pricing.base_price;
      })
      .map((p: any) => {
        const pricing = p.product_pricing?.[0] || {};
        const discountPercent = pricing.compare_at_price 
          ? Math.round((1 - pricing.base_price / pricing.compare_at_price) * 100)
          : 0;
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          merchant_id: p.merchant_id,
          is_featured: p.is_featured,
          created_at: p.created_at,
          price: pricing.base_price ?? 0,
          compare_at_price: pricing.compare_at_price,
          currency: pricing.currency ?? 'SAR',
          discount_percent: discountPercent,
          images: (p.product_media || []).map((m: any) => m.url).filter(Boolean),
          main_image_url: p.product_media?.[0]?.url,
        };
      })
      .sort((a: any, b: any) => b.discount_percent - a.discount_percent);
      
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// Trending products - /api/public/products/trending
publicRoutes.get('/products/trending', async (c) => {
  const url = new URL(c.req.url);
  const limit = url.searchParams.get('limit') || '20';
  
  try {
    // NEW SCHEMA: Get featured/recent products
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?select=id,name,slug,description,merchant_id,is_featured,created_at,product_pricing(base_price,compare_at_price,currency),product_media(url,alt,type,position)&status=eq.active&is_published=eq.true&order=is_featured.desc,created_at.desc&limit=${limit}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const rawData: any[] = await response.json();
    
    // Transform to expected format
    const data = rawData.map((p: any) => {
      const pricing = p.product_pricing?.[0] || {};
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        merchant_id: p.merchant_id,
        is_featured: p.is_featured,
        created_at: p.created_at,
        price: pricing.base_price ?? 0,
        compare_at_price: pricing.compare_at_price,
        currency: pricing.currency ?? 'SAR',
        images: (p.product_media || []).map((m: any) => m.url).filter(Boolean),
        main_image_url: p.product_media?.[0]?.url,
      };
    });
    
    return c.json({ ok: true, data });
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
    const merchantId = url.searchParams.get('merchant_id') || url.searchParams.get('store_id');
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const desc = url.searchParams.get('desc') !== 'false'; // Default to desc

    // NEW SCHEMA: Query products with related tables
    let query = `${c.env.SUPABASE_URL}/rest/v1/products?select=id,name,slug,description,short_description,type,status,sku,brand,tags,is_featured,created_at,merchant_id,product_pricing(base_price,compare_at_price,currency),product_media(id,url,alt,type,position)&status=eq.active&is_published=eq.true&limit=${limit}&offset=${offset}`;
    
    if (categoryId) {
      // For category filtering, we need separate query via product_category_assignments
      query += `&product_category_assignments.category_id=eq.${categoryId}`;
    }
    if (merchantId) {
      query += `&merchant_id=eq.${merchantId}`;
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

    const rawData: any[] = await response.json();
    
    // Transform to expected format for Flutter app
    const data = rawData.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      short_description: p.short_description,
      type: p.type,
      status: p.status,
      sku: p.sku,
      brand: p.brand,
      tags: p.tags,
      is_featured: p.is_featured,
      created_at: p.created_at,
      merchant_id: p.merchant_id,
      // Flatten pricing
      price: p.product_pricing?.[0]?.base_price ?? 0,
      compare_at_price: p.product_pricing?.[0]?.compare_at_price,
      currency: p.product_pricing?.[0]?.currency ?? 'SAR',
      // Flatten media to images array
      images: (p.product_media || []).map((m: any) => m.url).filter(Boolean),
      main_image_url: p.product_media?.[0]?.url,
    }));
    
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: 'Internal server error', detail: error.message }, 500);
  }
});

// Get product by ID (public)
publicRoutes.get('/products/:id', async (c) => {
  try {
    const productId = c.req.param('id') as string;

    // NEW SCHEMA: Query with related tables
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${productId}&select=id,name,slug,description,short_description,type,status,sku,barcode,brand,tags,weight,dimensions,is_featured,created_at,merchant_id,product_pricing(base_price,compare_at_price,currency),product_media(id,url,alt,type,position),inventory_items(quantity,available),product_variants(id,name,sku,price,compare_at_price,weight,options,is_default)&status=eq.active&is_published=eq.true`,
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

    const rawData: any[] = await response.json();
    if (!rawData || rawData.length === 0) {
      return c.json({ ok: false, error: 'Product not found' }, 404);
    }

    const p = rawData[0];
    const pricing = p.product_pricing?.[0] || {};
    
    // Transform to expected format
    const data = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      short_description: p.short_description,
      type: p.type,
      status: p.status,
      sku: p.sku,
      barcode: p.barcode,
      brand: p.brand,
      tags: p.tags,
      weight: p.weight,
      dimensions: p.dimensions,
      is_featured: p.is_featured,
      created_at: p.created_at,
      merchant_id: p.merchant_id,
      price: pricing.base_price ?? 0,
      compare_at_price: pricing.compare_at_price,
      currency: pricing.currency ?? 'SAR',
      images: (p.product_media || []).map((m: any) => m.url).filter(Boolean),
      main_image_url: p.product_media?.[0]?.url,
      stock: p.inventory_items?.[0]?.available ?? 0,
      variants: p.product_variants || [],
    };

    return c.json({ ok: true, data });
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
    
    // Get merchants with active status
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?status=eq.active&select=id,name,logo_url,created_at&order=created_at.desc&limit=${limit}`,
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
      name: store.name,
      logo_url: store.logo_url,
      is_verified: false,
      is_boosted: false,
      created_at: store.created_at,
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
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const desc = url.searchParams.get('desc') === 'true';

    // NEW SCHEMA: Use merchants table with correct column names
    let query = `${c.env.SUPABASE_URL}/rest/v1/merchants?select=id,name,logo_url,status,created_at&status=eq.active&limit=${limit}&offset=${offset}`;
    
    query += `&order=${sortBy}.${desc ? 'desc' : 'asc'}`;

    const response = await fetch(query, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ ok: false, error: 'Failed to fetch stores', detail: error }, response.status as any);
    }

    const rawData: any[] = await response.json();
    
    // Transform to expected format
    const data = (rawData || []).map((store: any) => ({
      id: store.id,
      name: store.name,
      logo_url: store.logo_url,
      is_verified: false,
      is_boosted: false,
      created_at: store.created_at,
    }));
    
    return c.json({ ok: true, data });
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
