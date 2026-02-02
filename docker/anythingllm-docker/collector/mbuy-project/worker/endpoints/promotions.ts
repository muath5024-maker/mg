/**
 * Promotions System Endpoints
 * Handles PIN/BOOST campaigns with analytics integration
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type PromotionContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

/**
 * Create a new promotion (PIN or BOOST)
 * POST /secure/promotions
 */
export async function createPromotion(c: PromotionContext) {
  try {
    const profileId = c.get('profileId');
    const body = await c.req.json();
    
    const {
      target_type, // 'store' | 'product'
      target_id,   // product_id (null if store)
      promo_type,  // 'pin' | 'boost'
      weight,      // 1-10 for boost
      start_at,
      end_at,
      budget_points,
    } = body;
    
    // Validate required fields
    if (!target_type || !promo_type || !start_at || !end_at) {
      return c.json({
        ok: false,
        error: 'Missing required fields',
        message: 'يرجى تعبئة جميع الحقول المطلوبة',
      }, 400);
    }
    
    // Validate target_type
    if (!['store', 'product'].includes(target_type)) {
      return c.json({
        ok: false,
        error: 'Invalid target_type',
      }, 400);
    }
    
    // Validate promo_type
    if (!['pin', 'boost'].includes(promo_type)) {
      return c.json({
        ok: false,
        error: 'Invalid promo_type',
      }, 400);
    }
    
    // Get merchant
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
        error: 'Merchant not found',
        message: 'لم يتم العثور على حسابك',
      }, 404);
    }
    
    const merchantId = merchants[0].id;
    
    // If target is product, verify ownership
    if (target_type === 'product' && target_id) {
      const productResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${target_id}&merchant_id=eq.${merchantId}&select=id`,
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
          message: 'المنتج غير موجود أو لا يتبع لمتجرك',
        }, 404);
      }
    }
    
    // Determine initial status
    const now = new Date();
    const startDate = new Date(start_at);
    const endDate = new Date(end_at);
    let status = 'scheduled';
    
    if (startDate <= now && endDate > now) {
      status = 'active';
    } else if (endDate <= now) {
      status = 'expired';
    }
    
    // Create promotion
    const promotionResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/promotions`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          target_type,
          target_id: target_type === 'product' ? target_id : null,
          promo_type,
          weight: promo_type === 'boost' ? (weight || 1) : null,
          start_at,
          end_at,
          status,
          budget_points: budget_points || null,
          created_by: profileId,
        }),
      }
    );
    
    if (!promotionResponse.ok) {
      const error = await promotionResponse.text();
      return c.json({
        ok: false,
        error: 'Failed to create promotion',
        detail: error,
      }, 500);
    }
    
    const promotion = await promotionResponse.json();
    
    // Create audit log
    await createAuditLog(c.env, merchantId, profileId, 'promotion_create', 'promotion', promotion[0]?.id, {
      promo_type,
      target_type,
      target_id,
      budget_points,
    });
    
    return c.json({
      ok: true,
      data: promotion[0],
      message: 'تم إنشاء الحملة بنجاح',
    }, 201);
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Get merchant's promotions
 * GET /secure/promotions
 */
