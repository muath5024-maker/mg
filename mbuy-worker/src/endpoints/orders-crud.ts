/**
 * Orders CRUD Endpoints
 * 
 * Compatible with DATABASE_SCHEMA.md
 * 
 * orders columns: id, store_id, customer_id, merchant_id, status, source,
 * subtotal, shipping_total, tax_total, discount_total, grand_total,
 * currency, notes, metadata, created_at, updated_at
 * 
 * NOTE: No payment_method column in orders table!
 * 
 * @module endpoints/orders-crud
 */

import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env, AuthContext } from '../types';

type OrdersContext = Context<{ Bindings: Env; Variables: AuthContext }>;

/**
 * Helper: Get Supabase client with service_role
 */
function getSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// =====================================================
// MERCHANT ORDERS
// =====================================================

/**
 * GET /api/merchant/orders
 * List orders for merchant's store
 */
export async function listMerchantOrders(c: OrdersContext) {
  const merchantId = c.get('merchantId') || c.get('userId');
  
  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'Merchant ID not found' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);
    
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status');
    const customerId = c.req.query('customer_id');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select(`
        id, store_id, customer_id, merchant_id, status, source,
        subtotal, shipping_total, tax_total, discount_total, grand_total,
        currency, notes, metadata, created_at, updated_at,
        customers(id, name, email, phone),
        order_items(*)
      `, { count: 'exact' })
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (customerId) query = query.eq('customer_id', customerId);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error, count } = await query;

    if (error) {
      console.error('[listMerchantOrders] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({
      ok: true,
      data: data || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) }
    });

  } catch (error: any) {
    console.error('[listMerchantOrders] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * GET /api/merchant/orders/:id
 * Get single order details (merchant view)
 */
export async function getMerchantOrder(c: OrdersContext) {
  const merchantId = c.get('merchantId') || c.get('userId');
  const orderId = c.req.param('id');

  if (!merchantId || !orderId) {
    return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Merchant ID and Order ID required' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, store_id, customer_id, merchant_id, status, source,
        subtotal, shipping_total, tax_total, discount_total, grand_total,
        currency, notes, metadata, created_at, updated_at,
        customers(id, name, email, phone),
        order_items(*),
        order_addresses(*),
        order_payments(*),
        order_shipments(*),
        order_status_history(*)
      `)
      .eq('id', orderId)
      .eq('merchant_id', merchantId)
      .single();

    if (error || !data) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Order not found' }, 404);
    }

    return c.json({ ok: true, data });

  } catch (error: any) {
    console.error('[getMerchantOrder] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * PUT /api/merchant/orders/:id/status
 * Update order status (merchant only)
 */
export async function updateOrderStatus(c: OrdersContext) {
  const merchantId = c.get('merchantId') || c.get('userId');
  const orderId = c.req.param('id');

  if (!merchantId || !orderId) {
    return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Merchant ID and Order ID required' }, 400);
  }

  try {
    const body = await c.req.json();
    const { status, notes } = body;

    if (!status) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Status is required' }, 400);
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, 400);
    }

    const supabase = getSupabase(c.env);

    // Verify ownership
    const { data: existing } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('merchant_id', merchantId)
      .single();

    if (!existing) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Order not found' }, 404);
    }

    const previousStatus = existing.status;

    // Update order status
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('[updateOrderStatus] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    // Add to status history
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      previous_status: previousStatus,
      new_status: status,
      notes: notes || null,
      changed_by: merchantId,
    });

    return c.json({ ok: true, data: order });

  } catch (error: any) {
    console.error('[updateOrderStatus] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// CUSTOMER ORDERS
// =====================================================

/**
 * GET /api/customer/orders
 * List orders for current customer
 */
export async function listCustomerOrders(c: OrdersContext) {
  const customerId = c.get('userId');
  const userType = c.get('userType');
  
  if (!customerId || userType !== 'customer') {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer access required' }, 403);
  }

  try {
    const supabase = getSupabase(c.env);
    
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select(`
        id, store_id, customer_id, merchant_id, status, source,
        subtotal, shipping_total, tax_total, discount_total, grand_total,
        currency, notes, created_at, updated_at,
        order_items(*, products(id, name))
      `, { count: 'exact' })
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;

    if (error) {
      console.error('[listCustomerOrders] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({
      ok: true,
      data: data || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) }
    });

  } catch (error: any) {
    console.error('[listCustomerOrders] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * GET /api/customer/orders/:id
 * Get single order details (customer view)
 */
export async function getCustomerOrder(c: OrdersContext) {
  const customerId = c.get('userId');
  const userType = c.get('userType');
  const orderId = c.req.param('id');

  if (!customerId || userType !== 'customer') {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer access required' }, 403);
  }

  if (!orderId) {
    return c.json({ ok: false, error: 'MISSING_ID', message: 'Order ID required' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, store_id, customer_id, merchant_id, status, source,
        subtotal, shipping_total, tax_total, discount_total, grand_total,
        currency, notes, created_at, updated_at,
        order_items(*, products(id, name)),
        order_addresses(*),
        order_shipments(*)
      `)
      .eq('id', orderId)
      .eq('customer_id', customerId)
      .single();

    if (error || !data) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Order not found' }, 404);
    }

    return c.json({ ok: true, data });

  } catch (error: any) {
    console.error('[getCustomerOrder] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * POST /api/customer/orders
 * Create new order (customer checkout)
 * 
 * Uses correct column names from DATABASE_SCHEMA.md:
 * - shipping_total (not shipping_cost)
 * - tax_total (not tax_amount)
 * - discount_total (not discount_amount)
 * - grand_total (not total_amount)
 */
export async function createCustomerOrder(c: OrdersContext) {
  const customerId = c.get('userId');
  const userType = c.get('userType');

  if (!customerId || userType !== 'customer') {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer access required' }, 403);
  }

  try {
    const body = await c.req.json();
    const { items, shipping_address_id, notes, merchant_id } = body;

    // Validate
    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Order items required' }, 400);
    }
    if (!shipping_address_id) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Shipping address required' }, 400);
    }

    const supabase = getSupabase(c.env);

    // Verify address belongs to customer
    const { data: address } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('id', shipping_address_id)
      .eq('customer_id', customerId)
      .single();

    if (!address) {
      return c.json({ ok: false, error: 'INVALID_ADDRESS', message: 'Invalid shipping address' }, 400);
    }

    // Calculate totals from items (get prices from product_pricing table)
    let subtotal = 0;
    const orderItems: any[] = [];
    let resolvedMerchantId = merchant_id;

    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('id, name, merchant_id, product_pricing(base_price)')
        .eq('id', item.product_id)
        .single();

      if (!product) {
        return c.json({ ok: false, error: 'INVALID_PRODUCT', message: `Product ${item.product_id} not found` }, 400);
      }

      // Get price from product_pricing table
      const price = product.product_pricing?.[0]?.base_price || 0;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      if (!resolvedMerchantId) {
        resolvedMerchantId = product.merchant_id;
      }

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: price,
        total_price: itemTotal,
        variant_id: item.variant_id || null,
      });
    }

    // Calculate totals with correct column names
    const shippingTotal = body.shipping_total || body.shipping_cost || 0;
    const taxTotal = body.tax_total || body.tax_amount || 0;
    const discountTotal = body.discount_total || body.discount_amount || 0;
    const grandTotal = subtotal + shippingTotal + taxTotal - discountTotal;

    // Create order with schema-compliant columns
    const orderData = {
      customer_id: customerId,
      merchant_id: resolvedMerchantId,
      store_id: resolvedMerchantId,
      status: 'pending',
      source: body.source || 'mobile',
      subtotal,
      shipping_total: shippingTotal,
      tax_total: taxTotal,
      discount_total: discountTotal,
      grand_total: grandTotal,
      currency: body.currency || 'SAR',
      notes: notes || null,
      metadata: body.metadata || {},
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('[createOrder] Error:', orderError);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: orderError.message }, 500);
    }

    // Insert order items
    const itemsWithOrderId = orderItems.map(item => ({ ...item, order_id: order.id }));
    await supabase.from('order_items').insert(itemsWithOrderId);

    // Insert shipping address
    await supabase.from('order_addresses').insert({
      order_id: order.id,
      type: 'shipping',
      ...address,
    });

    // Add to status history
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      previous_status: null,
      new_status: 'pending',
      notes: 'Order created',
    });

    return c.json({ ok: true, data: order }, 201);

  } catch (error: any) {
    console.error('[createOrder] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * POST /api/customer/orders/:id/cancel
 * Cancel order (customer - only if pending)
 */
export async function cancelCustomerOrder(c: OrdersContext) {
  const customerId = c.get('userId');
  const userType = c.get('userType');
  const orderId = c.req.param('id');

  if (!customerId || userType !== 'customer') {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer access required' }, 403);
  }

  try {
    const supabase = getSupabase(c.env);

    // Get order and verify ownership
    const { data: order } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('customer_id', customerId)
      .single();

    if (!order) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Order not found' }, 404);
    }

    // Only allow cancellation of pending orders
    if (order.status !== 'pending') {
      return c.json({ ok: false, error: 'CANNOT_CANCEL', message: 'Only pending orders can be cancelled' }, 400);
    }

    // Update status
    const { data: updated, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    // Add to history
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      previous_status: 'pending',
      new_status: 'cancelled',
      notes: 'Cancelled by customer',
    });

    return c.json({ ok: true, data: updated });

  } catch (error: any) {
    console.error('[cancelOrder] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}


