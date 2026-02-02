/**
 * Merchant Payment Settings Routes
 * 
 * إدارة إعدادات بوابات الدفع للتاجر
 * 
 * المسارات:
 * - GET /settings - قائمة بوابات الدفع المفعلة
 * - POST /settings - إضافة بوابة دفع جديدة
 * - PUT /settings/:id - تحديث إعدادات بوابة
 * - DELETE /settings/:id - حذف بوابة دفع
 * - POST /settings/:id/test - اختبار الاتصال بالبوابة
 * - GET /gateways - البوابات المتاحة للإضافة
 */

import { Hono } from 'hono';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  getGateway,
  isSupportedGateway,
  getSupportedGateways,
  gatewayInfo,
  PaymentGateway,
  GatewayCredentials,
} from '../lib/payment-gateways';

// =============================================================================
// Types
// =============================================================================

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface Variables {
  userId: string;
  merchantId: string;
}

// =============================================================================
// App
// =============================================================================

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// =============================================================================
// Helper Functions
// =============================================================================

function getSupabase(env: Env): SupabaseClient {
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// =============================================================================
// Routes
// =============================================================================

/**
 * الحصول على البوابات المتاحة للإضافة
 */
app.get('/gateways', (c) => {
  const gateways = getSupportedGateways().map((g) => ({
    id: g,
    ...gatewayInfo[g],
    requiredFields: getRequiredFields(g),
  }));

  return c.json({
    success: true,
    data: gateways,
  });
});

/**
 * الحصول على قائمة بوابات الدفع المفعلة للتاجر
 */
app.get('/settings', async (c) => {
  try {
    const merchantId = c.get('merchantId');
    const supabase = getSupabase(c.env);

    const { data, error } = await supabase
      .from('merchant_payment_methods')
      .select('id, provider, display_name, is_active, is_default, is_live_mode, supported_methods, created_at, updated_at')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // إضافة معلومات البوابة
    const methods = (data || []).map((m: any) => ({
      ...m,
      gateway_info: gatewayInfo[m.provider as PaymentGateway] || null,
    }));

    return c.json({
      success: true,
      data: methods,
    });
  } catch (error) {
    console.error('Get payment settings error:', error);
    return c.json({
      success: false,
      error: 'Failed to get payment settings',
    }, 500);
  }
});

/**
 * إضافة بوابة دفع جديدة
 */
app.post('/settings', async (c) => {
  try {
    const merchantId = c.get('merchantId');
    const body = await c.req.json();
    const {
      provider,
      display_name,
      api_key,
      api_secret,
      webhook_secret,
      is_live_mode = false,
      supported_methods = [],
      extra_data = {},
    } = body;

    // التحقق من البوابة
    if (!provider || !isSupportedGateway(provider)) {
      return c.json({
        success: false,
        error: `Invalid gateway. Supported: ${getSupportedGateways().join(', ')}`,
      }, 400);
    }

    // التحقق من البيانات المطلوبة
    if (!api_secret) {
      return c.json({
        success: false,
        error: 'api_secret is required',
      }, 400);
    }

    const supabase = getSupabase(c.env);

    // التحقق من عدم وجود البوابة مسبقاً
    const { data: existing } = await supabase
      .from('merchant_payment_methods')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('provider', provider)
      .single();

    if (existing) {
      return c.json({
        success: false,
        error: 'This gateway is already configured. Use PUT to update.',
      }, 400);
    }

    // التحقق من وجود بوابة افتراضية
    const { data: defaultExists } = await supabase
      .from('merchant_payment_methods')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('is_default', true)
      .single();

    const { data, error } = await supabase
      .from('merchant_payment_methods')
      .insert({
        merchant_id: merchantId,
        provider,
        display_name: display_name || gatewayInfo[provider as PaymentGateway]?.nameAr,
        api_key,
        api_secret,
        webhook_secret,
        is_live_mode,
        is_default: !defaultExists, // إذا لا توجد بوابة افتراضية، اجعل هذه افتراضية
        supported_methods,
        extra_data,
      })
      .select('id, provider, display_name, is_active, is_default, is_live_mode, supported_methods, created_at')
      .single();

    if (error) {
      throw error;
    }

    return c.json({
      success: true,
      data: {
        ...data,
        gateway_info: gatewayInfo[provider as PaymentGateway],
      },
      message: 'Payment gateway added successfully',
    });
  } catch (error) {
    console.error('Add payment gateway error:', error);
    return c.json({
      success: false,
      error: 'Failed to add payment gateway',
    }, 500);
  }
});

/**
 * تحديث إعدادات بوابة دفع
 */
app.put('/settings/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const merchantId = c.get('merchantId');
    const body = await c.req.json();
    const {
      display_name,
      api_key,
      api_secret,
      webhook_secret,
      is_active,
      is_default,
      is_live_mode,
      supported_methods,
      extra_data,
    } = body;

    const supabase = getSupabase(c.env);

    // التحقق من ملكية البوابة
    const { data: existing } = await supabase
      .from('merchant_payment_methods')
      .select('id, merchant_id')
      .eq('id', id)
      .single();

    if (!existing || existing.merchant_id !== merchantId) {
      return c.json({
        success: false,
        error: 'Payment method not found',
      }, 404);
    }

    // تحديث البيانات
    const updateData: any = {};
    if (display_name !== undefined) updateData.display_name = display_name;
    if (api_key !== undefined) updateData.api_key = api_key;
    if (api_secret !== undefined) updateData.api_secret = api_secret;
    if (webhook_secret !== undefined) updateData.webhook_secret = webhook_secret;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_default !== undefined) updateData.is_default = is_default;
    if (is_live_mode !== undefined) updateData.is_live_mode = is_live_mode;
    if (supported_methods !== undefined) updateData.supported_methods = supported_methods;
    if (extra_data !== undefined) updateData.extra_data = extra_data;

    const { data, error } = await supabase
      .from('merchant_payment_methods')
      .update(updateData)
      .eq('id', id)
      .select('id, provider, display_name, is_active, is_default, is_live_mode, supported_methods, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return c.json({
      success: true,
      data,
      message: 'Payment gateway updated successfully',
    });
  } catch (error) {
    console.error('Update payment gateway error:', error);
    return c.json({
      success: false,
      error: 'Failed to update payment gateway',
    }, 500);
  }
});

