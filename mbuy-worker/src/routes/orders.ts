/**
 * Orders Routes Module
 * Order management routes for customers
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type Variables = SupabaseAuthContext;

// Helper function to safely get UUID param
function getUuidParam(c: any, paramName: string = 'id'): string {
  return c.req.param(paramName) as string;
}

const ordersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ========================================
// Customer Orders
// ========================================

// Get user's orders
ordersRoutes.get('/', async (c) => {
  try {
    const userId = c.get('authUserId') as string;
    const status = c.req.query('status');

    let url = `${c.env.SUPABASE_URL}/rest/v1/orders?customer_id=eq.${userId}&select=*,order_items(*)`;
    if (status) {
      url += `&status=eq.${status}`;
    }
    url += '&order=created_at.desc';

    const response = await fetch(url, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
      },
    });

    const data = await response.json();
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ error: 'Failed to get orders', detail: error.message }, 500);
  }
});

// Get single order details
ordersRoutes.get('/:id', async (c) => {
  try {
    const userId = c.get('authUserId') as string;
    const orderId = getUuidParam(c, 'id');

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&customer_id=eq.${userId}&select=*,order_items(*)`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    const data = await response.json() as any[];
    return c.json({ ok: true, data: data[0] || null });
  } catch (error: any) {
    return c.json({ error: 'Failed to get order', detail: error.message }, 500);
  }
});

// Update order status (merchant only)
ordersRoutes.put('/:id', async (c) => {
  try {
    const orderId = getUuidParam(c, 'id');
    const { status } = await c.req.json();

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          status,
          updated_at: new Date().toISOString()
        }),
      }
    );

    const data = await response.json() as any[];
    return c.json({ ok: true, data: data[0] || null });
  } catch (error: any) {
    return c.json({ error: 'Failed to update order', detail: error.message }, 500);
  }
});

// Create order from cart
ordersRoutes.post('/from-cart', async (c) => {
  try {
    const userId = c.get('authUserId') as string;
    const body = await c.req.json();

    // Get cart items
    const cartResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/cart_items?user_id=eq.${userId}&select=*,products(*)`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
        },
      }
    );
    const cartItems = await cartResponse.json() as any[];

    if (!cartItems || cartItems.length === 0) {
      return c.json({ ok: false, error: 'Cart is empty' }, 400);
    }

    // Group items by store
    const storeGroups = cartItems.reduce((groups: any, item: any) => {
      const storeId = item.store_id;
      if (!groups[storeId]) {
        groups[storeId] = [];
      }
      groups[storeId].push(item);
      return groups;
    }, {});

    // Create order for each store
    const orders = [];
    for (const [storeId, items] of Object.entries(storeGroups)) {
      const storeItems = items as any[];
      const total = storeItems.reduce((sum: number, item: any) => {
        return sum + (item.products?.price || 0) * item.quantity;
      }, 0);

      // Create order
      const orderResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/orders`,
        {
          method: 'POST',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            customer_id: userId,
            store_id: storeId,
            status: 'pending',
            total_amount: total,
            shipping_address: body.shipping_address,
            payment_method: body.payment_method || 'cod',
          }),
        }
      );

      const orderData = await orderResponse.json() as any[];
      const order = orderData[0];

      if (order) {
        // Create order items
        for (const item of storeItems) {
          await fetch(
            `${c.env.SUPABASE_URL}/rest/v1/order_items`,
            {
              method: 'POST',
              headers: {
                'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.products?.price || 0,
              }),
            }
          );
        }
        orders.push(order);
      }
    }

    // Clear cart after successful order creation
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

    return c.json({ ok: true, data: orders });
  } catch (error: any) {
    return c.json({ error: 'Failed to create order', detail: error.message }, 500);
  }
});

// Cancel order
ordersRoutes.post('/:id/cancel', async (c) => {
  try {
    const userId = c.get('authUserId') as string;
    const orderId = getUuidParam(c, 'id');

    // Verify order belongs to user and is cancellable
    const checkResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&customer_id=eq.${userId}&select=status`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
        },
      }
    );
    const orders = await checkResponse.json() as any[];
    const order = orders[0];

    if (!order) {
      return c.json({ ok: false, error: 'Order not found' }, 404);
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return c.json({ ok: false, error: 'Order cannot be cancelled at this stage' }, 400);
    }

    // Cancel order
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        }),
      }
    );

    const data = await response.json() as any[];
    return c.json({ ok: true, data: data[0] || null });
  } catch (error: any) {
    return c.json({ error: 'Failed to cancel order', detail: error.message }, 500);
  }
});

export default ordersRoutes;
