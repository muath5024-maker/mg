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

// ==================== BUNDLES ====================

// Get all bundles
app.get('/', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const status = c.req.query('status');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  let query = supabase
    .from('product_bundles')
    .select(`
      *,
      items:bundle_items(
        *,
        product:products(id, name, price, image_url),
        variant:product_variants(id, options, price)
      )
    `)
    .eq('store_id', storeId)
    .order('sort_order');

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Get single bundle
app.get('/:id', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const bundleId = c.req.param('id');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('product_bundles')
    .select(`
      *,
      items:bundle_items(
        *,
        product:products(id, name, price, image_url, stock_quantity),
        variant:product_variants(id, options, price, stock_quantity)
      ),
      categories:bundle_category_assignments(
        category:bundle_categories(*)
      )
    `)
    .eq('id', bundleId)
    .eq('store_id', storeId)
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Create bundle
app.post('/', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('product_bundles')
    .insert({
      store_id: storeId,
      name: body.name,
      slug: body.slug,
      description: body.description,
      bundle_type: body.bundle_type || 'fixed',
      bundle_price: body.bundle_price,
      discount_value: body.discount_value,
      image_url: body.image_url,
      gallery_urls: body.gallery_urls || [],
      status: body.status || 'active',
      start_date: body.start_date,
      end_date: body.end_date,
      min_quantity: body.min_quantity || 1,
      max_quantity: body.max_quantity,
      limit_per_customer: body.limit_per_customer,
      total_quantity: body.total_quantity,
      allow_individual_items: body.allow_individual_items || false,
      show_savings: body.show_savings !== false,
      featured: body.featured || false
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Update bundle
app.put('/:id', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const bundleId = c.req.param('id');
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  const fields = [
    'name', 'slug', 'description', 'bundle_type', 'bundle_price',
    'discount_value', 'image_url', 'gallery_urls', 'status',
    'start_date', 'end_date', 'min_quantity', 'max_quantity',
    'limit_per_customer', 'total_quantity', 'allow_individual_items',
    'show_savings', 'featured', 'sort_order'
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from('product_bundles')
    .update(updateData)
    .eq('id', bundleId)
    .eq('store_id', storeId)
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Delete bundle
app.delete('/:id', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const bundleId = c.req.param('id');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { error } = await supabase
    .from('product_bundles')
    .delete()
    .eq('id', bundleId)
    .eq('store_id', storeId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true });
});

// ==================== BUNDLE ITEMS ====================

// Add item to bundle
app.post('/:bundleId/items', async (c) => {
  const supabase = getSupabase(c);
  const bundleId = c.req.param('bundleId');
  const body = await c.req.json();

  const { data, error } = await supabase
    .from('bundle_items')
    .insert({
      bundle_id: bundleId,
      product_id: body.product_id,
      variant_id: body.variant_id,
      quantity: body.quantity || 1,
      custom_price: body.custom_price,
      is_optional: body.is_optional || false,
      is_default_selected: body.is_default_selected !== false,
      sort_order: body.sort_order || 0
    })
    .select(`
      *,
      product:products(id, name, price, image_url),
      variant:product_variants(id, options, price)
    `)
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Update bundle item
app.put('/:bundleId/items/:itemId', async (c) => {
  const supabase = getSupabase(c);
  const itemId = c.req.param('itemId');
  const body = await c.req.json();

  const updateData: Record<string, unknown> = {};

  if (body.quantity !== undefined) updateData.quantity = body.quantity;
  if (body.custom_price !== undefined) updateData.custom_price = body.custom_price;
  if (body.is_optional !== undefined) updateData.is_optional = body.is_optional;
  if (body.is_default_selected !== undefined) updateData.is_default_selected = body.is_default_selected;
  if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

  const { data, error } = await supabase
    .from('bundle_items')
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Remove item from bundle
app.delete('/:bundleId/items/:itemId', async (c) => {
  const supabase = getSupabase(c);
  const itemId = c.req.param('itemId');

  const { error } = await supabase
    .from('bundle_items')
    .delete()
    .eq('id', itemId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true });
});

// ==================== CATEGORIES ====================

// Get bundle categories
app.get('/categories/list', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('bundle_categories')
    .select('*')
    .eq('store_id', storeId)
    .order('sort_order');

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Create category
app.post('/categories', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('bundle_categories')
    .insert({
      store_id: storeId,
      name: body.name,
      slug: body.slug,
      description: body.description,
      image_url: body.image_url,
      sort_order: body.sort_order || 0
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Assign bundle to category
app.post('/:bundleId/categories/:categoryId', async (c) => {
  const supabase = getSupabase(c);
  const bundleId = c.req.param('bundleId');
  const categoryId = c.req.param('categoryId');

  const { error } = await supabase
    .from('bundle_category_assignments')
    .insert({
      bundle_id: bundleId,
      category_id: categoryId
    });

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true });
});

// Remove bundle from category
app.delete('/:bundleId/categories/:categoryId', async (c) => {
  const supabase = getSupabase(c);
  const bundleId = c.req.param('bundleId');
  const categoryId = c.req.param('categoryId');

  const { error } = await supabase
    .from('bundle_category_assignments')
    .delete()
    .eq('bundle_id', bundleId)
    .eq('category_id', categoryId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true });
});

// ==================== DISCOUNT RULES ====================

// Get discount rules
app.get('/discount-rules', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('bundle_discount_rules')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Create discount rule
app.post('/discount-rules', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const body = await c.req.json();

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { data, error } = await supabase
    .from('bundle_discount_rules')
    .insert({
      store_id: storeId,
      name: body.name,
      rule_type: body.rule_type,
      conditions: body.conditions || {},
      discount_type: body.discount_type,
      discount_value: body.discount_value,
      max_uses: body.max_uses,
      max_uses_per_customer: body.max_uses_per_customer,
      start_date: body.start_date,
      end_date: body.end_date
    })
    .select()
    .single();

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true, data });
});

// Delete discount rule
app.delete('/discount-rules/:id', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);
  const ruleId = c.req.param('id');

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  const { error } = await supabase
    .from('bundle_discount_rules')
    .delete()
    .eq('id', ruleId)
    .eq('store_id', storeId);

  if (error) return c.json({ ok: false, error: error.message }, 400);
  return c.json({ ok: true });
});

// ==================== PRICING & AVAILABILITY ====================

// Calculate bundle price
app.get('/:bundleId/price', async (c) => {
  const supabase = getSupabase(c);
  const bundleId = c.req.param('bundleId');

  const { data: bundle } = await supabase
    .from('product_bundles')
    .select(`
      *,
      items:bundle_items(
        *,
        product:products(price),
        variant:product_variants(price)
      )
    `)
    .eq('id', bundleId)
    .single();

  if (!bundle) {
    return c.json({ ok: false, error: 'Bundle not found' }, 404);
  }

  // Calculate original price
  let originalPrice = 0;
  for (const item of bundle.items || []) {
    const price = item.custom_price || item.variant?.price || item.product?.price || 0;
    originalPrice += price * item.quantity;
  }

  // Calculate bundle price
  let bundlePrice = originalPrice;
  if (bundle.bundle_type === 'fixed') {
    bundlePrice = bundle.bundle_price || originalPrice;
  } else if (bundle.bundle_type === 'discount_percent') {
    bundlePrice = originalPrice * (1 - (bundle.discount_value || 0) / 100);
  } else if (bundle.bundle_type === 'discount_fixed') {
    bundlePrice = originalPrice - (bundle.discount_value || 0);
  }

  const savings = originalPrice - bundlePrice;
  const savingsPercent = originalPrice > 0 ? (savings / originalPrice) * 100 : 0;

  return c.json({
    ok: true,
    data: {
      original_price: originalPrice,
      bundle_price: bundlePrice,
      savings,
      savings_percent: savingsPercent
    }
  });
});

// Check availability
app.get('/:bundleId/availability', async (c) => {
  const supabase = getSupabase(c);
  const bundleId = c.req.param('bundleId');
  const quantity = parseInt(c.req.query('quantity') || '1');

  const { data: bundle } = await supabase
    .from('product_bundles')
    .select(`
      *,
      items:bundle_items(
        *,
        product:products(name, stock_quantity),
        variant:product_variants(options, stock_quantity)
      )
    `)
    .eq('id', bundleId)
    .single();

  if (!bundle) {
    return c.json({ ok: true, data: { available: false, reason: 'Bundle not found' } });
  }

  // Check status
  if (bundle.status !== 'active') {
    return c.json({ ok: true, data: { available: false, reason: 'Bundle is not active' } });
  }

  // Check dates
  const now = new Date();
  if (bundle.start_date && new Date(bundle.start_date) > now) {
    return c.json({ ok: true, data: { available: false, reason: 'Bundle has not started yet' } });
  }
  if (bundle.end_date && new Date(bundle.end_date) < now) {
    return c.json({ ok: true, data: { available: false, reason: 'Bundle has expired' } });
  }

  // Check total quantity
  if (bundle.total_quantity !== null) {
    if ((bundle.sold_quantity || 0) + quantity > bundle.total_quantity) {
      return c.json({ ok: true, data: { available: false, reason: 'Insufficient bundle quantity' } });
    }
  }

  // Check items stock
  const issues: { product: string; required: number; available: number }[] = [];
  for (const item of bundle.items || []) {
    if (item.is_optional) continue;

    const stock = item.variant?.stock_quantity ?? item.product?.stock_quantity ?? 0;
    const required = item.quantity * quantity;

    if (stock < required) {
      issues.push({
        product: item.product?.name,
        required,
        available: stock
      });
    }
  }

  return c.json({
    ok: true,
    data: {
      available: issues.length === 0,
      issues
    }
  });
});

// ==================== STATS ====================

// Get bundles stats
app.get('/stats/overview', async (c) => {
  const user = c.get('user') as any;
  const supabase = getSupabase(c);
  const storeId = await getStoreId(supabase, user.sub);

  if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

  // Total bundles
  const { count: totalBundles } = await supabase
    .from('product_bundles')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  // Active bundles
  const { count: activeBundles } = await supabase
    .from('product_bundles')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('status', 'active');

  // Total orders
  const { data: bundles } = await supabase
    .from('product_bundles')
    .select('order_count, view_count, bundle_price, original_price')
    .eq('store_id', storeId);

  const totalOrders = bundles?.reduce((sum, b) => sum + (b.order_count || 0), 0) || 0;
  const totalViews = bundles?.reduce((sum, b) => sum + (b.view_count || 0), 0) || 0;
  
  // Calculate total savings
  const totalSavings = bundles?.reduce((sum, b) => {
    const saving = ((b.original_price || 0) - (b.bundle_price || 0)) * (b.order_count || 0);
    return sum + saving;
  }, 0) || 0;

  // Top bundles
  const { data: topBundles } = await supabase
    .from('product_bundles')
    .select('id, name, order_count, view_count')
    .eq('store_id', storeId)
    .order('order_count', { ascending: false })
    .limit(5);

  return c.json({
    ok: true,
    data: {
      total_bundles: totalBundles || 0,
      active_bundles: activeBundles || 0,
      total_orders: totalOrders,
      total_views: totalViews,
      total_savings: totalSavings,
      top_bundles: topBundles || []
    }
  });
});

export default app;
