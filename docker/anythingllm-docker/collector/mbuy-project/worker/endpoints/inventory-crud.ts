/**
 * Inventory CRUD Endpoints - New System
 * 
 * Handles inventory management for merchants
 * 
 * @module endpoints/inventory-crud
 */

import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env, AuthContext } from '../types';

type InventoryContext = Context<{ Bindings: Env; Variables: AuthContext }>;

/**
 * Helper: Get Supabase client with service_role
 */
function getSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// =====================================================
// INVENTORY ITEMS
// =====================================================

/**
 * GET /api/merchant/inventory
 * List inventory items for merchant
 */
export async function listInventoryItems(c: InventoryContext) {
  const merchantId = c.get('merchantId') || c.get('userId');
  
  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'Merchant ID not found' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);
    
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const lowStock = c.req.query('low_stock') === 'true';
    const productId = c.req.query('product_id');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('inventory_items')
      .select(`
        *,
        products(id, name, sku, main_image_url)
      `, { count: 'exact' })
      .eq('merchant_id', merchantId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (lowStock) {
      query = query.lt('quantity', 10); // Low stock threshold
    }
    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[listInventory] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({
      ok: true,
      data: data || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) }
    });

  } catch (error: any) {
    console.error('[listInventory] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * GET /api/merchant/inventory/:productId
 * Get inventory for specific product
 */
export async function getProductInventory(c: InventoryContext) {
  const merchantId = c.get('merchantId') || c.get('userId');
  const productId = c.req.param('productId');

  if (!merchantId || !productId) {
    return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Merchant ID and Product ID required' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('product_id', productId)
      .eq('merchant_id', merchantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[getInventory] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({ ok: true, data: data || null });

  } catch (error: any) {
    console.error('[getInventory] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * PUT /api/merchant/inventory/:productId
 * Update inventory quantity
 */
export async function updateInventory(c: InventoryContext) {
  const merchantId = c.get('merchantId') || c.get('userId');
  const productId = c.req.param('productId');

  if (!merchantId || !productId) {
    return c.json({ ok: false, error: 'MISSING_PARAMS', message: 'Merchant ID and Product ID required' }, 400);
  }

  try {
    const body = await c.req.json();
    const { quantity, low_stock_threshold, reason } = body;

    if (quantity === undefined || quantity < 0) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Valid quantity required' }, 400);
    }

    const supabase = getSupabase(c.env);

    // Check if inventory record exists
    const { data: existing } = await supabase
      .from('inventory_items')
      .select('id, quantity, low_stock_threshold')
      .eq('product_id', productId)
      .eq('merchant_id', merchantId)
      .single();

    let inventoryData;
    const previousQuantity = existing?.quantity || 0;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('inventory_items')
        .update({
          quantity,
          low_stock_threshold: low_stock_threshold ?? existing.low_stock_threshold,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
      }
      inventoryData = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          product_id: productId,
          merchant_id: merchantId,
          quantity,
          low_stock_threshold: low_stock_threshold || 10,
        })
        .select()
        .single();

      if (error) {
        return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
      }
      inventoryData = data;
    }

    // Also update products.stock_quantity
    await supabase
      .from('products')
      .update({ stock_quantity: quantity, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('merchant_id', merchantId);

    // Log movement
    const quantityChange = quantity - previousQuantity;
    if (quantityChange !== 0) {
      await supabase.from('inventory_movements').insert({
        inventory_item_id: inventoryData.id,
        product_id: productId,
        merchant_id: merchantId,
        type: quantityChange > 0 ? 'adjustment_in' : 'adjustment_out',
        quantity: Math.abs(quantityChange),
        previous_quantity: previousQuantity,
        new_quantity: quantity,
        reason: reason || 'Manual adjustment',
        created_by: merchantId,
      });
    }

    return c.json({ ok: true, data: inventoryData });

  } catch (error: any) {
    console.error('[updateInventory] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

/**
 * POST /api/merchant/inventory/adjust
 * Bulk adjust inventory
 */
export async function bulkAdjustInventory(c: InventoryContext) {
  const merchantId = c.get('merchantId') || c.get('userId');

  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'Merchant ID not found' }, 400);
  }

  try {
    const body = await c.req.json();
    const { adjustments, reason } = body;

    if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
      return c.json({ ok: false, error: 'VALIDATION_ERROR', message: 'Adjustments array required' }, 400);
    }

    const supabase = getSupabase(c.env);
    const results: any[] = [];
    const errors: any[] = [];

    for (const adj of adjustments) {
      try {
        const { product_id, quantity, adjustment_type } = adj;

        // Get current quantity
        const { data: current } = await supabase
          .from('inventory_items')
          .select('id, quantity')
          .eq('product_id', product_id)
          .eq('merchant_id', merchantId)
          .single();

        let newQuantity: number;
        const previousQuantity = current?.quantity || 0;

        if (adjustment_type === 'set') {
          newQuantity = quantity;
        } else if (adjustment_type === 'add') {
          newQuantity = previousQuantity + quantity;
        } else if (adjustment_type === 'subtract') {
          newQuantity = Math.max(0, previousQuantity - quantity);
        } else {
          newQuantity = quantity;
        }

        // Update or insert
        if (current) {
          await supabase
            .from('inventory_items')
            .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
            .eq('id', current.id);
        } else {
          await supabase
            .from('inventory_items')
            .insert({ product_id, merchant_id: merchantId, quantity: newQuantity });
        }

        // Update products table
        await supabase
          .from('products')
          .update({ stock_quantity: newQuantity })
          .eq('id', product_id)
          .eq('merchant_id', merchantId);

        results.push({ product_id, previous: previousQuantity, new: newQuantity });

      } catch (err: any) {
        errors.push({ product_id: adj.product_id, error: err.message });
      }
    }

    return c.json({
      ok: true,
      data: { updated: results, errors },
      message: `Updated ${results.length} items, ${errors.length} errors`
    });

  } catch (error: any) {
    console.error('[bulkAdjust] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// INVENTORY MOVEMENTS (History)
// =====================================================

/**
 * GET /api/merchant/inventory/movements
 * Get inventory movement history
 */
export async function listInventoryMovements(c: InventoryContext) {
  const merchantId = c.get('merchantId') || c.get('userId');
  
  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'Merchant ID not found' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);
    
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const productId = c.req.query('product_id');
    const type = c.req.query('type'); // sale, purchase, adjustment_in, adjustment_out, return
    const offset = (page - 1) * limit;

    let query = supabase
      .from('inventory_movements')
      .select(`
        *,
        products(id, name, sku)
      `, { count: 'exact' })
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (productId) query = query.eq('product_id', productId);
    if (type) query = query.eq('type', type);

    const { data, error, count } = await query;

    if (error) {
      console.error('[listMovements] Error:', error);
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({
      ok: true,
      data: data || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) }
    });

  } catch (error: any) {
    console.error('[listMovements] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// INVENTORY STATS
// =====================================================

/**
 * GET /api/merchant/inventory/stats
 * Get inventory statistics
 */
export async function getInventoryStats(c: InventoryContext) {
  const merchantId = c.get('merchantId') || c.get('userId');
  
  if (!merchantId) {
    return c.json({ ok: false, error: 'NO_MERCHANT', message: 'Merchant ID not found' }, 400);
  }

  try {
    const supabase = getSupabase(c.env);

    // Get counts
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('is_active', true);

    const { count: lowStockCount } = await supabase
      .from('inventory_items')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .lt('quantity', 10);

    const { count: outOfStockCount } = await supabase
      .from('inventory_items')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('quantity', 0);

    // Get total inventory value
    const { data: valueData } = await supabase
      .from('products')
      .select('price, stock_quantity')
      .eq('merchant_id', merchantId)
      .eq('is_active', true);

    const totalValue = (valueData || []).reduce((sum, p) => {
      return sum + (p.price * (p.stock_quantity || 0));
    }, 0);

    return c.json({
      ok: true,
      data: {
        totalProducts: totalProducts || 0,
        lowStockCount: lowStockCount || 0,
        outOfStockCount: outOfStockCount || 0,
        totalInventoryValue: totalValue,
      }
    });

  } catch (error: any) {
    console.error('[getStats] Exception:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}


