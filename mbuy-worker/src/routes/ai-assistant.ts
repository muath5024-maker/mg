// ============================================================================
// MBUY AI Assistant Worker Endpoints
// Feature #8 - مساعد AI الذكي
// ============================================================================

import { Hono } from 'hono';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Type for route context
type RouteContext = {
  Variables: { user: any };
  Bindings: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; AI: any };
};

const aiAssistant = new Hono<RouteContext>();

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

// System prompt for AI assistant
const SYSTEM_PROMPT = `أنت مساعد ذكي لأصحاب المتاجر الإلكترونية على منصة MBUY. 
مهمتك مساعدتهم في:
- كتابة أوصاف المنتجات
- إنشاء محتوى تسويقي
- تحليل البيانات وتقديم توصيات
- الرد على استفسارات العملاء
- تحسين أداء المتجر

كن موجزاً ومفيداً. استخدم اللغة العربية بشكل أساسي.`;

// ============================================================================
// GET /secure/ai/settings - Get AI assistant settings
// ============================================================================
aiAssistant.get('/settings', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { data, error } = await supabase
      .from('ai_assistant_settings')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return default settings if none exist
    if (!data) {
      return c.json({
        ok: true,
        data: {
          preferred_model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 2000,
          daily_messages_limit: 100,
          monthly_tokens_limit: 500000,
          language: 'ar',
          auto_suggest: true,
          show_sources: true,
          total_conversations: 0,
          total_messages: 0,
          total_tokens_used: 0
        }
      });
    }

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error fetching AI settings:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// PUT /secure/ai/settings - Update AI assistant settings
// ============================================================================
aiAssistant.put('/settings', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();

    const { data, error } = await supabase
      .from('ai_assistant_settings')
      .upsert({
        store_id: storeId,
        ...body,
        updated_at: new Date().toISOString()
      }, { onConflict: 'store_id' })
      .select()
      .single();

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error updating AI settings:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/ai/conversations - Get conversations list
// ============================================================================
aiAssistant.get('/conversations', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const status = c.req.query('status') || 'active';

    const { data, error, count } = await supabase
      .from('ai_conversations')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .eq('user_id', user.sub)
      .eq('status', status)
      .order('is_pinned', { ascending: false })
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return c.json({
      ok: true,
      data,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /secure/ai/conversations - Create new conversation
// ============================================================================
aiAssistant.post('/conversations', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();
    const { title, context_type } = body;

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        store_id: storeId,
        user_id: user.sub,
        title: title || 'محادثة جديدة',
        context_type: context_type || 'general'
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/ai/conversations/:id - Get conversation with messages
// ============================================================================
aiAssistant.get('/conversations/:id', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const conversationId = c.req.param('id');

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.sub)
      .single();

    if (convError) throw convError;

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    return c.json({
      ok: true,
      data: {
        ...conversation,
        messages
      }
    });
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /secure/ai/chat - Send message and get AI response
// ============================================================================
aiAssistant.post('/chat', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();
    const { conversation_id, message, context } = body;

    if (!message) {
      return c.json({ ok: false, error: 'Message is required' }, 400);
    }

    let conversationId = conversation_id;

    // Create conversation if not provided
    if (!conversationId) {
      const { data: newConv } = await supabase
        .from('ai_conversations')
        .insert({
          store_id: storeId,
          user_id: user.sub,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          context_type: context?.type || 'general'
        })
        .select()
        .single();
      
      conversationId = newConv?.id;
    }

    // Save user message
    await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        store_id: storeId,
        role: 'user',
        content: message,
        metadata: context || {}
      });

    // Get conversation history
    const { data: history } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Build messages for AI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []).map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    // Call Cloudflare AI
    const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      max_tokens: 2000,
      temperature: 0.7
    });

    const assistantMessage = aiResponse.response || 'عذراً، لم أتمكن من معالجة طلبك.';

    // Save assistant message
    const { data: savedMessage } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        store_id: storeId,
        role: 'assistant',
        content: assistantMessage,
        model_used: '@cf/meta/llama-3.1-8b-instruct',
        tokens_input: message.length,
        tokens_output: assistantMessage.length
      })
      .select()
      .single();

    // Update conversation
    await supabase
      .from('ai_conversations')
      .update({
        messages_count: (history?.length || 0) + 2,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    // Log usage
    await supabase
      .from('ai_usage_log')
      .insert({
        store_id: storeId,
        user_id: user.sub,
        usage_type: 'chat',
        feature: 'ai_assistant',
        model_used: '@cf/meta/llama-3.1-8b-instruct',
        tokens_input: message.length,
        tokens_output: assistantMessage.length,
        success: true
      });

    return c.json({
      ok: true,
      data: {
        conversation_id: conversationId,
        message: savedMessage
      }
    });
  } catch (error: any) {
    console.error('Error in AI chat:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /secure/ai/quick-command - Execute quick command
// ============================================================================
aiAssistant.post('/quick-command', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();
    const { command_id, selection, product, context } = body;

    // Get command
    const { data: cmd, error: cmdError } = await supabase
      .from('ai_quick_commands')
      .select('*')
      .eq('id', command_id)
      .single();

    if (cmdError || !cmd) {
      return c.json({ ok: false, error: 'Command not found' }, 404);
    }

    // Build prompt
    let prompt = cmd.prompt_template;
    prompt = prompt.replace('{{selection}}', selection || '');
    prompt = prompt.replace('{{context}}', JSON.stringify(context) || '');
    
    if (product) {
      prompt = prompt.replace('{{product.name}}', product.name || '');
      prompt = prompt.replace('{{product.description}}', product.description || '');
      prompt = prompt.replace('{{product.price}}', product.price || '');
      prompt = prompt.replace('{{product.category}}', product.category || '');
      prompt = prompt.replace('{{product.cost}}', product.cost || '');
    }

    // Call Cloudflare AI
    const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const result = aiResponse.response || '';

    // Update command usage
    await supabase
      .from('ai_quick_commands')
      .update({ usage_count: cmd.usage_count + 1 })
      .eq('id', command_id);

    // Log usage
    await supabase
      .from('ai_usage_log')
      .insert({
        store_id: storeId,
        user_id: user.sub,
        usage_type: 'quick_command',
        feature: cmd.command,
        model_used: '@cf/meta/llama-3.1-8b-instruct',
        tokens_input: prompt.length,
        tokens_output: result.length,
        success: true
      });

    return c.json({
      ok: true,
      data: {
        command: cmd.command,
        result
      }
    });
  } catch (error: any) {
    console.error('Error executing quick command:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/ai/commands - Get available quick commands
// ============================================================================
aiAssistant.get('/commands', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);

    const category = c.req.query('category');

    let query = supabase
      .from('ai_quick_commands')
      .select('*')
      .eq('is_active', true)
      .or(`store_id.is.null,store_id.eq.${storeId}`)
      .order('usage_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error fetching commands:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/ai/suggestions - Get AI suggestions
// ============================================================================
aiAssistant.get('/suggestions', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const status = c.req.query('status') || 'pending';

    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', status)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error fetching suggestions:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// PATCH /secure/ai/suggestions/:id - Update suggestion status
// ============================================================================
aiAssistant.patch('/suggestions/:id', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const suggestionId = c.req.param('id');
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();
    const { status } = body;

    const updateData: any = { status };
    if (status === 'applied') {
      updateData.applied_at = new Date().toISOString();
    } else if (status === 'dismissed') {
      updateData.dismissed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('ai_suggestions')
      .update(updateData)
      .eq('id', suggestionId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error updating suggestion:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// DELETE /secure/ai/conversations/:id - Delete conversation
// ============================================================================
aiAssistant.delete('/conversations/:id', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const conversationId = c.req.param('id');

    const { error } = await supabase
      .from('ai_conversations')
      .update({ status: 'deleted' })
      .eq('id', conversationId)
      .eq('user_id', user.sub);

    if (error) throw error;

    return c.json({ ok: true, message: 'Conversation deleted' });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// PATCH /secure/ai/conversations/:id/pin - Toggle pin conversation
// ============================================================================
aiAssistant.patch('/conversations/:id/pin', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const conversationId = c.req.param('id');

    // Get current state
    const { data: current } = await supabase
      .from('ai_conversations')
      .select('is_pinned')
      .eq('id', conversationId)
      .eq('user_id', user.sub)
      .single();

    const { error } = await supabase
      .from('ai_conversations')
      .update({ is_pinned: !current?.is_pinned })
      .eq('id', conversationId)
      .eq('user_id', user.sub);

    if (error) throw error;

    return c.json({ ok: true, is_pinned: !current?.is_pinned });
  } catch (error: any) {
    console.error('Error toggling pin:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /secure/ai/messages/:id/rate - Rate a message
// ============================================================================
aiAssistant.post('/messages/:id/rate', async (c) => {
  try {
    const supabase = getSupabase(c);
    const messageId = c.req.param('id');
    const body = await c.req.json();
    const { rating, feedback } = body;

    const { error } = await supabase
      .from('ai_messages')
      .update({ rating, feedback })
      .eq('id', messageId);

    if (error) throw error;

    return c.json({ ok: true, message: 'Rating saved' });
  } catch (error: any) {
    console.error('Error rating message:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/ai/usage - Get AI usage stats
// ============================================================================
aiAssistant.get('/usage', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const days = parseInt(c.req.query('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get usage stats
    const { data: usage } = await supabase
      .from('ai_usage_log')
      .select('usage_type, tokens_input, tokens_output, cost_credits')
      .eq('store_id', storeId)
      .gte('created_at', startDate.toISOString());

    // Aggregate
    const stats = {
      total_requests: usage?.length || 0,
      total_tokens_input: 0,
      total_tokens_output: 0,
      total_cost: 0,
      by_type: {} as any
    };

    (usage || []).forEach((u: any) => {
      stats.total_tokens_input += u.tokens_input || 0;
      stats.total_tokens_output += u.tokens_output || 0;
      stats.total_cost += parseFloat(u.cost_credits) || 0;
      
      if (!stats.by_type[u.usage_type]) {
        stats.by_type[u.usage_type] = { count: 0, tokens: 0 };
      }
      stats.by_type[u.usage_type].count += 1;
      stats.by_type[u.usage_type].tokens += (u.tokens_input || 0) + (u.tokens_output || 0);
    });

    return c.json({ ok: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching usage:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

export default aiAssistant;
