/**
 * Referral Program Endpoints
 * نظام برنامج الإحالة
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type ReferralContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

// Helper to get store ID
async function getmerchantId(c: ReferralContext): Promise<string | null> {
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
// Get Referral Settings
// ============================================================================

export async function getReferralSettings(c: ReferralContext) {
  try {
    const merchantId = await getmerchantId(c);

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_settings?store_id=eq.${merchantId}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const settings = await response.json() as any[];
    
    // Create default if not exists
    if (!settings || settings.length === 0) {
      const createResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/referral_settings`,
        {
          method: 'POST',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({ store_id: merchantId }),
        }
      );
      const newSettings = await createResponse.json() as any[];
      return c.json({ ok: true, data: newSettings[0] });
    }

    return c.json({ ok: true, data: settings[0] });
  } catch (error: any) {
    console.error('Get referral settings error:', error);
    return c.json({ ok: false, error: 'فشل في جلب الإعدادات' }, 500);
  }
}

// ============================================================================
// Update Referral Settings
// ============================================================================

export async function updateReferralSettings(c: ReferralContext) {
  try {
    const merchantId = await getmerchantId(c);
    const body = await c.req.json();

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    // Check if exists
    const checkResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_settings?store_id=eq.${merchantId}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const existing = await checkResponse.json() as any[];

    if (!existing || existing.length === 0) {
      // Create new
      const createResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/referral_settings`,
        {
          method: 'POST',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({ store_id: merchantId, ...body }),
        }
      );
      const newSettings = await createResponse.json() as any[];
      return c.json({ ok: true, data: newSettings[0] });
    }

    // Update existing
    const updateResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_settings?store_id=eq.${merchantId}`,
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
    console.error('Update referral settings error:', error);
    return c.json({ ok: false, error: 'فشل في تحديث الإعدادات' }, 500);
  }
}

// ============================================================================
// Get All Referrals
// ============================================================================

export async function getReferrals(c: ReferralContext) {
  try {
    const merchantId = await getmerchantId(c);
    const status = c.req.query('status');

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    let url = `${c.env.SUPABASE_URL}/rest/v1/referrals?store_id=eq.${merchantId}&order=created_at.desc`;
    if (status && status !== 'all') {
      url += `&status=eq.${status}`;
    }

    const response = await fetch(url, {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
    });

    const referrals = await response.json();
    return c.json({ ok: true, data: referrals });
  } catch (error: any) {
    console.error('Get referrals error:', error);
    return c.json({ ok: false, error: 'فشل في جلب الإحالات' }, 500);
  }
}

// ============================================================================
// Get Referral Codes
// ============================================================================

export async function getReferralCodes(c: ReferralContext) {
  try {
    const merchantId = await getmerchantId(c);

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_codes?store_id=eq.${merchantId}&order=total_earnings.desc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const codes = await response.json();
    return c.json({ ok: true, data: codes });
  } catch (error: any) {
    console.error('Get referral codes error:', error);
    return c.json({ ok: false, error: 'فشل في جلب الأكواد' }, 500);
  }
}

// ============================================================================
// Get Top Referrers
// ============================================================================

export async function getTopReferrers(c: ReferralContext) {
  try {
    const merchantId = await getmerchantId(c);
    const limit = c.req.query('limit') || '10';

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_codes?store_id=eq.${merchantId}&order=successful_uses.desc&limit=${limit}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const topReferrers = await response.json();
    return c.json({ ok: true, data: topReferrers });
  } catch (error: any) {
    console.error('Get top referrers error:', error);
    return c.json({ ok: false, error: 'فشل في جلب المتصدرين' }, 500);
  }
}

// ============================================================================
// Get Referral Stats
// ============================================================================

export async function getReferralStats(c: ReferralContext) {
  try {
    const merchantId = await getmerchantId(c);

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    // Get settings with stats
    const settingsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_settings?store_id=eq.${merchantId}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const settings = await settingsResponse.json() as any[];

    // Get active referral codes count
    const codesResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_codes?store_id=eq.${merchantId}&is_active=eq.true&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const codes = await codesResponse.json() as any[];

    // Get pending referrals
    const pendingResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referrals?store_id=eq.${merchantId}&status=eq.pending&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const pending = await pendingResponse.json() as any[];

    const stats = {
      is_enabled: settings[0]?.is_enabled || false,
      total_referrals: settings[0]?.total_referrals || 0,
      successful_referrals: settings[0]?.successful_referrals || 0,
      total_rewards_given: settings[0]?.total_rewards_given || 0,
      active_codes: codes?.length || 0,
      pending_referrals: pending?.length || 0,
      conversion_rate: 0,
    };

    if (stats.total_referrals > 0) {
      stats.conversion_rate = Math.round((stats.successful_referrals / stats.total_referrals) * 100);
    }

    return c.json({ ok: true, data: stats });
  } catch (error: any) {
    console.error('Get referral stats error:', error);
    return c.json({ ok: false, error: 'فشل في جلب الإحصائيات' }, 500);
  }
}

// ============================================================================
// Generate User Referral Code (Public)
// ============================================================================

export async function generateUserReferralCode(c: ReferralContext) {
  try {
    const { store_id, user_id } = await c.req.json();

    if (!store_id || !user_id) {
      return c.json({ ok: false, error: 'Missing required fields' }, 400);
    }

    // Check if code already exists
    const checkResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_codes?store_id=eq.${store_id}&user_id=eq.${user_id}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const existing = await checkResponse.json() as any[];

    if (existing && existing.length > 0) {
      return c.json({ ok: true, data: existing[0] });
    }

    // Generate new code
    const code = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const createResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_codes`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          store_id,
          user_id,
          code,
        }),
      }
    );

    const newCode = await createResponse.json() as any[];
    return c.json({ ok: true, data: newCode[0] });
  } catch (error: any) {
    console.error('Generate referral code error:', error);
    return c.json({ ok: false, error: 'فشل في إنشاء كود الإحالة' }, 500);
  }
}

// ============================================================================
// Validate Referral Code (Public)
// ============================================================================

export async function validateReferralCode(c: ReferralContext) {
  try {
    const { store_id, code, referee_id } = await c.req.json();

    if (!store_id || !code) {
      return c.json({ ok: false, error: 'Missing required fields' }, 400);
    }

    // Get settings
    const settingsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_settings?store_id=eq.${store_id}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const settings = await settingsResponse.json() as any[];

    if (!settings || settings.length === 0 || !settings[0].is_enabled) {
      return c.json({ ok: false, valid: false, error: 'برنامج الإحالة غير مفعل' });
    }

    // Get code
    const codeResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_codes?store_id=eq.${store_id}&code=eq.${code.toUpperCase()}&is_active=eq.true`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const referralCode = await codeResponse.json() as any[];

    if (!referralCode || referralCode.length === 0) {
      return c.json({ ok: false, valid: false, error: 'كود الإحالة غير صالح' });
    }

    // Check if user is trying to use their own code
    if (referralCode[0].user_id === referee_id) {
      return c.json({ ok: false, valid: false, error: 'لا يمكنك استخدام كود الإحالة الخاص بك' });
    }

    // Check if user already referred
    if (referee_id) {
      const referredResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/referrals?store_id=eq.${store_id}&referee_id=eq.${referee_id}`,
        {
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      const referred = await referredResponse.json() as any[];

      if (referred && referred.length > 0) {
        return c.json({ ok: false, valid: false, error: 'لقد تمت إحالتك مسبقاً' });
      }
    }

    return c.json({
      ok: true,
      valid: true,
      data: {
        referral_code_id: referralCode[0].id,
        referrer_id: referralCode[0].user_id,
        referee_reward_type: settings[0].referee_reward_type,
        referee_reward_value: settings[0].referee_reward_value,
        min_order: settings[0].referee_min_order,
      },
    });
  } catch (error: any) {
    console.error('Validate referral code error:', error);
    return c.json({ ok: false, error: 'فشل في التحقق من الكود' }, 500);
  }
}

// ============================================================================
// Apply Referral (Public - after order)
// ============================================================================

export async function applyReferral(c: ReferralContext) {
  try {
    const { store_id, referral_code_id, referee_id, order_id, order_amount } = await c.req.json();

    if (!store_id || !referral_code_id || !referee_id || !order_id) {
      return c.json({ ok: false, error: 'Missing required fields' }, 400);
    }

    // Get settings
    const settingsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_settings?store_id=eq.${store_id}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const settings = await settingsResponse.json() as any[];

    // Get referral code
    const codeResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_codes?id=eq.${referral_code_id}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const referralCode = await codeResponse.json() as any[];

    if (!referralCode || referralCode.length === 0) {
      return c.json({ ok: false, error: 'كود الإحالة غير موجود' }, 404);
    }

    // Calculate rewards
    let referrerReward = settings[0].referrer_reward_value;
    let refereeReward = settings[0].referee_reward_value;

    if (settings[0].referrer_reward_type === 'percentage') {
      referrerReward = order_amount * (settings[0].referrer_reward_value / 100);
      if (settings[0].referrer_reward_max) {
        referrerReward = Math.min(referrerReward, settings[0].referrer_reward_max);
      }
    }

    if (settings[0].referee_reward_type === 'percentage') {
      refereeReward = order_amount * (settings[0].referee_reward_value / 100);
    }

    // Create referral record
    const referralResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referrals`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          store_id,
          referral_code_id,
          referrer_id: referralCode[0].user_id,
          referee_id,
          order_id,
          order_amount,
          status: 'completed',
          referrer_reward_type: settings[0].referrer_reward_type,
          referrer_reward_value: referrerReward,
          referee_reward_type: settings[0].referee_reward_type,
          referee_reward_value: refereeReward,
          completed_at: new Date().toISOString(),
        }),
      }
    );

    const referral = await referralResponse.json() as any[];

    // Update code stats
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_codes?id=eq.${referral_code_id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total_uses: referralCode[0].total_uses + 1,
          successful_uses: referralCode[0].successful_uses + 1,
          total_earnings: referralCode[0].total_earnings + referrerReward,
        }),
      }
    );

    // Update settings stats
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_settings?store_id=eq.${store_id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total_referrals: settings[0].total_referrals + 1,
          successful_referrals: settings[0].successful_referrals + 1,
          total_rewards_given: settings[0].total_rewards_given + referrerReward + refereeReward,
        }),
      }
    );

    return c.json({
      ok: true,
      data: {
        referral_id: referral[0]?.id,
        referrer_reward: referrerReward,
        referee_reward: refereeReward,
      },
    });
  } catch (error: any) {
    console.error('Apply referral error:', error);
    return c.json({ ok: false, error: 'فشل في تطبيق الإحالة' }, 500);
  }
}

// ============================================================================
// Toggle Referral Code Status
// ============================================================================

export async function toggleReferralCode(c: ReferralContext) {
  try {
    const id = c.req.param('id');
    const merchantId = await getmerchantId(c);

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    // Get current status
    const codeResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_codes?id=eq.${id}&store_id=eq.${merchantId}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const codes = await codeResponse.json() as any[];

    if (!codes || codes.length === 0) {
      return c.json({ ok: false, error: 'Code not found' }, 404);
    }

    // Toggle
    const updateResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/referral_codes?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          is_active: !codes[0].is_active,
        }),
      }
    );

    const updated = await updateResponse.json() as any[];
    return c.json({ ok: true, data: updated[0] });
  } catch (error: any) {
    console.error('Toggle referral code error:', error);
    return c.json({ ok: false, error: 'فشل في تحديث الكود' }, 500);
  }
}


