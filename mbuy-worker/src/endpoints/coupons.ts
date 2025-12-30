/**
 * Coupons System Endpoints
 * نظام الكوبونات الذكي
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type CouponsContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext & { merchantId?: string } }>;

// ============================================================================
// Get All Coupons
// ============================================================================

export async function getCoupons(c: CouponsContext) {
  try {
    const merchantId = c.get('merchantId') as string;
    
    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }
    
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/coupons?store_id=eq.${merchantId}&order=created_at.desc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const coupons = await response.json();
    
    // Ensure we always return an array
    const data = Array.isArray(coupons) ? coupons : [];
    
    return c.json({
      ok: true,
      data: data,
    });
  } catch (error: any) {
    console.error('Get coupons error:', error);
    return c.json({ ok: false, error: 'فشل في جلب الكوبونات' }, 500);
  }
}

// ============================================================================
// Create Coupon
// ============================================================================

export async function createCoupon(c: CouponsContext) {
  try {
    const merchantId = c.get('merchantId') as string;
    const body = await c.req.json();
    
    const {
      code,
      title,
      title_ar,
      description,
      description_ar,
      discount_type = 'percentage',
      discount_value,
      max_discount,
      min_order_amount = 0,
      usage_limit,
      usage_per_customer = 1,
      starts_at,
      expires_at,
      target_type = 'all',
      smart_type,
      auto_apply = false,
    } = body;
    
    if (!code || !discount_value) {
      return c.json({ ok: false, error: 'الكود وقيمة الخصم مطلوبان' }, 400);
    }
    
    // التحقق من عدم تكرار الكود
    const checkResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/coupons?store_id=eq.${merchantId}&code=eq.${code}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const existing = await checkResponse.json() as any[];
    if (existing && existing.length > 0) {
      return c.json({ ok: false, error: 'كود الكوبون مستخدم بالفعل' }, 400);
    }
    
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/coupons`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          store_id: merchantId,
          code: code.toUpperCase(),
          title: title || code,
          title_ar: title_ar || title || code,
          description,
          description_ar,
          discount_type,
          discount_value,
          max_discount,
          min_order_amount,
          usage_limit,
          usage_per_customer,
          starts_at: starts_at || new Date().toISOString(),
          expires_at,
          target_type,
          smart_type,
          auto_apply,
          is_active: true,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    const coupons = await response.json();
    
    return c.json({
      ok: true,
      data: coupons[0],
      message: 'تم إنشاء الكوبون بنجاح',
    });
  } catch (error: any) {
    console.error('Create coupon error:', error);
    return c.json({ ok: false, error: 'فشل في إنشاء الكوبون' }, 500);
  }
}

// ============================================================================
// Update Coupon
// ============================================================================

export async function updateCoupon(c: CouponsContext) {
  try {
    const merchantId = c.get('merchantId') as string;
    const couponId = c.req.param('id');
    const body = await c.req.json();
    
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/coupons?id=eq.${couponId}&store_id=eq.${merchantId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          ...body,
          updated_at: new Date().toISOString(),
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to update coupon');
    }
    
    const coupons = await response.json();
    
    return c.json({
      ok: true,
      data: coupons[0],
      message: 'تم تحديث الكوبون بنجاح',
    });
  } catch (error: any) {
    console.error('Update coupon error:', error);
    return c.json({ ok: false, error: 'فشل في تحديث الكوبون' }, 500);
  }
}

// ============================================================================
// Delete Coupon
// ============================================================================

export async function deleteCoupon(c: CouponsContext) {
  try {
    const merchantId = c.get('merchantId') as string;
    const couponId = c.req.param('id');
    
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/coupons?id=eq.${couponId}&store_id=eq.${merchantId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to delete coupon');
    }
    
    return c.json({
      ok: true,
      message: 'تم حذف الكوبون بنجاح',
    });
  } catch (error: any) {
    console.error('Delete coupon error:', error);
    return c.json({ ok: false, error: 'فشل في حذف الكوبون' }, 500);
  }
}

// ============================================================================
// Validate Coupon (Public endpoint for customers)
// ============================================================================

export async function validateCoupon(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json();
    const { code, store_id, customer_id, order_total } = body;
    
    if (!code || !store_id) {
      return c.json({ ok: false, valid: false, error: 'الكود والمتجر مطلوبان' }, 400);
    }
    
    // جلب الكوبون
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/coupons?code=eq.${code.toUpperCase()}&store_id=eq.${store_id}&is_active=eq.true`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const coupons: any[] = await response.json();
    
    if (!coupons || coupons.length === 0) {
      return c.json({ ok: true, valid: false, error: 'الكوبون غير صالح' });
    }
    
    const coupon = coupons[0];
    
    // التحقق من تاريخ الانتهاء
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return c.json({ ok: true, valid: false, error: 'الكوبون منتهي الصلاحية' });
    }
    
    // التحقق من تاريخ البداية
    if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
      return c.json({ ok: true, valid: false, error: 'الكوبون لم يبدأ بعد' });
    }
    
    // التحقق من عدد الاستخدامات الكلي
    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      return c.json({ ok: true, valid: false, error: 'تم استنفاذ عدد استخدامات الكوبون' });
    }
    
    // التحقق من الحد الأدنى للطلب
    if (order_total && coupon.min_order_amount > order_total) {
      return c.json({ 
        ok: true, 
        valid: false, 
        error: `الحد الأدنى للطلب ${coupon.min_order_amount} ر.س` 
      });
    }
    
    // التحقق من استخدام العميل
    if (customer_id && coupon.usage_per_customer) {
      const usesResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/coupon_uses?coupon_id=eq.${coupon.id}&customer_id=eq.${customer_id}`,
        {
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact',
          },
        }
      );
      
      const count = parseInt(usesResponse.headers.get('content-range')?.split('/')[1] || '0');
      if (count >= coupon.usage_per_customer) {
        return c.json({ ok: true, valid: false, error: 'لقد استخدمت هذا الكوبون من قبل' });
      }
    }
    
    // حساب الخصم
    let discountAmount = 0;
    if (order_total) {
      if (coupon.discount_type === 'percentage') {
        discountAmount = (order_total * coupon.discount_value) / 100;
        if (coupon.max_discount && discountAmount > coupon.max_discount) {
          discountAmount = coupon.max_discount;
        }
      } else if (coupon.discount_type === 'fixed') {
        discountAmount = coupon.discount_value;
      }
    }
    
    return c.json({
      ok: true,
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        title_ar: coupon.title_ar,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount: coupon.max_discount,
        min_order_amount: coupon.min_order_amount,
      },
      discount_amount: discountAmount,
    });
  } catch (error: any) {
    console.error('Validate coupon error:', error);
    return c.json({ ok: false, valid: false, error: 'فشل في التحقق من الكوبون' }, 500);
  }
}

// ============================================================================
// Apply Coupon (Record usage)
// ============================================================================

export async function applyCoupon(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json();
    const { coupon_id, store_id, customer_id, order_id, discount_applied, order_total } = body;
    
    if (!coupon_id || !store_id || !discount_applied || !order_total) {
      return c.json({ ok: false, error: 'بيانات ناقصة' }, 400);
    }
    
    // تسجيل الاستخدام
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/coupon_uses`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coupon_id,
          store_id,
          customer_id,
          order_id,
          discount_applied,
          order_total,
        }),
      }
    );
    
    // تحديث عداد الاستخدام
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/rpc/increment_coupon_usage`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coupon_id }),
      }
    );
    
    return c.json({
      ok: true,
      message: 'تم تطبيق الكوبون بنجاح',
    });
  } catch (error: any) {
    console.error('Apply coupon error:', error);
    return c.json({ ok: false, error: 'فشل في تطبيق الكوبون' }, 500);
  }
}

// ============================================================================
// Get Coupon Statistics
// ============================================================================

export async function getCouponStats(c: CouponsContext) {
  try {
    const merchantId = c.get('merchantId') as string;
    const couponId = c.req.param('id');
    
    // إحصائيات الاستخدام
    const usesResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/coupon_uses?coupon_id=eq.${couponId}&store_id=eq.${merchantId}&select=discount_applied,order_total,created_at`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const uses: any[] = await usesResponse.json();
    
    const stats = {
      total_uses: uses.length,
      total_discount: uses.reduce((sum, u) => sum + (u.discount_applied || 0), 0),
      total_orders_value: uses.reduce((sum, u) => sum + (u.order_total || 0), 0),
      average_order_value: uses.length > 0 
        ? uses.reduce((sum, u) => sum + (u.order_total || 0), 0) / uses.length 
        : 0,
    };
    
    return c.json({
      ok: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Get coupon stats error:', error);
    return c.json({ ok: false, error: 'فشل في جلب الإحصائيات' }, 500);
  }
}

// ============================================================================
// Create Smart Coupon (Auto-generated)
// ============================================================================

export async function createSmartCoupon(c: CouponsContext) {
  try {
    const merchantId = c.get('merchantId') as string;
    const body = await c.req.json();
    const { smart_type, discount_value = 10 } = body;
    
    const smartConfigs: Record<string, any> = {
      first_order: {
        code_prefix: 'WELCOME',
        title: 'Welcome Discount',
        title_ar: 'خصم الترحيب',
        description_ar: 'خصم خاص للعملاء الجدد',
        target_type: 'new_customers',
        usage_per_customer: 1,
      },
      abandoned_cart: {
        code_prefix: 'COMEBACK',
        title: 'Come Back Discount',
        title_ar: 'خصم العودة',
        description_ar: 'لا تفوت فرصتك! أكمل طلبك الآن',
        target_type: 'all',
        usage_per_customer: 1,
        expires_hours: 24,
      },
      win_back: {
        code_prefix: 'MISSYOU',
        title: 'We Miss You',
        title_ar: 'اشتقنا لك',
        description_ar: 'خصم خاص للعملاء الذين لم يشتروا منذ فترة',
        target_type: 'returning',
        usage_per_customer: 1,
      },
      social_share: {
        code_prefix: 'SHARE',
        title: 'Social Share Discount',
        title_ar: 'خصم المشاركة',
        description_ar: 'شارك وأحصل على خصم',
        target_type: 'all',
        usage_per_customer: 1,
      },
    };
    
    const config = smartConfigs[smart_type];
    if (!config) {
      return c.json({ ok: false, error: 'نوع الكوبون الذكي غير معروف' }, 400);
    }
    
    const code = config.code_prefix + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    let expires_at = null;
    if (config.expires_hours) {
      const date = new Date();
      date.setHours(date.getHours() + config.expires_hours);
      expires_at = date.toISOString();
    }
    
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/coupons`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          store_id: merchantId,
          code,
          title: config.title,
          title_ar: config.title_ar,
          description_ar: config.description_ar,
          discount_type: 'percentage',
          discount_value,
          target_type: config.target_type,
          smart_type,
          usage_per_customer: config.usage_per_customer,
          expires_at,
          is_active: true,
          auto_apply: smart_type === 'abandoned_cart',
        }),
      }
    );
    
    const coupons = await response.json();
    
    return c.json({
      ok: true,
      data: coupons[0],
      message: 'تم إنشاء الكوبون الذكي بنجاح',
    });
  } catch (error: any) {
    console.error('Create smart coupon error:', error);
    return c.json({ ok: false, error: 'فشل في إنشاء الكوبون الذكي' }, 500);
  }
}


