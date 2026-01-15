/**
 * Boost System Endpoints
 * نظام دعم الظهور للمنتجات والمتاجر
 * 
 * Boost Types:
 * - featured: ظهور في قسم المميز
 * - category_top: ظهور في أعلى الفئة
 * - search_top: ظهور في أعلى نتائج البحث
 * - home_banner: بانر في الصفحة الرئيسية
 * - media_for_you: ظهور في "لك" للميديا
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type BoostContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

// Boost pricing configuration
const BOOST_PRICING = {
  product: {
    featured: { points_per_day: 50, min_days: 1, max_days: 30 },
    category_top: { points_per_day: 30, min_days: 1, max_days: 30 },
    search_top: { points_per_day: 40, min_days: 1, max_days: 30 },
  },
  store: {
    featured: { points_per_day: 100, min_days: 7, max_days: 30 },
    home_banner: { points_per_day: 200, min_days: 7, max_days: 30 },
  },
  media: {
    media_for_you: { points_per_day: 20, min_days: 1, max_days: 14 },
  },
};

/**
 * Get boost pricing info
 * GET /secure/boost/pricing
 */
export async function getBoostPricing(c: BoostContext) {
  return c.json({
    ok: true,
    data: BOOST_PRICING,
  });
}

/**
 * Get merchant's active boosts
 * GET /secure/boost/active
 */
export async function getActiveBoosts(c: BoostContext) {
  try {
    const profileId = c.get('profileId');
    
    // Get merchant ID
    const merchantRes = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return c.json({ ok: true, data: [] });
    }
    
    const merchantId = merchants[0].id;
    
    // Get active boosts
    const boostsRes = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/boost_transactions?merchant_id=eq.${merchantId}&status=eq.active&order=expires_at.asc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const boosts: any[] = await boostsRes.json();
    
    return c.json({
      ok: true,
      data: boosts || [],
    });
    
  } catch (error: any) {
    console.error('Get active boosts error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ في جلب بيانات الدعم',
    }, 500);
  }
}

/**
 * Get boost history
 * GET /secure/boost/history
 */
export async function getBoostHistory(c: BoostContext) {
  try {
    const profileId = c.get('profileId');
    const url = new URL(c.req.url);
    const limit = url.searchParams.get('limit') || '20';
    const offset = url.searchParams.get('offset') || '0';
    
    // Get merchant ID
    const merchantRes = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return c.json({ ok: true, data: [], total: 0 });
    }
    
    const merchantId = merchants[0].id;
    
    // Get boost history with count
    const [boostsRes, countRes] = await Promise.all([
      fetch(
        `${c.env.SUPABASE_URL}/rest/v1/boost_transactions?merchant_id=eq.${merchantId}&order=created_at.desc&limit=${limit}&offset=${offset}`,
        {
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      ),
      fetch(
        `${c.env.SUPABASE_URL}/rest/v1/boost_transactions?merchant_id=eq.${merchantId}&select=count`,
        {
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact',
          },
        }
      ),
    ]);
    
    const boosts: any[] = await boostsRes.json();
    const countHeader = countRes.headers.get('content-range');
    const total = countHeader ? parseInt(countHeader.split('/')[1] || '0') : 0;
    
    return c.json({
      ok: true,
      data: boosts || [],
      total,
    });
    
  } catch (error: any) {
    console.error('Get boost history error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ في جلب سجل الدعم',
    }, 500);
  }
}

/**
 * Purchase boost for a product
 * POST /secure/boost/product
 */
