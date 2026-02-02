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

// Helper function to generate unique code
function generateUniqueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ==================== QR CODES ====================

app.get('/codes', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const type = c.req.query('type');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  let query = supabase
    .from('qr_codes')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (type) query = query.eq('qr_type', type);

  const { data, error } = await query;

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.get('/codes/:id', async (c) => {
  const supabase = getSupabase(c);
  const codeId = c.req.param('id');

  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('id', codeId)
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/codes', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  // Generate unique code
  const code = generateUniqueCode();

  const { data, error } = await supabase
    .from('qr_codes')
    .insert({
      store_id: storeId,
      name: body.name,
      code: code,
      qr_type: body.qr_type,
      target_id: body.target_id,
      target_url: body.target_url,
      is_dynamic: body.is_dynamic !== false,
      redirect_url: body.redirect_url || body.target_url,
      logo_url: body.logo_url,
      foreground_color: body.foreground_color || '#000000',
      background_color: body.background_color || '#FFFFFF',
      pattern_type: body.pattern_type || 'square',
      corner_type: body.corner_type || 'square',
      size: body.size || 300,
      frame_type: body.frame_type,
      frame_text: body.frame_text,
      frame_color: body.frame_color,
      track_scans: body.track_scans !== false,
      expires_at: body.expires_at,
      tags: body.tags,
      notes: body.notes
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.put('/codes/:id', async (c) => {
  const supabase = getSupabase(c);
  const codeId = c.req.param('id');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('qr_codes')
    .update({
      name: body.name,
      redirect_url: body.redirect_url,
      logo_url: body.logo_url,
      foreground_color: body.foreground_color,
      background_color: body.background_color,
      pattern_type: body.pattern_type,
      corner_type: body.corner_type,
      frame_type: body.frame_type,
      frame_text: body.frame_text,
      frame_color: body.frame_color,
      track_scans: body.track_scans,
      is_active: body.is_active,
      expires_at: body.expires_at,
      tags: body.tags,
      notes: body.notes
    })
    .eq('id', codeId)
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.delete('/codes/:id', async (c) => {
  const supabase = getSupabase(c);
  const codeId = c.req.param('id');

  const { error } = await supabase
    .from('qr_codes')
    .delete()
    .eq('id', codeId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true });
});

// ==================== QR SCANS ====================

app.get('/codes/:id/scans', async (c) => {
  const supabase = getSupabase(c);
  const codeId = c.req.param('id');
  const limit = parseInt(c.req.query('limit') || '100');

  const { data, error } = await supabase
    .from('qr_code_scans')
    .select('*')
    .eq('qr_code_id', codeId)
    .order('scanned_at', { ascending: false })
    .limit(limit);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Public scan endpoint
app.get('/scan/:code', async (c) => {
  const supabase = getSupabase(c);
  const code = c.req.param('code');
  const ip = c.req.header('cf-connecting-ip') || '';
  const userAgent = c.req.header('user-agent') || '';
  const sessionId = c.req.query('session') || generateUniqueCode();

  const { data, error } = await supabase
    .rpc('record_qr_scan', {
      p_code: code,
      p_ip: ip,
      p_user_agent: userAgent,
      p_session_id: sessionId
    });

  if (error || !data || data.length === 0) {
    return c.json({ ok: false, error: 'QR code not found' }, 404);
  }

  const result = data[0];
  
  if (result.redirect_url) {
    return c.redirect(result.redirect_url);
  }

  return c.json({ ok: true, data: result });
});

// ==================== TEMPLATES ====================

app.get('/templates', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('qr_code_templates')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/templates', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('qr_code_templates')
    .insert({
      store_id: storeId,
      name: body.name,
      logo_url: body.logo_url,
      foreground_color: body.foreground_color || '#000000',
      background_color: body.background_color || '#FFFFFF',
      pattern_type: body.pattern_type || 'square',
      corner_type: body.corner_type || 'square',
      frame_type: body.frame_type,
      frame_color: body.frame_color,
      is_default: body.is_default || false
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== CAMPAIGNS ====================

app.get('/campaigns', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('qr_code_campaigns')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

app.post('/campaigns', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('qr_code_campaigns')
    .insert({
      store_id: storeId,
      name: body.name,
      description: body.description,
      start_date: body.start_date,
      end_date: body.end_date,
      qr_code_ids: body.qr_code_ids || [],
      target_scans: body.target_scans,
      target_conversions: body.target_conversions,
      budget: body.budget,
      status: body.status || 'draft'
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// ==================== WIFI QR ====================

app.post('/wifi', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const code = generateUniqueCode();

  // Create QR code first
  const { data: qrCode, error: qrError } = await supabase
    .from('qr_codes')
    .insert({
      store_id: storeId,
      name: body.name || `WiFi: ${body.network_name}`,
      code: code,
      qr_type: 'wifi',
      is_dynamic: false,
      foreground_color: body.foreground_color || '#000000',
      background_color: body.background_color || '#FFFFFF'
    })
    .select()
    .single();

  if (qrError) return c.json({ ok: false, error: qrError.message }, 400);

  // Create WiFi details
  const { data, error } = await supabase
    .from('wifi_qr_codes')
    .insert({
      qr_code_id: qrCode.id,
      network_name: body.network_name,
      password: body.password,
      security_type: body.security_type || 'WPA',
      hidden: body.hidden || false
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data: { ...qrCode, wifi: data } });
});

// ==================== VCARD QR ====================

app.post('/vcard', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const code = generateUniqueCode();

  // Create QR code first
  const { data: qrCode, error: qrError } = await supabase
    .from('qr_codes')
    .insert({
      store_id: storeId,
      name: body.name || `VCard: ${body.first_name} ${body.last_name || ''}`,
      code: code,
      qr_type: 'vcard',
      is_dynamic: false,
      foreground_color: body.foreground_color || '#000000',
      background_color: body.background_color || '#FFFFFF'
    })
    .select()
    .single();

  if (qrError) return c.json({ ok: false, error: qrError.message }, 400);

  // Create VCard details
  const { data, error } = await supabase
    .from('vcard_qr_codes')
    .insert({
      qr_code_id: qrCode.id,
      first_name: body.first_name,
      last_name: body.last_name,
      organization: body.organization,
      title: body.title,
      phone: body.phone,
      mobile: body.mobile,
      email: body.email,
      website: body.website,
      address: body.address,
      city: body.city,
      country: body.country,
      notes: body.notes
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data: { ...qrCode, vcard: data } });
});

// ==================== PRINT JOBS ====================

app.post('/print', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('qr_code_print_jobs')
    .insert({
      store_id: storeId,
      name: body.name,
      qr_code_ids: body.qr_code_ids,
      paper_size: body.paper_size || 'A4',
      orientation: body.orientation || 'portrait',
      qr_per_page: body.qr_per_page || 1,
      qr_size: body.qr_size || 50,
      include_text: body.include_text !== false,
      text_position: body.text_position || 'below'
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

  const { count: totalCodes } = await supabase
    .from('qr_codes')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const { count: activeCodes } = await supabase
    .from('qr_codes')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('is_active', true);

  const { data: totalScans } = await supabase
    .from('qr_codes')
    .select('scan_count')
    .eq('store_id', storeId);

  const scans = totalScans?.reduce((sum, q) => sum + (q.scan_count || 0), 0) || 0;

  const { count: campaigns } = await supabase
    .from('qr_code_campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  return c.json({
    ok: true,
    data: {
      total_codes: totalCodes || 0,
      active_codes: activeCodes || 0,
      total_scans: scans,
      campaigns: campaigns || 0
    }
  });
});

export default app;
