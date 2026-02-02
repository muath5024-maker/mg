/**
 * Abandoned Cart System Endpoints
 * نظام السلة المتروكة
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type AbandonedCartContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

// Helper to get store ID
async function getmerchantId(c: AbandonedCartContext): Promise<string | null> {
  const authUserId = c.get('authUserId');
  
  const response = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${authUserId}&select=id&limit=1`,
    {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const stores = await response.json() as any[];
  return stores?.[0]?.id || null;
}

// ============================================================================
// Get Abandoned Carts
// ============================================================================

export async function getAbandonedCarts(c: AbandonedCartContext) {
  try {
    const merchantId = await getmerchantId(c);
    const status = c.req.query('status') || 'abandoned';
    
    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    let url = `${c.env.SUPABASE_URL}/rest/v1/abandoned_carts?merchant_id=eq.${merchantId}&order=abandoned_at.desc`;
    if (status !== 'all') {
      url += `&status=eq.${status}`;
    }

    const response = await fetch(url, {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
    });

    const carts = await response.json();
    return c.json({ ok: true, data: carts });
  } catch (error: any) {
    console.error('Get abandoned carts error:', error);
    return c.json({ ok: false, error: 'فشل في جلب السلات المتروكة' }, 500);
  }
}

// ============================================================================
// Get Single Abandoned Cart
// ============================================================================

export async function getAbandonedCart(c: AbandonedCartContext) {
  try {
    const id = c.req.param('id');
    const merchantId = await getmerchantId(c);

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/abandoned_carts?id=eq.${id}&merchant_id=eq.${merchantId}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const carts = await response.json() as any[];
    if (!carts || carts.length === 0) {
      return c.json({ ok: false, error: 'Cart not found' }, 404);
    }

    // Get recovery logs
    const logsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/cart_recovery_logs?abandoned_cart_id=eq.${id}&order=created_at.desc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const cart = carts[0];
    cart.recovery_logs = await logsResponse.json();

    return c.json({ ok: true, data: cart });
  } catch (error: any) {
    console.error('Get abandoned cart error:', error);
    return c.json({ ok: false, error: 'فشل في جلب السلة' }, 500);
  }
}

// ============================================================================
// Get Recovery Settings
// ============================================================================

export async function getRecoverySettings(c: AbandonedCartContext) {
  try {
    const merchantId = await getmerchantId(c);

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/cart_recovery_settings?merchant_id=eq.${merchantId}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const settings = await response.json() as any[];
    
    // If no settings exist, create default
    if (!settings || settings.length === 0) {
      const createResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/cart_recovery_settings`,
        {
          method: 'POST',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({ merchant_id: merchantId }),
        }
      );
      const newSettings = await createResponse.json() as any[];
      return c.json({ ok: true, data: newSettings[0] });
    }

    return c.json({ ok: true, data: settings[0] });
  } catch (error: any) {
    console.error('Get recovery settings error:', error);
    return c.json({ ok: false, error: 'فشل في جلب الإعدادات' }, 500);
  }
}

// ============================================================================
// Update Recovery Settings
// ============================================================================

export async function updateRecoverySettings(c: AbandonedCartContext) {
  try {
    const merchantId = await getmerchantId(c);
    const body = await c.req.json();

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    // Check if settings exist
    const checkResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/cart_recovery_settings?merchant_id=eq.${merchantId}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const existing = await checkResponse.json() as any[];

    if (!existing || existing.length === 0) {
      // Create new settings
      const createResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/cart_recovery_settings`,
        {
          method: 'POST',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({ merchant_id: merchantId, ...body }),
        }
      );
      const newSettings = await createResponse.json() as any[];
      return c.json({ ok: true, data: newSettings[0] });
    }

    // Update existing
    const updateResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/cart_recovery_settings?merchant_id=eq.${merchantId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(body),
      }
    );

    const settings = await updateResponse.json() as any[];
    return c.json({ ok: true, data: settings[0] });
  } catch (error: any) {
    console.error('Update recovery settings error:', error);
    return c.json({ ok: false, error: 'فشل في تحديث الإعدادات' }, 500);
  }
}

// ============================================================================
// Send Recovery Reminder
// ============================================================================

export async function sendRecoveryReminder(c: AbandonedCartContext) {
  try {
    const id = c.req.param('id');
    const merchantId = await getmerchantId(c);
    const { notification_type, include_coupon } = await c.req.json();

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    // Get cart
    const cartResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/abandoned_carts?id=eq.${id}&merchant_id=eq.${merchantId}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const carts = await cartResponse.json() as any[];
    
    if (!carts || carts.length === 0) {
      return c.json({ ok: false, error: 'Cart not found' }, 404);
    }

    const cart = carts[0];

    // Create coupon if requested
    let couponCode = null;
    if (include_coupon) {
      const couponResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/coupons`,
        {
          method: 'POST',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            merchant_id: merchantId,
            code: `CART${Date.now().toString(36).toUpperCase()}`,
            title: 'خصم استرجاع السلة',
            title_ar: 'خصم استرجاع السلة',
            discount_type: 'percentage',
            discount_value: 10,
            usage_limit: 1,
            usage_per_customer: 1,
            smart_type: 'abandoned_cart',
            target_customers: cart.customer_id ? [cart.customer_id] : null,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          }),
        }
      );
      const coupons = await couponResponse.json() as any[];
      couponCode = coupons[0]?.code;
    }

    // Log the reminder
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/cart_recovery_logs`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          abandoned_cart_id: id,
          merchant_id: merchantId,
          notification_type: notification_type || 'push',
          reminder_number: cart.reminder_count + 1,
          status: 'sent',
          sent_to: cart.customer_email || cart.customer_phone,
          coupon_code: couponCode,
        }),
      }
    );

    // Update cart
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/abandoned_carts?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reminder_count: cart.reminder_count + 1,
          reminder_sent_at: new Date().toISOString(),
          last_reminder_type: notification_type || 'push',
        }),
      }
    );

    // TODO: Actually send the notification via email/SMS/push

    return c.json({ 
      ok: true, 
      message: 'تم إرسال التذكير بنجاح',
      coupon_code: couponCode 
    });
  } catch (error: any) {
    console.error('Send recovery reminder error:', error);
    return c.json({ ok: false, error: 'فشل في إرسال التذكير' }, 500);
  }
}

// ============================================================================
// Get Abandoned Cart Stats
// ============================================================================

export async function getAbandonedCartStats(c: AbandonedCartContext) {
  try {
    const merchantId = await getmerchantId(c);

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    // Get settings with stats
    const settingsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/cart_recovery_settings?merchant_id=eq.${merchantId}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const settings = await settingsResponse.json() as any[];

    // Get counts by status
    const cartsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/abandoned_carts?merchant_id=eq.${merchantId}&select=status,cart_total`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const carts = await cartsResponse.json() as any[];

    const stats = {
      total_abandoned: settings[0]?.total_abandoned || 0,
      total_recovered: settings[0]?.total_recovered || 0,
      total_revenue_recovered: settings[0]?.total_revenue_recovered || 0,
      recovery_rate: 0,
      pending_carts: carts.filter((c: any) => c.status === 'abandoned').length,
      total_pending_value: carts
        .filter((c: any) => c.status === 'abandoned')
        .reduce((sum: number, c: any) => sum + (c.cart_total || 0), 0),
    };

    if (stats.total_abandoned > 0) {
      stats.recovery_rate = Math.round((stats.total_recovered / stats.total_abandoned) * 100);
    }

    return c.json({ ok: true, data: stats });
  } catch (error: any) {
    console.error('Get abandoned cart stats error:', error);
    return c.json({ ok: false, error: 'فشل في جلب الإحصائيات' }, 500);
  }
}

// ============================================================================
// Mark Cart as Recovered
// ============================================================================

export async function markCartRecovered(c: AbandonedCartContext) {
  try {
    const id = c.req.param('id');
    const merchantId = await getmerchantId(c);
    const { order_id } = await c.req.json();

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    // Get cart
    const cartResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/abandoned_carts?id=eq.${id}&store_id=eq.${merchantId}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const carts = await cartResponse.json() as any[];
    
    if (!carts || carts.length === 0) {
      return c.json({ ok: false, error: 'Cart not found' }, 404);
    }

    const cart = carts[0];

    // Update cart status
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/abandoned_carts?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'converted',
          converted_order_id: order_id,
          converted_at: new Date().toISOString(),
        }),
      }
    );

    // Update stats
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/cart_recovery_settings?merchant_id=eq.${merchantId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total_recovered: (await cartResponse.json() as any[])[0]?.total_recovered + 1 || 1,
          total_revenue_recovered: cart.cart_total,
        }),
      }
    );

    return c.json({ ok: true, message: 'تم تحديث السلة كمستردة' });
  } catch (error: any) {
    console.error('Mark cart recovered error:', error);
    return c.json({ ok: false, error: 'فشل في تحديث السلة' }, 500);
  }
}

// ============================================================================
// Create Abandoned Cart (Public - for tracking)
// ============================================================================

export async function createAbandonedCart(c: AbandonedCartContext) {
  try {
    const body = await c.req.json();
    const { 
      store_id, 
      customer_id, 
      customer_email, 
      customer_phone,
      customer_name,
      cart_items, 
      cart_total,
      cart_token 
    } = body;

    if (!store_id || !cart_items) {
      return c.json({ ok: false, error: 'Missing required fields' }, 400);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/abandoned_carts`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          store_id,
          customer_id,
          customer_email,
          customer_phone,
          customer_name,
          cart_items,
          cart_total: cart_total || 0,
          items_count: cart_items.length,
          cart_token,
          status: 'abandoned',
        }),
      }
    );

    const carts = await response.json() as any[];

    // Update store stats
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/rpc/increment_abandoned_count`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_store_id: store_id }),
      }
    );

    return c.json({ ok: true, data: carts[0] });
  } catch (error: any) {
    console.error('Create abandoned cart error:', error);
    return c.json({ ok: false, error: 'فشل في إنشاء السلة' }, 500);
  }
}


