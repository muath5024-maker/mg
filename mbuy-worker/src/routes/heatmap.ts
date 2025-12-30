// ============================================================================
// MBUY Heatmap Analytics Worker Endpoints
// Feature #7 - خريطة حرارية
// ============================================================================

import { Hono } from 'hono';

type RouteContext = { Variables: { user: any }; Bindings: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; AI?: any } };
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const heatmap = new Hono<RouteContext>();

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
// GET /secure/heatmap/settings - Get heatmap settings
// ============================================================================
heatmap.get('/settings', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { data, error } = await supabase
      .from('heatmap_settings')
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
          is_enabled: true,
          track_clicks: true,
          track_moves: false,
          track_scrolls: true,
          record_sessions: false,
          exclude_admin: true,
          exclude_bots: true,
          sample_rate: 100,
          data_retention_days: 30,
          max_sessions_stored: 1000
        }
      });
    }

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error fetching heatmap settings:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// PUT /secure/heatmap/settings - Update heatmap settings
// ============================================================================
heatmap.put('/settings', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();

    const { data, error } = await supabase
      .from('heatmap_settings')
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
    console.error('Error updating heatmap settings:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/heatmap/pages - Get pages with heatmap data
// ============================================================================
heatmap.get('/pages', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const days = parseInt(c.req.query('days') || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('heatmap_page_summary')
      .select('page_path, page_title, total_clicks, unique_visitors, avg_scroll_depth')
      .eq('store_id', storeId)
      .gte('period_date', startDate.toISOString().split('T')[0])
      .order('total_clicks', { ascending: false });

    if (error) throw error;

    // Aggregate by page
    const pageMap = new Map();
    (data || []).forEach((row: any) => {
      const existing = pageMap.get(row.page_path) || {
        page_path: row.page_path,
        page_title: row.page_title,
        total_clicks: 0,
        unique_visitors: 0,
        avg_scroll_depth: 0,
        days_count: 0
      };
      existing.total_clicks += row.total_clicks;
      existing.unique_visitors += row.unique_visitors;
      existing.avg_scroll_depth += row.avg_scroll_depth || 0;
      existing.days_count += 1;
      pageMap.set(row.page_path, existing);
    });

    const pages = Array.from(pageMap.values()).map((p: any) => ({
      ...p,
      avg_scroll_depth: p.days_count > 0 ? p.avg_scroll_depth / p.days_count : 0
    }));

    return c.json({ ok: true, data: pages });
  } catch (error: any) {
    console.error('Error fetching heatmap pages:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/heatmap/page/:path - Get heatmap data for specific page
// ============================================================================
heatmap.get('/page/:path', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const pagePath = decodeURIComponent(c.req.param('path'));
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const days = parseInt(c.req.query('days') || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get summary data
    const { data: summaryData, error: summaryError } = await supabase
      .from('heatmap_page_summary')
      .select('*')
      .eq('store_id', storeId)
      .eq('page_path', pagePath)
      .gte('period_date', startDate.toISOString().split('T')[0])
      .order('period_date', { ascending: false });

    if (summaryError) throw summaryError;

    // Get raw click data for heatmap visualization
    const { data: clickData, error: clickError } = await supabase
      .from('heatmap_events')
      .select('x_percent, y_percent, element_tag, element_id')
      .eq('store_id', storeId)
      .eq('page_path', pagePath)
      .eq('event_type', 'click')
      .gte('timestamp', startDate.toISOString())
      .limit(5000);

    if (clickError) throw clickError;

    // Aggregate click positions for heatmap
    const clicks = (clickData || []).map((c: any) => ({
      x: c.x_percent,
      y: c.y_percent
    }));

    // Aggregate hot zones
    const hotZones: any[] = [];
    const summary = summaryData || [];
    summary.forEach((s: any) => {
      if (s.hot_zones) {
        s.hot_zones.forEach((zone: any) => {
          const existing = hotZones.find(z => 
            Math.abs(z.x - zone.x) < 10 && Math.abs(z.y - zone.y) < 10
          );
          if (existing) {
            existing.count += zone.count;
          } else {
            hotZones.push({ ...zone });
          }
        });
      }
    });

    // Sort and limit
    hotZones.sort((a, b) => b.count - a.count);
    const topHotZones = hotZones.slice(0, 10);

    // Aggregate top elements
    const elementsMap = new Map();
    summary.forEach((s: any) => {
      if (s.top_clicked_elements) {
        s.top_clicked_elements.forEach((elem: any) => {
          const key = `${elem.tag}-${elem.id}`;
          const existing = elementsMap.get(key) || { ...elem, clicks: 0 };
          existing.clicks += elem.clicks;
          elementsMap.set(key, existing);
        });
      }
    });
    const topElements = Array.from(elementsMap.values())
      .sort((a: any, b: any) => b.clicks - a.clicks)
      .slice(0, 10);

    // Calculate totals
    const totalClicks = summary.reduce((sum: number, s: any) => sum + s.total_clicks, 0);
    const totalVisitors = summary.reduce((sum: number, s: any) => sum + s.unique_visitors, 0);
    const avgScrollDepth = summary.length > 0 
      ? summary.reduce((sum: number, s: any) => sum + (s.avg_scroll_depth || 0), 0) / summary.length 
      : 0;

    return c.json({
      ok: true,
      data: {
        page_path: pagePath,
        page_title: summary[0]?.page_title,
        total_clicks: totalClicks,
        unique_visitors: totalVisitors,
        avg_scroll_depth: avgScrollDepth,
        hot_zones: topHotZones,
        top_elements: topElements,
        clicks: clicks
      }
    });
  } catch (error: any) {
    console.error('Error fetching page heatmap:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /secure/heatmap/track - Track interaction event (public endpoint)
// ============================================================================
heatmap.post('/track', async (c) => {
  try {
    const supabase = getSupabase(c);
    const body = await c.req.json();

    const {
      store_id,
      session_id,
      event_type,
      page_path,
      x,
      y,
      viewport_width,
      viewport_height,
      element_tag,
      element_id,
      element_class,
      element_text,
      device_type,
      scroll_depth
    } = body;

    if (!store_id || !session_id || !event_type || !page_path) {
      return c.json({ ok: false, error: 'Missing required fields' }, 400);
    }

    // Check if heatmap is enabled for this store
    const { data: settings } = await supabase
      .from('heatmap_settings')
      .select('is_enabled, track_clicks, track_moves, track_scrolls')
      .eq('store_id', store_id)
      .single();

    if (settings && !settings.is_enabled) {
      return c.json({ ok: true, message: 'Heatmap disabled' });
    }

    // Check event type settings
    if (settings) {
      if (event_type === 'click' && !settings.track_clicks) {
        return c.json({ ok: true, message: 'Click tracking disabled' });
      }
      if (event_type === 'move' && !settings.track_moves) {
        return c.json({ ok: true, message: 'Move tracking disabled' });
      }
      if (event_type === 'scroll' && !settings.track_scrolls) {
        return c.json({ ok: true, message: 'Scroll tracking disabled' });
      }
    }

    // Calculate percentages
    const x_percent = viewport_width > 0 ? (x / viewport_width) * 100 : 0;
    const y_percent = viewport_height > 0 ? (y / viewport_height) * 100 : 0;

    const { error } = await supabase
      .from('heatmap_events')
      .insert({
        store_id,
        session_id,
        event_type,
        page_path,
        page_url: body.page_url,
        x_position: x,
        y_position: y,
        x_percent,
        y_percent,
        viewport_width,
        viewport_height,
        element_tag,
        element_id,
        element_class,
        element_text: element_text?.substring(0, 255),
        device_type: device_type || 'desktop',
        scroll_depth
      });

    if (error) throw error;

    return c.json({ ok: true });
  } catch (error: any) {
    console.error('Error tracking heatmap event:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/heatmap/sessions - Get session recordings
// ============================================================================
heatmap.get('/sessions', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const minDuration = parseInt(c.req.query('min_duration') || '0');

    let query = supabase
      .from('session_recordings')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (minDuration > 0) {
      query = query.gte('duration_seconds', minDuration);
    }

    const { data, error, count } = await query;

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
    console.error('Error fetching sessions:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/heatmap/sessions/:id - Get session details
// ============================================================================
heatmap.get('/sessions/:id', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const sessionId = c.req.param('id');
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { data, error } = await supabase
      .from('session_recordings')
      .select('*')
      .eq('id', sessionId)
      .eq('store_id', storeId)
      .single();

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error fetching session:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// PATCH /secure/heatmap/sessions/:id/star - Toggle star on session
// ============================================================================
heatmap.patch('/sessions/:id/star', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const sessionId = c.req.param('id');
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    // Get current state
    const { data: current } = await supabase
      .from('session_recordings')
      .select('is_starred')
      .eq('id', sessionId)
      .eq('store_id', storeId)
      .single();

    const { error } = await supabase
      .from('session_recordings')
      .update({ is_starred: !current?.is_starred })
      .eq('id', sessionId)
      .eq('store_id', storeId);

    if (error) throw error;

    return c.json({ ok: true, is_starred: !current?.is_starred });
  } catch (error: any) {
    console.error('Error toggling star:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// DELETE /secure/heatmap/sessions/:id - Delete session
// ============================================================================
heatmap.delete('/sessions/:id', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const sessionId = c.req.param('id');
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { error } = await supabase
      .from('session_recordings')
      .delete()
      .eq('id', sessionId)
      .eq('store_id', storeId);

    if (error) throw error;

    return c.json({ ok: true, message: 'Session deleted' });
  } catch (error: any) {
    console.error('Error deleting session:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/heatmap/stats - Get overall heatmap stats
// ============================================================================
heatmap.get('/stats', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const days = parseInt(c.req.query('days') || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total events
    const { count: totalEvents } = await supabase
      .from('heatmap_events')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('timestamp', startDate.toISOString());

    // Get unique sessions
    const { data: sessionsData } = await supabase
      .from('heatmap_events')
      .select('session_id')
      .eq('store_id', storeId)
      .gte('timestamp', startDate.toISOString());
    
    const uniqueSessions = new Set((sessionsData || []).map((s: any) => s.session_id)).size;

    // Get page stats
    const { data: pageStats } = await supabase
      .from('heatmap_page_summary')
      .select('page_path, total_clicks')
      .eq('store_id', storeId)
      .gte('period_date', startDate.toISOString().split('T')[0]);

    const totalPages = new Set((pageStats || []).map((p: any) => p.page_path)).size;
    const totalClicks = (pageStats || []).reduce((sum: number, p: any) => sum + p.total_clicks, 0);

    return c.json({
      ok: true,
      data: {
        total_events: totalEvents || 0,
        unique_sessions: uniqueSessions,
        total_pages: totalPages,
        total_clicks: totalClicks,
        period_days: days
      }
    });
  } catch (error: any) {
    console.error('Error fetching heatmap stats:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

export default heatmap;
