import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env, AuthContext } from '../types';

const customerSegments = new Hono<{ Bindings: Env; Variables: AuthContext }>();

// Get all segments for store
customerSegments.get('/segments', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('customer_segments')
    .select('*')
    .eq('store_id', merchantId)
    .order('priority', { ascending: true });
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Get segment by ID with customers
customerSegments.get('/segments/:id', async (c) => {
  const { id } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const [segmentRes, customersRes] = await Promise.all([
    supabase
      .from('customer_segments')
      .select('*')
      .eq('id', id)
      .eq('store_id', merchantId)
      .single(),
    supabase
      .from('segment_customers')
      .select(`
        *,
        customer:customers(id, full_name, phone, email, avatar_url)
      `)
      .eq('segment_id', id)
      .order('added_at', { ascending: false })
      .limit(100)
  ]);
  
  if (segmentRes.error) return c.json({ ok: false, error: segmentRes.error.message }, 500);
  
  return c.json({ 
    ok: true, 
    data: {
      ...segmentRes.data,
      customers: customersRes.data || []
    }
  });
});

// Create segment
customerSegments.post('/segments', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('customer_segments')
    .insert({
      store_id: merchantId,
      name: body.name,
      description: body.description,
      segment_type: body.segment_type || 'custom',
      criteria: body.criteria || {},
      color: body.color || '#6366F1',
      icon: body.icon || 'group'
    })
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  
  // Auto-assign customers if it's an auto segment
  if (data.segment_type === 'auto') {
    await supabase.rpc('auto_assign_segment_customers', { p_segment_id: data.id });
  }
  
  return c.json({ ok: true, data });
});

// Update segment
customerSegments.put('/segments/:id', async (c) => {
  const { id } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('customer_segments')
    .update({
      name: body.name,
      description: body.description,
      criteria: body.criteria,
      color: body.color,
      icon: body.icon,
      is_active: body.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('store_id', merchantId)
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Delete segment
customerSegments.delete('/segments/:id', async (c) => {
  const { id } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { error } = await supabase
    .from('customer_segments')
    .delete()
    .eq('id', id)
    .eq('store_id', merchantId);
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true });
});

// Refresh auto segment
customerSegments.post('/segments/:id/refresh', async (c) => {
  const { id } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Verify ownership
  const { data: segment } = await supabase
    .from('customer_segments')
    .select('id')
    .eq('id', id)
    .eq('store_id', merchantId)
    .single();
  
  if (!segment) return c.json({ ok: false, error: 'Segment not found' }, 404);
  
  const { data, error } = await supabase.rpc('auto_assign_segment_customers', {
    p_segment_id: id
  });
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, assigned: data });
});

// Add customer to segment manually
customerSegments.post('/segments/:id/customers', async (c) => {
  const { id } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('segment_customers')
    .insert({
      segment_id: id,
      customer_id: body.customer_id,
      store_id: merchantId,
      added_reason: 'manual',
      added_by: userId
    })
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  
  // Update count
  await supabase.rpc('exec_sql', {
    sql: `UPDATE customer_segments SET customer_count = customer_count + 1, updated_at = NOW() WHERE id = '${id}'`
  });
  
  return c.json({ ok: true, data });
});

// Remove customer from segment
customerSegments.delete('/segments/:segmentId/customers/:customerId', async (c) => {
  const { segmentId, customerId } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { error } = await supabase
    .from('segment_customers')
    .delete()
    .eq('segment_id', segmentId)
    .eq('customer_id', customerId)
    .eq('store_id', merchantId);
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  
  // Update count
  await supabase.rpc('exec_sql', {
    sql: `UPDATE customer_segments SET customer_count = customer_count - 1, updated_at = NOW() WHERE id = '${segmentId}'`
  });
  
  return c.json({ ok: true });
});

// Get all tags
customerSegments.get('/tags', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('customer_tags')
    .select('*')
    .eq('store_id', merchantId)
    .order('name');
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Create tag
customerSegments.post('/tags', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('customer_tags')
    .insert({
      store_id: merchantId,
      name: body.name,
      color: body.color || '#3B82F6',
      description: body.description
    })
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Delete tag
customerSegments.delete('/tags/:id', async (c) => {
  const { id } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { error } = await supabase
    .from('customer_tags')
    .delete()
    .eq('id', id)
    .eq('store_id', merchantId);
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true });
});

