/**
 * Store Subdomain Routing for *.mbuy.pro
 * Extracts slug from Host header and routes accordingly
 */

import { Context, Next } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

const MAIN_DOMAIN = 'mbuy.pro';
const WORKER_DOMAIN = 'baharista1.workers.dev';

// Context variables for subdomain routing
type SubdomainVariables = {
  storeSlug: string | null;
  isStoreSubdomain: boolean;
};

type SubdomainContext = Context<{ Bindings: Env; Variables: SubdomainVariables }>;

/**
 * Extract store slug from Host header
 * Examples:
 * - ali-shop.mbuy.pro -> ali-shop
 * - www.mbuy.pro -> null (main site)
 * - mbuy.pro -> null (main site)
 * - localhost:8787 -> null (development)
 */
export function extractStoreSlug(host: string): string | null {
  if (!host) return null;
  
  // Remove port if present
  const hostWithoutPort = host.split(':')[0].toLowerCase();
  
  // Check if it's a subdomain of mbuy.pro
  if (hostWithoutPort.endsWith(`.${MAIN_DOMAIN}`)) {
    const subdomain = hostWithoutPort.replace(`.${MAIN_DOMAIN}`, '');
    // Exclude www and api subdomains
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return subdomain;
    }
  }
  
  return null;
}

/**
 * Middleware to handle subdomain routing
 * Sets storeSlug in context if request is to a store subdomain
 */
export async function storeSubdomainMiddleware(c: SubdomainContext, next: Next) {
  const host = c.req.header('host') || '';
  const slug = extractStoreSlug(host);
  
  if (slug) {
    // Store slug in context
    c.set('storeSlug', slug);
    c.set('isStoreSubdomain', true);
  } else {
    c.set('storeSlug', null);
    c.set('isStoreSubdomain', false);
  }
  
  await next();
}

/**
 * Get store by subdomain/slug
 * GET /store-site/:slug
 */
