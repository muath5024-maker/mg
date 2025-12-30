/**
 * Subscriptions System Endpoints
 * Manages merchant subscriptions and plans
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type SubscriptionContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

// Plan configurations
const PLANS: Record<string, any> = {
  starter: {
    id: 'starter',
    name: 'باقة البداية',
    name_en: 'Starter',
    price: 0,
    ai_images_limit: 3,
    ai_videos_limit: 0,
    products_limit: 50,
    features: ['50 منتج', '3 صور AI', 'دعم أساسي'],
  },
  pro: {
    id: 'pro',
    name: 'باقة برو',
    name_en: 'Pro',
    price: 49,
    ai_images_limit: 50,
    ai_videos_limit: 10,
    products_limit: 500,
    features: ['500 منتج', '50 صورة AI', '10 فيديو AI', 'دعم متقدم'],
  },
  business: {
    id: 'business',
    name: 'باقة الأعمال',
    name_en: 'Business',
    price: 99,
    ai_images_limit: 999999,
    ai_videos_limit: 50,
    products_limit: 999999,
    features: ['منتجات غير محدودة', 'صور AI غير محدودة', '50 فيديو AI', 'دعم VIP'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'باقة المؤسسات',
    name_en: 'Enterprise',
    price: 199,
    ai_images_limit: 999999,
    ai_videos_limit: 999999,
    products_limit: 999999,
    features: ['كل شيء غير محدود', 'دعم مخصص 24/7', 'API مخصص'],
  },
};

/**
 * Get available plans
 * GET /secure/subscriptions/plans
 */
export async function getPlans(c: SubscriptionContext) {
  return c.json({
    ok: true,
    data: Object.values(PLANS),
  });
}

/**
 * Get current subscription
 * GET /secure/subscription
 */
export async function getSubscription(c: SubscriptionContext) {
  try {
    const profileId = c.get('profileId');
    
    // Try to get active subscription
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${profileId}&status=eq.active&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const subscriptions: any[] = await response.json();
    
    if (!subscriptions || subscriptions.length === 0) {
      // Return default free subscription
      return c.json({
        ok: true,
        data: {
          plan_id: 'starter',
          plan_name: 'باقة البداية',
          status: 'active',
          ai_images_limit: 3,
          ai_images_used: 0,
          ai_videos_limit: 0,
          ai_videos_used: 0,
          products_limit: 50,
          products_used: 0,
          is_free: true,
          price: 0,
        },
      });
    }
    
    const subscription = subscriptions[0];
    
    // Get products count
    const productsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/products?merchant_id=eq.${subscription.store_id}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact',
        },
      }
    );
    const productsCount = parseInt(productsResponse.headers.get('content-range')?.split('/')[1] || '0');
    
    return c.json({
      ok: true,
      data: {
        ...subscription,
        products_used: productsCount,
        is_free: subscription.price === 0,
      },
    });
    
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}

/**
 * Create/Upgrade subscription
 * POST /secure/subscription
 */
