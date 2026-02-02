import { Hono } from 'hono';

type RouteContext = { Variables: { user: any }; Bindings: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; AI?: any } };
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const app = new Hono<RouteContext>();

// Helper to get Supabase client
function getSupabase(c: any): SupabaseClient {
  return createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Helper to get store_id from user
async function getStoreId(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('merchants')
    .select('id')
    .eq('id', userId)
    .single();
  return data?.id || null;
}

// ==================== PAYMENT PROVIDERS ====================

app.get('/providers', async (c) => {
  const supabase = getSupabase(c);

  const { data, error } = await supabase
    .from('payment_providers')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== STORE PAYMENT METHODS ====================

app.get('/methods', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('store_payment_methods')
    .select(`*, provider:payment_providers(*)`)
    .eq('store_id', storeId)
    .order('display_order');

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/methods', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('store_payment_methods')
    .upsert({
      store_id: storeId,
      provider_id: body.provider_id,
      merchant_id: body.merchant_id,
      api_key: body.api_key,
      api_secret: body.api_secret,
      terminal_id: body.terminal_id,
      webhook_secret: body.webhook_secret,
      test_mode: body.test_mode || false,
      min_amount: body.min_amount,
      max_amount: body.max_amount,
      processing_fee_type: body.processing_fee_type || 'percentage',
      processing_fee_value: body.processing_fee_value,
      pass_fee_to_customer: body.pass_fee_to_customer || false,
      display_order: body.display_order || 0,
      is_active: body.is_active !== false
    }, { onConflict: 'store_id,provider_id' })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.put('/methods/:id', async (c) => {
  const supabase = getSupabase(c);
  const methodId = c.req.param('id');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('store_payment_methods')
    .update({
      merchant_id: body.merchant_id,
      api_key: body.api_key,
      api_secret: body.api_secret,
      terminal_id: body.terminal_id,
      webhook_secret: body.webhook_secret,
      test_mode: body.test_mode,
      min_amount: body.min_amount,
      max_amount: body.max_amount,
      processing_fee_type: body.processing_fee_type,
      processing_fee_value: body.processing_fee_value,
      pass_fee_to_customer: body.pass_fee_to_customer,
      display_order: body.display_order,
      is_active: body.is_active
    })
    .eq('id', methodId)
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.delete('/methods/:id', async (c) => {
  const supabase = getSupabase(c);
  const methodId = c.req.param('id');

  const { error } = await supabase
    .from('store_payment_methods')
    .delete()
    .eq('id', methodId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true });
});

// ==================== BANK ACCOUNTS ====================

app.get('/bank-accounts', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('store_bank_accounts')
    .select('*')
    .eq('store_id', storeId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/bank-accounts', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('store_bank_accounts')
    .insert({
      store_id: storeId,
      bank_name: body.bank_name,
      bank_name_ar: body.bank_name_ar,
      account_name: body.account_name,
      account_number: body.account_number,
      iban: body.iban,
      swift_code: body.swift_code,
      bank_logo: body.bank_logo,
      instructions: body.instructions,
      is_default: body.is_default || false,
      is_active: body.is_active !== false
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== PAYMENTS ====================

app.get('/transactions', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const status = c.req.query('status');
  const limit = parseInt(c.req.query('limit') || '50');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  let query = supabase
    .from('payments')
    .select(`*, provider:payment_providers(name, name_ar)`)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.get('/transactions/:id', async (c) => {
  const supabase = getSupabase(c);
  const paymentId = c.req.param('id');

  const { data, error } = await supabase
    .from('payments')
    .select(`*, provider:payment_providers(*), refunds:payment_refunds(*)`)
    .eq('id', paymentId)
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== REFUNDS ====================

app.post('/refunds', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('payment_refunds')
    .insert({
      store_id: storeId,
      payment_id: body.payment_id,
      amount: body.amount,
      reason: body.reason,
      notes: body.notes,
      status: 'pending'
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.get('/refunds', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const status = c.req.query('status');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  let query = supabase
    .from('payment_refunds')
    .select(`*, payment:payments(order_id, amount)`)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== PAYMENT SETTINGS ====================

app.get('/settings', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('payment_settings')
    .select('*')
    .eq('store_id', storeId)
    .single();

  if (error && error.code !== 'PGRST116') return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data: data || {} });
});

app.post('/settings', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('payment_settings')
    .upsert({
      store_id: storeId,
      currency: body.currency || 'SAR',
      multi_currency_enabled: body.multi_currency_enabled,
      supported_currencies: body.supported_currencies,
      auto_capture: body.auto_capture,
      capture_delay_hours: body.capture_delay_hours,
      partial_payment_enabled: body.partial_payment_enabled,
      min_partial_percentage: body.min_partial_percentage,
      receipt_email_enabled: body.receipt_email_enabled,
      receipt_sms_enabled: body.receipt_sms_enabled,
      auto_refund_enabled: body.auto_refund_enabled,
      refund_policy_days: body.refund_policy_days
    }, { onConflict: 'store_id' })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== STATS ====================

app.get('/stats', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { count: activeMethods } = await supabase
    .from('store_payment_methods')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('is_active', true);

  const { count: totalTransactions } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: pendingTransactions } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('status', 'pending');

  const { data: totalAmount } = await supabase
    .from('payments')
    .select('amount')
    .eq('store_id', storeId)
    .eq('status', 'completed');

  const total = totalAmount?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  const { count: pendingRefunds } = await supabase
    .from('payment_refunds')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('status', 'pending');

  return c.json({
    ok: true,
    data: {
      active_methods: activeMethods || 0,
      total_transactions: totalTransactions || 0,
      pending_transactions: pendingTransactions || 0,
      total_amount: total,
      pending_refunds: pendingRefunds || 0
    }
  });
});

export default app;