// Get customer analytics for store
customerSegments.get('/analytics', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const tier = c.req.query('tier');
  const limit = parseInt(c.req.query('limit') || '50');
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  let query = supabase
    .from('customer_analytics')
    .select(`
      *,
      customer:customers(id, full_name, phone, email, avatar_url)
    `)
    .eq('store_id', merchantId)
    .order('total_spent', { ascending: false })
    .limit(limit);
  
  if (tier) {
    query = query.eq('customer_tier', tier);
  }
  
  const { data, error } = await query;
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Get analytics summary
customerSegments.get('/analytics/summary', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('customer_analytics')
    .select('customer_tier')
    .eq('store_id', merchantId);
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  
  const tiers = data.reduce((acc: Record<string, number>, item) => {
    const tier = item.customer_tier || 'unknown';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});
  
  return c.json({ 
    ok: true, 
    data: {
      total: data.length,
      tiers
    }
  });
});

// Calculate RFM for a customer
customerSegments.post('/analytics/calculate/:customerId', async (c) => {
  const { customerId } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { error } = await supabase.rpc('calculate_customer_rfm', {
    p_customer_id: customerId,
    p_store_id: merchantId
  });
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true });
});

// Bulk calculate RFM for all customers
customerSegments.post('/analytics/calculate-all', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Get all customers who have ordered from this store
  const { data: customers } = await supabase
    .from('orders')
    .select('customer_id')
    .eq('store_id', merchantId)
    .not('customer_id', 'is', null);
  
  if (!customers) return c.json({ ok: true, processed: 0 });
  
  const uniqueCustomers = [...new Set(customers.map(c => c.customer_id))];
  
  // Calculate RFM for each customer
  for (const customerId of uniqueCustomers) {
    await supabase.rpc('calculate_customer_rfm', {
      p_customer_id: customerId,
      p_store_id: merchantId
    });
  }
  
  return c.json({ ok: true, processed: uniqueCustomers.length });
});

// Assign tag to customer
customerSegments.post('/customers/:customerId/tags', async (c) => {
  const { customerId } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('customer_tag_assignments')
    .insert({
      customer_id: customerId,
      tag_id: body.tag_id,
      store_id: merchantId,
      assigned_by: userId
    })
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Remove tag from customer
customerSegments.delete('/customers/:customerId/tags/:tagId', async (c) => {
  const { customerId, tagId } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { error } = await supabase
    .from('customer_tag_assignments')
    .delete()
    .eq('customer_id', customerId)
    .eq('tag_id', tagId)
    .eq('store_id', merchantId);
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true });
});

// Get customer tags
customerSegments.get('/customers/:customerId/tags', async (c) => {
  const { customerId } = c.req.param();
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('customer_tag_assignments')
    .select(`
      *,
      tag:customer_tags(*)
    `)
    .eq('customer_id', customerId)
    .eq('store_id', merchantId);
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data: data.map(d => d.tag) });
});

// Get segment campaigns
customerSegments.get('/campaigns', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const status = c.req.query('status');
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  let query = supabase
    .from('segment_campaigns')
    .select(`
      *,
      segment:customer_segments(id, name, color, customer_count)
    `)
    .eq('store_id', merchantId)
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Create campaign for segment
customerSegments.post('/campaigns', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Get segment customer count
  const { data: segment } = await supabase
    .from('customer_segments')
    .select('customer_count')
    .eq('id', body.segment_id)
    .single();
  
  const { data, error } = await supabase
    .from('segment_campaigns')
    .insert({
      segment_id: body.segment_id,
      store_id: merchantId,
      name: body.name,
      campaign_type: body.campaign_type,
      content: body.content || {},
      status: body.status || 'draft',
      scheduled_at: body.scheduled_at,
      target_count: segment?.customer_count || 0,
      created_by: userId
    })
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

export default customerSegments;
