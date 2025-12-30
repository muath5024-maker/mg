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

// ==================== COD SETTINGS ====================

app.get('/settings', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('cod_settings')
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
    .from('cod_settings')
    .upsert({
      store_id: storeId,
      is_enabled: body.is_enabled !== false,
      min_order_amount: body.min_order_amount,
      max_order_amount: body.max_order_amount,
      cod_fee: body.cod_fee || 0,
      cod_fee_type: body.cod_fee_type || 'fixed',
      excluded_zones: body.excluded_zones,
      excluded_product_categories: body.excluded_product_categories,
      require_phone_verification: body.require_phone_verification,
      require_id_verification: body.require_id_verification,
      require_address_verification: body.require_address_verification,
      max_failed_deliveries: body.max_failed_deliveries || 3,
      blacklist_auto_add: body.blacklist_auto_add,
      trust_score_threshold: body.trust_score_threshold || 50
    }, { onConflict: 'store_id' })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== CUSTOMER STATUS ====================

app.get('/customers', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const status = c.req.query('status');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  let query = supabase
    .from('cod_customer_status')
    .select('*')
    .eq('store_id', storeId)
    .order('total_orders', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query.limit(100);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.get('/customers/:customerId', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const customerId = c.req.param('customerId');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('cod_customer_status')
    .select('*')
    .eq('store_id', storeId)
    .eq('customer_id', customerId)
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.put('/customers/:customerId/status', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const customerId = c.req.param('customerId');
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('cod_customer_status')
    .update({
      status: body.status,
      notes: body.notes
    })
    .eq('store_id', storeId)
    .eq('customer_id', customerId)
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== BLACKLIST ====================

app.get('/blacklist', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('cod_blacklist')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/blacklist', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('cod_blacklist')
    .insert({
      store_id: storeId,
      customer_id: body.customer_id,
      phone: body.phone,
      national_id: body.national_id,
      reason: body.reason,
      block_type: body.block_type || 'permanent',
      blocked_until: body.blocked_until,
      is_active: true
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.delete('/blacklist/:id', async (c) => {
  const supabase = getSupabase(c);
  const blacklistId = c.req.param('id');

  const { error } = await supabase
    .from('cod_blacklist')
    .update({ is_active: false })
    .eq('id', blacklistId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true });
});

// ==================== COD ORDERS ====================

app.get('/orders', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const status = c.req.query('status');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  let query = supabase
    .from('cod_orders')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('collection_status', status);

  const { data, error } = await query.limit(100);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.put('/orders/:id/status', async (c) => {
  const supabase = getSupabase(c);
  const orderId = c.req.param('id');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('cod_orders')
    .update({
      collection_status: body.status,
      collected_amount: body.collected_amount,
      collection_date: body.collection_date,
      collection_notes: body.notes
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== COD VERIFICATION ====================

app.get('/verification/:orderId', async (c) => {
  const supabase = getSupabase(c);
  const orderId = c.req.param('orderId');

  const { data, error } = await supabase
    .from('cod_verification')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/verification', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('cod_verification')
    .insert({
      store_id: storeId,
      order_id: body.order_id,
      customer_id: body.customer_id,
      phone_verified: body.phone_verified || false,
      id_verified: body.id_verified || false,
      address_verified: body.address_verified || false,
      verification_code: body.verification_code,
      code_sent_at: body.code_sent_at,
      code_verified_at: body.code_verified_at,
      verified_by: body.verified_by
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/send-code', async (c) => {
  const supabase = getSupabase(c);
  const body = await c.req.json();

  // Generate 6 digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const { error } = await supabase
    .from('cod_verification')
    .update({
      verification_code: code,
      code_sent_at: new Date().toISOString()
    })
    .eq('order_id', body.order_id);

  if (error) return c.json({ ok: false, error: error.message }, 400);

  // In production, send SMS here
  return c.json({ ok: true, data: { message: 'Verification code sent' } });
});

app.post('/verify-code', async (c) => {
  const supabase = getSupabase(c);
  const body = await c.req.json();

  const { data: verification, error: fetchError } = await supabase
    .from('cod_verification')
    .select('*')
    .eq('order_id', body.order_id)
    .single();

  if (fetchError) return c.json({ ok: false, error: fetchError.message }, 400);

  if (verification.verification_code !== body.code) {
    return c.json({ ok: false, error: 'Invalid verification code' }, 400);
  }

  const { data, error } = await supabase
    .from('cod_verification')
    .update({
      phone_verified: true,
      code_verified_at: new Date().toISOString()
    })
    .eq('order_id', body.order_id)
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== ELIGIBILITY CHECK ====================

app.post('/check-eligibility', async (c) => {
  const supabase = getSupabase(c);
  const body = await c.req.json();

  const { data, error } = await supabase
    .rpc('check_cod_eligibility', {
      p_store_id: body.store_id,
      p_customer_id: body.customer_id,
      p_order_amount: body.order_amount,
      p_zone: body.zone
    });

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== DAILY REPORTS ====================

app.get('/reports', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const limit = parseInt(c.req.query('limit') || '30');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('cod_daily_reports')
    .select('*')
    .eq('store_id', storeId)
    .order('report_date', { ascending: false })
    .limit(limit);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== STATS ====================

app.get('/stats', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { count: totalOrders } = await supabase
    .from('cod_orders')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: pendingCollection } = await supabase
    .from('cod_orders')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('collection_status', 'pending');

  const { count: collectedOrders } = await supabase
    .from('cod_orders')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('collection_status', 'collected');

  const { count: failedOrders } = await supabase
    .from('cod_orders')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('collection_status', 'failed');

  const { count: blacklistedCustomers } = await supabase
    .from('cod_blacklist')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('is_active', true);

  const { data: pendingAmount } = await supabase
    .from('cod_orders')
    .select('cod_amount')
    .eq('store_id', storeId)
    .eq('collection_status', 'pending');

  const pending = pendingAmount?.reduce((sum, o) => sum + (o.cod_amount || 0), 0) || 0;

  return c.json({
    ok: true,
    data: {
      total_orders: totalOrders || 0,
      pending_collection: pendingCollection || 0,
      collected_orders: collectedOrders || 0,
      failed_orders: failedOrders || 0,
      blacklisted_customers: blacklistedCustomers || 0,
      pending_amount: pending
    }
  });
});

export default app;