export async function purchaseProductBoost(c: BoostContext) {
  try {
    const profileId = c.get('profileId');
    const body = await c.req.json();
    
    const { product_id, boost_type, duration_days } = body;
    
    // Validate inputs
    if (!product_id || !boost_type || !duration_days) {
      return c.json({
        ok: false,
        error: 'MISSING_FIELDS',
        message: 'يرجى تحديد المنتج ونوع الدعم والمدة',
      }, 400);
    }
    
    // Validate boost type
    const pricing = BOOST_PRICING.product[boost_type as keyof typeof BOOST_PRICING.product];
    if (!pricing) {
      return c.json({
        ok: false,
        error: 'INVALID_BOOST_TYPE',
        message: 'نوع الدعم غير صالح',
      }, 400);
    }
    
    // Validate duration
    if (duration_days < pricing.min_days || duration_days > pricing.max_days) {
      return c.json({
        ok: false,
        error: 'INVALID_DURATION',
        message: `المدة يجب أن تكون بين ${pricing.min_days} و ${pricing.max_days} يوم`,
      }, 400);
    }
    
    // Calculate total points
    const totalPoints = pricing.points_per_day * duration_days;
    
    // Get merchant
    const merchantRes = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id,points_balance`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return c.json({
        ok: false,
        error: 'NOT_MERCHANT',
        message: 'يجب أن تكون تاجراً لاستخدام هذه الخدمة',
      }, 403);
    }
    
    const merchant = merchants[0];
    
    // Check points balance
    if ((merchant.points_balance || 0) < totalPoints) {
      return c.json({
        ok: false,
        error: 'INSUFFICIENT_POINTS',
        message: `رصيد النقاط غير كافٍ. المطلوب: ${totalPoints}، المتوفر: ${merchant.points_balance || 0}`,
      }, 400);
    }
    
    // Verify product belongs to merchant
    const productRes = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${product_id}&store_id=eq.${merchant.id}&select=id,name`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const products: any[] = await productRes.json();
    if (!products || products.length === 0) {
      return c.json({
        ok: false,
        error: 'PRODUCT_NOT_FOUND',
        message: 'المنتج غير موجود أو لا يخصك',
      }, 404);
    }
    
    // Check if product already has active boost of same type
    const existingBoostRes = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/boost_transactions?merchant_id=eq.${merchant.id}&target_type=eq.product&target_id=eq.${product_id}&boost_type=eq.${boost_type}&status=eq.active`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const existingBoosts: any[] = await existingBoostRes.json();
    if (existingBoosts && existingBoosts.length > 0) {
      return c.json({
        ok: false,
        error: 'BOOST_EXISTS',
        message: 'هذا المنتج لديه دعم نشط من نفس النوع',
      }, 400);
    }
    
    // Calculate dates
    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration_days);
    
    // Create boost transaction
    const boostRes = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/boost_transactions`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          merchant_id: merchant.id,
          target_type: 'product',
          target_id: product_id,
          boost_type,
          points_spent: totalPoints,
          duration_days,
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'active',
        }),
      }
    );
    
    if (!boostRes.ok) {
      throw new Error('Failed to create boost transaction');
    }
    
    const boostData: any[] = await boostRes.json();
    
    // Update product boost columns
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${product_id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boost_points: totalPoints,
          boost_type,
          boost_expires_at: expiresAt.toISOString(),
        }),
      }
    );
    
    // Deduct points from merchant
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${merchant.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points_balance: (merchant.points_balance || 0) - totalPoints,
        }),
      }
    );
    
    return c.json({
      ok: true,
      data: boostData[0],
      message: `تم تفعيل دعم الظهور للمنتج لمدة ${duration_days} يوم`,
    });
    
  } catch (error: any) {
    console.error('Purchase product boost error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ في شراء الدعم',
    }, 500);
  }
}

/**
 * Purchase boost for store
 * POST /secure/boost/store
 */
