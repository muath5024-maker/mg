/**
 * Merchant Routes Module
 * Routes for merchant dashboard and store management
 * 
 * NEW: Uses merchants table and authMiddleware
 */

import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { authMiddleware, requireMerchantAccess } from '../middleware/authMiddleware';
import { 
  getMerchantStore, 
  updateMerchantStore, 
  getMerchantSettings,
  getMerchantUsers,
  addMerchantUser,
} from '../endpoints/merchant';
import {
  getBoostPricing,
  getActiveBoosts,
  getBoostHistory,
  purchaseProductBoost,
  purchaseStoreBoost,
  cancelBoost,
} from '../endpoints/boost';
import merchantPayments from './merchant-payments';

type Variables = AuthContext & {
  validatedBody?: any;
};

const merchantRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
merchantRoutes.use('*', authMiddleware);
merchantRoutes.use('*', requireMerchantAccess());

// ========================================
// Store Management
// ========================================

// Get merchant store info
merchantRoutes.get('/store', getMerchantStore);

// Update merchant store
merchantRoutes.put('/store', updateMerchantStore);

// Get merchant settings
merchantRoutes.get('/settings', getMerchantSettings);

// ========================================
// Employees Management
// ========================================

// Get merchant employees
merchantRoutes.get('/users', getMerchantUsers);

// Add merchant employee
merchantRoutes.post('/users', addMerchantUser);

// ========================================
// Products Management (TODO: Update to use new schema)
// ========================================

// Get merchant products
merchantRoutes.get('/products', async (c) => {
  const merchantId = c.get('merchantId') || c.get('userId');
  
  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'No merchant found' }, 400);
  }

  try {
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?merchant_id=eq.${merchantId}&select=*&order=created_at.desc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: 'Failed to fetch products' }, 500);
    }

    const products = await response.json();
    return c.json({ ok: true, data: products });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
});

// Create product
merchantRoutes.post('/products', async (c) => {
  const merchantId = c.get('merchantId') || c.get('userId');
  
  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'No merchant found' }, 400);
  }

  try {
    const body = await c.req.json();
    const { name, description, price, category_id, stock, image_url } = body;

    if (!name || !price) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Name and price are required' }, 400);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          name,
          description: description || '',
          price,
          category_id: category_id || null,
          stock: stock || 0,
          image_url: image_url || null,
          status: 'active',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Create Product] Error:', errorText);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: 'Failed to create product' }, 500);
    }

    const products = await response.json() as any[];
    return c.json({ ok: true, data: products[0] }, 201);

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
});

// Update product
merchantRoutes.put('/products/:id', async (c) => {
  const merchantId = c.get('merchantId') || c.get('userId');
  const productId = c.req.param('id');
  
  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'No merchant found' }, 400);
  }

  try {
    const body = await c.req.json();

    // Verify ownership
    const checkResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${productId}&merchant_id=eq.${merchantId}&limit=1`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const products = await checkResponse.json() as any[];
    if (!products || products.length === 0) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Product not found' }, 404);
    }

    // Update product
    const updateData = { ...body, updated_at: new Date().toISOString() };
    delete updateData.id;
    delete updateData.merchant_id;

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${productId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: 'Failed to update product' }, 500);
    }

    const updated = await response.json() as any[];
    return c.json({ ok: true, data: updated[0] });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
});

// Delete product
merchantRoutes.delete('/products/:id', async (c) => {
  const merchantId = c.get('merchantId') || c.get('userId');
  const productId = c.req.param('id');
  
  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'No merchant found' }, 400);
  }

  try {
    // Verify ownership
    const checkResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${productId}&merchant_id=eq.${merchantId}&limit=1`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const products = await checkResponse.json() as any[];
    if (!products || products.length === 0) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Product not found' }, 404);
    }

    // Hard delete
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${productId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: 'Failed to delete product' }, 500);
    }

    return c.json({ ok: true, message: 'Product deleted' });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
});

// ========================================
// Orders Management
// ========================================

// Get merchant orders
merchantRoutes.get('/orders', async (c) => {
  const merchantId = c.get('merchantId') || c.get('userId');
  const status = c.req.query('status');
  
  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'No merchant found' }, 400);
  }

  try {
    let url = `${c.env.SUPABASE_URL}/rest/v1/orders?merchant_id=eq.${merchantId}&select=*,order_items(*)&order=created_at.desc`;
    
    if (status) {
      url += `&status=eq.${status}`;
    }

    const response = await fetch(url, {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!response.ok) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: 'Failed to fetch orders' }, 500);
    }

    const orders = await response.json();
    return c.json({ ok: true, data: orders });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
});

// Update order status
merchantRoutes.put('/orders/:id/status', async (c) => {
  const merchantId = c.get('merchantId') || c.get('userId');
  const orderId = c.req.param('id');
  
  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'No merchant found' }, 400);
  }

  try {
    const body = await c.req.json();
    const { status } = body;

    if (!status) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Status is required' }, 400);
    }

    // Verify ownership
    const checkResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&merchant_id=eq.${merchantId}&limit=1`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const orders = await checkResponse.json() as any[];
    if (!orders || orders.length === 0) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Order not found' }, 404);
    }

    // Update status
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
      }
    );

    if (!response.ok) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: 'Failed to update order' }, 500);
    }

    const updated = await response.json() as any[];
    return c.json({ ok: true, data: updated[0] });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
});

// ========================================
// Payment Settings
// ========================================

merchantRoutes.route('/payments', merchantPayments);

// ========================================
// Boost System (دعم الظهور)
// ========================================

// Get boost pricing info
merchantRoutes.get('/boost/pricing', getBoostPricing);

// Get active boosts
merchantRoutes.get('/boost/active', getActiveBoosts);

// Get boost history
merchantRoutes.get('/boost/history', getBoostHistory);

// Purchase product boost
merchantRoutes.post('/boost/product', purchaseProductBoost);

// Purchase store boost
merchantRoutes.post('/boost/store', purchaseStoreBoost);

// Cancel boost
merchantRoutes.post('/boost/cancel', cancelBoost);

export default merchantRoutes;