/**
 * حذف بوابة دفع
 */
app.delete('/settings/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const merchantId = c.get('merchantId');
    const supabase = getSupabase(c.env);

    // التحقق من ملكية البوابة
    const { data: existing } = await supabase
      .from('merchant_payment_methods')
      .select('id, merchant_id, is_default')
      .eq('id', id)
      .single();

    if (!existing || existing.merchant_id !== merchantId) {
      return c.json({
        success: false,
        error: 'Payment method not found',
      }, 404);
    }

    // منع حذف البوابة الافتراضية إذا كانت الوحيدة النشطة
    if (existing.is_default) {
      const { count } = await supabase
        .from('merchant_payment_methods')
        .select('id', { count: 'exact' })
        .eq('merchant_id', merchantId)
        .eq('is_active', true);

      if (count && count > 1) {
        return c.json({
          success: false,
          error: 'Cannot delete default gateway. Set another gateway as default first.',
        }, 400);
      }
    }

    const { error } = await supabase
      .from('merchant_payment_methods')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return c.json({
      success: true,
      message: 'Payment gateway deleted successfully',
    });
  } catch (error) {
    console.error('Delete payment gateway error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete payment gateway',
    }, 500);
  }
});

/**
 * اختبار الاتصال ببوابة الدفع
 */
