/**
 * Categories CRUD Endpoints - New System
 * 
 * @module endpoints/categories-crud
 */

import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env, AuthContext } from '../types';

type CategoriesContext = Context<{ Bindings: Env; Variables: AuthContext }>;

function getSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// =====================================================
// MERCHANT CATEGORIES
// =====================================================

/**
 * GET /api/merchant/categories
 * List categories for merchant
 */
export async function listMerchantCategories(c: CategoriesContext) {
  const merchantId = c.get('merchantId') || c.get('userId');
  
  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'Merchant ID not found' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);

    let query = supabase
      .from('product_categories')
      .select('*')
      .order('position', { ascending: true });

    // Filter by merchant_id
    query = query.eq('merchant_id', merchantId);

    const { data, error } = await query;

    if (error) {
      console.error('[listCategories] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({ ok: true, data: data || [] });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * POST /api/merchant/categories
 * Create new category
 */
export async function createMerchantCategory(c: CategoriesContext) {
  const merchantId = c.get('merchantId') || c.get('userId');

  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'Merchant ID not found' }, 400);
  }

  try {
    const body = await c.req.json();
    
    if (!body.name?.trim()) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Category name required' }, 400);
    }

    const supabase = getSupabase(c.env);

    const categoryData = {
      merchant_id: merchantId,
      store_id: merchantId, // store_id = merchant_id
      name: body.name.trim(),
      description: body.description || null,
      parent_id: body.parent_id || null,
      image_url: body.image_url || null,
      position: body.position || 0,
      is_active: body.is_active ?? true,
    };

    const { data, error } = await supabase
      .from('product_categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      console.error('[createCategory] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({ ok: true, data }, 201);

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * PUT /api/merchant/categories/:id
 * Update category
 */
export async function updateMerchantCategory(c: CategoriesContext) {
  const merchantId = c.get('merchantId') || c.get('userId');
  const categoryId = c.req.param('id');

  if (!merchantId || !categoryId) {
    return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Merchant ID and Category ID required' }, 400);
  }

  try {
    const body = await c.req.json();
    const supabase = getSupabase(c.env);

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    const allowedFields = ['name', 'description', 'parent_id', 'image_url', 'position', 'is_active'];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from('product_categories')
      .update(updateData)
      .eq('id', categoryId)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error || !data) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Category not found' }, 404);
    }

    return c.json({ ok: true, data });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * DELETE /api/merchant/categories/:id
 * Delete category
 */
export async function deleteMerchantCategory(c: CategoriesContext) {
  const merchantId = c.get('merchantId') || c.get('userId');
  const categoryId = c.req.param('id');

  if (!merchantId || !categoryId) {
    return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Merchant ID and Category ID required' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);

    // Check if category has products
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (count && count > 0) {
      return c.json({ ok: false, error: 'HAS_PRODUCTS', message: `Cannot delete: ${count} products in this category` }, 400);
    }

    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', categoryId)
      .eq('merchant_id', merchantId);

    if (error) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({ ok: true, message: 'Category deleted' });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// PUBLIC CATEGORIES
// =====================================================

/**
 * GET /api/public/categories
 * List active categories for a store
 */
export async function listPublicCategories(c: Context<{ Bindings: Env }>) {
  try {
    const supabase = getSupabase(c.env);
    
    const storeIdParam = c.req.query('store_id');
    const merchantIdParam = c.req.query('merchant_id');
    const merchantId = merchantIdParam || storeIdParam; // support both

    let query = supabase
      .from('product_categories')
      .select('id, name, description, image_url, parent_id')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (merchantId) query = query.eq('merchant_id', merchantId);

    const { data, error } = await query;

    if (error) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({ ok: true, data: data || [] });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}


