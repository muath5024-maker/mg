// ============================================================================
// MBUY Smart Pricing Worker Endpoints
// Feature #10 - التسعير الذكي
// ============================================================================

import { Hono } from 'hono';

type RouteContext = { Variables: { user: any }; Bindings: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; AI?: any } };
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const smartPricing = new Hono<RouteContext>();

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
// GET /secure/pricing/settings - Get pricing settings
// ============================================================================
smartPricing.get('/settings', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { data, error } = await supabase
      .from('pricing_settings')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return c.json({
      ok: true,
      data: data || {
        auto_pricing_enabled: false,
        competitor_matching_enabled: false,
        demand_pricing_enabled: false,
        default_margin_percent: 30,
        min_margin_percent: 10,
        max_margin_percent: 100,
        competitor_strategy: 'match',
        rounding_strategy: 'nearest',
        rounding_amount: 1,
        alert_on_margin_below: 15,
        alert_on_competitor_lower: true
      }
    });
  } catch (error: any) {
    console.error('Error fetching pricing settings:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// PUT /secure/pricing/settings - Update pricing settings
// ============================================================================
smartPricing.put('/settings', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();

    const { data, error } = await supabase
      .from('pricing_settings')
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
    console.error('Error updating pricing settings:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/pricing/rules - Get pricing rules
// ============================================================================
smartPricing.get('/rules', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('store_id', storeId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error fetching rules:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /secure/pricing/rules - Create pricing rule
// ============================================================================
smartPricing.post('/rules', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();

    const { data, error } = await supabase
      .from('pricing_rules')
      .insert({
        store_id: storeId,
        ...body
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error creating rule:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// PATCH /secure/pricing/rules/:id - Update pricing rule
// ============================================================================
smartPricing.patch('/rules/:id', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const ruleId = c.req.param('id');
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();

    const { data, error } = await supabase
      .from('pricing_rules')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', ruleId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error updating rule:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// DELETE /secure/pricing/rules/:id - Delete pricing rule
// ============================================================================
smartPricing.delete('/rules/:id', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const ruleId = c.req.param('id');
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { error } = await supabase
      .from('pricing_rules')
      .delete()
      .eq('id', ruleId)
      .eq('store_id', storeId);

    if (error) throw error;

    return c.json({ ok: true, message: 'Rule deleted' });
  } catch (error: any) {
    console.error('Error deleting rule:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/pricing/competitors - Get competitor prices
// ============================================================================
smartPricing.get('/competitors', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const productId = c.req.query('product_id');

    let query = supabase
      .from('competitor_prices')
      .select(`
        *,
        product:products(id, name, price)
      `)
      .eq('store_id', storeId)
      .order('scraped_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error fetching competitors:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /secure/pricing/competitors - Add competitor price
// ============================================================================
smartPricing.post('/competitors', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();
    const { product_id, competitor_name, competitor_url, price, in_stock } = body;

    const { data, error } = await supabase
      .from('competitor_prices')
      .insert({
        store_id: storeId,
        product_id,
        competitor_name,
        competitor_url,
        price,
        in_stock: in_stock ?? true,
        source: 'manual'
      })
      .select()
      .single();

    if (error) throw error;

    // Check if we should create an alert
    const { data: product } = await supabase
      .from('products')
      .select('price, name')
      .eq('id', product_id)
      .single();

    if (product && price < product.price) {
      await supabase
        .from('price_alerts')
        .insert({
          store_id: storeId,
          product_id,
          alert_type: 'competitor_lower',
          severity: 'high',
          title: `منافس بسعر أقل: ${product.name}`,
          message: `${competitor_name} يبيع المنتج بسعر ${price} ريال (سعرك: ${product.price} ريال)`,
          data: { competitor_name, competitor_price: price, your_price: product.price },
          suggested_action: 'decrease',
          suggested_price: price
        });
    }

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error adding competitor:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/pricing/history - Get price history
// ============================================================================
smartPricing.get('/history', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const productId = c.req.query('product_id');
    const limit = parseInt(c.req.query('limit') || '50');

    let query = supabase
      .from('price_history')
      .select(`
        *,
        product:products(id, name)
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error fetching history:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/pricing/alerts - Get price alerts
// ============================================================================
smartPricing.get('/alerts', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const status = c.req.query('status') || 'pending';

    const { data, error } = await supabase
      .from('price_alerts')
      .select(`
        *,
        product:products(id, name, price, image_url)
      `)
      .eq('store_id', storeId)
      .eq('status', status)
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// PATCH /secure/pricing/alerts/:id - Update alert status
// ============================================================================
smartPricing.patch('/alerts/:id', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const alertId = c.req.param('id');
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();
    const { status } = body;

    const updateData: any = { status };
    if (status === 'actioned') updateData.actioned_at = new Date().toISOString();
    if (status === 'dismissed') updateData.dismissed_at = new Date().toISOString();

    const { error } = await supabase
      .from('price_alerts')
      .update(updateData)
      .eq('id', alertId)
      .eq('store_id', storeId);

    if (error) throw error;

    return c.json({ ok: true, message: 'Alert updated' });
  } catch (error: any) {
    console.error('Error updating alert:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/pricing/suggestions - Get price suggestions
// ============================================================================
smartPricing.get('/suggestions', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { data, error } = await supabase
      .from('price_suggestions')
      .select(`
        *,
        product:products(id, name, price, cost, image_url)
      `)
      .eq('store_id', storeId)
      .eq('status', 'pending')
      .order('confidence_score', { ascending: false });

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error fetching suggestions:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /secure/pricing/suggestions/:id/apply - Apply price suggestion
// ============================================================================
smartPricing.post('/suggestions/:id/apply', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const suggestionId = c.req.param('id');
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    // Get suggestion
    const { data: suggestion } = await supabase
      .from('price_suggestions')
      .select('*')
      .eq('id', suggestionId)
      .eq('store_id', storeId)
      .single();

    if (!suggestion) {
      return c.json({ ok: false, error: 'Suggestion not found' }, 404);
    }

    // Update product price
    const { error: updateError } = await supabase
      .from('products')
      .update({ price: suggestion.suggested_price })
      .eq('id', suggestion.product_id);

    if (updateError) throw updateError;

    // Log the change
    await supabase
      .from('price_history')
      .insert({
        store_id: storeId,
        product_id: suggestion.product_id,
        old_price: suggestion.current_price,
        new_price: suggestion.suggested_price,
        change_type: 'suggestion',
        change_reason: suggestion.reasoning,
        created_by: user.sub
      });

    // Update suggestion status
    await supabase
      .from('price_suggestions')
      .update({ status: 'applied', applied_at: new Date().toISOString() })
      .eq('id', suggestionId);

    return c.json({ ok: true, message: 'Price updated' });
  } catch (error: any) {
    console.error('Error applying suggestion:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /secure/pricing/suggestions/:id/reject - Reject price suggestion
// ============================================================================
smartPricing.post('/suggestions/:id/reject', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const suggestionId = c.req.param('id');
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();
    const { reason } = body;

    await supabase
      .from('price_suggestions')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', suggestionId)
      .eq('store_id', storeId);

    return c.json({ ok: true, message: 'Suggestion rejected' });
  } catch (error: any) {
    console.error('Error rejecting suggestion:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /secure/pricing/analyze/:product_id - Analyze product pricing
// ============================================================================
smartPricing.post('/analyze/:product_id', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const productId = c.req.param('product_id');
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    // Get product
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('store_id', storeId)
      .single();

    if (!product) {
      return c.json({ ok: false, error: 'Product not found' }, 404);
    }

    // Get competitor prices
    const { data: competitors } = await supabase
      .from('competitor_prices')
      .select('*')
      .eq('product_id', productId)
      .eq('in_stock', true)
      .order('scraped_at', { ascending: false });

    // Get settings
    const { data: settings } = await supabase
      .from('pricing_settings')
      .select('*')
      .eq('store_id', storeId)
      .single();

    // Calculate suggested price
    let suggestedPrice = product.price;
    let reasoning = '';
    let confidence = 0.5;

    const competitorPrices = competitors?.map((c: any) => c.price) || [];
    const avgCompetitorPrice = competitorPrices.length > 0 
      ? competitorPrices.reduce((a: number, b: number) => a + b, 0) / competitorPrices.length 
      : null;
    const minCompetitorPrice = competitorPrices.length > 0 
      ? Math.min(...competitorPrices) 
      : null;

    if (minCompetitorPrice && product.price > minCompetitorPrice * 1.1) {
      // Our price is >10% higher than lowest competitor
      const strategy = settings?.competitor_strategy || 'match';
      if (strategy === 'beat') {
        suggestedPrice = minCompetitorPrice * 0.95;
        reasoning = 'سعرك أعلى من المنافسين. نقترح خفض السعر للمنافسة.';
      } else if (strategy === 'match') {
        suggestedPrice = minCompetitorPrice;
        reasoning = 'سعرك أعلى من المنافسين. نقترح مطابقة أقل سعر.';
      }
      confidence = 0.8;
    } else if (product.cost && product.price < product.cost * 1.1) {
      // Margin too low
      suggestedPrice = product.cost * (1 + (settings?.default_margin_percent || 30) / 100);
      reasoning = 'هامش الربح منخفض جداً. نقترح رفع السعر.';
      confidence = 0.9;
    }

    // Round price
    if (settings?.rounding_strategy === 'psychological') {
      suggestedPrice = Math.ceil(suggestedPrice) - 0.01;
    } else {
      suggestedPrice = Math.round(suggestedPrice);
    }

    const analysis = {
      current_price: product.price,
      cost_price: product.cost,
      current_margin: product.cost ? ((product.price - product.cost) / product.cost * 100).toFixed(1) : null,
      suggested_price: suggestedPrice,
      suggested_margin: product.cost ? ((suggestedPrice - product.cost) / product.cost * 100).toFixed(1) : null,
      reasoning,
      confidence,
      competitor_analysis: {
        count: competitorPrices.length,
        min: minCompetitorPrice,
        avg: avgCompetitorPrice?.toFixed(2),
        competitors: competitors?.slice(0, 5)
      }
    };

    // Save suggestion if price differs
    if (Math.abs(suggestedPrice - product.price) > 0.5 && confidence >= 0.7) {
      await supabase
        .from('price_suggestions')
        .upsert({
          store_id: storeId,
          product_id: productId,
          current_price: product.price,
          suggested_price: suggestedPrice,
          suggestion_type: 'ai',
          confidence_score: confidence,
          reasoning,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'product_id' });
    }

    return c.json({ ok: true, data: analysis });
  } catch (error: any) {
    console.error('Error analyzing pricing:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

export default smartPricing;