export async function createSubscription(c: SubscriptionContext) {
  try {
    const profileId = c.get('profileId');
    const body = await c.req.json();
    const { plan_id, store_id, payment_method, payment_reference } = body;
    
    const plan = PLANS[plan_id];
    if (!plan) {
      return c.json({ ok: false, error: 'Invalid plan_id' }, 400);
    }
    
    if (!store_id) {
      return c.json({ ok: false, error: 'store_id is required' }, 400);
    }
    
    // Cancel existing active subscription
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${profileId}&status=eq.active`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        }),
      }
    );
    
    // Calculate expiry (1 month from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    // Create new subscription
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/subscriptions`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          user_id: profileId,
          store_id,
          plan_id,
          plan_name: plan.name,
          status: plan.price === 0 ? 'active' : 'pending_payment',
          price: plan.price,
          currency: 'SAR',
          payment_method,
          payment_reference,
          ai_images_limit: plan.ai_images_limit,
          ai_images_used: 0,
          ai_videos_limit: plan.ai_videos_limit,
          ai_videos_used: 0,
          products_limit: plan.products_limit,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    const subscriptions: any[] = await response.json();
    const subscription = subscriptions[0];
    
    // Award bonus points for paid plans
    if (plan.price > 0) {
      await awardPoints(c.env, profileId, 100, 'مكافأة ترقية الاشتراك', 'subscription', subscription.id);
    }
    
    return c.json({
      ok: true,
      data: subscription,
      message: plan.price === 0 ? 'تم تفعيل الباقة المجانية' : 'تم إنشاء الاشتراك، يرجى إتمام الدفع',
    });
    
  } catch (error: any) {
    console.error('Create subscription error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Use AI credits
 * POST /secure/subscription/use-ai
 */
export async function useAiCredits(c: SubscriptionContext) {
  try {
    const profileId = c.get('profileId');
    const body = await c.req.json();
    const { type } = body; // 'image' or 'video'
    
    if (!type || !['image', 'video'].includes(type)) {
      return c.json({ ok: false, error: 'type must be "image" or "video"' }, 400);
    }
    
    // Get active subscription
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${profileId}&status=eq.active&limit=1`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const subscriptions: any[] = await response.json();
    
    if (!subscriptions || subscriptions.length === 0) {
      return c.json({
        ok: false,
        error: 'No active subscription',
        can_use: false,
      }, 403);
    }
    
    const sub = subscriptions[0];
    
    // Check limits
    if (type === 'image') {
      if (sub.ai_images_used >= sub.ai_images_limit) {
        return c.json({
          ok: false,
          error: 'AI image limit reached',
          can_use: false,
          limit: sub.ai_images_limit,
          used: sub.ai_images_used,
        }, 403);
      }
      
      // Increment usage
      await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/subscriptions?id=eq.${sub.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ai_images_used: sub.ai_images_used + 1,
          }),
        }
      );
      
      return c.json({
        ok: true,
        can_use: true,
        remaining: sub.ai_images_limit - sub.ai_images_used - 1,
      });
      
    } else {
      if (sub.ai_videos_used >= sub.ai_videos_limit) {
        return c.json({
          ok: false,
          error: 'AI video limit reached',
          can_use: false,
          limit: sub.ai_videos_limit,
          used: sub.ai_videos_used,
        }, 403);
      }
      
      // Increment usage
      await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/subscriptions?id=eq.${sub.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ai_videos_used: sub.ai_videos_used + 1,
          }),
        }
      );
      
      return c.json({
        ok: true,
        can_use: true,
        remaining: sub.ai_videos_limit - sub.ai_videos_used - 1,
      });
    }
    
  } catch (error: any) {
    console.error('Use AI credits error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}

/**
 * Cancel subscription
 * POST /secure/subscription/cancel
 */
export async function cancelSubscription(c: SubscriptionContext) {
  try {
    const profileId = c.get('profileId');
    
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${profileId}&status=eq.active`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }
    
    return c.json({
      ok: true,
      message: 'تم إلغاء الاشتراك بنجاح',
    });
    
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}

/**
 * Get subscription history
 * GET /secure/subscription/history
 */
export async function getSubscriptionHistory(c: SubscriptionContext) {
  try {
    const profileId = c.get('profileId');
    
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${profileId}&order=created_at.desc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const subscriptions: any[] = await response.json();
    
    return c.json({
      ok: true,
      data: subscriptions || [],
    });
    
  } catch (error: any) {
    console.error('Get subscription history error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}

// Helper: Award points
async function awardPoints(
  env: Env,
  userId: string,
  amount: number,
  description: string,
  referenceType: string,
  referenceId: string
) {
  try {
    // Get store ID
    const merchantResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/merchants?id=eq.${userId}&select=id,points_balance`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantResponse.json();
    if (!merchants || merchants.length === 0) return;
    
    const merchant = merchants[0];
    const newBalance = (merchant.points_balance || 0) + amount;
    
    // Update store points balance
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/merchants?id=eq.${merchant.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points_balance: newBalance,
        }),
      }
    );
    
    // Create transaction record
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/point_transactions`,
      {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_id: merchant.id,
          type: 'earned',
          amount,
          balance_after: newBalance,
          description,
          reference_type: referenceType,
          reference_id: referenceId,
        }),
      }
    );
  } catch (error) {
    console.error('Award points error:', error);
  }
}


