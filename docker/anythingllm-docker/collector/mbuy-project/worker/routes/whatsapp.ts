// ============================================================================
// MBUY WhatsApp Integration Worker Endpoints
// Feature #22 - تكامل واتساب للتواصل والتسويق
// ============================================================================

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

// ==================== WHATSAPP SETTINGS ====================

app.get('/settings', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error && error.code !== 'PGRST116') return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data: data || {} });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.post('/settings', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const body = await c.req.json();

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('whatsapp_settings')
      .upsert({
        store_id: storeId,
        phone_number: body.phone_number,
        phone_number_id: body.phone_number_id,
        business_account_id: body.business_account_id,
        api_token: body.api_token,
        webhook_verify_token: body.webhook_verify_token,
        business_name: body.business_name,
        business_description: body.business_description,
        business_category: body.business_category,
        business_website: body.business_website,
        business_email: body.business_email,
        business_address: body.business_address,
        auto_reply_enabled: body.auto_reply_enabled,
        catalog_enabled: body.catalog_enabled,
        order_notifications_enabled: body.order_notifications_enabled,
        shipping_updates_enabled: body.shipping_updates_enabled,
        working_hours: body.working_hours,
        auto_reply_outside_hours: body.auto_reply_outside_hours,
        outside_hours_message: body.outside_hours_message,
        outside_hours_message_ar: body.outside_hours_message_ar,
        is_active: body.is_active !== false
      }, { onConflict: 'store_id' })
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ==================== TEMPLATES ====================

app.get('/templates', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.post('/templates', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const body = await c.req.json();

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .insert({
        store_id: storeId,
        name: body.name,
        template_id: body.template_id,
        language: body.language || 'ar',
        category: body.category || 'UTILITY',
        header_type: body.header_type,
        header_content: body.header_content,
        body_text: body.body_text,
        footer_text: body.footer_text,
        buttons: body.buttons || [],
        variables: body.variables || [],
        status: 'draft'
      })
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data }, 201);
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.put('/templates/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const templateId = c.req.param('id');
    const body = await c.req.json();

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .update({
        name: body.name,
        template_id: body.template_id,
        language: body.language,
        category: body.category,
        header_type: body.header_type,
        header_content: body.header_content,
        body_text: body.body_text,
        footer_text: body.footer_text,
        buttons: body.buttons,
        variables: body.variables
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.delete('/templates/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const templateId = c.req.param('id');

    const { error } = await supabase
      .from('whatsapp_templates')
      .delete()
      .eq('id', templateId);

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ==================== QUICK REPLIES ====================

app.get('/quick-replies', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('whatsapp_quick_replies')
      .select('*')
      .eq('store_id', storeId)
      .order('display_order');

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.post('/quick-replies', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const body = await c.req.json();

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('whatsapp_quick_replies')
      .insert({
        store_id: storeId,
        shortcut: body.shortcut,
        title: body.title,
        title_ar: body.title_ar,
        message_text: body.message_text,
        message_text_ar: body.message_text_ar,
        media_url: body.media_url,
        media_type: body.media_type,
        category: body.category || 'general',
        display_order: body.display_order || 0,
        is_active: body.is_active !== false
      })
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data }, 201);
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.put('/quick-replies/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const replyId = c.req.param('id');
    const body = await c.req.json();

    const { data, error } = await supabase
      .from('whatsapp_quick_replies')
      .update({
        shortcut: body.shortcut,
        title: body.title,
        title_ar: body.title_ar,
        message_text: body.message_text,
        message_text_ar: body.message_text_ar,
        media_url: body.media_url,
        media_type: body.media_type,
        category: body.category,
        display_order: body.display_order,
        is_active: body.is_active
      })
      .eq('id', replyId)
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.delete('/quick-replies/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const replyId = c.req.param('id');

    const { error } = await supabase
      .from('whatsapp_quick_replies')
      .delete()
      .eq('id', replyId);

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ==================== AUTO REPLIES ====================

app.get('/auto-replies', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('whatsapp_auto_replies')
      .select('*')
      .eq('store_id', storeId)
      .order('priority');

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.post('/auto-replies', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const body = await c.req.json();

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('whatsapp_auto_replies')
      .insert({
        store_id: storeId,
        name: body.name,
        trigger_type: body.trigger_type || 'keyword',
        keywords: body.keywords || [],
        match_type: body.match_type || 'contains',
        response_text: body.response_text,
        response_text_ar: body.response_text_ar,
        media_url: body.media_url,
        media_type: body.media_type,
        delay_seconds: body.delay_seconds || 0,
        active_days: body.active_days || [0,1,2,3,4,5,6],
        active_from: body.active_from,
        active_until: body.active_until,
        max_triggers_per_user: body.max_triggers_per_user || 1,
        cooldown_hours: body.cooldown_hours || 24,
        priority: body.priority || 0,
        is_active: body.is_active !== false
      })
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data }, 201);
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.put('/auto-replies/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const replyId = c.req.param('id');
    const body = await c.req.json();

    const { data, error } = await supabase
      .from('whatsapp_auto_replies')
      .update({
        name: body.name,
        trigger_type: body.trigger_type,
        keywords: body.keywords,
        match_type: body.match_type,
        response_text: body.response_text,
        response_text_ar: body.response_text_ar,
        media_url: body.media_url,
        media_type: body.media_type,
        delay_seconds: body.delay_seconds,
        active_days: body.active_days,
        active_from: body.active_from,
        active_until: body.active_until,
        max_triggers_per_user: body.max_triggers_per_user,
        cooldown_hours: body.cooldown_hours,
        priority: body.priority,
        is_active: body.is_active
      })
      .eq('id', replyId)
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.delete('/auto-replies/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const replyId = c.req.param('id');

    const { error } = await supabase
      .from('whatsapp_auto_replies')
      .delete()
      .eq('id', replyId);

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ==================== CONVERSATIONS ====================

app.get('/conversations', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const status = c.req.query('status');

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    let query = supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('store_id', storeId)
      .order('last_message_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.get('/conversations/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const conversationId = c.req.param('id');

    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.put('/conversations/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const conversationId = c.req.param('id');
    const body = await c.req.json();

    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .update({
        status: body.status,
        assigned_to: body.assigned_to,
        tags: body.tags,
        priority: body.priority
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.get('/conversations/:id/messages', async (c) => {
  try {
    const supabase = getSupabase(c);
    const conversationId = c.req.param('id');

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ==================== SEND MESSAGE ====================

app.post('/send', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const body = await c.req.json();

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    // Get WhatsApp settings
    const { data: settings } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .single();

    if (!settings) {
      return c.json({ ok: false, error: 'WhatsApp not configured' }, 400);
    }

    // Create or get conversation
    let conversationId = body.conversation_id;
    if (!conversationId && body.phone_number) {
      const { data: existingConv } = await supabase
        .from('whatsapp_conversations')
        .select('id')
        .eq('store_id', storeId)
        .eq('phone_number', body.phone_number)
        .single();

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        const { data: newConv } = await supabase
          .from('whatsapp_conversations')
          .insert({
            store_id: storeId,
            phone_number: body.phone_number,
            customer_name: body.customer_name,
            status: 'active'
          })
          .select()
          .single();
        conversationId = newConv?.id;
      }
    }

    // Log the message
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert({
        store_id: storeId,
        conversation_id: conversationId,
        message_type: body.message_type || 'text',
        direction: 'outbound',
        text_content: body.text_content,
        media_url: body.media_url,
        media_mime_type: body.media_mime_type,
        template_name: body.template_name,
        template_variables: body.template_variables,
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);

    // Update conversation last message
    await supabase
      .from('whatsapp_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: body.text_content?.substring(0, 100),
        last_message_direction: 'outbound'
      })
      .eq('id', conversationId);

    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ==================== BROADCASTS ====================

app.get('/broadcasts', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('whatsapp_broadcasts')
      .select('*, whatsapp_templates(name)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.post('/broadcasts', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const body = await c.req.json();

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('whatsapp_broadcasts')
      .insert({
        store_id: storeId,
        name: body.name,
        template_id: body.template_id,
        audience_type: body.audience_type || 'all',
        segment_id: body.segment_id,
        phone_numbers: body.phone_numbers,
        template_variables: body.template_variables || {},
        scheduled_at: body.scheduled_at,
        status: body.scheduled_at ? 'scheduled' : 'draft',
        total_recipients: body.phone_numbers?.length || 0
      })
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data }, 201);
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.get('/broadcasts/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const broadcastId = c.req.param('id');

    const { data, error } = await supabase
      .from('whatsapp_broadcasts')
      .select('*, whatsapp_templates(name, body_text)')
      .eq('id', broadcastId)
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.get('/broadcasts/:id/recipients', async (c) => {
  try {
    const supabase = getSupabase(c);
    const broadcastId = c.req.param('id');

    const { data, error } = await supabase
      .from('whatsapp_broadcast_recipients')
      .select('*')
      .eq('broadcast_id', broadcastId)
      .order('created_at');

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.put('/broadcasts/:id/cancel', async (c) => {
  try {
    const supabase = getSupabase(c);
    const broadcastId = c.req.param('id');

    const { data, error } = await supabase
      .from('whatsapp_broadcasts')
      .update({ status: 'cancelled' })
      .eq('id', broadcastId)
      .eq('status', 'scheduled')
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ==================== CATALOG SYNC ====================

app.get('/catalog', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('whatsapp_catalog_items')
      .select('*, products(name, price, image_url)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.post('/catalog/sync', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const body = await c.req.json();

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { product_ids } = body;

    // Create catalog items for products
    const items = product_ids.map((product_id: string) => ({
      store_id: storeId,
      product_id,
      sync_status: 'pending'
    }));

    const { data, error } = await supabase
      .from('whatsapp_catalog_items')
      .upsert(items, { onConflict: 'store_id,product_id' })
      .select();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.delete('/catalog/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const itemId = c.req.param('id');

    const { error } = await supabase
      .from('whatsapp_catalog_items')
      .delete()
      .eq('id', itemId);

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ==================== STATS ====================

app.get('/stats', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { count: messagesCount } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);

    const { count: conversationsCount } = await supabase
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);

    const { count: activeConversations } = await supabase
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('status', 'active');

    const { count: templatesCount } = await supabase
      .from('whatsapp_templates')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);

    const { count: broadcastsCount } = await supabase
      .from('whatsapp_broadcasts')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);

    return c.json({
      ok: true,
      data: {
        total_messages: messagesCount || 0,
        total_conversations: conversationsCount || 0,
        active_conversations: activeConversations || 0,
        templates: templatesCount || 0,
        broadcasts: broadcastsCount || 0
      }
    });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

export default app;
