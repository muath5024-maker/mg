/**
 * Favorites/Wishlist Endpoints - إدارة المفضلة للعميل
 * 
 * UPDATED: Uses new schema tables:
 * - wishlists (customer_id, name, is_default, is_public)
 * - wishlist_items (wishlist_id, product_id, variant_id)
 * - products + product_pricing + product_media
 * 
 * @module endpoints/favorites
 */

import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env, AuthContext } from '../types';

type FavoritesContext = Context<{ Bindings: Env; Variables: AuthContext }>;

/**
 * Helper: Get Supabase client with service_role
 */
function getSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// =====================================================
// HELPER: Get or create default wishlist
// =====================================================
async function getOrCreateDefaultWishlist(supabase: any, customerId: string) {
  // Try to get existing default wishlist
  let { data: wishlist, error } = await supabase
    .from('wishlists')
    .select('id')
    .eq('customer_id', customerId)
    .eq('is_default', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  // Create if doesn't exist
  if (!wishlist) {
    const { data: newWishlist, error: createError } = await supabase
      .from('wishlists')
      .insert({ 
        customer_id: customerId, 
        name: 'المفضلة',
        is_default: true,
        is_public: false
      })
      .select('id')
      .single();

    if (createError) throw new Error(createError.message);
    wishlist = newWishlist;
  }

  return wishlist;
}

// =====================================================
// GET FAVORITES
// =====================================================

/**
 * GET /api/customer/favorites
 * Get customer's favorites list with product details
 */
export async function getFavorites(c: FavoritesContext) {
  const customerId = c.get('userId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  try {
    const supabase = getSupabase(c.env);
    
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    const wishlist = await getOrCreateDefaultWishlist(supabase, customerId);

    // Get wishlist items with product details (NEW SCHEMA)
    const { data, error, count } = await supabase
      .from('wishlist_items')
      .select(`
        id,
        notes,
        priority,
        created_at,
        products (
          id,
          name,
          slug,
          description,
          short_description,
          status,
          merchant_id,
          product_pricing (base_price, compare_at_price, currency),
          product_media (url, alt, type, position),
          inventory_items (quantity, available)
        )
      `, { count: 'exact' })
      .eq('wishlist_id', wishlist.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[getFavorites] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    // Transform to flat structure
    const favorites = (data || []).map((item: any) => {
      const product = item.products;
      if (!product) return null;

      const pricing = product.product_pricing?.[0] || {};
      const media = product.product_media || [];
      const inventory = product.inventory_items?.[0] || {};
      const mainImage = media.find((m: any) => m.position === 0) || media[0];

      // Calculate discount
      const price = pricing.base_price || 0;
      const comparePrice = pricing.compare_at_price;
      const hasDiscount = comparePrice && comparePrice > price;
      const discountPercent = hasDiscount 
        ? Math.round((1 - price / comparePrice) * 100) 
        : 0;

      return {
        id: item.id,
        added_at: item.created_at,
        notes: item.notes,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.short_description || product.description,
          price: price,
          compare_at_price: comparePrice,
          discount_percent: discountPercent,
          currency: pricing.currency || 'SAR',
          stock: inventory.available || 0,
          is_in_stock: (inventory.available || 0) > 0,
          image_url: mainImage?.url,
          images: media.map((m: any) => m.url).filter(Boolean),
          status: product.status,
          merchant_id: product.merchant_id,
        }
      };
    }).filter(Boolean);

    return c.json({
      ok: true,
      data: favorites,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('[getFavorites] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// ADD TO FAVORITES
// =====================================================

/**
 * POST /api/customer/favorites
 * Add product to favorites
 * Body: { product_id, notes? }
 */
export async function addToFavorites(c: FavoritesContext) {
  const customerId = c.get('userId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  try {
    const body = await c.req.json();
    const { product_id, notes = null } = body;

    if (!product_id) {
      return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Product ID is required' }, 400);
    }

    const supabase = getSupabase(c.env);

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return c.json({ ok: false, error: 'PRODUCT_NOT_FOUND', message: 'Product not found' }, 404);
    }

    const wishlist = await getOrCreateDefaultWishlist(supabase, customerId);

    // Check if already in favorites
    const { data: existing } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('wishlist_id', wishlist.id)
      .eq('product_id', product_id)
      .single();

    if (existing) {
      return c.json({ 
        ok: true, 
        message: 'المنتج موجود بالفعل في المفضلة',
        data: { item_id: existing.id, already_exists: true }
      });
    }

    // Add to wishlist
    const { data: newItem, error: insertError } = await supabase
      .from('wishlist_items')
      .insert({
        wishlist_id: wishlist.id,
        product_id: product_id,
        notes: notes
      })
      .select('id')
      .single();

    if (insertError) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: insertError.message }, 500);
    }

    return c.json({ 
      ok: true, 
      message: 'تمت الإضافة إلى المفضلة',
      data: { item_id: newItem.id, already_exists: false }
    }, 201);

  } catch (error: any) {
    console.error('[addToFavorites] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// REMOVE FROM FAVORITES
// =====================================================

/**
 * DELETE /api/customer/favorites/:productId
 * Remove product from favorites by product ID
 */
export async function removeFromFavorites(c: FavoritesContext) {
  const customerId = c.get('userId');
  const productId = c.req.param('productId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  if (!productId) {
    return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Product ID is required' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);

    const wishlist = await getOrCreateDefaultWishlist(supabase, customerId);

    // Delete item
    const { error: deleteError } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('wishlist_id', wishlist.id)
      .eq('product_id', productId);

    if (deleteError) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: deleteError.message }, 500);
    }

    return c.json({ ok: true, message: 'تمت الإزالة من المفضلة' });

  } catch (error: any) {
    console.error('[removeFromFavorites] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// CHECK IF FAVORITED
// =====================================================

/**
 * GET /api/customer/favorites/check/:productId
 * Check if product is in favorites
 */
export async function checkFavorite(c: FavoritesContext) {
  const customerId = c.get('userId');
  const productId = c.req.param('productId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  if (!productId) {
    return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Product ID is required' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);

    // Get default wishlist
    const { data: wishlist } = await supabase
      .from('wishlists')
      .select('id')
      .eq('customer_id', customerId)
      .eq('is_default', true)
      .single();

    if (!wishlist) {
      return c.json({ ok: true, data: { is_favorited: false } });
    }

    // Check if exists
    const { data: item } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('wishlist_id', wishlist.id)
      .eq('product_id', productId)
      .single();

    return c.json({ 
      ok: true, 
      data: { 
        is_favorited: !!item,
        item_id: item?.id || null
      } 
    });

  } catch (error: any) {
    console.error('[checkFavorite] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// TOGGLE FAVORITE
// =====================================================

/**
 * POST /api/customer/favorites/toggle
 * Toggle product favorite status
 * Body: { product_id }
 */
export async function toggleFavorite(c: FavoritesContext) {
  const customerId = c.get('userId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  try {
    const body = await c.req.json();
    const { product_id } = body;

    if (!product_id) {
      return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Product ID is required' }, 400);
    }

    const supabase = getSupabase(c.env);

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return c.json({ ok: false, error: 'PRODUCT_NOT_FOUND', message: 'Product not found' }, 404);
    }

    const wishlist = await getOrCreateDefaultWishlist(supabase, customerId);

    // Check current state
    const { data: existing } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('wishlist_id', wishlist.id)
      .eq('product_id', product_id)
      .single();

    if (existing) {
      // Remove
      await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', existing.id);

      return c.json({ 
        ok: true, 
        message: 'تمت الإزالة من المفضلة',
        data: { is_favorited: false }
      });
    } else {
      // Add
      const { data: newItem } = await supabase
        .from('wishlist_items')
        .insert({ wishlist_id: wishlist.id, product_id: product_id })
        .select('id')
        .single();

      return c.json({ 
        ok: true, 
        message: 'تمت الإضافة إلى المفضلة',
        data: { is_favorited: true, item_id: newItem?.id }
      });
    }

  } catch (error: any) {
    console.error('[toggleFavorite] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// GET FAVORITES COUNT
// =====================================================

/**
 * GET /api/customer/favorites/count
 * Get favorites count (for badge)
 */
export async function getFavoritesCount(c: FavoritesContext) {
  const customerId = c.get('userId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  try {
    const supabase = getSupabase(c.env);

    // Get default wishlist
    const { data: wishlist } = await supabase
      .from('wishlists')
      .select('id')
      .eq('customer_id', customerId)
      .eq('is_default', true)
      .single();

    if (!wishlist) {
      return c.json({ ok: true, data: { count: 0 } });
    }

    const { count, error } = await supabase
      .from('wishlist_items')
      .select('id', { count: 'exact', head: true })
      .eq('wishlist_id', wishlist.id);

    if (error) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({ ok: true, data: { count: count || 0 } });

  } catch (error: any) {
    console.error('[getFavoritesCount] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// CLEAR FAVORITES
// =====================================================

/**
 * DELETE /api/customer/favorites
 * Clear all favorites
 */
export async function clearFavorites(c: FavoritesContext) {
  const customerId = c.get('userId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  try {
    const supabase = getSupabase(c.env);

    // Get default wishlist
    const { data: wishlist } = await supabase
      .from('wishlists')
      .select('id')
      .eq('customer_id', customerId)
      .eq('is_default', true)
      .single();

    if (!wishlist) {
      return c.json({ ok: true, message: 'المفضلة فارغة بالفعل' });
    }

    // Delete all items
    const { error: deleteError } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('wishlist_id', wishlist.id);

    if (deleteError) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: deleteError.message }, 500);
    }

    return c.json({ ok: true, message: 'تم مسح المفضلة بنجاح' });

  } catch (error: any) {
    console.error('[clearFavorites] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}