export async function getPromotions(c: PromotionContext) {
  try {
    const profileId = c.get('profileId');
    const url = new URL(c.req.url);
    const status = url.searchParams.get('status');
    const promoType = url.searchParams.get('promo_type');
    const limit = url.searchParams.get('limit') || '20';
    const offset = url.searchParams.get('offset') || '0';
    
    // Get merchant
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
        error: 'Merchant not found',
      }, 404);
    }
    
    const merchantId = merchants[0].id;
    
    // Build query
    let query = `${c.env.SUPABASE_URL}/rest/v1/promotions?merchant_id=eq.${merchantId}&select=*,products(name,main_image_url)&order=created_at.desc&limit=${limit}&offset=${offset}`;
    
    if (status) {
      query += `&status=eq.${status}`;
    }
    if (promoType) {
      query += `&promo_type=eq.${promoType}`;
    }
    
    const response = await fetch(query, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return c.json({
        ok: false,
        error: 'Failed to fetch promotions',
      }, response.status as any);
    }
    
    const promotions = await response.json();
    
    return c.json({
      ok: true,
      data: promotions,
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
 * Get single promotion with analytics
 * GET /secure/promotions/:id
 */
export async function getPromotion(c: PromotionContext) {
  try {
    const profileId = c.get('profileId');
    const promotionId = c.req.param('id');
    
    // Get promotion with analytics
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/promotions?id=eq.${promotionId}&select=*,products(name,main_image_url)`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const promotions: any[] = await response.json();
    
    if (!promotions || promotions.length === 0) {
      return c.json({
        ok: false,
        error: 'Promotion not found',
      }, 404);
    }
    
    const promotion = promotions[0];
    
    // Verify ownership - check if merchant_id matches profile
    if (promotion.merchant_id !== profileId) {
      return c.json({
        ok: false,
        error: 'Not authorized',
      }, 403);
    }
    
    // Get analytics summary for this promotion
    const analyticsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/analytics_daily_rollups?promotion_id=eq.${promotionId}&select=date,views,clicks,orders,revenue,ctr,conversion_rate&order=date.desc&limit=30`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const analytics = await analyticsResponse.json();
    
    // Calculate totals
    const totals = (analytics as any[]).reduce((acc, day) => ({
      views: acc.views + (day.views || 0),
      clicks: acc.clicks + (day.clicks || 0),
      orders: acc.orders + (day.orders || 0),
      revenue: acc.revenue + parseFloat(day.revenue || 0),
    }), { views: 0, clicks: 0, orders: 0, revenue: 0 });
    
    return c.json({
      ok: true,
      data: {
        ...promotion,
        analytics: {
          daily: analytics,
          totals,
          avg_ctr: totals.views > 0 ? (totals.clicks / totals.views * 100).toFixed(2) : 0,
          avg_conversion: totals.views > 0 ? (totals.orders / totals.views * 100).toFixed(2) : 0,
        },
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
 * Cancel a promotion
 * POST /secure/promotions/:id/cancel
 */
export async function cancelPromotion(c: PromotionContext) {
  try {
    const profileId = c.get('profileId');
    const promotionId = c.req.param('id');
    
    // Get promotion
    const getResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/promotions?id=eq.${promotionId}&select=*`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const promotions: any[] = await getResponse.json();
    
    if (!promotions || promotions.length === 0) {
      return c.json({
        ok: false,
        error: 'Promotion not found',
      }, 404);
    }
    
    const promotion = promotions[0];
    
    // Verify ownership
    if (promotion.merchant_id !== profileId) {
      return c.json({
        ok: false,
        error: 'Not authorized',
      }, 403);
    }
    
    // Check if can be cancelled
    if (promotion.status === 'expired' || promotion.status === 'cancelled') {
      return c.json({
        ok: false,
        error: 'Cannot cancel',
        message: 'لا يمكن إلغاء حملة منتهية أو ملغية',
      }, 400);
    }
    
    // Update status
    const updateResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/promotions?id=eq.${promotionId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        }),
      }
    );
    
    if (!updateResponse.ok) {
      return c.json({
        ok: false,
        error: 'Failed to cancel promotion',
      }, 500);
    }
    
    // Create audit log
    await createAuditLog(c.env, promotion.merchant_id, profileId, 'promotion_cancel', 'promotion', promotionId, {
      previous_status: promotion.status,
    });
    
    return c.json({
      ok: true,
      message: 'تم إلغاء الحملة بنجاح',
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
 * Helper: Create audit log
 */
async function createAuditLog(
  env: Env,
  merchantId: string,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  meta: any = {}
) {
  try {
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/audit_logs`,
      {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          actor_user_id: actorId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          severity: 'info',
          meta,
        }),
      }
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Get promotion statistics for boost screen
 * GET /secure/promotions/stats
 */
export async function getPromotionStats(c: PromotionContext) {
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
          active_promotions: 0,
          total_promotions: 0,
          total_views: 0,
          total_clicks: 0,
          total_orders: 0,
          total_revenue: 0,
        },
      });
    }
    
    const merchantId = merchants[0].id;
    
    // Get active promotions count
    const activeResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/promotions?merchant_id=eq.${merchantId}&status=eq.active&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact',
        },
      }
    );
    
    const activeCount = parseInt(activeResponse.headers.get('content-range')?.split('/')[1] || '0');
    
    // Get total promotions count
    const totalResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/promotions?merchant_id=eq.${merchantId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact',
        },
      }
    );
    
    const totalCount = parseInt(totalResponse.headers.get('content-range')?.split('/')[1] || '0');
    
    // Get analytics totals for promotions
    const analyticsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/analytics_daily_rollups?merchant_id=eq.${merchantId}&promotion_id=not.is.null&select=views,clicks,orders,revenue`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const analytics: any[] = await analyticsResponse.json();
    
    const totals = analytics.reduce((acc, row) => ({
      views: acc.views + (row.views || 0),
      clicks: acc.clicks + (row.clicks || 0),
      orders: acc.orders + (row.orders || 0),
      revenue: acc.revenue + parseFloat(row.revenue || 0),
    }), { views: 0, clicks: 0, orders: 0, revenue: 0 });
    
    return c.json({
      ok: true,
      data: {
        active_promotions: activeCount,
        total_promotions: totalCount,
        total_views: totals.views,
        total_clicks: totals.clicks,
        total_orders: totals.orders,
        total_revenue: totals.revenue,
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


