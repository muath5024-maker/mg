/**
 * Inventory Management System
 * Tracks stock movements, alerts, and integrates with orders
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
import { createAuditLog } from './auditLogs';

type InventoryContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

/**
 * Get inventory overview
 * GET /secure/inventory
 */
export async function getInventoryOverview(c: InventoryContext) {
  try {
    const profileId = c.get('profileId');
    const url = new URL(c.req.url);
    const lowStockOnly = url.searchParams.get('low_stock') === 'true';
    const search = url.searchParams.get('search');
    const limit = url.searchParams.get('limit') || '50';
    const offset = url.searchParams.get('offset') || '0';
    
    // Get merchant's store
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantResponse.json();
    
    if (!merchants || merchants.length === 0) {
      return c.json({
        ok: false,
        error: 'Store not found',
      }, 404);
    }
    
    const merchantId = merchants[0].id;
    
    // Build query
    let query = `${c.env.SUPABASE_URL}/rest/v1/products?merchant_id=eq.${merchantId}&select=id,name,main_image_url,stock,stock_threshold,stock_alert_enabled,price,sku&order=stock.asc&limit=${limit}&offset=${offset}`;
    
    if (lowStockOnly) {
      // Products where stock <= threshold
      query += `&stock_alert_enabled=eq.true`;
    }
    
    if (search) {
      query += `&name=ilike.*${encodeURIComponent(search)}*`;
    }
    
    const response = await fetch(query, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact',
      },
    });
    
    const products: any[] = await response.json();
    const totalCount = parseInt(response.headers.get('content-range')?.split('/')[1] || '0');
    
    // Add low_stock flag
    const productsWithStatus = products.map(p => ({
      ...p,
      is_low_stock: p.stock_alert_enabled && p.stock <= p.stock_threshold,
      is_out_of_stock: p.stock <= 0,
    }));
    
    // Filter by low stock if needed
    const filteredProducts = lowStockOnly 
      ? productsWithStatus.filter(p => p.is_low_stock)
      : productsWithStatus;
    
    // Calculate summary
    const summary = {
      total_products: totalCount,
      out_of_stock: productsWithStatus.filter(p => p.is_out_of_stock).length,
      low_stock: productsWithStatus.filter(p => p.is_low_stock && !p.is_out_of_stock).length,
      total_value: productsWithStatus.reduce((sum, p) => sum + (p.stock * p.price), 0),
    };
    
    return c.json({
      ok: true,
      data: filteredProducts,
      summary,
      total: totalCount,
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Get inventory movements for a product
 * GET /secure/inventory/:productId/movements
 */
export async function getProductMovements(c: InventoryContext) {
  try {
    const profileId = c.get('profileId');
    const productId = c.req.param('productId');
    const url = new URL(c.req.url);
    const limit = url.searchParams.get('limit') || '50';
    const offset = url.searchParams.get('offset') || '0';
    
    // Verify product ownership
    const productResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${productId}&select=id,merchant_id,name,stock,`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const products: any[] = await productResponse.json();
    
    if (!products || products.length === 0) {
      return c.json({
        ok: false,
        error: 'Product not found',
      }, 404);
    }
    
    const product = products[0];
    
    if (product.merchant_id !== profileId) {
      return c.json({
        ok: false,
        error: 'Not authorized',
      }, 403);
    }
    
    // Get movements (user_profiles removed - use created_by directly)
    const movementsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/inventory_movements?product_id=eq.${productId}&select=*&order=created_at.desc&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact',
        },
      }
    );
    
    const movements = await movementsResponse.json();
    const totalCount = parseInt(movementsResponse.headers.get('content-range')?.split('/')[1] || '0');
    
    return c.json({
      ok: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          current_stock: product.stock,
        },
        movements,
      },
      total: totalCount,
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Adjust inventory (manual)
 * POST /secure/inventory/adjust
 * Accepts: product_id in body (Flutter) OR productId in path (legacy)
 * Accepts: quantity (delta) OR delta
 * Accepts: note OR notes
 */
export async function adjustInventory(c: InventoryContext) {
  try {
    const profileId = c.get('profileId');
    const pathProductId = c.req.param('productId'); // May be undefined
    const body = await c.req.json();
    
    // Support both product_id in body (Flutter) or productId in path
    const productId = body.product_id || pathProductId;
    
    if (!productId) {
      return c.json({
        ok: false,
        error: 'Product ID required',
        message: 'يجب تحديد المنتج',
      }, 400);
    }
    
    // Support both 'delta' and 'quantity' fields
    const delta = body.delta ?? body.quantity;
    const reason = body.reason;
    const notes = body.notes ?? body.note;
    
    if (typeof delta !== 'number' || delta === 0) {
      return c.json({
        ok: false,
        error: 'Invalid delta',
        message: 'يجب تحديد كمية التعديل',
      }, 400);
    }
    
    // Map Flutter reasons to Worker reasons
    const reasonMap: Record<string, string> = {
      'adjustment': 'manual_adjust',
      'purchase': 'restock',
      'return': 'return',
      'damage': 'damage',
      'correction': 'manual_adjust',
      // Also accept Worker reasons directly
      'manual_adjust': 'manual_adjust',
      'restock': 'restock',
    };
    
    const mappedReason = reasonMap[reason] || 'manual_adjust';
    
    // Verify product ownership
    const productResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${productId}&select=id,merchant_id,name,stock,stock_threshold,stock_alert_enabled,`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const products: any[] = await productResponse.json();
    
    if (!products || products.length === 0) {
      return c.json({
        ok: false,
        error: 'Product not found',
      }, 404);
    }
    
    const product = products[0];
    
    if (product.merchant_id !== profileId) {
      return c.json({
        ok: false,
        error: 'Not authorized',
      }, 403);
    }
    
    // Calculate new stock
    const stockBefore = product.stock;
    const stockAfter = Math.max(0, stockBefore + delta);
    
    // Update product stock
    const updateResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${productId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: stockAfter,
          updated_at: new Date().toISOString(),
        }),
      }
    );
    
    if (!updateResponse.ok) {
      return c.json({
        ok: false,
        error: 'Failed to update stock',
      }, 500);
    }
    
    // Create movement record
    const movementResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/inventory_movements`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          store_id: product.store_id,
          product_id: productId,
          delta,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reason: mappedReason,
          reference_type: 'manual',
          actor_user_id: profileId,
          notes: notes || null,
        }),
      }
    );
    
    const movement = await movementResponse.json();
    
    // Create audit log
    await createAuditLog(c.env, {
      merchant_id: product.merchant_id || product.store_id,
      actor_user_id: profileId,
      action: 'inventory_adjust',
      entity_type: 'inventory',
      entity_id: productId,
      severity: mappedReason === 'damage' ? 'warning' : 'info',
      meta: {
        product_name: product.name,
        delta,
        stock_before: stockBefore,
        stock_after: stockAfter,
        reason: mappedReason,
        notes,
      },
    });
    
    // Check if alert should be triggered
    const alertTriggered = product.stock_alert_enabled && 
      stockAfter <= product.stock_threshold && 
      stockBefore > product.stock_threshold;
    
    return c.json({
      ok: true,
      data: {
        product_id: productId,
        stock_before: stockBefore,
        stock_after: stockAfter,
        delta,
        movement_id: movement[0]?.id,
        alert_triggered: alertTriggered,
      },
      message: alertTriggered 
        ? `تم تعديل المخزون - تنبيه: المخزون وصل للحد الأدنى!`
        : 'تم تعديل المخزون بنجاح',
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Bulk update stock thresholds
 * PUT /secure/inventory/thresholds
 */
export async function updateThresholds(c: InventoryContext) {
  try {
    const profileId = c.get('profileId');
    const body = await c.req.json();
    
    const { products } = body; // [{product_id, threshold, alert_enabled}]
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return c.json({
        ok: false,
        error: 'Products array required',
      }, 400);
    }
    
    // Get merchant's store
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantResponse.json();
    
    if (!merchants || merchants.length === 0) {
      return c.json({
        ok: false,
        error: 'Store not found',
      }, 404);
    }
    
    const merchantId = merchants[0].id;
    
    // Update each product
    let updatedCount = 0;
    
    for (const item of products) {
      const { product_id, threshold, alert_enabled } = item;
      
      const updateResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${product_id}&merchant_id=eq.${merchantId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stock_threshold: threshold ?? 5,
            stock_alert_enabled: alert_enabled ?? true,
            updated_at: new Date().toISOString(),
          }),
        }
      );
      
      if (updateResponse.ok) {
        updatedCount++;
      }
    }
    
    return c.json({
      ok: true,
      data: {
        updated: updatedCount,
        total: products.length,
      },
      message: 'تم تحديث إعدادات التنبيهات',
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Get all inventory movements for the store
 * GET /secure/inventory/movements
 */
export async function getAllMovements(c: InventoryContext) {
  try {
    const profileId = c.get('profileId');
    const url = new URL(c.req.url);
    const limit = url.searchParams.get('limit') || '50';
    const offset = url.searchParams.get('offset') || '0';
    
    // Get merchant's store
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantResponse.json();
    
    if (!merchants || merchants.length === 0) {
      return c.json({
        ok: true,
        data: [],
        total: 0,
      });
    }
    
    const merchantId = merchants[0].id;
    
    // Get all movements for the store with product info
    const movementsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/inventory_movements?merchant_id=eq.${merchantId}&select=*,products(id,name,main_image_url)&order=created_at.desc&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact',
        },
      }
    );
    
    const movements = await movementsResponse.json();
    const totalCount = parseInt(movementsResponse.headers.get('content-range')?.split('/')[1] || '0');
    
    return c.json({
      ok: true,
      data: movements,
      total: totalCount,
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Get low stock alerts
 * GET /secure/inventory/alerts
 */
export async function getInventoryAlerts(c: InventoryContext) {
  try {
    const profileId = c.get('profileId');
    
    // Get merchant's store
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantResponse.json();
    
    if (!merchants || merchants.length === 0) {
      return c.json({
        ok: true,
        data: {
          out_of_stock: [],
          low_stock: [],
          total_alerts: 0,
        },
      });
    }
    
    const merchantId = merchants[0].id;
    
    // Get products with alerts enabled that are at or below threshold
    const alertsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?merchant_id=eq.${merchantId}&stock_alert_enabled=eq.true&select=id,name,main_image_url,stock,stock_threshold,sku&order=stock.asc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const products: any[] = await alertsResponse.json();
    
    // Separate out of stock and low stock
    const outOfStock = products.filter(p => p.stock <= 0);
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.stock_threshold);
    
    return c.json({
      ok: true,
      data: {
        out_of_stock: outOfStock,
        low_stock: lowStock,
        total_alerts: outOfStock.length + lowStock.length,
      },
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Internal: Adjust inventory for order (called by order system)
 */
export async function adjustInventoryForOrder(
  env: Env,
  productId: string,
  delta: number,
  reason: 'order_reserved' | 'order_paid' | 'order_cancelled',
  orderId: string,
  actorId: string | null
): Promise<{ success: boolean; newStock?: number; error?: string }> {
  try {
    // Get current stock
    const productResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/products?id=eq.${productId}&select=id,merchant_id,stock`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const products: any[] = await productResponse.json();
    
    if (!products || products.length === 0) {
      return { success: false, error: 'Product not found' };
    }
    
    const product = products[0];
    const stockBefore = product.stock;
    const stockAfter = Math.max(0, stockBefore + delta);
    
    // Update stock
    const updateResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/products?id=eq.${productId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: stockAfter,
          updated_at: new Date().toISOString(),
        }),
      }
    );
    
    if (!updateResponse.ok) {
      return { success: false, error: 'Failed to update stock' };
    }
    
    // Create movement
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/inventory_movements`,
      {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_id: product.store_id,
          product_id: productId,
          delta,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reason,
          reference_type: 'order',
          reference_id: orderId,
          actor_user_id: actorId,
        }),
      }
    );
    
    return { success: true, newStock: stockAfter };
    
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