export async function purchaseStoreBoost(c: BoostContext) {
  try {
    const profileId = c.get('profileId');
    const body = await c.req.json();
    
    const { boost_type, duration_days } = body;
    
    // Validate inputs
    if (!boost_type || !duration_days) {
      return c.json({
        ok: false,
        error: 'MISSING_FIELDS',
        message: 'يرجى تحديد نوع الدعم والمدة',
      }, 400);
    }
    
    // Validate boost type
    const pricing = BOOST_PRICING.store[boost_type as keyof typeof BOOST_PRICING.store];
    if (!pricing) {
      return c.json({
        ok: false,
        error: 'INVALID_BOOST_TYPE',
        message: 'نوع الدعم غير صالح',
      }, 400);
    }
    
    // Validate duration
    if (duration_days < pricing.min_days || duration_days > pricing.max_days) {
      return c.json({
        ok: false,
        error: 'INVALID_DURATION',
        message: `المدة يجب أن تكون بين ${pricing.min_days} و ${pricing.max_days} يوم`,
      }, 400);
    }
    
    // Calculate total points
    const totalPoints = pricing.points_per_day * duration_days;
    
    // Get merchant
    const merchantRes = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id,points_balance,business_name`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return c.json({
        ok: false,
        error: 'NOT_MERCHANT',
        message: 'يجب أن تكون تاجراً لاستخدام هذه الخدمة',
      }, 403);
    }
    
    const merchant = merchants[0];
    
    // Check points balance
    if ((merchant.points_balance || 0) < totalPoints) {
      return c.json({
        ok: false,
        error: 'INSUFFICIENT_POINTS',
        message: `رصيد النقاط غير كافٍ. المطلوب: ${totalPoints}، المتوفر: ${merchant.points_balance || 0}`,
      }, 400);
    }
    
    // Check if store already has active boost of same type
    const existingBoostRes = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/boost_transactions?merchant_id=eq.${merchant.id}&target_type=eq.store&target_id=eq.${merchant.id}&boost_type=eq.${boost_type}&status=eq.active`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const existingBoosts: any[] = await existingBoostRes.json();
    if (existingBoosts && existingBoosts.length > 0) {
      return c.json({
        ok: false,
        error: 'BOOST_EXISTS',
        message: 'متجرك لديه دعم نشط من نفس النوع',
      }, 400);
    }
    
    // Calculate dates
    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration_days);
    
    // Create boost transaction
    const boostRes = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/boost_transactions`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          merchant_id: merchant.id,
          target_type: 'store',
          target_id: merchant.id,
          boost_type,
          points_spent: totalPoints,
          duration_days,
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'active',
        }),
      }
    );
    
    if (!boostRes.ok) {
      throw new Error('Failed to create boost transaction');
    }
    
    const boostData: any[] = await boostRes.json();
    
    // Update merchant boost columns
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${merchant.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points_balance: (merchant.points_balance || 0) - totalPoints,
          boost_points: totalPoints,
          boost_type,
          boost_expires_at: expiresAt.toISOString(),
        }),
      }
    );
    
    return c.json({
      ok: true,
      data: boostData[0],
      message: `تم تفعيل دعم الظهور للمتجر لمدة ${duration_days} يوم`,
    });
    
  } catch (error: any) {
    console.error('Purchase store boost error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ في شراء الدعم',
    }, 500);
  }
}

/**
 * Cancel active boost
 * POST /secure/boost/cancel
 */
export async function cancelBoost(c: BoostContext) {
  try {
    const profileId = c.get('profileId');
    const body = await c.req.json();
    
    const { boost_id } = body;
    
    if (!boost_id) {
      return c.json({
        ok: false,
        error: 'MISSING_FIELDS',
        message: 'يرجى تحديد رقم الدعم',
      }, 400);
    }
    
    // Get merchant
    const merchantRes = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return c.json({
        ok: false,
        error: 'NOT_MERCHANT',
        message: 'يجب أن تكون تاجراً لاستخدام هذه الخدمة',
      }, 403);
    }
    
    const merchantId = merchants[0].id;
    
    // Get the boost transaction
    const boostRes = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/boost_transactions?id=eq.${boost_id}&merchant_id=eq.${merchantId}&status=eq.active`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const boosts: any[] = await boostRes.json();
    if (!boosts || boosts.length === 0) {
      return c.json({
        ok: false,
        error: 'BOOST_NOT_FOUND',
        message: 'الدعم غير موجود أو غير نشط',
      }, 404);
    }
    
    const boost = boosts[0];
    
    // Calculate refund (50% of remaining days)
    const now = new Date();
    const expiresAt = new Date(boost.expires_at);
    const startsAt = new Date(boost.starts_at);
    const totalDays = boost.duration_days;
    const elapsedMs = now.getTime() - startsAt.getTime();
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    const refundPoints = Math.floor((boost.points_spent / totalDays) * remainingDays * 0.5);
    
    // Cancel the boost
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/boost_transactions?id=eq.${boost_id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
        }),
      }
    );
    
    // Remove boost from target
    if (boost.target_type === 'product') {
      await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${boost.target_id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            boost_points: 0,
            boost_type: null,
            boost_expires_at: null,
          }),
        }
      );
    } else if (boost.target_type === 'store') {
      // Only clear boost columns, don't change points_balance yet
      await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${merchantId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            boost_points: 0,
            boost_type: null,
            boost_expires_at: null,
          }),
        }
      );
    }
    
    // Refund points
    if (refundPoints > 0) {
      const currentMerchant = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${merchantId}&select=points_balance`,
        {
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const merchantData: any[] = await currentMerchant.json();
      const currentBalance = merchantData[0]?.points_balance || 0;
      
      await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${merchantId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            points_balance: currentBalance + refundPoints,
          }),
        }
      );
    }
    
    return c.json({
      ok: true,
      data: {
        cancelled: true,
        refund_points: refundPoints,
        remaining_days: remainingDays,
      },
      message: refundPoints > 0 
        ? `تم إلغاء الدعم واسترداد ${refundPoints} نقطة`
        : 'تم إلغاء الدعم',
    });
    
  } catch (error: any) {
    console.error('Cancel boost error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ في إلغاء الدعم',
    }, 500);
  }
}

/**
 * Get boosted products for public display
 * GET /public/boosted-products
 */
export async function getBoostedProducts(c: Context<{ Bindings: Env }>) {
  try {
    const url = new URL(c.req.url);
    const boostType = url.searchParams.get('type') || 'featured';
    const categoryId = url.searchParams.get('category_id');
    const limit = url.searchParams.get('limit') || '20';
    
    let query = `${c.env.SUPABASE_URL}/rest/v1/products?boost_type=eq.${boostType}&boost_expires_at=gt.${new Date().toISOString()}&select=id,name,price,images,store_id,boost_points&order=boost_points.desc&limit=${limit}`;
    
    if (categoryId) {
      query += `&platform_category_id=eq.${categoryId}`;
    }
    
    const response = await fetch(query, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    const products: any[] = await response.json();
    
    return c.json({
      ok: true,
      data: products || [],
    });
    
  } catch (error: any) {
    console.error('Get boosted products error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ في جلب المنتجات',
    }, 500);
  }
}

/**
 * Get boosted stores for public display
 * GET /public/boosted-stores
 */
export async function getBoostedStores(c: Context<{ Bindings: Env }>) {
  try {
    const url = new URL(c.req.url);
    const boostType = url.searchParams.get('type') || 'featured';
    const limit = url.searchParams.get('limit') || '10';
    
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?boost_type=eq.${boostType}&boost_expires_at=gt.${new Date().toISOString()}&select=id,business_name,logo_url,boost_points&order=boost_points.desc&limit=${limit}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const stores: any[] = await response.json();
    
    return c.json({
      ok: true,
      data: stores || [],
    });
    
  } catch (error: any) {
    console.error('Get boosted stores error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ في جلب المتاجر',
    }, 500);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Admin: Get all boost transactions
 * GET /admin/api/boosts
 */
export async function adminListBoosts(c: Context<{ Bindings: Env }>) {
  try {
    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status');
    const targetType = url.searchParams.get('target_type');
    const offset = (page - 1) * limit;
    
    let query = `${c.env.SUPABASE_URL}/rest/v1/boost_transactions?select=*,merchants(business_name)&order=created_at.desc&limit=${limit}&offset=${offset}`;
    
    if (status) query += `&status=eq.${status}`;
    if (targetType) query += `&target_type=eq.${targetType}`;
    
    const [dataRes, countRes] = await Promise.all([
      fetch(query, {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }),
      fetch(
        `${c.env.SUPABASE_URL}/rest/v1/boost_transactions?select=count${status ? `&status=eq.${status}` : ''}${targetType ? `&target_type=eq.${targetType}` : ''}`,
        {
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact',
          },
        }
      ),
    ]);
    
    const data: any[] = await dataRes.json();
    const countHeader = countRes.headers.get('content-range');
    const total = countHeader ? parseInt(countHeader.split('/')[1] || '0') : 0;
    
    return c.json({
      ok: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
    
  } catch (error: any) {
    console.error('Admin list boosts error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ في جلب البيانات',
    }, 500);
  }
}

/**
 * Admin: Get boost statistics
 * GET /admin/api/boosts/stats
 */
export async function adminBoostStats(c: Context<{ Bindings: Env }>) {
  try {
    const [activeRes, totalRes, revenueRes] = await Promise.all([
      // Active boosts count
      fetch(
        `${c.env.SUPABASE_URL}/rest/v1/boost_transactions?status=eq.active&select=count`,
        {
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact',
          },
        }
      ),
      // Total boosts count
      fetch(
        `${c.env.SUPABASE_URL}/rest/v1/boost_transactions?select=count`,
        {
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact',
          },
        }
      ),
      // Total points spent (revenue)
      fetch(
        `${c.env.SUPABASE_URL}/rest/v1/boost_transactions?select=points_spent`,
        {
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      ),
    ]);
    
    const activeCount = parseInt(activeRes.headers.get('content-range')?.split('/')[1] || '0');
    const totalCount = parseInt(totalRes.headers.get('content-range')?.split('/')[1] || '0');
    const revenueData: any[] = await revenueRes.json();
    const totalRevenue = revenueData.reduce((sum, item) => sum + (item.points_spent || 0), 0);
    
    return c.json({
      ok: true,
      data: {
        active_boosts: activeCount,
        total_boosts: totalCount,
        total_points_spent: totalRevenue,
      },
    });
    
  } catch (error: any) {
    console.error('Admin boost stats error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ في جلب الإحصائيات',
    }, 500);
  }
}

/**
 * Admin: Cancel any boost
 * POST /admin/api/boosts/:id/cancel
 */
export async function adminCancelBoost(c: Context<{ Bindings: Env }>) {
  try {
    const boostId = c.req.param('id');
    
    // Get the boost
    const boostRes = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/boost_transactions?id=eq.${boostId}&status=eq.active`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const boosts: any[] = await boostRes.json();
    if (!boosts || boosts.length === 0) {
      return c.json({
        ok: false,
        error: 'NOT_FOUND',
        message: 'الدعم غير موجود أو غير نشط',
      }, 404);
    }
    
    const boost = boosts[0];
    
    // Cancel the boost
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/boost_transactions?id=eq.${boostId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
        }),
      }
    );
    
    // Remove boost from target
    if (boost.target_type === 'product') {
      await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/products?id=eq.${boost.target_id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            boost_points: 0,
            boost_type: null,
            boost_expires_at: null,
          }),
        }
      );
    } else if (boost.target_type === 'store') {
      await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${boost.merchant_id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            boost_points: 0,
            boost_type: null,
            boost_expires_at: null,
          }),
        }
      );
    }
    
    return c.json({
      ok: true,
      message: 'تم إلغاء الدعم بنجاح',
    });
    
  } catch (error: any) {
    console.error('Admin cancel boost error:', error);
    return c.json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ في إلغاء الدعم',
    }, 500);
  }
}
