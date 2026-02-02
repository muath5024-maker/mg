/**
 * Payment Processor - Unified Payment API
 * 
 * نظام الدفع الموحد لجميع بوابات الدفع
 * 
 * المسارات:
 * - POST /pay/create - إنشاء دفعة جديدة لطلب
 * - GET /pay/status/:id - حالة الدفعة
 * - POST /pay/refund - استرجاع
 * - POST /pay/webhook/:gateway - استقبال إشعارات البوابات
 * - GET /pay/gateways - البوابات المتاحة
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
  CreatePaymentRequest,
} from '../lib/payment-gateways';

// =============================================================================
// Types
// =============================================================================

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  WORKER_URL: string;
}

interface MerchantPaymentSettings {
  id: string;
  merchant_id: string;
  gateway: PaymentGateway;
  api_key: string;
  api_secret: string;
  webhook_secret: string | null;
  is_active: boolean;
  is_default: boolean;
  extra_data: Record<string, any> | null;
}

// =============================================================================
// App
// =============================================================================

const app = new Hono<{ Bindings: Env }>();

// =============================================================================
// Helper Functions
// =============================================================================

function getSupabase(env: Env): SupabaseClient {
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * الحصول على إعدادات بوابة الدفع للتاجر
 */
async function getMerchantPaymentSettings(
  supabase: SupabaseClient,
  merchantId: string,
  gateway?: PaymentGateway
): Promise<MerchantPaymentSettings | null> {
  let query = supabase
    .from('merchant_payment_methods')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('is_active', true);

  if (gateway) {
    query = query.eq('provider', gateway);
  } else {
    query = query.eq('is_default', true);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    merchant_id: data.merchant_id,
    gateway: data.provider as PaymentGateway,
    api_key: data.api_key || '',
    api_secret: data.api_secret || '',
    webhook_secret: data.webhook_secret,
    is_active: data.is_active,
    is_default: data.is_default,
    extra_data: data.extra_data as Record<string, any> | null,
  };
}

/**
 * تحويل إعدادات المتجر إلى credentials للبوابة
 */
function settingsToCredentials(settings: MerchantPaymentSettings): GatewayCredentials {
  return {
    publishableKey: settings.api_key, // بعض البوابات تستخدمه كـ entity ID
    secretKey: settings.api_secret,
    webhookSecret: settings.webhook_secret || undefined,
    ...(settings.extra_data || {}),
  };
}

// =============================================================================
// Routes
// =============================================================================

/**
 * الحصول على قائمة البوابات المدعومة
 */
app.get('/gateways', (c) => {
  const gateways = getSupportedGateways().map((g) => ({
    id: g,
    ...gatewayInfo[g],
  }));

  return c.json({
    success: true,
    data: gateways,
  });
});

/**
 * إنشاء دفعة جديدة
 */
