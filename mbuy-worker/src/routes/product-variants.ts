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

// ==================== VARIANT OPTIONS ====================

// Get all variant options
app.get('/options', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('variant_options')
    .select('*')
    .eq('store_id', storeId)
    .order('sort_order');

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Create variant option
app.post('/options', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('variant_options')
    .insert({
      store_id: storeId,
      name: body.name,
      display_name: body.display_name,
      option_type: body.option_type || 'select',
      values: body.values || [],
      sort_order: body.sort_order || 0
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Update variant option
app.put('/options/:id', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const optionId = c.req.param('id');
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('variant_options')
    .update({
      display_name: body.display_name,
      option_type: body.option_type,
      values: body.values,
      sort_order: body.sort_order,
      is_active: body.is_active
    })
    .eq('id', optionId)
    .eq('store_id', storeId)
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Delete variant option
app.delete('/options/:id', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const optionId = c.req.param('id');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { error } = await supabase
    .from('variant_options')
    .delete()
    .eq('id', optionId)
    .eq('store_id', storeId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true });
});

// ==================== PRODUCT VARIANTS ====================

// Get variants for a product
app.get('/product/:productId', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const productId = c.req.param('productId');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  // Get variant groups
  const { data: groups } = await supabase
    .from('product_variant_groups')
    .select(`
      *,
      option:variant_options(*)
    `)
    .eq('product_id', productId)
    .order('sort_order');

  // Get variants
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .eq('store_id', storeId)
    .order('created_at');

  if (error) return c.json({ ok: false, error: error.message }, 400);
  
  return c.json({
    ok: true,
    data: {
      groups: groups || [],
      variants: variants || []
    }
  });
});

// Add variant group to product
app.post('/product/:productId/groups', async (c) => {
  const supabase = getSupabase(c);
  const productId = c.req.param('productId');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('product_variant_groups')
    .insert({
      product_id: productId,
      option_id: body.option_id,
      available_values: body.available_values || [],
      sort_order: body.sort_order || 0,
      is_required: body.is_required !== false
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Remove variant group from product
app.delete('/product/:productId/groups/:groupId', async (c) => {
  const supabase = getSupabase(c);
  const groupId = c.req.param('groupId');

  const { error } = await supabase
    .from('product_variant_groups')
    .delete()
    .eq('id', groupId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true });
});

// Create variant
app.post('/product/:productId', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const productId = c.req.param('productId');
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('product_variants')
    .insert({
      product_id: productId,
      store_id: storeId,
      sku: body.sku,
      barcode: body.barcode,
      options: body.options,
      price: body.price,
      compare_at_price: body.compare_at_price,
      cost_price: body.cost_price,
      stock_quantity: body.stock_quantity || 0,
      low_stock_threshold: body.low_stock_threshold || 5,
      allow_backorder: body.allow_backorder || false,
      weight: body.weight,
      weight_unit: body.weight_unit || 'kg',
      dimensions: body.dimensions,
      image_url: body.image_url,
      is_default: body.is_default || false
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Update variant
app.put('/:variantId', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const variantId = c.req.param('variantId');
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (body.sku !== undefined) updateData.sku = body.sku;
  if (body.barcode !== undefined) updateData.barcode = body.barcode;
  if (body.options !== undefined) updateData.options = body.options;
  if (body.price !== undefined) updateData.price = body.price;
  if (body.compare_at_price !== undefined) updateData.compare_at_price = body.compare_at_price;
  if (body.cost_price !== undefined) updateData.cost_price = body.cost_price;
  if (body.stock_quantity !== undefined) updateData.stock_quantity = body.stock_quantity;
  if (body.low_stock_threshold !== undefined) updateData.low_stock_threshold = body.low_stock_threshold;
  if (body.allow_backorder !== undefined) updateData.allow_backorder = body.allow_backorder;
  if (body.weight !== undefined) updateData.weight = body.weight;
  if (body.dimensions !== undefined) updateData.dimensions = body.dimensions;
  if (body.image_url !== undefined) updateData.image_url = body.image_url;
  if (body.is_default !== undefined) updateData.is_default = body.is_default;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;

  const { data, error } = await supabase
    .from('product_variants')
    .update(updateData)
    .eq('id', variantId)
    .eq('store_id', storeId)
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Delete variant
app.delete('/:variantId', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const variantId = c.req.param('variantId');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { error } = await supabase
    .from('product_variants')
    .delete()
    .eq('id', variantId)
    .eq('store_id', storeId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true });
});

// Generate variants from options
app.post('/product/:productId/generate', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const productId = c.req.param('productId');
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  // Get product
  const { data: product } = await supabase
    .from('products')
    .select('price')
    .eq('id', productId)
    .single();

  if (!product) {
    return c.json({ ok: false, error: 'Product not found' }, 404);
  }

  // Get variant groups
  const { data: groups } = await supabase
    .from('product_variant_groups')
    .select(`
      option_id,
      available_values,
      option:variant_options(name)
    `)
    .eq('product_id', productId)
    .order('sort_order');

  if (!groups || groups.length === 0) {
    return c.json({ ok: false, error: 'No variant groups defined' }, 400);
  }

  // Generate combinations
  const generateCombinations = (arrays: string[][], optionNames: string[]): Record<string, string>[] => {
    if (arrays.length === 0) return [{}];
    
    const result: Record<string, string>[] = [];
    const first = arrays[0];
    const rest = arrays.slice(1);
    const firstName = optionNames[0];
    const restNames = optionNames.slice(1);
    
    const restCombinations = generateCombinations(rest, restNames);
    
    for (const value of first) {
      for (const combo of restCombinations) {
        result.push({ [firstName]: value, ...combo });
      }
    }
    
    return result;
  };

  const values = groups.map(g => g.available_values || []);
  const names = groups.map(g => (g.option as any)?.name || 'option');
  const combinations = generateCombinations(values, names);

  // Create variants
  const variants = combinations.map((options, index) => ({
    product_id: productId,
    store_id: storeId,
    options,
    price: body.base_price || product.price,
    stock_quantity: body.default_stock || 0,
    is_default: index === 0
  }));

  const { data, error } = await supabase
    .from('product_variants')
    .upsert(variants, { onConflict: 'product_id,options' })
    .select();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  
  return c.json({
    ok: true,
    data: {
      generated: data?.length || 0,
      variants: data
    }
  });
});

// ==================== INVENTORY ====================

// Update variant inventory
app.put('/:variantId/inventory', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const variantId = c.req.param('variantId');
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  // Update variant stock
  const { data, error } = await supabase
    .from('product_variants')
    .update({
      stock_quantity: body.quantity,
      updated_at: new Date().toISOString()
    })
    .eq('id', variantId)
    .eq('store_id', storeId)
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Bulk update inventory
app.post('/inventory/bulk', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const updates = body.variants || [];
  let updated = 0;

  for (const item of updates) {
    const { error } = await supabase
      .from('product_variants')
      .update({
        stock_quantity: item.quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.variant_id)
      .eq('store_id', storeId);

    if (!error) updated++;
  }

  return c.json({ ok: true, data: { updated } });
});

// ==================== PRICE RULES ====================

// Get price rules
app.get('/price-rules', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('variant_price_rules')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Create price rule
app.post('/price-rules', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('variant_price_rules')
    .insert({
      store_id: storeId,
      name: body.name,
      rule_type: body.rule_type,
      conditions: body.conditions || {},
      adjustment_type: body.adjustment_type,
      adjustment_value: body.adjustment_value
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Delete price rule
app.delete('/price-rules/:id', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const ruleId = c.req.param('id');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { error } = await supabase
    .from('variant_price_rules')
    .delete()
    .eq('id', ruleId)
    .eq('store_id', storeId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true });
});

// ==================== STATS ====================

// Get variants stats
app.get('/stats', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  // Get total variants
  const { count: totalVariants } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  // Get active variants
  const { count: activeVariants } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('is_active', true);

  // Get low stock variants
  const { data: lowStock } = await supabase
    .from('product_variants')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .filter('stock_quantity', 'lte', 'low_stock_threshold');

  // Get out of stock
  const { count: outOfStock } = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('stock_quantity', 0);

  // Get options count
  const { count: optionsCount } = await supabase
    .from('variant_options')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  return c.json({
    ok: true,
    data: {
      total_variants: totalVariants || 0,
      active_variants: activeVariants || 0,
      low_stock_count: lowStock?.length || 0,
      out_of_stock: outOfStock || 0,
      options_count: optionsCount || 0,
      low_stock_variants: lowStock || []
    }
  });
});

export default app;
