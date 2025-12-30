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

// ==================== SHIPPING CARRIERS ====================

app.get('/carriers', async (c) => {
  const supabase = getSupabase(c);

  const { data, error } = await supabase
    .from('shipping_carriers')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== STORE SHIPPING SETTINGS ====================

app.get('/settings', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('store_shipping_settings')
    .select(`*, carrier:shipping_carriers(*)`)
    .eq('store_id', storeId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/settings', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('store_shipping_settings')
    .upsert({
      store_id: storeId,
      carrier_id: body.carrier_id,
      account_id: body.account_id,
      api_key: body.api_key,
      api_secret: body.api_secret,
      default_service: body.default_service,
      sender_name: body.sender_name,
      sender_phone: body.sender_phone,
      sender_address: body.sender_address,
      sender_city: body.sender_city,
      sender_district: body.sender_district,
      sender_postal_code: body.sender_postal_code,
      pricing_type: body.pricing_type || 'carrier',
      fixed_price: body.fixed_price,
      markup_type: body.markup_type,
      markup_value: body.markup_value,
      free_shipping_threshold: body.free_shipping_threshold,
      insurance_enabled: body.insurance_enabled,
      cod_enabled: body.cod_enabled,
      cod_fee: body.cod_fee,
      is_active: body.is_active !== false,
      is_default: body.is_default || false
    }, { onConflict: 'store_id,carrier_id' })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== SHIPMENTS ====================

app.get('/shipments', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const status = c.req.query('status');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  let query = supabase
    .from('shipments')
    .select(`*, carrier:shipping_carriers(name, name_ar, logo_url)`)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/shipments', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('shipments')
    .insert({
      store_id: storeId,
      order_id: body.order_id,
      carrier_id: body.carrier_id,
      recipient_name: body.recipient_name,
      recipient_phone: body.recipient_phone,
      recipient_email: body.recipient_email,
      recipient_address: body.recipient_address,
      recipient_city: body.recipient_city,
      recipient_district: body.recipient_district,
      recipient_postal_code: body.recipient_postal_code,
      package_count: body.package_count || 1,
      total_weight: body.total_weight,
      dimensions: body.dimensions,
      service_code: body.service_code,
      service_name: body.service_name,
      shipping_cost: body.shipping_cost,
      cod_amount: body.cod_amount,
      notes: body.notes,
      special_instructions: body.special_instructions
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.get('/shipments/:id/tracking', async (c) => {
  const supabase = getSupabase(c);
  const shipmentId = c.req.param('id');

  const { data, error } = await supabase
    .from('shipment_tracking')
    .select('*')
    .eq('shipment_id', shipmentId)
    .order('event_time', { ascending: false });

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== SHIPPING ZONES & RATES ====================

app.get('/zones', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('shipping_zones')
    .select(`*, rates:shipping_rates(*)`)
    .eq('store_id', storeId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/zones', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('shipping_zones')
    .insert({
      store_id: storeId,
      name: body.name,
      zone_type: body.zone_type || 'region',
      countries: body.countries,
      regions: body.regions,
      cities: body.cities,
      postal_codes: body.postal_codes
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/rates', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('shipping_rates')
    .insert({
      store_id: storeId,
      zone_id: body.zone_id,
      name: body.name,
      rate_type: body.rate_type || 'flat',
      base_rate: body.base_rate,
      per_kg_rate: body.per_kg_rate,
      per_item_rate: body.per_item_rate,
      min_order_amount: body.min_order_amount,
      max_order_amount: body.max_order_amount,
      free_shipping_threshold: body.free_shipping_threshold,
      estimated_days_min: body.estimated_days_min,
      estimated_days_max: body.estimated_days_max
    })
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

  const { count: totalShipments } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: pendingShipments } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('status', 'pending');

  const { count: inTransit } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('status', 'in_transit');

  const { count: delivered } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('status', 'delivered');

  return c.json({
    ok: true,
    data: {
      total_shipments: totalShipments || 0,
      pending: pendingShipments || 0,
      in_transit: inTransit || 0,
      delivered: delivered || 0
    }
  });
});

export default app;