app.post('/create', async (c) => {
  try {
    const body = await c.req.json();
    const {
      merchant_id,
      order_id,
      amount, // بالهللة
      currency = 'SAR',
      description,
      customer,
      gateway: preferredGateway,
      success_url,
      failure_url,
      metadata,
    } = body;

    // التحقق من البيانات المطلوبة
    if (!merchant_id || !order_id || !amount) {
      return c.json({
        success: false,
        error: 'Missing required fields: merchant_id, order_id, amount',
      }, 400);
    }

    const supabase = getSupabase(c.env);

    // الحصول على إعدادات بوابة الدفع للتاجر
    const settings = await getMerchantPaymentSettings(
      supabase,
      merchant_id,
      preferredGateway && isSupportedGateway(preferredGateway) ? preferredGateway : undefined
    );

    if (!settings) {
      return c.json({
        success: false,
        error: 'No payment gateway configured for this merchant',
      }, 400);
    }

    // التحقق من صحة التاجر
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, name')
      .eq('id', merchant_id)
      .single();

    if (!merchant) {
      return c.json({
        success: false,
        error: 'Merchant not found',
      }, 404);
    }

    // التحقق من الطلب
    const { data: order } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, status')
      .eq('id', order_id)
      .eq('merchant_id', merchant_id)
      .single();

    if (!order) {
      return c.json({
        success: false,
        error: 'Order not found',
      }, 404);
    }

    if (order.status !== 'pending' && order.status !== 'awaiting_payment') {
      return c.json({
        success: false,
        error: `Order cannot be paid. Current status: ${order.status}`,
      }, 400);
    }

    // الحصول على البوابة وإنشاء الدفعة
    const gateway = getGateway(settings.gateway);
    const credentials = settingsToCredentials(settings);

    const callbackUrl = `${c.env.WORKER_URL}/pay/webhook/${settings.gateway}`;

    const paymentRequest: CreatePaymentRequest = {
      orderId: order_id,
      amount: amount || order.total_amount,
      currency,
      description: description || `Order #${order.order_number}`,
      customer,
      callbackUrl,
      successUrl: success_url || callbackUrl,
      failureUrl: failure_url || callbackUrl,
      metadata: {
        merchant_id,
        order_number: order.order_number,
        ...metadata,
      },
    };

    const paymentResponse = await gateway.createPayment(credentials, paymentRequest);

    // حفظ معاملة الدفع
    await supabase.from('payment_transactions').insert({
      id: crypto.randomUUID(),
      merchant_id,
      order_id,
      payment_method_id: settings.id,
      transaction_id: paymentResponse.transactionId,
      amount: paymentRequest.amount,
      currency,
      status: 'pending',
      gateway_response: paymentResponse.rawResponse,
      metadata: paymentRequest.metadata,
    });

    // تحديث حالة الطلب
    await supabase
      .from('orders')
      .update({
        status: 'awaiting_payment',
        payment_status: 'pending',
      })
      .eq('id', order_id);

    return c.json({
      success: true,
      data: {
        transaction_id: paymentResponse.transactionId,
        payment_url: paymentResponse.paymentUrl,
        gateway: settings.gateway,
        expires_at: paymentResponse.expiresAt,
      },
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment',
    }, 500);
  }
});

/**
 * الحصول على حالة الدفعة
 */
app.get('/status/:transactionId', async (c) => {
  try {
    const transactionId = c.req.param('transactionId');
    const supabase = getSupabase(c.env);

    // البحث عن المعاملة
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        merchant_payment_methods!inner (
          provider,
          api_key,
          api_secret
        )
      `)
      .eq('transaction_id', transactionId)
      .single();

    if (error || !transaction) {
      return c.json({
        success: false,
        error: 'Transaction not found',
      }, 404);
    }

    // الحصول على الحالة من البوابة
    const gatewayName = (transaction.merchant_payment_methods as any).provider as PaymentGateway;
    
    if (isSupportedGateway(gatewayName)) {
      const gateway = getGateway(gatewayName);
      const credentials: GatewayCredentials = {
        publishableKey: (transaction.merchant_payment_methods as any).api_key,
        secretKey: (transaction.merchant_payment_methods as any).api_secret,
      };

      try {
        const { status, rawResponse } = await gateway.getPaymentStatus(
          credentials,
          transactionId
        );

        // تحديث الحالة إذا تغيرت
        if (status !== transaction.status) {
          await supabase
            .from('payment_transactions')
            .update({
              status,
              gateway_response: rawResponse,
              updated_at: new Date().toISOString(),
            })
            .eq('id', transaction.id);
        }

        return c.json({
          success: true,
          data: {
            transaction_id: transactionId,
            status,
            amount: transaction.amount,
            currency: transaction.currency,
            gateway: gatewayName,
            created_at: transaction.created_at,
          },
        });
      } catch {
        // إذا فشل الاتصال بالبوابة، نعيد الحالة المحفوظة
        return c.json({
          success: true,
          data: {
            transaction_id: transactionId,
            status: transaction.status,
            amount: transaction.amount,
            currency: transaction.currency,
            gateway: gatewayName,
            created_at: transaction.created_at,
          },
        });
      }
    }

    return c.json({
      success: true,
      data: {
        transaction_id: transactionId,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        created_at: transaction.created_at,
      },
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    return c.json({
      success: false,
      error: 'Failed to get payment status',
    }, 500);
  }
});

/**
 * استرجاع مبلغ
 */
app.post('/refund', async (c) => {
  try {
    const body = await c.req.json();
    const {
      transaction_id,
      amount, // بالهللة (اختياري - إذا فارغ = كامل المبلغ)
      reason,
    } = body;

    if (!transaction_id) {
      return c.json({
        success: false,
        error: 'Missing required field: transaction_id',
      }, 400);
    }

    const supabase = getSupabase(c.env);

    // البحث عن المعاملة
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        merchant_payment_methods!inner (
          provider,
          api_key,
          api_secret
        )
      `)
      .eq('transaction_id', transaction_id)
      .single();

    if (error || !transaction) {
      return c.json({
        success: false,
        error: 'Transaction not found',
      }, 404);
    }

    if (transaction.status !== 'paid' && transaction.status !== 'captured') {
      return c.json({
        success: false,
        error: `Cannot refund transaction with status: ${transaction.status}`,
      }, 400);
    }

    // تنفيذ الاسترجاع
    const gatewayName = (transaction.merchant_payment_methods as any).provider as PaymentGateway;
    const gateway = getGateway(gatewayName);
    const credentials: GatewayCredentials = {
      publishableKey: (transaction.merchant_payment_methods as any).api_key,
      secretKey: (transaction.merchant_payment_methods as any).api_secret,
    };

    const refundResponse = await gateway.refund(credentials, {
      transactionId: transaction_id,
      orderId: transaction.order_id,
      amount,
      reason,
    });

    // تحديث حالة المعاملة
    const newStatus = amount && amount < transaction.amount
      ? 'partially_refunded'
      : 'refunded';

    await supabase
      .from('payment_transactions')
      .update({
        status: newStatus,
        refund_id: refundResponse.refundId,
        refunded_amount: (transaction.refunded_amount || 0) + (amount || transaction.amount),
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    // تحديث حالة الطلب
    await supabase
      .from('orders')
      .update({
        payment_status: newStatus,
      })
      .eq('id', transaction.order_id);

    return c.json({
      success: true,
      data: {
        refund_id: refundResponse.refundId,
        amount: refundResponse.amount,
        status: refundResponse.status,
      },
    });
  } catch (error) {
    console.error('Refund error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process refund',
    }, 500);
  }
});

