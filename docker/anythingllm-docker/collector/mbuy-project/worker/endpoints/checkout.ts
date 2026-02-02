/**
 * Checkout Endpoints V2 - إتمام عملية الشراء
 * 
 * Updated to work with new database schema:
 * - shopping_carts, cart_items instead of carts
 * - merchants instead of stores
 * - order_items with merchant_id, item_type, product_data
 * - inventory_items for stock management
 * 
 * @module endpoints/checkout-v2
 */

import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env, AuthContext } from '../types';

type CheckoutContext = Context<{ Bindings: Env; Variables: AuthContext }>;

/**
 * Helper: Get Supabase client with service_role
 */
function getSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Generate unique order number
 */
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// =====================================================
// CHECKOUT OPERATIONS
// =====================================================

/**
 * POST /api/customer/checkout/validate
 * Validate cart before checkout (check stock, prices)
 */
export async function validateCheckout(c: CheckoutContext) {
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
      return c.json({ ok: false, error: 'EMPTY_CART', message: 'Your cart is empty' }, 400);
    }

    // Get cart items with product info from new schema
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select('id, quantity, product_id, variant_id, unit_price')
      .eq('cart_id', cart.id);

    if (itemsError) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: itemsError.message }, 500);
    }

    if (!items || items.length === 0) {
      return c.json({ ok: false, error: 'EMPTY_CART', message: 'Your cart is empty' }, 400);
    }

    // Get product details for all items
    const productIds = items.map(i => i.product_id);
    const { data: products } = await supabase
      .from('products')
      .select(`
        id,
        name,
        name_ar,
        slug,
        status,
        merchant_id,
        merchants!products_merchant_id_fkey (id, name, name_ar, status)
      `)
      .in('id', productIds);

    // Get pricing for products
    const { data: pricing } = await supabase
      .from('product_pricing')
      .select('product_id, base_price, sale_price, currency')
      .in('product_id', productIds);

    // Get inventory for stock check
    const { data: inventory } = await supabase
      .from('inventory_items')
      .select('product_id, variant_id, quantity_available')
      .in('product_id', productIds);

    // Get main images
    const { data: media } = await supabase
      .from('product_media')
      .select('product_id, url')
      .in('product_id', productIds)
      .eq('is_primary', true);

    // Create lookup maps
    const productMap = new Map(products?.map(p => [p.id, p]) || []);
    const pricingMap = new Map(pricing?.map(p => [p.product_id, p]) || []);
    const mediaMap = new Map(media?.map(m => [m.product_id, m.url]) || []);

    // Create inventory lookup (product_id + variant_id -> quantity)
    const inventoryMap = new Map<string, number>();
    inventory?.forEach(inv => {
      const key = inv.variant_id ? `${inv.product_id}:${inv.variant_id}` : inv.product_id;
      const current = inventoryMap.get(key) || 0;
      inventoryMap.set(key, current + (inv.quantity_available || 0));
    });

    const validationErrors: any[] = [];
    const validItems: any[] = [];

    for (const item of items) {
      const product = productMap.get(item.product_id);
      const price = pricingMap.get(item.product_id);
      
      if (!product) {
        validationErrors.push({
          item_id: item.id,
          error: 'PRODUCT_NOT_FOUND',
          message: 'Product no longer exists'
        });
        continue;
      }

      if (product.status !== 'active') {
        validationErrors.push({
          item_id: item.id,
          product_name: product.name,
          error: 'PRODUCT_UNAVAILABLE',
          message: 'Product is no longer available'
        });
        continue;
      }

      const merchant = product.merchants as any;
      if (!merchant || merchant.status !== 'active') {
        validationErrors.push({
          item_id: item.id,
          product_name: product.name,
          error: 'MERCHANT_UNAVAILABLE',
          message: 'Merchant is not available'
        });
        continue;
      }

      // Check stock
      const inventoryKey = item.variant_id ? `${item.product_id}:${item.variant_id}` : item.product_id;
      const availableStock = inventoryMap.get(inventoryKey) || 0;

      if (availableStock < item.quantity) {
        validationErrors.push({
          item_id: item.id,
          product_name: product.name,
          error: 'INSUFFICIENT_STOCK',
          message: availableStock > 0 
            ? `Only ${availableStock} items available` 
            : 'Out of stock',
          available_stock: availableStock
        });
        continue;
      }

      const unitPrice = price?.sale_price || price?.base_price || item.unit_price;
      const subtotal = unitPrice * item.quantity;

      validItems.push({
        item_id: item.id,
        product_id: product.id,
        variant_id: item.variant_id,
        product_name: product.name,
        product_name_ar: product.name_ar,
        product_image: mediaMap.get(product.id),
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal: subtotal,
        merchant_id: product.merchant_id,
        merchant_name: merchant.name,
        merchant_name_ar: merchant.name_ar
      });
    }

    const subtotal = validItems.reduce((sum, item) => sum + item.subtotal, 0);
    const isValid = validationErrors.length === 0;

    return c.json({
      ok: true,
      data: {
        is_valid: isValid,
        items: validItems,
        validation_errors: validationErrors,
        summary: {
          subtotal: subtotal,
          items_count: validItems.reduce((sum, item) => sum + item.quantity, 0),
          currency: 'SAR'
        }
      }
    });

  } catch (error: any) {
    console.error('[validateCheckout] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * POST /api/customer/checkout
 * Create order from cart
 */
export async function createOrder(c: CheckoutContext) {
  const customerId = c.get('userId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  try {
    const body = await c.req.json();
    const {
      shipping_address,
      billing_address,
      payment_method = 'cash',
      notes = '',
      coupon_code
    } = body;

    if (!shipping_address) {
      return c.json({ ok: false, error: 'MISSING_ADDRESS', message: 'Shipping address is required' }, 400);
    }

    const supabase = getSupabase(c.env);

    // Get cart
    const { data: cart } = await supabase
      .from('shopping_carts')
      .select('id')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .single();

    if (!cart) {
      return c.json({ ok: false, error: 'EMPTY_CART', message: 'Your cart is empty' }, 400);
    }

    // Get cart items
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select('id, quantity, product_id, variant_id, unit_price')
      .eq('cart_id', cart.id);

    if (itemsError || !cartItems || cartItems.length === 0) {
      return c.json({ ok: false, error: 'EMPTY_CART', message: 'Your cart is empty' }, 400);
    }

    // Get products with merchant info
    const productIds = cartItems.map(i => i.product_id);
    const { data: products } = await supabase
      .from('products')
      .select(`
        id,
        name,
        name_ar,
        slug,
        status,
        merchant_id,
        merchants!products_merchant_id_fkey (id, name, name_ar, status)
      `)
      .in('id', productIds);

    // Get pricing
    const { data: pricing } = await supabase
      .from('product_pricing')
      .select('product_id, base_price, sale_price, currency')
      .in('product_id', productIds);

    // Get inventory for stock validation
    const { data: inventory } = await supabase
      .from('inventory_items')
      .select('id, product_id, variant_id, quantity_available')
      .in('product_id', productIds);

    // Get images
    const { data: media } = await supabase
      .from('product_media')
      .select('product_id, url')
      .in('product_id', productIds)
      .eq('is_primary', true);

    // Create lookup maps
    const productMap = new Map(products?.map(p => [p.id, p]) || []);
    const pricingMap = new Map(pricing?.map(p => [p.product_id, p]) || []);
    const mediaMap = new Map(media?.map(m => [m.product_id, m.url]) || []);

    // Create inventory map for stock check
    const inventoryMap = new Map<string, { id: string, quantity: number }[]>();
    inventory?.forEach(inv => {
      const key = inv.variant_id ? `${inv.product_id}:${inv.variant_id}` : inv.product_id;
      if (!inventoryMap.has(key)) {
        inventoryMap.set(key, []);
      }
      inventoryMap.get(key)!.push({
        id: inv.id,
        quantity: inv.quantity_available || 0
      });
    });

    // Group items by merchant
    const merchantGroups: Map<string, any[]> = new Map();
    
    for (const item of cartItems) {
      const product = productMap.get(item.product_id);
      
      if (!product || product.status !== 'active') continue;
      
      const merchant = product.merchants as any;
      if (!merchant || merchant.status !== 'active') continue;

      // Check stock
      const inventoryKey = item.variant_id ? `${item.product_id}:${item.variant_id}` : item.product_id;
      const inventoryItems = inventoryMap.get(inventoryKey) || [];
      const totalAvailable = inventoryItems.reduce((sum, i) => sum + i.quantity, 0);

      if (totalAvailable < item.quantity) {
        return c.json({
          ok: false,
          error: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock for ${product.name}. Only ${totalAvailable} available.`
        }, 400);
      }

      const merchantId = product.merchant_id;
      if (!merchantGroups.has(merchantId)) {
        merchantGroups.set(merchantId, []);
      }

      const price = pricingMap.get(item.product_id);
      const unitPrice = price?.sale_price || price?.base_price || item.unit_price;

      merchantGroups.get(merchantId)!.push({
        ...item,
        product,
        merchant,
        unit_price: unitPrice,
        image_url: mediaMap.get(item.product_id),
        inventory_items: inventoryItems
      });
    }

    if (merchantGroups.size === 0) {
      return c.json({ ok: false, error: 'NO_VALID_ITEMS', message: 'No valid items in cart' }, 400);
    }

    const orders: any[] = [];
    let totalAmount = 0;

    // Create orders for each merchant
    for (const [merchantId, items] of merchantGroups) {
      const merchant = items[0].merchant;
      const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const shippingTotal = 25; // Fixed shipping per merchant (configurable)
      const taxTotal = 0; // Can calculate VAT here
      const discountTotal = 0; // Apply coupon if valid
      const grandTotal = subtotal + shippingTotal + taxTotal - discountTotal;
      totalAmount += grandTotal;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: customerId,
          merchant_id: merchantId,
          store_id: merchantId, // Same as merchant for now
          status: 'pending',
          source: 'app',
          subtotal: subtotal,
          shipping_total: shippingTotal,
          tax_total: taxTotal,
          discount_total: discountTotal,
          grand_total: grandTotal,
          currency: 'SAR',
          notes: notes,
          metadata: {
            payment_method: payment_method,
            coupon_code: coupon_code || null
          }
        })
        .select('id')
        .single();

      if (orderError) {
        console.error('[createOrder] Error creating order:', orderError);
        return c.json({ ok: false, error: 'ORDER_CREATION_FAILED', message: orderError.message }, 500);
      }

      // Create order addresses
      await supabase.from('order_addresses').insert([
        {
          order_id: order.id,
          type: 'shipping',
          ...shipping_address
        },
        ...(billing_address ? [{
          order_id: order.id,
          type: 'billing',
          ...billing_address
        }] : [])
      ]);

      // Create order items with new schema
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        variant_id: item.variant_id,
        merchant_id: merchantId,
        item_type: 'product',
        name: item.product.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.unit_price * item.quantity,
        product_data: {
          name_ar: item.product.name_ar,
          slug: item.product.slug,
          image_url: item.image_url
        }
      }));

      const { error: itemsInsertError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsInsertError) {
        console.error('[createOrder] Error creating order items:', itemsInsertError);
        // Rollback order
        await supabase.from('order_addresses').delete().eq('order_id', order.id);
        await supabase.from('orders').delete().eq('id', order.id);
        return c.json({ ok: false, error: 'ORDER_ITEMS_FAILED', message: itemsInsertError.message }, 500);
      }

      // Update inventory (reduce stock)
      for (const item of items) {
        let remainingQuantity = item.quantity;
        
        for (const inv of item.inventory_items) {
          if (remainingQuantity <= 0) break;
          
          const deduction = Math.min(inv.quantity, remainingQuantity);
          remainingQuantity -= deduction;
          
          await supabase
            .from('inventory_items')
            .update({ quantity_available: inv.quantity - deduction })
            .eq('id', inv.id);
        }
      }

      // Create order payment record
      await supabase.from('order_payments').insert({
        order_id: order.id,
        merchant_id: merchantId,
        payment_method: payment_method,
        amount: grandTotal,
        status: payment_method === 'cash' ? 'pending' : 'pending'
      });

      // Create order number from ID (first 8 chars)
      const orderNumber = `ORD-${order.id.substring(0, 8).toUpperCase()}`;

      orders.push({
        id: order.id,
        order_number: orderNumber,
        merchant_id: merchantId,
        merchant_name: merchant.name,
        merchant_name_ar: merchant.name_ar,
        subtotal: subtotal,
        shipping: shippingTotal,
        tax: taxTotal,
        discount: discountTotal,
        total: grandTotal,
        items_count: items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      });
    }

    // Mark cart as completed
    await supabase
      .from('shopping_carts')
      .update({ status: 'completed' })
      .eq('id', cart.id);

    return c.json({
      ok: true,
      message: 'Order placed successfully',
      data: {
        orders: orders,
        total_amount: totalAmount,
        payment_method: payment_method,
        shipping_address: shipping_address
      }
    }, 201);

  } catch (error: any) {
    console.error('[createOrder] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * GET /api/customer/orders
 * Get customer's orders
 */
export async function getCustomerOrders(c: CheckoutContext) {
  const customerId = c.get('userId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
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
        id,
        status,
        source,
        subtotal,
        shipping_total,
        tax_total,
        discount_total,
        grand_total,
        currency,
        created_at,
        updated_at,
        merchants!fk_orders_merchant (id, name, name_ar, logo_url),
        order_items (
          id,
          name,
          quantity,
          unit_price,
          total,
          product_data
        ),
        order_payments (
          payment_method,
          status,
          paid_at
        )
      `, { count: 'exact' })
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[getCustomerOrders] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    // Add order number to each order
    const ordersWithNumber = (data || []).map(order => ({
      ...order,
      order_number: `ORD-${order.id.substring(0, 8).toUpperCase()}`
    }));

    return c.json({
      ok: true,
      data: ordersWithNumber,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('[getCustomerOrders] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * GET /api/customer/orders/:id
 * Get single order details
 */
export async function getOrderDetails(c: CheckoutContext) {
  const customerId = c.get('userId');
  const orderId = c.req.param('id');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  if (!orderId) {
    return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Order ID is required' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        source,
        subtotal,
        shipping_total,
        tax_total,
        discount_total,
        grand_total,
        currency,
        notes,
        metadata,
        created_at,
        updated_at,
        merchants!fk_orders_merchant (id, name, name_ar, logo_url, phone, email),
        order_items (
          id,
          product_id,
          variant_id,
          name,
          quantity,
          unit_price,
          total,
          product_data
        ),
        order_addresses (
          type,
          name,
          phone,
          country,
          city,
          district,
          street,
          building_number,
          postal_code,
          latitude,
          longitude
        ),
        order_payments (
          payment_method,
          provider,
          amount,
          status,
          paid_at
        ),
        order_shipments (
          tracking_number,
          carrier,
          status,
          shipped_at,
          delivered_at
        )
      `)
      .eq('id', orderId)
      .eq('customer_id', customerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ ok: false, error: 'ORDER_NOT_FOUND', message: 'Order not found' }, 404);
      }
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    // Add order number
    const orderWithNumber = {
      ...order,
      order_number: `ORD-${order.id.substring(0, 8).toUpperCase()}`
    };

    return c.json({ ok: true, data: orderWithNumber });

  } catch (error: any) {
    console.error('[getOrderDetails] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * POST /api/customer/orders/:id/cancel
 * Cancel an order (only if pending)
 */
export async function cancelOrder(c: CheckoutContext) {
  const customerId = c.get('userId');
  const orderId = c.req.param('id');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  if (!orderId) {
    return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Order ID is required' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);

    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id, 
        status,
        order_items (product_id, variant_id, quantity)
      `)
      .eq('id', orderId)
      .eq('customer_id', customerId)
      .single();

    if (orderError || !order) {
      return c.json({ ok: false, error: 'ORDER_NOT_FOUND', message: 'Order not found' }, 404);
    }

    if (order.status !== 'pending') {
      return c.json({
        ok: false,
        error: 'CANNOT_CANCEL',
        message: 'Only pending orders can be cancelled'
      }, 400);
    }

    // Restore inventory
    for (const item of (order.order_items as any[])) {
      // Find inventory item and restore stock
      const inventoryKey = item.variant_id 
        ? `product_id.eq.${item.product_id},variant_id.eq.${item.variant_id}`
        : `product_id.eq.${item.product_id},variant_id.is.null`;

      const { data: invItems } = await supabase
        .from('inventory_items')
        .select('id, quantity_available')
        .eq('product_id', item.product_id)
        .eq('variant_id', item.variant_id || null)
        .limit(1);

      if (invItems && invItems[0]) {
        await supabase
          .from('inventory_items')
          .update({ quantity_available: invItems[0].quantity_available + item.quantity })
          .eq('id', invItems[0].id);
      }
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    if (updateError) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: updateError.message }, 500);
    }

    // Update payment status
    await supabase
      .from('order_payments')
      .update({ status: 'cancelled' })
      .eq('order_id', orderId);

    return c.json({ ok: true, message: 'Order cancelled successfully' });

  } catch (error: any) {
    console.error('[cancelOrder] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// ADDRESS OPERATIONS
// =====================================================

/**
 * GET /api/customer/addresses
 * Get customer's saved addresses
 */
export async function getAddresses(c: CheckoutContext) {
  const customerId = c.get('userId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  try {
    const supabase = getSupabase(c.env);

    const { data: addresses, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.log('[getAddresses] Error:', error.message);
      return c.json({ ok: true, data: [] });
    }

    return c.json({ ok: true, data: addresses || [] });

  } catch (error: any) {
    console.error('[getAddresses] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * POST /api/customer/addresses
 * Add new address
 */
export async function addAddress(c: CheckoutContext) {
  const customerId = c.get('userId');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  try {
    const body = await c.req.json();
    const {
      type = 'shipping',
      name,
      phone,
      email,
      country = 'SA',
      city,
      district,
      street,
      building_number,
      apartment_number,
      postal_code,
      latitude,
      longitude,
      is_default = false
    } = body;

    if (!city || !district || !street) {
      return c.json({ 
        ok: false, 
        error: 'MISSING_FIELDS', 
        message: 'City, district, and street are required' 
      }, 400);
    }

    const supabase = getSupabase(c.env);

    // Get customer's merchant_id from customers table
    const { data: customer } = await supabase
      .from('customers')
      .select('merchant_id')
      .eq('user_id', customerId)
      .single();

    const merchantId = customer?.merchant_id || '00000000-0000-0000-0000-000000000001'; // Default merchant

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId);
    }

    const { data: address, error } = await supabase
      .from('customer_addresses')
      .insert({
        customer_id: customerId,
        merchant_id: merchantId,
        type,
        name,
        phone,
        email,
        country,
        city,
        district,
        street,
        building_number,
        apartment_number,
        postal_code,
        latitude,
        longitude,
        is_default
      })
      .select()
      .single();

    if (error) {
      console.error('[addAddress] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({ ok: true, data: address }, 201);

  } catch (error: any) {
    console.error('[addAddress] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * PUT /api/customer/addresses/:id
 * Update address
 */
export async function updateAddress(c: CheckoutContext) {
  const customerId = c.get('userId');
  const addressId = c.req.param('id');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  if (!addressId) {
    return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Address ID is required' }, 400);
  }

  try {
    const body = await c.req.json();
    const supabase = getSupabase(c.env);

    // Verify ownership
    const { data: existing } = await supabase
      .from('customer_addresses')
      .select('id')
      .eq('id', addressId)
      .eq('customer_id', customerId)
      .single();

    if (!existing) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Address not found' }, 404);
    }

    // If setting as default, unset other defaults
    if (body.is_default) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId)
        .neq('id', addressId);
    }

    const { data: address, error } = await supabase
      .from('customer_addresses')
      .update({
        type: body.type,
        name: body.name,
        phone: body.phone,
        email: body.email,
        country: body.country,
        city: body.city,
        district: body.district,
        street: body.street,
        building_number: body.building_number,
        apartment_number: body.apartment_number,
        postal_code: body.postal_code,
        latitude: body.latitude,
        longitude: body.longitude,
        is_default: body.is_default
      })
      .eq('id', addressId)
      .select()
      .single();

    if (error) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({ ok: true, data: address });

  } catch (error: any) {
    console.error('[updateAddress] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * DELETE /api/customer/addresses/:id
 * Delete address
 */
export async function deleteAddress(c: CheckoutContext) {
  const customerId = c.get('userId');
  const addressId = c.req.param('id');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  if (!addressId) {
    return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Address ID is required' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);

    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)
      .eq('customer_id', customerId);

    if (error) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({ ok: true, message: 'Address deleted successfully' });

  } catch (error: any) {
    console.error('[deleteAddress] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * PUT /api/customer/addresses/:id/default
 * Set address as default
 */
export async function setDefaultAddress(c: CheckoutContext) {
  const customerId = c.get('userId');
  const addressId = c.req.param('id');
  
  if (!customerId) {
    return c.json({ ok: false, error: 'UNAUTHORIZED', message: 'Customer authentication required' }, 401);
  }

  if (!addressId) {
    return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Address ID is required' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);

    // Verify ownership
    const { data: existing } = await supabase
      .from('customer_addresses')
      .select('id')
      .eq('id', addressId)
      .eq('customer_id', customerId)
      .single();

    if (!existing) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Address not found' }, 404);
    }

    // Unset all defaults
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', customerId);

    // Set new default
    const { error } = await supabase
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', addressId);

    if (error) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({ ok: true, message: 'Default address updated' });

  } catch (error: any) {
    console.error('[setDefaultAddress] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}
