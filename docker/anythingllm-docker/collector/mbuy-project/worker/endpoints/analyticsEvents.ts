/**
 * Analytics Events & Ranking Engine
 * Handles event tracking and applies PIN/BOOST to all lists
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type AnalyticsContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;
type PublicContext = Context<{ Bindings: Env }>;

/**
 * Track an analytics event
 * POST /track (public, no auth required)
 */
export async function trackEvent(c: PublicContext) {
  try {
    const body = await c.req.json();
    
    const {
      store_id,
      product_id,
      user_id,
      event_type,
      meta,
    } = body;
    
    if (!store_id || !event_type) {
      return c.json({
        ok: false,
        error: 'store_id and event_type are required',
      }, 400);
    }
    
    // Validate event_type
    const validEventTypes = [
      'view_store', 'view_product', 'search_impression', 'click',
      'add_to_cart', 'remove_from_cart', 'checkout', 'order_paid',
      'order_cancelled', 'share', 'follow', 'unfollow'
    ];
    
    if (!validEventTypes.includes(event_type)) {
      return c.json({
        ok: false,
        error: 'Invalid event_type',
      }, 400);
    }
    
    // Find active promotion for this target
    let promotionId: string | null = null;
    
    if (product_id) {
      // Check for product-level promotion
      const promoResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/promotions?target_type=eq.product&target_id=eq.${product_id}&status=eq.active&select=id&limit=1`,
        {
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const promos: any[] = await promoResponse.json();
      if (promos && promos.length > 0) {
        promotionId = promos[0].id;
      }
    }
    
    // If no product promotion, check for store promotion
    if (!promotionId) {
      const storePromoResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/promotions?store_id=eq.${store_id}&target_type=eq.store&status=eq.active&select=id&limit=1`,
        {
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const storePromos: any[] = await storePromoResponse.json();
      if (storePromos && storePromos.length > 0) {
        promotionId = storePromos[0].id;
      }
    }
    
    // Insert event
    const eventResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/analytics_events`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_id,
          product_id: product_id || null,
          user_id: user_id || null,
          event_type,
          source: 'app',
          promotion_id: promotionId,
          meta: {
            ...meta,
            user_agent: c.req.header('user-agent'),
            ip: c.req.header('cf-connecting-ip'),
          },
        }),
      }
    );
    
    if (!eventResponse.ok) {
      console.error('Failed to track event:', await eventResponse.text());
      // Don't fail the request, just log
    }
    
    return c.json({
      ok: true,
      tracked: true,
    });
    
  } catch (error: any) {
    console.error('Track event error:', error);
    return c.json({
      ok: true, // Don't fail client requests
      tracked: false,
    });
  }
}

/**
 * Ranking Engine - Apply PIN/BOOST to product lists
 * Used internally by product endpoints
 */
export async function applyRanking(
  env: Env,
  items: any[],
  itemType: 'product' | 'store',
  options: {
    maxPinned?: number;
    boostMultiplier?: number;
  } = {}
): Promise<any[]> {
  const { maxPinned = 3, boostMultiplier = 1.5 } = options;
  
  if (!items || items.length === 0) return items;
  
  try {
    // Get IDs
    const ids = items.map(item => item.id);
    
    // Get active promotions for these items
    let promotionsQuery: string;
    
    if (itemType === 'product') {
      // Get promotions for products + their store promotions
      const merchantIds = [...new Set(items.map(item => item.store_id))];
      promotionsQuery = `${env.SUPABASE_URL}/rest/v1/promotions?status=eq.active&or=(and(target_type.eq.product,target_id.in.(${ids.join(',')})),and(target_type.eq.store,store_id.in.(${merchantIds.join(',')})))&select=id,target_type,target_id,store_id,promo_type,weight`;
    } else {
      // Get promotions for stores
      promotionsQuery = `${env.SUPABASE_URL}/rest/v1/promotions?status=eq.active&target_type=eq.store&store_id=in.(${ids.join(',')})&select=id,target_type,store_id,promo_type,weight`;
    }
    
    const promoResponse = await fetch(promotionsQuery, {
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    const promotions: any[] = await promoResponse.json();
    
    if (!promotions || promotions.length === 0) {
      return items;
    }
    
    // Build promotion map
    const promoMap: Map<string, { type: 'pin' | 'boost'; weight: number; promotionId: string }> = new Map();
    
    for (const promo of promotions) {
      const targetId = promo.target_type === 'product' ? promo.target_id : promo.store_id;
      const existingPromo = promoMap.get(targetId);
      
      // PIN takes priority over BOOST
      if (!existingPromo || (promo.promo_type === 'pin' && existingPromo.type !== 'pin')) {
        promoMap.set(targetId, {
          type: promo.promo_type,
          weight: promo.weight || 1,
          promotionId: promo.id,
        });
      }
    }
    
    // Apply ranking
    const pinnedItems: any[] = [];
    const boostedItems: any[] = [];
    const normalItems: any[] = [];
    
    for (const item of items) {
      const itemId = itemType === 'product' ? item.id : item.id;
      const merchantId = itemType === 'product' ? item.store_id : item.id;
      
      // Check for direct item promotion or store promotion
      const promo = promoMap.get(itemId) || promoMap.get(merchantId);
      
      if (promo) {
        item._promotion = {
          id: promo.promotionId,
          type: promo.type,
        };
        
        if (promo.type === 'pin') {
          pinnedItems.push(item);
        } else {
          item._boostScore = promo.weight * boostMultiplier;
          boostedItems.push(item);
        }
      } else {
        normalItems.push(item);
      }
    }
    
    // Sort boosted items by score
    boostedItems.sort((a, b) => (b._boostScore || 0) - (a._boostScore || 0));
    
    // Combine: pinned (limited) + boosted + normal
    const result = [
      ...pinnedItems.slice(0, maxPinned),
      ...boostedItems,
      ...normalItems,
      ...pinnedItems.slice(maxPinned), // Overflow pinned go after
    ];
    
    // Clean up internal properties
    for (const item of result) {
      delete item._boostScore;
    }
    
    return result;
    
  } catch (error) {
    console.error('Ranking engine error:', error);
    return items; // Return original on error
  }
}

/**
 * Get analytics summary for merchant dashboard
 * GET /secure/analytics/summary
 */
export async function getAnalyticsSummary(c: AnalyticsContext) {
  try {
    const profileId = c.get('profileId');
    const url = new URL(c.req.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
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
          period_days: days,
          total_views: 0,
          total_clicks: 0,
          total_orders: 0,
          total_revenue: 0,
          daily: [],
        },
      });
    }
    
    const merchantId = merchants[0].id;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get daily rollups
    const rollupResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/analytics_daily_rollups?store_id=eq.${merchantId}&date=gte.${startDate.toISOString().split('T')[0]}&select=date,views,clicks,orders,revenue,ctr,conversion_rate&order=date.asc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const rollups: any[] = await rollupResponse.json();
    
    // Aggregate by date (sum product-level rollups)
    const dailyMap = new Map<string, any>();
    
    for (const row of rollups) {
      const existing = dailyMap.get(row.date);
      if (existing) {
        existing.views += row.views || 0;
        existing.clicks += row.clicks || 0;
        existing.orders += row.orders || 0;
        existing.revenue += parseFloat(row.revenue || 0);
      } else {
        dailyMap.set(row.date, {
          date: row.date,
          views: row.views || 0,
          clicks: row.clicks || 0,
          orders: row.orders || 0,
          revenue: parseFloat(row.revenue || 0),
        });
      }
    }
    
    const daily = Array.from(dailyMap.values());
    
    // Calculate totals
    const totals = daily.reduce((acc, day) => ({
      views: acc.views + day.views,
      clicks: acc.clicks + day.clicks,
      orders: acc.orders + day.orders,
      revenue: acc.revenue + day.revenue,
    }), { views: 0, clicks: 0, orders: 0, revenue: 0 });
    
    return c.json({
      ok: true,
      data: {
        period_days: days,
        total_views: totals.views,
        total_clicks: totals.clicks,
        total_orders: totals.orders,
        total_revenue: totals.revenue,
        avg_ctr: totals.views > 0 ? ((totals.clicks / totals.views) * 100).toFixed(2) : 0,
        avg_conversion: totals.views > 0 ? ((totals.orders / totals.views) * 100).toFixed(2) : 0,
        daily,
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
 * Get top products by views/sales
 * GET /secure/analytics/top-products
 */
export async function getTopProducts(c: AnalyticsContext) {
  try {
    const profileId = c.get('profileId');
    const url = new URL(c.req.url);
    const metric = url.searchParams.get('metric') || 'views'; // views, clicks, orders, revenue
    const days = parseInt(url.searchParams.get('days') || '30');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
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
      });
    }
    
    const merchantId = merchants[0].id;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get aggregated product analytics
    const rollupResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/analytics_daily_rollups?store_id=eq.${merchantId}&date=gte.${startDate.toISOString().split('T')[0]}&product_id=not.is.null&select=product_id,views,clicks,orders,revenue`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const rollups: any[] = await rollupResponse.json();
    
    // Aggregate by product
    const productMap = new Map<string, any>();
    
    for (const row of rollups) {
      const existing = productMap.get(row.product_id);
      if (existing) {
        existing.views += row.views || 0;
        existing.clicks += row.clicks || 0;
        existing.orders += row.orders || 0;
        existing.revenue += parseFloat(row.revenue || 0);
      } else {
        productMap.set(row.product_id, {
          product_id: row.product_id,
          views: row.views || 0,
          clicks: row.clicks || 0,
          orders: row.orders || 0,
          revenue: parseFloat(row.revenue || 0),
        });
      }
    }
    
    // Sort by metric and limit
    let products = Array.from(productMap.values());
    products.sort((a, b) => b[metric] - a[metric]);
    products = products.slice(0, limit);
    
    // Get product details
    if (products.length > 0) {
      const productIds = products.map(p => p.product_id);
      const productsResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/products?id=in.(${productIds.join(',')})&select=id,name,main_image_url,price`,
        {
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const productDetails: any[] = await productsResponse.json();
      const detailsMap = new Map(productDetails.map(p => [p.id, p]));
      
      products = products.map(p => ({
        ...p,
        product: detailsMap.get(p.product_id),
      }));
    }
    
    return c.json({
      ok: true,
      data: products,
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}


