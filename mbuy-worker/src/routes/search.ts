/**
 * Search Routes Module
 * Product and store search routes
 */

import { Hono } from 'hono';
import { Env } from '../types';

const searchRoutes = new Hono<{ Bindings: Env }>();

// ========================================
// Product Search
// ========================================

// Search products
searchRoutes.post('/products', async (c) => {
  try {
    const body = await c.req.json();
    const query = body.query as string;
    const limit = body.limit as number || 20;
    const offset = body.offset as number || 0;
    const categoryId = body.category_id as string;
    const minPrice = body.min_price as number;
    const maxPrice = body.max_price as number;
    const sortBy = body.sort_by || 'relevance';

    if (!query || query.trim().length < 2) {
      return c.json({ ok: true, data: { results: [], total: 0 } });
    }

    // Build search query
    let searchUrl = `${c.env.SUPABASE_URL}/rest/v1/products?select=*,merchants\!products_merchant_id_fkey(name,logo_url),product_categories(name)&is_active=eq.true&or=(name.ilike.*${encodeURIComponent(query)}*,description.ilike.*${encodeURIComponent(query)}*)&limit=${limit}&offset=${offset}`;

    if (categoryId) {
      searchUrl += `&category_id=eq.${categoryId}`;
    }
    if (minPrice !== undefined) {
      searchUrl += `&price=gte.${minPrice}`;
    }
    if (maxPrice !== undefined) {
      searchUrl += `&price=lte.${maxPrice}`;
    }

    // Sort options
    switch (sortBy) {
      case 'price_asc':
        searchUrl += '&order=price.asc';
        break;
      case 'price_desc':
        searchUrl += '&order=price.desc';
        break;
      case 'newest':
        searchUrl += '&order=created_at.desc';
        break;
      case 'popular':
        searchUrl += '&order=views.desc.nullslast';
        break;
      default:
        searchUrl += '&order=created_at.desc';
    }

    const response = await fetch(searchUrl, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ ok: false, error: 'Search failed', detail: error }, response.status as any);
    }

    const data = await response.json();
    const total = parseInt(response.headers.get('content-range')?.split('/')[1] || '0');

    return c.json({
      ok: true,
      data: {
        results: data,
        total,
        query,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    return c.json({ ok: false, error: 'Search failed', detail: error.message }, 500);
  }
});

// ========================================
// Store Search
// ========================================

// Search stores
searchRoutes.post('/stores', async (c) => {
  try {
    const body = await c.req.json();
    const query = body.query as string;
    const limit = body.limit as number || 20;
    const offset = body.offset as number || 0;
    const city = body.city as string;

    if (!query || query.trim().length < 2) {
      return c.json({ ok: true, data: { results: [], total: 0 } });
    }

    // Build search query
    let searchUrl = `${c.env.SUPABASE_URL}/rest/v1/merchants?select=*,products\!products_merchant_id_fkey(count)&is_active=eq.true&or=(name.ilike.*${encodeURIComponent(query)}*,description.ilike.*${encodeURIComponent(query)}*)&limit=${limit}&offset=${offset}&order=is_verified.desc,created_at.desc`;

    if (city) {
      searchUrl += `&city=eq.${city}`;
    }

    const response = await fetch(searchUrl, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ ok: false, error: 'Store search failed', detail: error }, response.status as any);
    }

    const data = await response.json() as any[];
    const total = parseInt(response.headers.get('content-range')?.split('/')[1] || '0');

    // Transform to include products_count
    const transformedData = data.map((store: any) => ({
      ...store,
      products_count: store.products?.[0]?.count || 0,
      products: undefined,
    }));

    return c.json({
      ok: true,
      data: {
        results: transformedData,
        total,
        query,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    return c.json({ ok: false, error: 'Store search failed', detail: error.message }, 500);
  }
});

// ========================================
// Combined Search
// ========================================

// Search all (products + stores)
searchRoutes.post('/all', async (c) => {
  try {
    const body = await c.req.json();
    const query = body.query as string;
    const limit = body.limit as number || 10;

    if (!query || query.trim().length < 2) {
      return c.json({
        ok: true,
        data: {
          products: [],
          stores: [],
          query,
        },
      });
    }

    // Parallel fetch for products and stores
    const [productsRes, storesRes] = await Promise.all([
      fetch(
        `${c.env.SUPABASE_URL}/rest/v1/products?select=id,name,price,images,merchants\!products_merchant_id_fkey(name)&is_active=eq.true&or=(name.ilike.*${encodeURIComponent(query)}*,description.ilike.*${encodeURIComponent(query)}*)&limit=${limit}&order=created_at.desc`,
        {
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      ),
      fetch(
        `${c.env.SUPABASE_URL}/rest/v1/merchants?select=id,name,logo_url,city,is_verified&is_active=eq.true&or=(name.ilike.*${encodeURIComponent(query)}*,description.ilike.*${encodeURIComponent(query)}*)&limit=${Math.floor(limit / 2)}&order=is_verified.desc`,
        {
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      ),
    ]);

    const products = productsRes.ok ? await productsRes.json() : [];
    const stores = storesRes.ok ? await storesRes.json() : [];

    return c.json({
      ok: true,
      data: {
        products,
        stores,
        query,
      },
    });
  } catch (error: any) {
    return c.json({ ok: false, error: 'Search failed', detail: error.message }, 500);
  }
});

// ========================================
// Search Suggestions
// ========================================

// Get search suggestions
searchRoutes.post('/suggestions', async (c) => {
  try {
    const body = await c.req.json();
    const query = body.query as string;

    if (!query || query.trim().length < 2) {
      return c.json({ ok: true, data: { suggestions: [] } });
    }

    // Get product names that match
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?select=name&is_active=eq.true&name=ilike.*${encodeURIComponent(query)}*&limit=5`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return c.json({ ok: true, data: { suggestions: [] } });
    }

    const products = await response.json() as any[];
    const suggestions = products.map((p: any) => p.name);

    return c.json({
      ok: true,
      data: {
        suggestions: [...new Set(suggestions)],
      },
    });
  } catch (error: any) {
    return c.json({ ok: true, data: { suggestions: [] } });
  }
});

// ========================================
// Category-based Search
// ========================================

// Get products by category
searchRoutes.get('/category/:id', async (c) => {
  try {
    const categoryId = c.req.param('id');
    const limit = c.req.query('limit') || '20';
    const offset = c.req.query('offset') || '0';

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?select=*,merchants\!products_merchant_id_fkey(name,logo_url),product_categories(name)&is_active=eq.true&category_id=eq.${categoryId}&limit=${limit}&offset=${offset}&order=created_at.desc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return c.json({ ok: false, error: 'Failed to fetch products', detail: error }, response.status as any);
    }

    const data = await response.json();
    const total = parseInt(response.headers.get('content-range')?.split('/')[1] || '0');

    return c.json({
      ok: true,
      data: {
        results: data,
        total,
        categoryId,
      },
    });
  } catch (error: any) {
    return c.json({ ok: false, error: 'Failed to fetch products', detail: error.message }, 500);
  }
});

export default searchRoutes;
