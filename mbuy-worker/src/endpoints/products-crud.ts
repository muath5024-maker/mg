/**
 * Products CRUD Endpoints - New System
 * 
 * Uses:
 * - AuthContext (not SupabaseAuthContext)
 * - merchants table (not user_profiles/stores)
 * - service_role for database operations
 * 
 * @module endpoints/products-crud
 */

import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env, AuthContext } from '../types';

type ProductsContext = Context<{ Bindings: Env; Variables: AuthContext }>;

/**
 * Helper: Get Supabase client with service_role
 */
function getSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// =====================================================
// LIST PRODUCTS
// =====================================================

/**
 * GET /api/merchant/products
 * List products for current merchant
 */
export async function listMerchantProducts(c: ProductsContext) {
  const merchantId = c.get('merchantId') || c.get('userId');
  
  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'Merchant ID not found' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);
    
    // Query params
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status'); // active, inactive, draft
    const categoryId = c.req.query('category_id');
    const search = c.req.query('search');
    
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('products')
      .select('*, product_categories(id, name)', { count: 'exact' })
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[listProducts] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({
      ok: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('[listProducts] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// GET SINGLE PRODUCT
// =====================================================

/**
 * GET /api/merchant/products/:id
 * Get single product by ID (must belong to merchant)
 */
export async function getMerchantProduct(c: ProductsContext) {
  const merchantId = c.get('merchantId') || c.get('userId');
  const productId = c.req.param('id');

  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'Merchant ID not found' }, 400);
  }

  if (!productId) {
    return c.json({ ok: false, error: 'MISSING_ID', message: 'Product ID required' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories(id, name),
        product_variants(*),
        product_media(*)
      `)
      .eq('id', productId)
      .eq('merchant_id', merchantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ ok: false, error: 'NOT_FOUND', message: 'Product not found' }, 404);
      }
      console.error('[getProduct] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({ ok: true, data });

  } catch (error: any) {
    console.error('[getProduct] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// CREATE PRODUCT
// =====================================================

/**
 * POST /api/merchant/products
 * Create new product
 */
export async function createMerchantProduct(c: ProductsContext) {
  const merchantId = c.get('merchantId') || c.get('userId');

  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'Merchant ID not found' }, 400);
  }

  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.name?.trim()) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Product name is required' }, 400);
    }
    if (body.price === undefined || body.price < 0) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Valid price is required' }, 400);
    }

    const supabase = getSupabase(c.env);

    // Prepare product data - merchant_id IS the store reference
    const productData = {
      merchant_id: merchantId,
      store_id: merchantId, // store_id references merchants.id
      name: body.name.trim(),
      description: body.description || null,
      price: parseFloat(body.price),
      compare_at_price: body.compare_at_price ? parseFloat(body.compare_at_price) : null,
      cost_price: body.cost_price ? parseFloat(body.cost_price) : null,
      sku: body.sku || null,
      barcode: body.barcode || null,
      category_id: body.category_id || null,
      status: body.status || 'draft',
      type: body.type || 'simple',
      stock_quantity: body.stock_quantity || body.stock || 0,
      track_inventory: body.track_inventory ?? true,
      allow_backorder: body.allow_backorder ?? false,
      weight: body.weight || null,
      weight_unit: body.weight_unit || 'kg',
      main_image_url: body.main_image_url || body.image_url || null,
      is_active: body.is_active ?? true,
      is_featured: body.is_featured ?? false,
      meta_title: body.meta_title || null,
      meta_description: body.meta_description || null,
    };

    // Insert product
    const { data: product, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error('[createProduct] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    // Handle media if provided
    if (body.media && Array.isArray(body.media) && body.media.length > 0) {
      const mediaData = body.media.map((m: any, index: number) => ({
        product_id: product.id,
        type: m.type || 'image',
        url: m.url,
        alt_text: m.alt_text || null,
        position: m.position ?? index,
        is_main: m.is_main ?? (index === 0),
      }));

      await supabase.from('product_media').insert(mediaData);
    }

    // Handle variants if provided
    if (body.variants && Array.isArray(body.variants) && body.variants.length > 0) {
      const variantData = body.variants.map((v: any) => ({
        product_id: product.id,
        sku: v.sku || null,
        price: v.price ? parseFloat(v.price) : product.price,
        stock_quantity: v.stock_quantity || 0,
        options: v.options || {},
        is_active: v.is_active ?? true,
      }));

      await supabase.from('product_variants').insert(variantData);
    }

    return c.json({ ok: true, data: product }, 201);

  } catch (error: any) {
    console.error('[createProduct] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// UPDATE PRODUCT
// =====================================================

/**
 * PUT /api/merchant/products/:id
 * Update existing product
 */
export async function updateMerchantProduct(c: ProductsContext) {
  const merchantId = c.get('merchantId') || c.get('userId');
  const productId = c.req.param('id');

  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'Merchant ID not found' }, 400);
  }

  if (!productId) {
    return c.json({ ok: false, error: 'MISSING_ID', message: 'Product ID required' }, 400);
  }

  try {
    const body = await c.req.json();
    const supabase = getSupabase(c.env);

    // Verify ownership
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('merchant_id', merchantId)
      .single();

    if (!existing) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Product not found' }, 404);
    }

    // Build update object (only include provided fields)
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    
    const allowedFields = [
      'name', 'description', 'price', 'compare_at_price', 'cost_price',
      'sku', 'barcode', 'category_id', 'status', 'type',
      'stock_quantity', 'track_inventory', 'allow_backorder',
      'weight', 'weight_unit', 'main_image_url', 'is_active', 'is_featured',
      'meta_title', 'meta_description'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Update product
    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('[updateProduct] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({ ok: true, data: product });

  } catch (error: any) {
    console.error('[updateProduct] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// DELETE PRODUCT
// =====================================================

/**
 * DELETE /api/merchant/products/:id
 * Delete product (soft delete by setting status to 'archived')
 */
export async function deleteMerchantProduct(c: ProductsContext) {
  const merchantId = c.get('merchantId') || c.get('userId');
  const productId = c.req.param('id');

  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'Merchant ID not found' }, 400);
  }

  if (!productId) {
    return c.json({ ok: false, error: 'MISSING_ID', message: 'Product ID required' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);

    // Verify ownership and soft delete
    const { data, error } = await supabase
      .from('products')
      .update({ status: 'archived', is_active: false, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('merchant_id', merchantId)
      .select('id')
      .single();

    if (error || !data) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Product not found' }, 404);
    }

    return c.json({ ok: true, message: 'Product deleted successfully' });

  } catch (error: any) {
    console.error('[deleteProduct] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// PUBLIC PRODUCTS (No Auth Required)
// =====================================================

/**
 * GET /api/public/products
 * List active products (for storefront)
 */
export async function listPublicProducts(c: Context<{ Bindings: Env }>) {
  try {
    const supabase = getSupabase(c.env);
    
    const storeIdParam = c.req.query('store_id');
    const merchantIdParam = c.req.query('merchant_id');
    const merchantId = merchantIdParam || storeIdParam; // support both
    const categoryId = c.req.query('category_id');
    const search = c.req.query('search');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select('id, name, description, price, compare_at_price, main_image_url, category_id, product_categories(name)', { count: 'exact' })
      .eq('status', 'active')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (merchantId) query = query.eq('merchant_id', merchantId);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query;

    if (error) {
      console.error('[listPublicProducts] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({
      ok: true,
      data: data || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) }
    });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * GET /api/public/products/:id
 * Get single public product
 */
export async function getPublicProduct(c: Context<{ Bindings: Env }>) {
  const productId = c.req.param('id');

  try {
    const supabase = getSupabase(c.env);

    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, description, price, compare_at_price, main_image_url,
        category_id, product_categories(name),
        product_media(*),
        product_variants(id, sku, price, stock_quantity, options, is_active)
      `)
      .eq('id', productId)
      .eq('status', 'active')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Product not found' }, 404);
    }

    return c.json({ ok: true, data });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}


