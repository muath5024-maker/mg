/**
 * Cart Routes Module
 * Shopping cart management routes
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type Variables = SupabaseAuthContext;

const cartRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ========================================
// Cart Management
// ========================================

// Get user's cart items
cartRoutes.get('/', async (c) => {
  try {
    const userId = c.get('authUserId') as string;

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/cart_items?user_id=eq.${userId}&select=*,products(*)`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    const data = await response.json();
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ error: 'Failed to get cart', detail: error.message }, 500);
  }
});

// Add item to cart
cartRoutes.post('/', async (c) => {
  try {
    const userId = c.get('authUserId') as string;
    const body = await c.req.json();

    // Get store_id from product if not provided
    let storeId = body.merchant_id;
    if (!storeId && body.product_id) {
      const productResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${body.product_id}&select=merchant_id`,
        {
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
          },
        }
      );
      const products = await productResponse.json() as any[];
      storeId = products?.[0]?.merchant_id;

      if (!storeId) {
        return c.json({ ok: false, error: 'Product not found or has no store' }, 404);
      }
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/cart_items`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          user_id: userId as string,
          product_id: body.product_id as string,
          quantity: body.quantity || 1,
          store_id: storeId as string,
        }),
      }
    );

    const data = await response.json();
    return c.json({ ok: true, data }, response.status as any);
  } catch (error: any) {
    return c.json({ error: 'Failed to add to cart', detail: error.message }, 500);
  }
});

// Update cart item quantity
cartRoutes.put('/:id', async (c) => {
  try {
    const userId = c.get('authUserId') as string;
    const cartItemId = c.req.param('id') as string;
    const { quantity } = await c.req.json();

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/cart_items?id=eq.${cartItemId}&user_id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ quantity }),
      }
    );

    const data = await response.json();
    return c.json({ ok: true, data }, response.status as any);
  } catch (error: any) {
    return c.json({ error: 'Failed to update cart item', detail: error.message }, 500);
  }
});

// Delete cart item
cartRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.get('authUserId') as string;
    const cartItemId = c.req.param('id') as string;

    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/cart_items?id=eq.${cartItemId}&user_id=eq.${userId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    return c.json({ ok: true, message: 'Cart item deleted' });
  } catch (error: any) {
    return c.json({ error: 'Failed to delete cart item', detail: error.message }, 500);
  }
});

// Clear entire cart
cartRoutes.delete('/', async (c) => {
  try {
    const userId = c.get('authUserId') as string;

    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/cart_items?user_id=eq.${userId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    return c.json({ ok: true, message: 'Cart cleared' });
  } catch (error: any) {
    return c.json({ error: 'Failed to clear cart', detail: error.message }, 500);
  }
});

export default cartRoutes;
