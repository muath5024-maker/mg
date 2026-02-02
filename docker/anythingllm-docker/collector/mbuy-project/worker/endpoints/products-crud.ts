/**
 * Products CRUD Endpoints
 * 
 * Compatible with DATABASE_SCHEMA.md
 * 
 * Products table columns: id, store_id, merchant_id, name, slug, description, 
 * short_description, type, status, sku, barcode, brand, tags, weight, dimensions,
 * is_featured, is_published, metadata, created_at, updated_at
 * 
 * Related tables:
 * - product_pricing: base_price, compare_at_price, currency
 * - product_media: url, alt, type, position
 * - inventory_items: quantity, reserved, available
 * - product_category_assignments: Many-to-Many with product_categories
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
 * List products for current merchant with pricing, media, and inventory
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
    const status = c.req.query('status'); // active, draft, archived
    const categoryId = c.req.query('category_id');
    const search = c.req.query('search');
    
    const offset = (page - 1) * limit;

    // Build query with related tables
    let query = supabase
      .from('products')
      .select(`
        id, store_id, merchant_id, name, slug, description, short_description,
        type, status, sku, barcode, brand, tags, weight, dimensions,
        is_featured, is_published, metadata, created_at, updated_at,
        product_pricing(base_price, compare_at_price, currency),
        product_media(id, url, alt, type, position),
        inventory_items(quantity, reserved, available),
        product_category_assignments(product_categories(id, name, slug))
      `, { count: 'exact' })
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }
    if (categoryId) {
      // Filter by category via M2M relationship
      query = query.eq('product_category_assignments.category_id', categoryId);
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
 * Get single product by ID with all related data
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
        id, store_id, merchant_id, name, slug, description, short_description,
        type, status, sku, barcode, brand, tags, weight, dimensions,
        is_featured, is_published, metadata, created_at, updated_at,
        product_pricing(base_price, compare_at_price, currency),
        product_media(id, url, alt, type, position),
        inventory_items(quantity, reserved, available, low_stock_threshold),
        product_variants(id, name, sku, barcode, price, compare_at_price, weight, options, is_default),
        product_category_assignments(product_categories(id, name, slug))
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
 * Create new product with pricing, media, inventory, and categories
 * 
 * Schema-compliant: Creates entries in products, product_pricing, 
 * product_media, inventory_items, product_category_assignments
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
    if (body.base_price === undefined || body.base_price < 0) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Valid base_price is required' }, 400);
    }

    const supabase = getSupabase(c.env);

    // Generate slug from name
    const slug = body.slug || body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Prepare product data (only columns that exist in products table)
    const productData = {
      merchant_id: merchantId,
      store_id: merchantId,
      name: body.name.trim(),
      slug: slug,
      description: body.description || null,
      short_description: body.short_description || null,
      type: body.type || 'simple',
      status: body.status || 'draft',
      sku: body.sku || null,
      barcode: body.barcode || null,
      brand: body.brand || null,
      tags: body.tags || [],
      weight: body.weight || null,
      dimensions: body.dimensions || null,
      is_featured: body.is_featured ?? false,
      is_published: body.is_published ?? false,
      metadata: body.metadata || {},
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

    // Create pricing record (required - prices are in product_pricing table)
    const pricingData = {
      product_id: product.id,
      base_price: parseFloat(body.base_price),
      compare_at_price: body.compare_at_price ? parseFloat(body.compare_at_price) : null,
      currency: body.currency || 'SAR',
    };
    await supabase.from('product_pricing').insert(pricingData);

    // Create inventory record
    if (body.quantity !== undefined || body.stock_quantity !== undefined) {
      const inventoryData = {
        product_id: product.id,
        merchant_id: merchantId,
        quantity: body.quantity ?? body.stock_quantity ?? 0,
        reserved: 0,
        low_stock_threshold: body.low_stock_threshold || 5,
      };
      await supabase.from('inventory_items').insert(inventoryData);
    }

    // Handle media if provided
    if (body.media && Array.isArray(body.media) && body.media.length > 0) {
      const mediaData = body.media.map((m: any, index: number) => ({
        product_id: product.id,
        type: m.type || 'image',
        url: m.url,
        alt: m.alt || m.alt_text || null,
        position: m.position ?? index,
        metadata: m.metadata || {},
      }));
      await supabase.from('product_media').insert(mediaData);
    }

    // Handle category assignments (M2M relationship)
    if (body.category_ids && Array.isArray(body.category_ids) && body.category_ids.length > 0) {
      const categoryAssignments = body.category_ids.map((catId: string) => ({
        product_id: product.id,
        category_id: catId,
      }));
      await supabase.from('product_category_assignments').insert(categoryAssignments);
    } else if (body.category_id) {
      // Support legacy single category_id
      await supabase.from('product_category_assignments').insert({
        product_id: product.id,
        category_id: body.category_id,
      });
    }

    // Handle variants if provided
    if (body.variants && Array.isArray(body.variants) && body.variants.length > 0) {
      const variantData = body.variants.map((v: any) => ({
        product_id: product.id,
        store_id: merchantId,
        name: v.name || 'Default',
        sku: v.sku || null,
        barcode: v.barcode || null,
        price: v.price ? parseFloat(v.price) : parseFloat(body.base_price),
        compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
        weight: v.weight || null,
        dimensions: v.dimensions || null,
        options: v.options || {},
        is_default: v.is_default ?? false,
        metadata: v.metadata || {},
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
 * Update existing product and related tables
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

    // Build update object (only columns that exist in products table)
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    
    const allowedFields = [
      'name', 'slug', 'description', 'short_description', 'type', 'status',
      'sku', 'barcode', 'brand', 'tags', 'weight', 'dimensions',
      'is_featured', 'is_published', 'metadata'
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

    // Update pricing if provided
    if (body.base_price !== undefined || body.compare_at_price !== undefined) {
      const pricingUpdate: Record<string, any> = {};
      if (body.base_price !== undefined) pricingUpdate.base_price = parseFloat(body.base_price);
      if (body.compare_at_price !== undefined) pricingUpdate.compare_at_price = body.compare_at_price ? parseFloat(body.compare_at_price) : null;
      if (body.currency) pricingUpdate.currency = body.currency;
      
      await supabase
        .from('product_pricing')
        .update(pricingUpdate)
        .eq('product_id', productId);
    }

    // Update inventory if provided
    if (body.quantity !== undefined || body.low_stock_threshold !== undefined) {
      const inventoryUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
      if (body.quantity !== undefined) inventoryUpdate.quantity = body.quantity;
      if (body.low_stock_threshold !== undefined) inventoryUpdate.low_stock_threshold = body.low_stock_threshold;
      
      await supabase
        .from('inventory_items')
        .update(inventoryUpdate)
        .eq('product_id', productId);
    }

    // Update category assignments if provided
    if (body.category_ids && Array.isArray(body.category_ids)) {
      // Remove existing assignments
      await supabase
        .from('product_category_assignments')
        .delete()
        .eq('product_id', productId);
      
      // Add new assignments
      if (body.category_ids.length > 0) {
        const categoryAssignments = body.category_ids.map((catId: string) => ({
          product_id: productId,
          category_id: catId,
        }));
        await supabase.from('product_category_assignments').insert(categoryAssignments);
      }
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

    // Verify ownership and soft delete (is_published = false for archived)
    const { data, error } = await supabase
      .from('products')
      .update({ status: 'archived', is_published: false, updated_at: new Date().toISOString() })
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
 * List published products (for storefront)
 */