export async function getStoreBySubdomain(c: Context<{ Bindings: Env }>) {
  try {
    const slug = c.req.param('slug') as string;
    
    if (!slug) {
      return c.json({
        ok: false,
        error: 'Store slug is required',
      }, 400);
    }
    
    // Fetch store by slug
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?slug=eq.${encodeURIComponent(slug)}&select=id,name,description,slug,public_url,logo_url,cover_image_url,city,rating,followers_count,is_verified,is_active`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      return c.json({
        ok: false,
        error: 'Failed to fetch store',
      }, response.status as any);
    }
    
    const data: any[] = await response.json();
    
    if (!data || data.length === 0) {
      return c.json({
        ok: false,
        error: 'Store not found',
        message: 'المتجر غير موجود أو غير متاح',
      }, 404);
    }
    
    const store = data[0];
    
    // Check if store is active
    if (!store.is_active) {
      return c.json({
        ok: false,
        error: 'Store unavailable',
        message: 'المتجر غير متاح حالياً',
      }, 404);
    }
    
    return c.json({
      ok: true,
      data: store,
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Get store products by slug (for storefront)
 * GET /store-site/:slug/products
 */
export async function getPublicStoreProducts(c: Context<{ Bindings: Env }>) {
  try {
    const slug = c.req.param('slug') as string;
    
    if (!slug) {
      return c.json({
        ok: false,
        error: 'Store slug is required',
      }, 400);
    }
    
    const url = new URL(c.req.url);
    const limit = url.searchParams.get('limit') || '20';
    const offset = url.searchParams.get('offset') || '0';
    const categoryId = url.searchParams.get('category_id');
    
    // First get store ID from slug
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?slug=eq.${encodeURIComponent(slug)}&select=id,is_active`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const storeData: any[] = await merchantResponse.json();
    
    if (!storeData || storeData.length === 0 || !storeData[0].is_active) {
      return c.json({
        ok: false,
        error: 'Store not found or unavailable',
      }, 404);
    }
    
    const merchantId = storeData[0].id;
    
    // Build products query - includes regular products
    let query = `${c.env.SUPABASE_URL}/rest/v1/products?select=*,product_categories(name)&merchant_id=eq.${merchantId}&is_active=eq.true&limit=${limit}&offset=${offset}&order=created_at.desc`;
    
    if (categoryId) {
      query += `&category_id=eq.${categoryId}`;
    }
    
    const response = await fetch(query, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    let products: any[] = [];
    if (response.ok) {
      products = await response.json();
    }
    
    // Get dropship products (reseller_listings)
    const listingsQuery = `${c.env.SUPABASE_URL}/rest/v1/reseller_listings?select=*,dropship_products!reseller_listings_dropship_product_id_fkey(*),categories:product_categories(name)&reseller_merchant_id=eq.${merchantId}&is_active=eq.true&limit=${limit}&offset=${offset}&order=created_at.desc`;
    
    const listingsResponse = await fetch(listingsQuery, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    let dropshipProducts: any[] = [];
    if (listingsResponse.ok) {
      const listings: any[] = await listingsResponse.json();
      // Transform listings to product-like format
      dropshipProducts = listings.map((listing: any) => ({
        id: listing.id,
        name: listing.dropship_products?.title,
        description: listing.dropship_products?.description,
        price: listing.resale_price, // Use resale_price
        main_image_url: listing.dropship_products?.media?.[0]?.url || null,
        is_dropship: true,
        listing_id: listing.id,
        dropship_product_id: listing.dropship_product_id,
        stock: listing.dropship_products?.stock_qty || 0,
        categories: listing.categories || null,
      }));
    }
    
    // Combine both lists
    const allProducts = [...products, ...dropshipProducts];
    
    return c.json({
      ok: true,
      data: allProducts,
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Validate and update store slug
 */
type AuthContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

export async function updateStoreSlug(c: AuthContext) {
  try {
    const profileId = c.get('profileId') as string;
    const merchantId = c.req.param('id');
    const { slug } = await c.req.json();
    
    if (!slug) {
      return c.json({
        ok: false,
        error: 'Slug is required',
      }, 400);
    }
    
    // Validate slug format
    const slugRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
    if (!slugRegex.test(slug.toLowerCase())) {
      return c.json({
        ok: false,
        error: 'Invalid slug format',
        message: 'الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط',
      }, 400);
    }
    
    // Check if slug is already taken
    const existingResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?slug=eq.${encodeURIComponent(slug.toLowerCase())}&id=neq.${merchantId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const existing: any[] = await existingResponse.json();
    
    if (existing && existing.length > 0) {
      return c.json({
        ok: false,
        error: 'Slug already taken',
        message: 'هذا الرابط مستخدم بالفعل، جرب رابط آخر',
      }, 409);
    }
    
    // Update store slug (public_url will be auto-computed by trigger)
    const updateResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${merchantId}&owner_id=eq.${profileId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          slug: slug.toLowerCase(),
        }),
      }
    );
    
    if (!updateResponse.ok) {
      return c.json({
        ok: false,
        error: 'Failed to update slug',
      }, updateResponse.status as any);
    }
    
    const updated: any[] = await updateResponse.json();
    
    if (!updated || updated.length === 0) {
      return c.json({
        ok: false,
        error: 'Store not found or not authorized',
      }, 404);
    }
    
return c.json({
      ok: true,
      data: updated[0],
      message: 'تم تحديث رابط المتجر بنجاح',
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Track store or product view (public)
 * POST /store-site/track
 */
export async function trackStoreView(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json();
    const { store_id, product_id, event_type } = body;
    
    if (!store_id) {
      return c.json({
        ok: false,
        error: 'store_id is required',
      }, 400);
    }
    
    // Create analytics event
    const eventData = {
      store_id,
      event_type: event_type || (product_id ? 'product_view' : 'store_view'),
      entity_type: product_id ? 'product' : 'store',
      entity_id: product_id || store_id,
      metadata: {
        source: 'store_site',
        user_agent: c.req.header('user-agent'),
        referrer: c.req.header('referer'),
      },
    };
    
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/analytics_events`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(eventData),
      }
    );
    
    if (!response.ok) {
      console.error('Failed to track view:', await response.text());
      // Don't return error to user - tracking failures shouldn't break the UI
    }
    
    return c.json({
      ok: true,
      message: 'Event tracked',
    });
    
  } catch (error: any) {
    console.error('Track view error:', error);
    // Don't return error to user
    return c.json({
      ok: true,
      message: 'Event tracked',
    });
  }
}


