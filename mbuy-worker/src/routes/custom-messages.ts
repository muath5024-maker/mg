import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../types';

const customMessages = new Hono<{ Bindings: Env }>();

// Get all templates
customMessages.get('/templates', async (c) => {
  const user = c.get('user' as never) as { id: string; store_id: string };
  const type = c.req.query('type');
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  let query = supabase
    .from('message_templates')
    .select('*')
    .eq('store_id', user.store_id)
    .order('is_system', { ascending: false })
    .order('name');
  
  if (type) {
    query = query.eq('template_type', type);
  }
  
  const { data, error } = await query;
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Get template by ID
customMessages.get('/templates/:id', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user' as never) as { id: string; store_id: string };
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('id', id)
    .eq('store_id', user.store_id)
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Create template
customMessages.post('/templates', async (c) => {
  const user = c.get('user' as never) as { id: string; store_id: string };
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('message_templates')
    .insert({
      store_id: user.store_id,
      name: body.name,
      description: body.description,
      template_type: body.template_type || 'custom',
      channels: body.channels || ['notification'],
      content: body.content || {},
      available_variables: body.available_variables || []
    })
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Update template
customMessages.put('/templates/:id', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user' as never) as { id: string; store_id: string };
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Don't allow editing system templates
  const { data: existing } = await supabase
    .from('message_templates')
    .select('is_system')
    .eq('id', id)
    .single();
  
  if (existing?.is_system) {
    return c.json({ ok: false, error: 'Cannot edit system templates' }, 400);
  }
  
  const { data, error } = await supabase
    .from('message_templates')
    .update({
      name: body.name,
      description: body.description,
      channels: body.channels,
      content: body.content,
      is_active: body.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('store_id', user.store_id)
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Delete template
customMessages.delete('/templates/:id', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user' as never) as { id: string; store_id: string };
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { error } = await supabase
    .from('message_templates')
    .delete()
    .eq('id', id)
    .eq('store_id', user.store_id)
    .eq('is_system', false);
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true });
});

// Get all campaigns
customMessages.get('/campaigns', async (c) => {
  const user = c.get('user' as never) as { id: string; store_id: string };
  const status = c.req.query('status');
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  let query = supabase
    .from('message_campaigns')
    .select(`
      *,
      template:message_templates(id, name)
    `)
    .eq('store_id', user.store_id)
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Get campaign by ID
customMessages.get('/campaigns/:id', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user' as never) as { id: string; store_id: string };
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('message_campaigns')
    .select(`
      *,
      template:message_templates(*)
    `)
    .eq('id', id)
    .eq('store_id', user.store_id)
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Create campaign
customMessages.post('/campaigns', async (c) => {
  const user = c.get('user' as never) as { id: string; store_id: string };
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('message_campaigns')
    .insert({
      store_id: user.store_id,
      name: body.name,
      description: body.description,
      template_id: body.template_id,
      channel: body.channel || 'notification',
      content: body.content || {},
      target_type: body.target_type || 'all',
      target_segment_id: body.target_segment_id,
      target_tag_id: body.target_tag_id,
      target_customers: body.target_customers,
      status: body.scheduled_at ? 'scheduled' : 'draft',
      scheduled_at: body.scheduled_at,
      created_by: user.id
    })
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Update campaign
customMessages.put('/campaigns/:id', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user' as never) as { id: string; store_id: string };
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('message_campaigns')
    .update({
      name: body.name,
      description: body.description,
      content: body.content,
      target_type: body.target_type,
      target_segment_id: body.target_segment_id,
      target_customers: body.target_customers,
      scheduled_at: body.scheduled_at,
      status: body.status
    })
    .eq('id', id)
    .eq('store_id', user.store_id)
    .eq('status', 'draft') // Only update draft campaigns
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Send campaign now
customMessages.post('/campaigns/:id/send', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user' as never) as { id: string; store_id: string };
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Queue messages
  const { data: count, error } = await supabase.rpc('queue_campaign_messages', {
    p_campaign_id: id
  });
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, queued: count });
});

// Cancel campaign
customMessages.post('/campaigns/:id/cancel', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user' as never) as { id: string; store_id: string };
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Update campaign status
  await supabase
    .from('message_campaigns')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('store_id', user.store_id);
  
  // Cancel pending queue items
  await supabase
    .from('message_queue')
    .update({ status: 'cancelled' })
    .eq('campaign_id', id)
    .eq('status', 'pending');
  
  return c.json({ ok: true });
});

// Get message history
customMessages.get('/history', async (c) => {
  const user = c.get('user' as never) as { id: string; store_id: string };
  const limit = parseInt(c.req.query('limit') || '50');
  const customerId = c.req.query('customer_id');
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  let query = supabase
    .from('message_history')
    .select(`
      *,
      customer:customers(id, full_name, phone)
    `)
    .eq('store_id', user.store_id)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (customerId) {
    query = query.eq('customer_id', customerId);
  }
  
  const { data, error } = await query;
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Get automated messages
customMessages.get('/automation', async (c) => {
  const user = c.get('user' as never) as { id: string; store_id: string };
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('automated_messages')
    .select(`
      *,
      template:message_templates(id, name)
    `)
    .eq('store_id', user.store_id)
    .order('created_at');
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Create automated message
customMessages.post('/automation', async (c) => {
  const user = c.get('user' as never) as { id: string; store_id: string };
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('automated_messages')
    .insert({
      store_id: user.store_id,
      name: body.name,
      trigger_type: body.trigger_type,
      trigger_config: body.trigger_config || {},
      template_id: body.template_id,
      channels: body.channels || ['notification'],
      content: body.content || {},
      is_active: body.is_active ?? true
    })
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Update automated message
customMessages.put('/automation/:id', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user' as never) as { id: string; store_id: string };
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('automated_messages')
    .update({
      name: body.name,
      trigger_config: body.trigger_config,
      template_id: body.template_id,
      channels: body.channels,
      content: body.content,
      is_active: body.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('store_id', user.store_id)
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Toggle automated message
customMessages.patch('/automation/:id/toggle', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user' as never) as { id: string; store_id: string };
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Get current state
  const { data: current } = await supabase
    .from('automated_messages')
    .select('is_active')
    .eq('id', id)
    .single();
  
  const { data, error } = await supabase
    .from('automated_messages')
    .update({ is_active: !current?.is_active })
    .eq('id', id)
    .eq('store_id', user.store_id)
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Delete automated message
customMessages.delete('/automation/:id', async (c) => {
  const { id } = c.req.param();
  const user = c.get('user' as never) as { id: string; store_id: string };
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { error } = await supabase
    .from('automated_messages')
    .delete()
    .eq('id', id)
    .eq('store_id', user.store_id);
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true });
});

// Get settings
customMessages.get('/settings', async (c) => {
  const user = c.get('user' as never) as { id: string; store_id: string };
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('message_settings')
    .select('*')
    .eq('store_id', user.store_id)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    return c.json({ ok: false, error: error.message }, 500);
  }
  
  return c.json({ ok: true, data: data || {} });
});

// Update settings
customMessages.put('/settings', async (c) => {
  const user = c.get('user' as never) as { id: string; store_id: string };
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('message_settings')
    .upsert({
      store_id: user.store_id,
      notifications_enabled: body.notifications_enabled,
      sms_enabled: body.sms_enabled,
      email_enabled: body.email_enabled,
      whatsapp_enabled: body.whatsapp_enabled,
      sms_sender_id: body.sms_sender_id,
      email_from_name: body.email_from_name,
      email_from_address: body.email_from_address,
      daily_limit_sms: body.daily_limit_sms,
      daily_limit_email: body.daily_limit_email,
      quiet_hours_start: body.quiet_hours_start,
      quiet_hours_end: body.quiet_hours_end,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Send test message
customMessages.post('/test', async (c) => {
  const user = c.get('user' as never) as { id: string; store_id: string };
  const body = await c.req.json();
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // For now, just return success - actual sending would be implemented
  // based on the channel (FCM, SMS provider, etc)
  
  return c.json({ 
    ok: true, 
    message: 'Test message would be sent',
    channel: body.channel,
    content: body.content
  });
});

// Get queue status
customMessages.get('/queue', async (c) => {
  const user = c.get('user' as never) as { id: string; store_id: string };
  const status = c.req.query('status');
  const limit = parseInt(c.req.query('limit') || '50');
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  let query = supabase
    .from('message_queue')
    .select('*')
    .eq('store_id', user.store_id)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) return c.json({ ok: false, error: error.message }, 500);
  return c.json({ ok: true, data });
});

// Get statistics
customMessages.get('/stats', async (c) => {
  const user = c.get('user' as never) as { id: string; store_id: string };
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Get message counts
  const [campaignsRes, historyRes, automationRes] = await Promise.all([
    supabase
      .from('message_campaigns')
      .select('status')
      .eq('store_id', user.store_id),
    supabase
      .from('message_history')
      .select('status')
      .eq('store_id', user.store_id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('automated_messages')
      .select('is_active, triggered_count, sent_count')
      .eq('store_id', user.store_id)
  ]);
  
  const campaigns = campaignsRes.data || [];
  const history = historyRes.data || [];
  const automation = automationRes.data || [];
  
  return c.json({
    ok: true,
    data: {
      campaigns: {
        total: campaigns.length,
        draft: campaigns.filter(c => c.status === 'draft').length,
        scheduled: campaigns.filter(c => c.status === 'scheduled').length,
        completed: campaigns.filter(c => c.status === 'completed').length
      },
      messages_30d: {
        total: history.length,
        sent: history.filter(h => h.status === 'sent' || h.status === 'delivered').length,
        failed: history.filter(h => h.status === 'failed').length
      },
      automation: {
        total: automation.length,
        active: automation.filter(a => a.is_active).length,
        triggered: automation.reduce((sum, a) => sum + (a.triggered_count || 0), 0),
        sent: automation.reduce((sum, a) => sum + (a.sent_count || 0), 0)
      }
    }
  });
});

export default customMessages;
