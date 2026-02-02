/**
 * Payment Gateway Routes - Moyasar Integration
 * 
 * Moyasar هي بوابة دفع سعودية تدعم:
 * - Apple Pay
 * - مدى
 * - Visa/MasterCard
 * - STC Pay
 * 
 * الدفع يتم عبر:
 * 1. إنشاء Payment Intent في Backend
 * 2. عرض نموذج الدفع في Frontend
 * 3. معالجة Webhook عند اكتمال الدفع
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
import { supabaseAuthMiddleware } from '../middleware/supabaseAuthMiddleware';
import { createClient } from '@supabase/supabase-js';

type Variables = SupabaseAuthContext;

const paymentsGateway = new Hono<{ Bindings: Env; Variables: Variables }>();

// ============================================================================
// Types
// ============================================================================

interface PointsPackage {
  id: string;
  points: number;
  bonus: number;
  price: number; // بالهللة (SAR * 100)
  priceDisplay: number; // بالريال
}

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  description: string;
  callback_url: string;
  metadata: {
    user_id: string;
    profile_id: string;
    package_id: string;
    points: number;
    bonus: number;
  };
}

// باقات النقاط المتاحة
const POINTS_PACKAGES: PointsPackage[] = [
  { id: 'pkg_100', points: 100, bonus: 0, price: 1000, priceDisplay: 10 },
  { id: 'pkg_500', points: 500, bonus: 50, price: 4500, priceDisplay: 45 },
  { id: 'pkg_1000', points: 1000, bonus: 150, price: 8000, priceDisplay: 80 },
  { id: 'pkg_2500', points: 2500, bonus: 500, price: 18000, priceDisplay: 180 },
  { id: 'pkg_5000', points: 5000, bonus: 1500, price: 30000, priceDisplay: 300 },
];

// ============================================================================
// Helper Functions
// ============================================================================

function getSupabaseAdmin(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// ============================================================================
// GET /payments/packages - قائمة باقات النقاط
// ============================================================================

paymentsGateway.get('/packages', async (c) => {
  return c.json({
    success: true,
    packages: POINTS_PACKAGES.map(pkg => ({
      id: pkg.id,
      points: pkg.points,
      bonus: pkg.bonus,
      totalPoints: pkg.points + pkg.bonus,
      price: pkg.priceDisplay,
      currency: 'SAR',
      pricePerPoint: (pkg.priceDisplay / (pkg.points + pkg.bonus)).toFixed(2),
    })),
  });
});

// ============================================================================
// POST /payments/create-intent - إنشاء نية دفع
// ============================================================================

paymentsGateway.post('/create-intent', supabaseAuthMiddleware, async (c) => {
  const profileId = c.get('profileId');
  const authUserId = c.get('authUserId');

  try {
    const body = await c.req.json();
    const { package_id } = body;

    // التحقق من الباقة
    const selectedPackage = POINTS_PACKAGES.find(p => p.id === package_id);
    if (!selectedPackage) {
      return c.json({ error: 'INVALID_PACKAGE', message: 'Invalid package selected' }, 400);
    }

    // إنشاء سجل في قاعدة البيانات
    const supabase = getSupabaseAdmin(c.env);
    
    const { data: payment, error: dbError } = await supabase
      .from('payment_transactions')
      .insert({
        user_profile_id: profileId,
        amount: selectedPackage.price,
        currency: 'SAR',
        status: 'pending',
        payment_type: 'points_purchase',
        metadata: {
          package_id: selectedPackage.id,
          points: selectedPackage.points,
          bonus: selectedPackage.bonus,
          total_points: selectedPackage.points + selectedPackage.bonus,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Payment] DB Error:', dbError);
      return c.json({ error: 'DB_ERROR', message: 'Failed to create payment record' }, 500);
    }

    // إنشاء Payment Intent عبر Moyasar API
    // ملاحظة: في الوضع التجريبي سنستخدم test keys
    const moyasarResponse = await fetch('https://api.moyasar.com/v1/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(c.env.MOYASAR_SECRET_KEY + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: selectedPackage.price,
        currency: 'SAR',
        description: `شراء ${selectedPackage.points} نقطة${selectedPackage.bonus > 0 ? ` + ${selectedPackage.bonus} هدية` : ''}`,
        callback_url: `${c.env.WORKER_URL || 'https://misty-mode-b68b.baharista1.workers.dev'}/payments/webhook`,
        metadata: {
          payment_id: payment.id,
          user_id: authUserId,
          profile_id: profileId,
          package_id: selectedPackage.id,
        },
      }),
    });

    if (!moyasarResponse.ok) {
      const errorData = await moyasarResponse.json();
      console.error('[Payment] Moyasar Error:', errorData);
      
      // تحديث حالة الدفع إلى فشل
      await supabase
        .from('payment_transactions')
        .update({ status: 'failed', error_message: JSON.stringify(errorData) })
        .eq('id', payment.id);

      return c.json({ error: 'PAYMENT_ERROR', message: 'Failed to create payment' }, 500);
    }

    const invoice = await moyasarResponse.json() as any;

    // تحديث سجل الدفع بمعرف Moyasar
    await supabase
      .from('payment_transactions')
      .update({ 
        external_id: invoice.id,
        metadata: {
          ...payment.metadata,
          moyasar_invoice_id: invoice.id,
        }
      })
      .eq('id', payment.id);

    return c.json({
      success: true,
      payment_id: payment.id,
      invoice_id: invoice.id,
      invoice_url: invoice.url,
      amount: selectedPackage.priceDisplay,
      currency: 'SAR',
      package: {
        points: selectedPackage.points,
        bonus: selectedPackage.bonus,
        total: selectedPackage.points + selectedPackage.bonus,
      },
    });

  } catch (error: any) {
    console.error('[Payment] Create Intent Error:', error);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Payment creation failed' }, 500);
  }
});

// ============================================================================
// POST /payments/webhook - Moyasar Webhook
// ============================================================================

paymentsGateway.post('/webhook', async (c) => {
  try {
    const body = await c.req.json();
    console.log('[Payment Webhook] Received:', JSON.stringify(body));

    const { id, status, metadata } = body;

    if (!metadata?.payment_id) {
      console.error('[Payment Webhook] Missing payment_id in metadata');
      return c.json({ received: true });
    }

    const supabase = getSupabaseAdmin(c.env);

    // الحصول على سجل الدفع
    const { data: payment, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', metadata.payment_id)
      .single();

    if (fetchError || !payment) {
      console.error('[Payment Webhook] Payment not found:', metadata.payment_id);
      return c.json({ received: true });
    }

    // معالجة حالة الدفع
    if (status === 'paid') {
      // تحديث حالة الدفع
      await supabase
        .from('payment_transactions')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      // إضافة النقاط للمستخدم
      const totalPoints = payment.metadata.total_points || (payment.metadata.points + payment.metadata.bonus);
      
      // تحديث رصيد النقاط
      const { data: currentBalance } = await supabase
        .from('user_points')
        .select('balance')
        .eq('user_profile_id', payment.user_profile_id)
        .single();

      if (currentBalance) {
        await supabase
          .from('user_points')
          .update({ 
            balance: currentBalance.balance + totalPoints,
            updated_at: new Date().toISOString(),
          })
          .eq('user_profile_id', payment.user_profile_id);
      } else {
        await supabase
          .from('user_points')
          .insert({
            user_profile_id: payment.user_profile_id,
            balance: totalPoints,
          });
      }

      // إضافة سجل المعاملة
      await supabase
        .from('points_transactions')
        .insert({
          user_profile_id: payment.user_profile_id,
          type: 'purchase',
          amount: totalPoints,
          description: `شراء ${payment.metadata.points} نقطة${payment.metadata.bonus > 0 ? ` + ${payment.metadata.bonus} هدية` : ''}`,
          reference_id: payment.id,
        });

      console.log('[Payment Webhook] Points added successfully:', totalPoints);

    } else if (status === 'failed') {
      await supabase
        .from('payment_transactions')
        .update({ 
          status: 'failed',
          error_message: body.source?.message || 'Payment failed',
        })
        .eq('id', payment.id);
    }

    return c.json({ received: true });

  } catch (error: any) {
    console.error('[Payment Webhook] Error:', error);
    return c.json({ received: true });
  }
});

// ============================================================================
// GET /payments/status/:id - حالة الدفع
// ============================================================================

paymentsGateway.get('/status/:id', supabaseAuthMiddleware, async (c) => {
  const profileId = c.get('profileId');
  const paymentId = c.req.param('id');

  try {
    const supabase = getSupabaseAdmin(c.env);

    const { data: payment, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', paymentId)
      .eq('user_profile_id', profileId)
      .single();

    if (error || !payment) {
      return c.json({ error: 'NOT_FOUND', message: 'Payment not found' }, 404);
    }

    return c.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount / 100,
        currency: payment.currency,
        points: payment.metadata?.total_points,
        created_at: payment.created_at,
        completed_at: payment.completed_at,
      },
    });

  } catch (error: any) {
    console.error('[Payment Status] Error:', error);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Failed to get payment status' }, 500);
  }
});

// ============================================================================
// GET /payments/history - سجل المدفوعات
// ============================================================================

paymentsGateway.get('/history', supabaseAuthMiddleware, async (c) => {
  const profileId = c.get('profileId');

  try {
    const supabase = getSupabaseAdmin(c.env);

    const { data: payments, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return c.json({ error: 'DB_ERROR', message: 'Failed to fetch payments' }, 500);
    }

    return c.json({
      success: true,
      payments: payments.map(p => ({
        id: p.id,
        status: p.status,
        amount: p.amount / 100,
        currency: p.currency,
        points: p.metadata?.total_points,
        description: `شراء ${p.metadata?.points} نقطة`,
        created_at: p.created_at,
        completed_at: p.completed_at,
      })),
    });

  } catch (error: any) {
    console.error('[Payment History] Error:', error);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Failed to get payment history' }, 500);
  }
});

// ============================================================================
// POST /payments/simulate - محاكاة الدفع (للتجربة فقط)
// ============================================================================

paymentsGateway.post('/simulate', supabaseAuthMiddleware, async (c) => {
  const profileId = c.get('profileId');

  // تحقق من وضع التطوير
  if (c.env.ENVIRONMENT === 'production') {
    return c.json({ error: 'NOT_ALLOWED', message: 'Simulation not allowed in production' }, 403);
  }

  try {
    const body = await c.req.json();
    const { package_id } = body;

    const selectedPackage = POINTS_PACKAGES.find(p => p.id === package_id);
    if (!selectedPackage) {
      return c.json({ error: 'INVALID_PACKAGE', message: 'Invalid package selected' }, 400);
    }

    const supabase = getSupabaseAdmin(c.env);
    const totalPoints = selectedPackage.points + selectedPackage.bonus;

    // إنشاء سجل دفع محاكى
    const { data: payment } = await supabase
      .from('payment_transactions')
      .insert({
        user_profile_id: profileId,
        amount: selectedPackage.price,
        currency: 'SAR',
        status: 'completed',
        payment_type: 'points_purchase',
        metadata: {
          package_id: selectedPackage.id,
          points: selectedPackage.points,
          bonus: selectedPackage.bonus,
          total_points: totalPoints,
          simulated: true,
        },
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    // تحديث رصيد النقاط
    const { data: currentBalance } = await supabase
      .from('user_points')
      .select('balance')
      .eq('user_profile_id', profileId)
      .single();

    if (currentBalance) {
      await supabase
        .from('user_points')
        .update({ 
          balance: currentBalance.balance + totalPoints,
          updated_at: new Date().toISOString(),
        })
        .eq('user_profile_id', profileId);
    } else {
      await supabase
        .from('user_points')
        .insert({
          user_profile_id: profileId,
          balance: totalPoints,
        });
    }

    // إضافة سجل المعاملة
    await supabase
      .from('points_transactions')
      .insert({
        user_profile_id: profileId,
        type: 'purchase',
        amount: totalPoints,
        description: `شراء ${selectedPackage.points} نقطة (محاكاة)`,
        reference_id: payment?.id,
      });

    return c.json({
      success: true,
      message: `تمت إضافة ${totalPoints} نقطة بنجاح (محاكاة)`,
      points_added: totalPoints,
    });

  } catch (error: any) {
    console.error('[Payment Simulate] Error:', error);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Simulation failed' }, 500);
  }
});

export default paymentsGateway;
