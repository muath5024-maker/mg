/**
 * Cart Endpoints - إدارة سلة التسوق للعميل
 * 
 * UPDATED: Uses new schema tables:
 * - shopping_carts (customer_id, status, ...)
 * - cart_items (cart_id, product_id, variant_id, quantity, unit_price)
 * - products + product_pricing + product_media
 * - merchants (not stores)
 * 
 * @module endpoints/cart
 */

import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env, AuthContext } from '../types';

type CartContext = Context<{ Bindings: Env; Variables: AuthContext }>;

/**
 * Helper: Get Supabase client with service_role
 */
function getSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// =====================================================
// HELPER: Get or create active cart
// =====================================================
async function getOrCreateCart(supabase: any, customerId: string) {
  // Try to get existing active cart
  let { data: cart, error } = await supabase
    .from('shopping_carts')
    .select('id')
    .eq('customer_id', customerId)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  // Create if doesn't exist
  if (!cart) {
    const { data: newCart, error: createError } = await supabase
      .from('shopping_carts')
      .insert({ customer_id: customerId, status: 'active' })
      .select('id')
      .single();

    if (createError) throw new Error(createError.message);
    cart = newCart;
  }

  return cart;
}

// =====================================================
// GET CART
// =====================================================

/**
 * GET /api/customer/cart
 * Get customer's cart with all items and product details
 */
