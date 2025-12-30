// ============================================================================
// MBUY Webstore Management Worker Endpoints
// Feature #17 - إدارة المتجر الإلكتروني
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

// ==================== STORE THEME ====================

app.get('/theme', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('store_themes')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error && error.code !== 'PGRST116') return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data: data || {} });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.post('/theme', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const body = await c.req.json();

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('store_themes')
      .upsert({
        store_id: storeId,
        theme_name: body.theme_name,
        theme_type: body.theme_type,
        primary_color: body.primary_color,
        secondary_color: body.secondary_color,
        accent_color: body.accent_color,
        background_color: body.background_color,
        text_color: body.text_color,
        header_bg_color: body.header_bg_color,
        footer_bg_color: body.footer_bg_color,
        heading_font: body.heading_font,
        body_font: body.body_font,
        font_size_base: body.font_size_base,
        layout_type: body.layout_type,
        header_style: body.header_style,
        product_grid_columns: body.product_grid_columns,
        products_per_page: body.products_per_page,
        show_search: body.show_search,
        show_categories: body.show_categories,
        show_cart_icon: body.show_cart_icon,
        show_wishlist: body.show_wishlist,
        show_compare: body.show_compare,
        show_quick_view: body.show_quick_view,
        show_social_share: body.show_social_share,
        custom_css: body.custom_css,
        custom_js: body.custom_js
      }, { onConflict: 'store_id' })
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ==================== STORE PAGES ====================

app.get('/pages', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('store_pages')
      .select('*')
      .eq('store_id', storeId)
      .order('menu_order');

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.post('/pages', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const body = await c.req.json();

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('store_pages')
      .insert({
        store_id: storeId,
        slug: body.slug,
        title: body.title,
        title_ar: body.title_ar,
        content: body.content,
        content_ar: body.content_ar,
        meta_title: body.meta_title,
        meta_description: body.meta_description,
        meta_keywords: body.meta_keywords,
        page_type: body.page_type || 'custom',
        template: body.template,
        show_in_menu: body.show_in_menu || false,
        menu_order: body.menu_order || 0,
        is_published: body.is_published !== false
      })
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data }, 201);
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.put('/pages/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const pageId = c.req.param('id');
    const body = await c.req.json();

    const { data, error } = await supabase
      .from('store_pages')
      .update({
        slug: body.slug,
        title: body.title,
        title_ar: body.title_ar,
        content: body.content,
        content_ar: body.content_ar,
        meta_title: body.meta_title,
        meta_description: body.meta_description,
        page_type: body.page_type,
        show_in_menu: body.show_in_menu,
        menu_order: body.menu_order,
        is_published: body.is_published
      })
      .eq('id', pageId)
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.delete('/pages/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const pageId = c.req.param('id');

    const { error } = await supabase
      .from('store_pages')
      .delete()
      .eq('id', pageId);

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ==================== STORE BANNERS ====================

app.get('/banners', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('store_banners')
      .select('*')
      .eq('store_id', storeId)
      .order('display_order');

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.post('/banners', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const body = await c.req.json();

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('store_banners')
      .insert({
        store_id: storeId,
        title: body.title,
        title_ar: body.title_ar,
        subtitle: body.subtitle,
        subtitle_ar: body.subtitle_ar,
        image_url: body.image_url,
        mobile_image_url: body.mobile_image_url,
        link_url: body.link_url,
        link_target: body.link_target,
        button_text: body.button_text,
        button_text_ar: body.button_text_ar,
        position: body.position || 'hero',
        display_order: body.display_order || 0,
        start_date: body.start_date,
        end_date: body.end_date,
        show_on_desktop: body.show_on_desktop !== false,
        show_on_mobile: body.show_on_mobile !== false,
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

app.put('/banners/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const bannerId = c.req.param('id');
    const body = await c.req.json();

    const { data, error } = await supabase
      .from('store_banners')
      .update(body)
      .eq('id', bannerId)
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.delete('/banners/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const bannerId = c.req.param('id');

    const { error } = await supabase
      .from('store_banners')
      .delete()
      .eq('id', bannerId);

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ==================== STORE MENU ====================

app.get('/menu', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const location = c.req.query('location') || 'main';

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('store_menu_items')
      .select('*')
      .eq('store_id', storeId)
      .eq('menu_location', location)
      .order('display_order');

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.post('/menu', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const body = await c.req.json();

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('store_menu_items')
      .insert({
        store_id: storeId,
        parent_id: body.parent_id,
        menu_location: body.menu_location || 'main',
        title: body.title,
        title_ar: body.title_ar,
        url: body.url,
        link_type: body.link_type || 'custom',
        link_id: body.link_id,
        icon: body.icon,
        display_order: body.display_order || 0
      })
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data }, 201);
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ==================== SEO SETTINGS ====================

app.get('/seo', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('store_seo_settings')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error && error.code !== 'PGRST116') return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data: data || {} });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.post('/seo', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const body = await c.req.json();

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('store_seo_settings')
      .upsert({
        store_id: storeId,
        home_title: body.home_title,
        home_description: body.home_description,
        home_keywords: body.home_keywords,
        product_title_template: body.product_title_template,
        category_title_template: body.category_title_template,
        og_image: body.og_image,
        twitter_handle: body.twitter_handle,
        google_analytics_id: body.google_analytics_id,
        facebook_pixel_id: body.facebook_pixel_id,
        tiktok_pixel_id: body.tiktok_pixel_id,
        google_verification: body.google_verification,
        sitemap_enabled: body.sitemap_enabled,
        robots_txt: body.robots_txt
      }, { onConflict: 'store_id' })
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ==================== DOMAINS ====================

app.get('/domains', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('store_domains')
      .select('*')
      .eq('store_id', storeId);

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.post('/domains', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const body = await c.req.json();

    if (!storeId) return c.json({ ok: false, error: 'Store not found' }, 404);

    const { data, error } = await supabase
      .from('store_domains')
      .insert({
        store_id: storeId,
        domain: body.domain,
        domain_type: body.domain_type || 'custom',
        is_primary: body.is_primary || false
      })
      .select()
      .single();

    if (error) return c.json({ ok: false, error: error.message }, 400);
    return c.json({ ok: true, data }, 201);
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

    const { count: pagesCount } = await supabase
      .from('store_pages')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);

    const { count: bannersCount } = await supabase
      .from('store_banners')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('is_active', true);

    const { count: domainsCount } = await supabase
      .from('store_domains')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);

    return c.json({
      ok: true,
      data: {
        pages: pagesCount || 0,
        banners: bannersCount || 0,
        domains: domainsCount || 0
      }
    });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

export default app;
