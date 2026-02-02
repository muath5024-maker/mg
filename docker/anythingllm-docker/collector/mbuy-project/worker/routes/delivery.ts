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

// ==================== DELIVERY METHODS ====================

app.get('/methods', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('delivery_methods')
    .select('*')
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
    .from('delivery_methods')
    .insert({
      store_id: storeId,
      name: body.name,
      name_ar: body.name_ar,
      type: body.type || 'shipping',
      description: body.description,
      description_ar: body.description_ar,
      price: body.price || 0,
      price_type: body.price_type || 'fixed',
      free_above: body.free_above,
      min_order_amount: body.min_order_amount,
      estimated_time: body.estimated_time,
      zones: body.zones,
      available_days: body.available_days,
      available_from: body.available_from,
      available_until: body.available_until,
      max_daily_orders: body.max_daily_orders,
      requires_address: body.requires_address !== false,
      display_order: body.display_order || 0,
      is_active: body.is_active !== false
    })
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
    .from('delivery_methods')
    .update({
      name: body.name,
      name_ar: body.name_ar,
      type: body.type,
      description: body.description,
      description_ar: body.description_ar,
      price: body.price,
      price_type: body.price_type,
      free_above: body.free_above,
      min_order_amount: body.min_order_amount,
      estimated_time: body.estimated_time,
      zones: body.zones,
      available_days: body.available_days,
      available_from: body.available_from,
      available_until: body.available_until,
      max_daily_orders: body.max_daily_orders,
      requires_address: body.requires_address,
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
    .from('delivery_methods')
    .delete()
    .eq('id', methodId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true });
});

// ==================== DELIVERY SLOTS ====================

app.get('/slots', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const methodId = c.req.query('method_id');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  let query = supabase
    .from('delivery_slots')
    .select(`*, method:delivery_methods(name, name_ar)`)
    .eq('store_id', storeId);

  if (methodId) query = query.eq('method_id', methodId);

  const { data, error } = await query.order('day_of_week').order('start_time');

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/slots', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('delivery_slots')
    .insert({
      store_id: storeId,
      method_id: body.method_id,
      day_of_week: body.day_of_week,
      start_time: body.start_time,
      end_time: body.end_time,
      max_orders: body.max_orders || 10,
      cutoff_hours: body.cutoff_hours || 2,
      extra_fee: body.extra_fee || 0
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.get('/slots/available', async (c) => {
  const supabase = getSupabase(c);
  const storeId = c.req.query('store_id');
  const methodId = c.req.query('method_id');
  const date = c.req.query('date');

  if (!storeId || !date) {
    return c.json({ ok: false, error: 'store_id and date are required' }, 400);
  }

  let query = supabase
    .from('delivery_slot_availability')
    .select(`*, slot:delivery_slots(*)`)
    .eq('date', date)
    .eq('is_available', true);

  const { data, error } = await query;

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/slots/book', async (c) => {
  const supabase = getSupabase(c);
  const body = await c.req.json();

  const { data, error } = await supabase
    .rpc('book_delivery_slot', {
      p_slot_id: body.slot_id,
      p_date: body.date,
      p_order_id: body.order_id
    });

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== PICKUP POINTS ====================

app.get('/pickup-points', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('pickup_points')
    .select('*')
    .eq('store_id', storeId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/pickup-points', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('pickup_points')
    .insert({
      store_id: storeId,
      name: body.name,
      name_ar: body.name_ar,
      address: body.address,
      city: body.city,
      district: body.district,
      latitude: body.latitude,
      longitude: body.longitude,
      phone: body.phone,
      working_hours: body.working_hours,
      preparation_time: body.preparation_time || 60,
      is_active: body.is_active !== false
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== DELIVERY TRACKING ====================

app.get('/tracking/:orderId', async (c) => {
  const supabase = getSupabase(c);
  const orderId = c.req.param('orderId');

  const { data, error } = await supabase
    .from('delivery_tracking')
    .select('*')
    .eq('order_id', orderId)
    .order('event_time', { ascending: false });

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/tracking', async (c) => {
  const supabase = getSupabase(c);
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('delivery_tracking')
    .insert({
      order_id: body.order_id,
      status: body.status,
      location: body.location,
      latitude: body.latitude,
      longitude: body.longitude,
      notes: body.notes,
      driver_id: body.driver_id
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== DELIVERY SETTINGS ====================

app.get('/settings', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('delivery_settings')
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
    .from('delivery_settings')
    .upsert({
      store_id: storeId,
      same_day_enabled: body.same_day_enabled,
      same_day_cutoff: body.same_day_cutoff,
      same_day_fee: body.same_day_fee,
      express_enabled: body.express_enabled,
      express_time: body.express_time,
      express_fee: body.express_fee,
      scheduled_enabled: body.scheduled_enabled,
      advance_booking_days: body.advance_booking_days,
      default_preparation_time: body.default_preparation_time,
      auto_assign_driver: body.auto_assign_driver,
      customer_tracking_enabled: body.customer_tracking_enabled,
      rating_enabled: body.rating_enabled,
      photo_proof_required: body.photo_proof_required,
      signature_required: body.signature_required
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

  const { count: totalMethods } = await supabase
    .from('delivery_methods')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: activeMethods } = await supabase
    .from('delivery_methods')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('is_active', true);

  const { count: pickupPoints } = await supabase
    .from('pickup_points')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('is_active', true);

  const { count: totalSlots } = await supabase
    .from('delivery_slots')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  return c.json({
    ok: true,
    data: {
      total_methods: totalMethods || 0,
      active_methods: activeMethods || 0,
      pickup_points: pickupPoints || 0,
      total_slots: totalSlots || 0
    }
  });
});

export default app;
