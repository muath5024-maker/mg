/**
 * Platform Categories Endpoints
 * 
 * فئات المنصة الرئيسية (تديرها الإدارة)
 * مختلفة عن product_categories (فئات المتجر الخاصة بكل تاجر)
 * 
 * platform_categories columns: 
 * id, name, name_en, slug, icon, image_url, parent_id, 
 * order, is_active, is_featured, metadata, created_at, updated_at
 * 
 * @module endpoints/platform-categories
 */

import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env, AuthContext } from '../types';

type PlatformCategoriesContext = Context<{ Bindings: Env; Variables: AuthContext }>;

function getSupabase(env: Env, useServiceRole: boolean = false) {
  return createClient(
    env.SUPABASE_URL, 
    useServiceRole ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// =====================================================
// PUBLIC ENDPOINTS
// =====================================================

/**
 * GET /public/platform-categories
 * List all active platform categories (hierarchical)
 * Public - No auth required
 */
export async function listPlatformCategories(c: Context<{ Bindings: Env }>) {
  try {
    const url = new URL(c.req.url);
    const parentId = url.searchParams.get('parent_id');
    const featured = url.searchParams.get('featured');
    const flat = url.searchParams.get('flat') === 'true';

    const supabase = getSupabase(c.env);

    let query = supabase
      .from('platform_categories')
      .select('id, name, name_en, slug, icon, image_url, parent_id, "order", is_featured, metadata')
      .eq('is_active', true)
      .order('"order"', { ascending: true });

    // Filter by parent_id
    if (parentId === 'null' || parentId === '') {
      query = query.is('parent_id', null);
    } else if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    // Filter featured only
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[listPlatformCategories] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    // If flat=true, return flat list
    if (flat) {
      return c.json({ ok: true, data: data || [] });
    }

    // Build hierarchical structure
    const categories = data || [];
    const rootCategories = categories.filter(cat => !cat.parent_id);
    const childMap = new Map<string, any[]>();

    // Group children by parent_id
    categories.forEach(cat => {
      if (cat.parent_id) {
        if (!childMap.has(cat.parent_id)) {
          childMap.set(cat.parent_id, []);
        }
        childMap.get(cat.parent_id)!.push(cat);
      }
    });

    // Attach children to parents
    const hierarchical = rootCategories.map(parent => ({
      ...parent,
      children: childMap.get(parent.id) || []
    }));

    return c.json({ ok: true, data: hierarchical });

  } catch (error: any) {
    console.error('[listPlatformCategories] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * GET /public/platform-categories/:slug
 * Get single category by slug with its products
 */
export async function getPlatformCategoryBySlug(c: Context<{ Bindings: Env }>) {
  try {
    const slug = c.req.param('slug');
    
    if (!slug) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Category slug required' }, 400);
    }

    const supabase = getSupabase(c.env);

    // Get category
    const { data: category, error: catError } = await supabase
      .from('platform_categories')
      .select('id, name, name_en, slug, icon, image_url, parent_id, "order", is_featured, metadata')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (catError || !category) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Category not found' }, 404);
    }

    // Get subcategories
    const { data: subcategories } = await supabase
      .from('platform_categories')
      .select('id, name, name_en, slug, icon, image_url, "order"')
      .eq('parent_id', category.id)
      .eq('is_active', true)
      .order('"order"', { ascending: true });

    return c.json({ 
      ok: true, 
      data: {
        ...category,
        subcategories: subcategories || []
      }
    });

  } catch (error: any) {
    console.error('[getPlatformCategoryBySlug] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * GET /public/platform-categories/:slug/products
 * Get products in a platform category
 */
export async function getCategoryProducts(c: Context<{ Bindings: Env }>) {
  try {
    const slug = c.req.param('slug');
    const url = new URL(c.req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const sortDesc = url.searchParams.get('desc') !== 'false';
    const includeSubcategories = url.searchParams.get('include_sub') !== 'false';

    if (!slug) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Category slug required' }, 400);
    }

    const supabase = getSupabase(c.env);

    // Get category ID
    const { data: category, error: catError } = await supabase
      .from('platform_categories')
      .select('id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (catError || !category) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Category not found' }, 404);
    }

    // Get category IDs (including subcategories if requested)
    let categoryIds = [category.id];
    
    if (includeSubcategories) {
      const { data: subcats } = await supabase
        .from('platform_categories')
        .select('id')
        .eq('parent_id', category.id)
        .eq('is_active', true);
      
      if (subcats) {
        categoryIds = [...categoryIds, ...subcats.map(s => s.id)];
      }
    }

    // Get products
    let query = supabase
      .from('products')
      .select(`
        id, name, slug, price, compare_at_price, 
        images, stock, is_active, is_featured,
        boost_points, boost_type, boost_expires_at,
        merchants!products_merchant_id_fkey(id, name, logo_url),
        platform_categories!products_platform_category_id_fkey(id, name, slug)
      `, { count: 'exact' })
      .in('platform_category_id', categoryIds)
      .eq('is_active', true)
      .gt('stock', 0)
      .range(offset, offset + limit - 1);

    // Handle special sort cases
    if (sortBy === 'boost') {
      // Boosted products first
      query = query.order('boost_points', { ascending: false, nullsFirst: false });
    } else if (sortBy === 'price') {
      query = query.order('price', { ascending: !sortDesc });
    } else if (sortBy === 'name') {
      query = query.order('name', { ascending: !sortDesc });
    } else {
      query = query.order('created_at', { ascending: !sortDesc });
    }

    const { data: products, error: prodError, count } = await query;

    if (prodError) {
      console.error('[getCategoryProducts] Error:', prodError);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: prodError.message }, 500);
    }

    return c.json({ 
      ok: true, 
      data: products || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error: any) {
    console.error('[getCategoryProducts] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// ADMIN ENDPOINTS (requires admin auth)
// =====================================================

/**
 * GET /admin/api/platform-categories
 * List all categories (including inactive)
 */
export async function adminListCategories(c: PlatformCategoriesContext) {
  try {
    const supabase = getSupabase(c.env, true);

    const { data, error } = await supabase
      .from('platform_categories')
      .select('*')
      .order('"order"', { ascending: true });

    if (error) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({ ok: true, data: data || [] });
  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * POST /admin/api/platform-categories
 * Create new platform category
 */
export async function adminCreateCategory(c: PlatformCategoriesContext) {
  try {
    const body = await c.req.json();

    if (!body.name?.trim()) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Category name required' }, 400);
    }

    const supabase = getSupabase(c.env, true);

    // Generate slug if not provided
    const slug = body.slug || body.name.trim()
      .toLowerCase()
      .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const categoryData = {
      name: body.name.trim(),
      name_en: body.name_en?.trim() || null,
      slug: slug || `category-${Date.now()}`,
      icon: body.icon || null,
      image_url: body.image_url || null,
      parent_id: body.parent_id || null,
      order: body.order || 0,
      is_active: body.is_active !== false,
      is_featured: body.is_featured || false,
      metadata: body.metadata || {},
    };

    const { data, error } = await supabase
      .from('platform_categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      console.error('[adminCreateCategory] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({ ok: true, data }, 201);
  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * PUT /admin/api/platform-categories/:id
 * Update platform category
 */
export async function adminUpdateCategory(c: PlatformCategoriesContext) {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    if (!id) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Category ID required' }, 400);
    }

    const supabase = getSupabase(c.env, true);

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.name_en !== undefined) updateData.name_en = body.name_en?.trim() || null;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.parent_id !== undefined) updateData.parent_id = body.parent_id || null;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    const { data, error } = await supabase
      .from('platform_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[adminUpdateCategory] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    if (!data) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Category not found' }, 404);
    }

    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * DELETE /admin/api/platform-categories/:id
 * Delete platform category
 */
export async function adminDeleteCategory(c: PlatformCategoriesContext) {
  try {
    const id = c.req.param('id');

    if (!id) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Category ID required' }, 400);
    }

    const supabase = getSupabase(c.env, true);

    // Check if has children
    const { count } = await supabase
      .from('platform_categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', id);

    if (count && count > 0) {
      return c.json({ 
        ok: false, 
        error: 'HAS_CHILDREN', 
        message: 'Cannot delete category with subcategories. Delete subcategories first.' 
      }, 400);
    }

    // Check if has products
    const { count: productCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('platform_category_id', id);

    if (productCount && productCount > 0) {
      return c.json({ 
        ok: false, 
        error: 'HAS_PRODUCTS', 
        message: `Cannot delete category with ${productCount} products. Reassign products first.` 
      }, 400);
    }

    const { error } = await supabase
      .from('platform_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[adminDeleteCategory] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({ ok: true, message: 'Category deleted' });
  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * PUT /admin/api/platform-categories/reorder
 * Reorder categories
 */
export async function adminReorderCategories(c: PlatformCategoriesContext) {
  try {
    const body = await c.req.json();
    
    if (!Array.isArray(body.categories)) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'categories array required' }, 400);
    }

    const supabase = getSupabase(c.env, true);

    // Update each category's order
    const updates = body.categories.map((item: { id: string; order: number }, index: number) => 
      supabase
        .from('platform_categories')
        .update({ order: item.order ?? index })
        .eq('id', item.id)
    );

    await Promise.all(updates);

    return c.json({ ok: true, message: 'Categories reordered' });
  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}