app.post('/settings/:id/test', async (c) => {
  try {
    const id = c.req.param('id');
    const merchantId = c.get('merchantId');
    const supabase = getSupabase(c.env);

    // الحصول على إعدادات البوابة
    const { data: method } = await supabase
      .from('merchant_payment_methods')
      .select('*')
      .eq('id', id)
      .eq('merchant_id', merchantId)
      .single();

    if (!method) {
      return c.json({
        success: false,
        error: 'Payment method not found',
      }, 404);
    }

    // اختبار الاتصال
    const gateway = getGateway(method.provider as PaymentGateway);
    const credentials: GatewayCredentials = {
      publishableKey: method.api_key || '',
      secretKey: method.api_secret || '',
      webhookSecret: method.webhook_secret || undefined,
    };

    try {
      // محاولة الحصول على معاملة غير موجودة للتحقق من صحة الـ credentials
      await gateway.getPaymentStatus(credentials, 'test_' + Date.now());
      // إذا وصلنا هنا، الـ credentials صحيحة (حتى لو المعاملة غير موجودة)
      return c.json({
        success: true,
        message: 'Connection successful',
        data: {
          gateway: method.provider,
          is_live_mode: method.is_live_mode,
        },
      });
    } catch (error: any) {
      // التحقق من نوع الخطأ
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        // الـ credentials صحيحة، فقط المعاملة غير موجودة
        return c.json({
          success: true,
          message: 'Connection successful',
          data: {
            gateway: method.provider,
            is_live_mode: method.is_live_mode,
          },
        });
      }
      
      return c.json({
        success: false,
        error: 'Connection failed: ' + error.message,
      }, 400);
    }
  } catch (error) {
    console.error('Test payment gateway error:', error);
    return c.json({
      success: false,
      error: 'Failed to test payment gateway',
    }, 500);
  }
});

// =============================================================================
// Helper: Required Fields per Gateway
// =============================================================================

function getRequiredFields(gateway: PaymentGateway): {
  api_key: { required: boolean; label: string; labelAr: string; placeholder: string };
  api_secret: { required: boolean; label: string; labelAr: string; placeholder: string };
  webhook_secret: { required: boolean; label: string; labelAr: string; placeholder: string };
  extra?: Record<string, { required: boolean; label: string; labelAr: string; placeholder: string }>;
} {
  const common = {
    api_key: {
      required: false,
      label: 'Public Key',
      labelAr: 'المفتاح العام',
      placeholder: 'pk_...',
    },
    api_secret: {
      required: true,
      label: 'Secret Key',
      labelAr: 'المفتاح السري',
      placeholder: 'sk_...',
    },
    webhook_secret: {
      required: false,
      label: 'Webhook Secret',
      labelAr: 'سر الـ Webhook',
      placeholder: 'whsec_...',
    },
  };

  switch (gateway) {
    case 'moyasar':
      return {
        ...common,
        api_key: { ...common.api_key, placeholder: 'pk_live_...' },
        api_secret: { ...common.api_secret, placeholder: 'sk_live_...' },
      };

    case 'tap':
      return {
        ...common,
        api_key: { ...common.api_key, required: false, label: 'Publishable Key', placeholder: 'pk_live_...' },
        api_secret: { ...common.api_secret, label: 'Secret Key', placeholder: 'sk_live_...' },
      };

    case 'paytabs':
      return {
        ...common,
        api_key: { ...common.api_key, required: true, label: 'Profile ID', labelAr: 'معرف الحساب', placeholder: '12345' },
        api_secret: { ...common.api_secret, label: 'Server Key', labelAr: 'مفتاح السيرفر', placeholder: 'SJNK...' },
      };

    case 'hyperpay':
      return {
        ...common,
        api_key: { ...common.api_key, required: true, label: 'Entity ID', labelAr: 'معرف الكيان', placeholder: '8ac...' },
        api_secret: { ...common.api_secret, label: 'Access Token', labelAr: 'رمز الوصول', placeholder: 'OGFj...' },
      };

    default:
      return common;
  }
}

export default app;