export async function listPublicProducts(c: Context<{ Bindings: Env }>) {
  try {
    const supabase = getSupabase(c.env);
    
    const storeIdParam = c.req.query('store_id');
    const merchantIdParam = c.req.query('merchant_id');
    const merchantId = merchantIdParam || storeIdParam;
    const categoryId = c.req.query('category_id');
    const search = c.req.query('search');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select(`
        id, name, slug, description, short_description, type, status,
        sku, brand, tags, is_featured, created_at,
        product_pricing(base_price, compare_at_price, currency),
        product_media(id, url, alt, type, position),
        product_category_assignments(product_categories(id, name, slug))
      `, { count: 'exact' })
      .eq('status', 'active')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (merchantId) query = query.eq('merchant_id', merchantId);
    if (categoryId) {
      query = query.eq('product_category_assignments.category_id', categoryId);
    }
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
 * Get single public product with full details
 */
export async function getPublicProduct(c: Context<{ Bindings: Env }>) {
  const productId = c.req.param('id');

  try {
    const supabase = getSupabase(c.env);

    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, slug, description, short_description, type, status,
        sku, barcode, brand, tags, weight, dimensions, is_featured, created_at,
        product_pricing(base_price, compare_at_price, currency),
        product_media(id, url, alt, type, position),
        inventory_items(quantity, available),
        product_variants(id, name, sku, price, compare_at_price, weight, options, is_default),
        product_category_assignments(product_categories(id, name, slug))
      `)
      .eq('id', productId)
      .eq('status', 'active')
      .eq('is_published', true)
      .single();

    if (error || !data) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Product not found' }, 404);
    }

    return c.json({ ok: true, data });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}