export async function getCart(c: CartContext) {
  const customerId = c.get('userId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  try {
    const supabase = getSupabase(c.env);
    
    const cart = await getOrCreateCart(supabase, customerId);

    // Get cart items with product details (NEW SCHEMA)
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        unit_price,
        variant_id,
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
      `)
      .eq('cart_id', cart.id)
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('[getCart] Error:', itemsError);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: itemsError.message }, 500);
    }

    // Transform to flat structure
    const cartItems = (items || []).map((item: any) => {
      const product = item.products;
      if (!product) return null;

      const pricing = product.product_pricing?.[0] || {};
      const media = product.product_media || [];
      const inventory = product.inventory_items?.[0] || {};
      const mainImage = media.find((m: any) => m.position === 0) || media[0];

      return {
        id: item.id,
        quantity: item.quantity,
        variant_id: item.variant_id,
        added_at: item.created_at,
        // Use stored price if available, otherwise current price
        unit_price: item.unit_price || pricing.base_price || 0,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.short_description || product.description,
          price: pricing.base_price || 0,
          compare_at_price: pricing.compare_at_price,
          currency: pricing.currency || 'SAR',
          stock: inventory.available || 0,
          image_url: mainImage?.url,
          images: media.map((m: any) => m.url).filter(Boolean),
          status: product.status,
          merchant_id: product.merchant_id,
        }
      };
    }).filter(Boolean);

    // Calculate totals
    const subtotal = cartItems.reduce((sum: number, item: any) => 
      sum + (item.unit_price * item.quantity), 0);
    
    const itemsCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

    return c.json({
      ok: true,
      data: {
        cart_id: cart.id,
        items: cartItems,
        items_count: itemsCount,
        subtotal: Math.round(subtotal * 100) / 100,
        currency: 'SAR'
      }
    });

  } catch (error: any) {
    console.error('[getCart] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// ADD TO CART
// =====================================================

/**
 * POST /api/customer/cart
 * Add item to cart
 * Body: { product_id, quantity?, variant_id? }
 */
export async function addToCart(c: CartContext) {
  const customerId = c.get('userId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  try {
    const body = await c.req.json();
    const { product_id, quantity = 1, variant_id = null } = body;

    if (!product_id) {
      return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Product ID is required' }, 400);
    }

    if (quantity < 1) {
      return c.json({ ok: false, error: 'INVALID_QUANTITY', message: 'Quantity must be at least 1' }, 400);
    }

    const supabase = getSupabase(c.env);

    // Verify product exists and get pricing
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        id, name, status,
        product_pricing (base_price),
        inventory_items (available)
      `)
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return c.json({ ok: false, error: 'PRODUCT_NOT_FOUND', message: 'Product not found' }, 404);
    }

    if (product.status !== 'active') {
      return c.json({ ok: false, error: 'PRODUCT_UNAVAILABLE', message: 'Product is not available' }, 400);
    }

    const stock = product.inventory_items?.[0]?.available || 0;
    const price = product.product_pricing?.[0]?.base_price || 0;

    if (stock < quantity) {
      return c.json({ 
        ok: false, 
        error: 'INSUFFICIENT_STOCK', 
        message: stock === 0 ? 'Product is out of stock' : `Only ${stock} items available` 
      }, 400);
    }

    const cart = await getOrCreateCart(supabase, customerId);

    // Check if product already in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart.id)
      .eq('product_id', product_id)
      .is('variant_id', variant_id)
      .single();

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > stock) {
        return c.json({ 
          ok: false, 
          error: 'INSUFFICIENT_STOCK', 
          message: `Cannot add more. Only ${stock} items available, you have ${existingItem.quantity} in cart` 
        }, 400);
      }

      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', existingItem.id);

      if (updateError) {
        return c.json({ ok: false, error: 'DATABASE_ERROR', message: updateError.message }, 500);
      }

      return c.json({ 
        ok: true, 
        message: 'تم تحديث السلة',
        data: { item_id: existingItem.id, quantity: newQuantity } 
      });
    } else {
      // Add new item with current price
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: product_id,
          variant_id: variant_id,
          quantity: quantity,
          unit_price: price
        })
        .select('id')
        .single();

      if (insertError) {
        return c.json({ ok: false, error: 'DATABASE_ERROR', message: insertError.message }, 500);
      }

      return c.json({ 
        ok: true, 
        message: 'تمت الإضافة إلى السلة',
        data: { item_id: newItem.id, quantity: quantity } 
      }, 201);
    }

  } catch (error: any) {
    console.error('[addToCart] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// UPDATE CART ITEM
// =====================================================

/**
 * PUT /api/customer/cart/:itemId
 * Update cart item quantity
 * Body: { quantity }
 */
export async function updateCartItem(c: CartContext) {
  const customerId = c.get('userId');
  const itemId = c.req.param('itemId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  if (!itemId) {
    return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Item ID is required' }, 400);
  }

  try {
    const body = await c.req.json();
    const { quantity } = body;

    if (typeof quantity !== 'number' || quantity < 0) {
      return c.json({ ok: false, error: 'INVALID_QUANTITY', message: 'Valid quantity is required' }, 400);
    }

    const supabase = getSupabase(c.env);

    // Verify item belongs to customer's cart
    const { data: item, error: itemError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        shopping_carts!inner (customer_id),
        products (
          inventory_items (available)
        )
      `)
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return c.json({ ok: false, error: 'ITEM_NOT_FOUND', message: 'Cart item not found' }, 404);
    }

    if ((item.shopping_carts as any).customer_id !== customerId) {
      return c.json({ ok: false, error: 'FORBIDDEN', message: 'Access denied' }, 403);
    }

    if (quantity === 0) {
      // Remove item
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (deleteError) {
        return c.json({ ok: false, error: 'DATABASE_ERROR', message: deleteError.message }, 500);
      }

      return c.json({ ok: true, message: 'تم حذف المنتج من السلة' });
    }

    // Check stock
    const stock = (item.products as any)?.inventory_items?.[0]?.available || 0;
    if (stock < quantity) {
      return c.json({ 
        ok: false, 
        error: 'INSUFFICIENT_STOCK', 
        message: `Only ${stock} items available` 
      }, 400);
    }

    // Update quantity
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', itemId);

    if (updateError) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: updateError.message }, 500);
    }

    return c.json({ ok: true, message: 'تم تحديث الكمية', data: { quantity } });

  } catch (error: any) {
    console.error('[updateCartItem] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// REMOVE FROM CART
// =====================================================

/**
 * DELETE /api/customer/cart/:itemId
 * Remove item from cart
 */
export async function removeFromCart(c: CartContext) {
  const customerId = c.get('userId');
  const itemId = c.req.param('itemId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  if (!itemId) {
    return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Item ID is required' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);

    // Verify item belongs to customer's cart
    const { data: item, error: itemError } = await supabase
      .from('cart_items')
      .select(`id, shopping_carts!inner (customer_id)`)
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return c.json({ ok: false, error: 'ITEM_NOT_FOUND', message: 'Cart item not found' }, 404);
    }

    if ((item.shopping_carts as any).customer_id !== customerId) {
      return c.json({ ok: false, error: 'FORBIDDEN', message: 'Access denied' }, 403);
    }

    // Delete item
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: deleteError.message }, 500);
    }

    return c.json({ ok: true, message: 'تم حذف المنتج من السلة' });

  } catch (error: any) {
    console.error('[removeFromCart] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// CLEAR CART
// =====================================================

/**
 * DELETE /api/customer/cart
 * Clear entire cart
 */
export async function clearCart(c: CartContext) {
  const customerId = c.get('userId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  try {
    const supabase = getSupabase(c.env);

    // Get customer's active cart
    const { data: cart } = await supabase
      .from('shopping_carts')
      .select('id')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .single();

    if (!cart) {
      return c.json({ ok: true, message: 'السلة فارغة بالفعل' });
    }

    // Delete all cart items
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (deleteError) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: deleteError.message }, 500);
    }

    return c.json({ ok: true, message: 'تم إفراغ السلة بنجاح' });

  } catch (error: any) {
    console.error('[clearCart] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// GET CART COUNT
// =====================================================

/**
 * GET /api/customer/cart/count
 * Get cart items count (for badge)
 */
export async function getCartCount(c: CartContext) {
  const customerId = c.get('userId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  try {
    const supabase = getSupabase(c.env);

    const { data: cart } = await supabase
      .from('shopping_carts')
      .select('id')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .single();

    if (!cart) {
      return c.json({ ok: true, data: { count: 0, unique_items: 0 } });
    }

    const { data: items, error } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('cart_id', cart.id);

    if (error) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    const totalCount = (items || []).reduce((sum, item) => sum + item.quantity, 0);
    const uniqueItems = items?.length || 0;

    return c.json({ 
      ok: true, 
      data: { 
        count: totalCount,
        unique_items: uniqueItems
      } 
    });

  } catch (error: any) {
    console.error('[getCartCount] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}
