// ============================================================================
// MBUY Content Generator Worker Endpoints
// Feature #9 - مولد المحتوى التسويقي
// ============================================================================

import { Hono } from 'hono';

type RouteContext = { Variables: { user: any }; Bindings: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; AI?: any } };
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const contentGenerator = new Hono<RouteContext>();

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

// ============================================================================
// GET /secure/content/templates - Get content templates
// ============================================================================
contentGenerator.get('/templates', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    const type = c.req.query('type');
    const platform = c.req.query('platform');

    let query = supabase
      .from('content_templates')
      .select('*')
      .eq('is_active', true)
      .or(`store_id.is.null,store_id.eq.${storeId}`)
      .order('is_featured', { ascending: false })
      .order('usage_count', { ascending: false });

    if (type) query = query.eq('template_type', type);
    if (platform) query = query.eq('platform', platform);

    const { data, error } = await query;

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /secure/content/generate - Generate content
// ============================================================================
contentGenerator.post('/generate', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();
    const { template_id, content_type, platform, input_data, custom_prompt } = body;

    let prompt = custom_prompt || '';

    // If using template
    if (template_id) {
      const { data: template } = await supabase
        .from('content_templates')
        .select('*')
        .eq('id', template_id)
        .single();

      if (template) {
        prompt = template.template_content;
        // Replace variables
        Object.entries(input_data || {}).forEach(([key, value]) => {
          prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value as string);
        });

        // Update template usage
        await supabase
          .from('content_templates')
          .update({ usage_count: template.usage_count + 1 })
          .eq('id', template_id);
      }
    }

    // Get store settings for brand voice
    const { data: settings } = await supabase
      .from('content_settings')
      .select('*')
      .eq('store_id', storeId)
      .single();

    // Build AI prompt
    const systemPrompt = `أنت كاتب محتوى تسويقي محترف. 
${settings?.brand_voice ? `أسلوب العلامة التجارية: ${settings.brand_voice}` : ''}
${settings?.brand_tone ? `النبرة: ${settings.brand_tone}` : ''}
${settings?.include_emoji ? 'يمكنك استخدام الإيموجي بشكل معتدل.' : 'لا تستخدم الإيموجي.'}
${settings?.include_hashtags ? 'أضف هاشتاقات مناسبة في النهاية.' : ''}
اكتب محتوى جذاب وقصير ومؤثر باللغة العربية.`;

    // Call Cloudflare AI
    const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.8
    });

    const generatedText = aiResponse.response || '';

    // Generate variations
    const variationsResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `اكتب 2 نسخ بديلة مختلفة من هذا المحتوى:\n\n${generatedText}` }
      ],
      max_tokens: 1500,
      temperature: 0.9
    });

    const variations = variationsResponse.response?.split('\n\n').filter((v: string) => v.trim()) || [];

    // Save generated content
    const { data: saved, error: saveError } = await supabase
      .from('generated_content')
      .insert({
        store_id: storeId,
        user_id: user.sub,
        content_type: content_type || 'social_post',
        platform,
        template_id,
        input_data,
        prompt_used: prompt,
        generated_text: generatedText,
        variations,
        model_used: '@cf/meta/llama-3.1-8b-instruct',
        tokens_used: prompt.length + generatedText.length
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return c.json({
      ok: true,
      data: {
        id: saved.id,
        content: generatedText,
        variations
      }
    });
  } catch (error: any) {
    console.error('Error generating content:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/content/library - Get saved content
// ============================================================================
contentGenerator.get('/library', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const type = c.req.query('type');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    let query = supabase
      .from('content_library')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq('content_type', type);

    const { data, error, count } = await query;

    if (error) throw error;

    return c.json({
      ok: true,
      data,
      pagination: { total: count, limit, offset }
    });
  } catch (error: any) {
    console.error('Error fetching library:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /secure/content/library - Save content to library
// ============================================================================
contentGenerator.post('/library', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();
    const { title, content, content_type, category, tags, generated_content_id } = body;

    const { data, error } = await supabase
      .from('content_library')
      .insert({
        store_id: storeId,
        title,
        content,
        content_type,
        category,
        tags: tags || [],
        source: generated_content_id ? 'generated' : 'manual',
        generated_content_id
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error saving to library:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// DELETE /secure/content/library/:id - Delete from library
// ============================================================================
contentGenerator.delete('/library/:id', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const itemId = c.req.param('id');
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { error } = await supabase
      .from('content_library')
      .delete()
      .eq('id', itemId)
      .eq('store_id', storeId);

    if (error) throw error;

    return c.json({ ok: true, message: 'Content deleted' });
  } catch (error: any) {
    console.error('Error deleting content:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/content/history - Get generation history
// ============================================================================
contentGenerator.get('/history', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    const { data, error, count } = await supabase
      .from('generated_content')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .eq('user_id', user.sub)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return c.json({
      ok: true,
      data,
      pagination: { total: count, limit, offset }
    });
  } catch (error: any) {
    console.error('Error fetching history:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /secure/content/rate/:id - Rate generated content
// ============================================================================
contentGenerator.post('/rate/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const contentId = c.req.param('id');
    const body = await c.req.json();
    const { rating, feedback } = body;

    const { error } = await supabase
      .from('generated_content')
      .update({ rating, feedback })
      .eq('id', contentId);

    if (error) throw error;

    return c.json({ ok: true, message: 'Rating saved' });
  } catch (error: any) {
    console.error('Error rating content:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/content/settings - Get content settings
// ============================================================================
contentGenerator.get('/settings', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { data, error } = await supabase
      .from('content_settings')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return c.json({
      ok: true,
      data: data || {
        brand_voice: 'professional',
        default_language: 'ar',
        include_emoji: true,
        include_hashtags: true,
        max_hashtags: 5
      }
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// PUT /secure/content/settings - Update content settings
// ============================================================================
contentGenerator.put('/settings', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();

    const { data, error } = await supabase
      .from('content_settings')
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
    console.error('Error updating settings:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

export default contentGenerator;