/**
 * Webhook - استقبال إشعارات من بوابات الدفع
 */
app.post('/webhook/:gateway', async (c) => {
  try {
    const gatewayName = c.req.param('gateway');

    if (!isSupportedGateway(gatewayName)) {
      return c.json({ success: false, error: 'Unknown gateway' }, 400);
    }

    const gateway = getGateway(gatewayName);
    const payload = await c.req.json();
    const headers: Record<string, string> = {};
    
    // نسخ الـ headers المهمة
    c.req.raw.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    console.log(`Webhook received from ${gatewayName}:`, JSON.stringify(payload));

    // معالجة الـ payload
    const webhookData = gateway.parseWebhook(payload, headers, {
      publishableKey: '',
      secretKey: '',
    });

    const supabase = getSupabase(c.env);

    // البحث عن المعاملة
    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        merchant_payment_methods!inner (
          provider,
          api_key,
          api_secret,
          webhook_secret
        )
      `)
      .eq('transaction_id', webhookData.transactionId)
      .single();

    if (!transaction) {
      // قد تكون معاملة جديدة أو من تاجر مختلف
      console.log('Transaction not found for webhook:', webhookData.transactionId);
      return c.json({ success: true, message: 'Webhook received' });
    }

    // التحقق من صحة الـ webhook
    const credentials: GatewayCredentials = {
      publishableKey: (transaction.merchant_payment_methods as any).api_key,
      secretKey: (transaction.merchant_payment_methods as any).api_secret,
      webhookSecret: (transaction.merchant_payment_methods as any).webhook_secret,
    };

    const isValid = gateway.verifyWebhook(payload, headers, credentials);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return c.json({ success: false, error: 'Invalid signature' }, 401);
    }

    // تحديث حالة المعاملة
    await supabase
      .from('payment_transactions')
      .update({
        status: webhookData.status,
        gateway_response: webhookData.rawPayload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    // تحديث حالة الطلب
    if (webhookData.status === 'paid' || webhookData.status === 'captured') {
      await supabase
        .from('orders')
        .update({
          status: 'processing',
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', transaction.order_id);

      // يمكن إضافة إشعارات للتاجر والعميل هنا
    } else if (webhookData.status === 'failed' || webhookData.status === 'cancelled') {
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: webhookData.status,
        })
        .eq('id', transaction.order_id);
    }

    return c.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // نعيد 200 حتى لا تعيد البوابة إرسال الـ webhook
    return c.json({ success: true, message: 'Webhook received' });
  }
});

export default app;
