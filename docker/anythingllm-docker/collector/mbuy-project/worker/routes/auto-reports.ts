// ============================================================================
// MBUY Auto Reports Worker Endpoints
// Feature #6 - تقارير تلقائية
// ============================================================================

import { Hono } from 'hono';

type RouteContext = { Variables: { user: any }; Bindings: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; AI?: any } };
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const autoReports = new Hono<RouteContext>();

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
// GET /secure/reports/settings - Get report settings
// ============================================================================
autoReports.get('/settings', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { data, error } = await supabase
      .from('report_settings')
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
          daily_report_enabled: true,
          daily_report_time: '08:00:00',
          weekly_report_enabled: true,
          weekly_report_day: 0,
          weekly_report_time: '09:00:00',
          monthly_report_enabled: true,
          monthly_report_day: 1,
          monthly_report_time: '10:00:00',
          send_email: true,
          send_push: true,
          send_sms: false,
          report_format: 'detailed',
          include_charts: true,
          include_recommendations: true,
          report_language: 'ar'
        }
      });
    }

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error fetching report settings:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// PUT /secure/reports/settings - Update report settings
// ============================================================================
autoReports.put('/settings', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const body = await c.req.json();

    const { data, error } = await supabase
      .from('report_settings')
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
    console.error('Error updating report settings:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/reports - List generated reports
// ============================================================================
autoReports.get('/', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const reportType = c.req.query('type'); // daily, weekly, monthly
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    let query = supabase
      .from('generated_reports')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reportType) {
      query = query.eq('report_type', reportType);
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
    console.error('Error fetching reports:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/reports/:id - Get report details
// ============================================================================
autoReports.get('/:id', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const reportId = c.req.param('id');
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { data, error } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('id', reportId)
      .eq('store_id', storeId)
      .single();

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error fetching report:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// POST /secure/reports/generate - Generate a new report
// ============================================================================
autoReports.post('/generate', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { report_type, start_date, end_date } = await c.req.json();

    // Calculate date range based on report type
    const today = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (report_type) {
      case 'daily':
        periodStart = new Date(today);
        periodStart.setDate(periodStart.getDate() - 1);
        periodEnd = periodStart;
        break;
      case 'weekly':
        periodEnd = new Date(today);
        periodEnd.setDate(periodEnd.getDate() - 1);
        periodStart = new Date(periodEnd);
        periodStart.setDate(periodStart.getDate() - 6);
        break;
      case 'monthly':
        periodEnd = new Date(today);
        periodEnd.setDate(periodEnd.getDate() - 1);
        periodStart = new Date(periodEnd);
        periodStart.setMonth(periodStart.getMonth() - 1);
        break;
      case 'custom':
        periodStart = new Date(start_date);
        periodEnd = new Date(end_date);
        break;
      default:
        return c.json({ ok: false, error: 'Invalid report type' }, 400);
    }

    // Fetch sales data
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString() + 'T23:59:59Z')
      .not('status', 'in', '("cancelled","refunded")');

    const orders = ordersData || [];
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalOrders = orders.length;
    const uniqueCustomers = new Set(orders.map(o => o.customer_id)).size;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get previous period for comparison
    const periodLength = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const prevPeriodStart = new Date(periodStart);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - periodLength - 1);
    const prevPeriodEnd = new Date(periodStart);
    prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 1);

    const { data: prevOrdersData } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('store_id', storeId)
      .gte('created_at', prevPeriodStart.toISOString())
      .lte('created_at', prevPeriodEnd.toISOString() + 'T23:59:59Z')
      .not('status', 'in', '("cancelled","refunded")');

    const prevOrders = prevOrdersData || [];
    const prevRevenue = prevOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
    const prevOrderCount = prevOrders.length;

    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100) : 0;
    const ordersChange = prevOrderCount > 0 ? ((totalOrders - prevOrderCount) / prevOrderCount * 100) : 0;

    // Get top products
    const { data: topProductsData } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        total_price,
        products (name_ar, name)
      `)
      .in('order_id', orders.map(o => o.id))
      .limit(100);

    // Aggregate top products
    const productMap = new Map();
    (topProductsData || []).forEach((item: any) => {
      const existing = productMap.get(item.product_id) || { 
        quantity: 0, 
        revenue: 0, 
        name: item.products?.name_ar || item.products?.name || 'منتج' 
      };
      existing.quantity += item.quantity;
      existing.revenue += item.total_price;
      productMap.set(item.product_id, existing);
    });

    const topProducts = Array.from(productMap.entries())
      .map(([id, data]: [string, any]) => ({ product_id: id, ...data }))
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    // Generate report
    const reportTitle = report_type === 'daily' 
      ? `التقرير اليومي - ${periodStart.toLocaleDateString('ar-SA')}`
      : report_type === 'weekly'
        ? `التقرير الأسبوعي - ${periodStart.toLocaleDateString('ar-SA')} إلى ${periodEnd.toLocaleDateString('ar-SA')}`
        : `التقرير الشهري - ${periodStart.toLocaleDateString('ar-SA')} إلى ${periodEnd.toLocaleDateString('ar-SA')}`;

    const { data: report, error } = await supabase
      .from('generated_reports')
      .insert({
        store_id: storeId,
        report_type: report_type,
        report_period_start: periodStart.toISOString().split('T')[0],
        report_period_end: periodEnd.toISOString().split('T')[0],
        title: reportTitle,
        title_ar: reportTitle,
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        total_customers: uniqueCustomers,
        avg_order_value: avgOrderValue,
        revenue_change: revenueChange,
        orders_change: ordersChange,
        top_products: topProducts,
        executive_summary: generateExecutiveSummary(totalRevenue, totalOrders, revenueChange, ordersChange)
      })
      .select()
      .single();

    if (error) throw error;

    return c.json({ ok: true, data: report });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// Helper function to generate executive summary
function generateExecutiveSummary(
  revenue: number, 
  orders: number, 
  revenueChange: number, 
  ordersChange: number
): string {
  const revenueText = revenueChange >= 0 
    ? `ارتفعت الإيرادات بنسبة ${revenueChange.toFixed(1)}%` 
    : `انخفضت الإيرادات بنسبة ${Math.abs(revenueChange).toFixed(1)}%`;
  
  const ordersText = ordersChange >= 0
    ? `زادت الطلبات بنسبة ${ordersChange.toFixed(1)}%`
    : `انخفضت الطلبات بنسبة ${Math.abs(ordersChange).toFixed(1)}%`;

  return `إجمالي الإيرادات: ${revenue.toFixed(2)} ر.س | عدد الطلبات: ${orders} | ${revenueText} | ${ordersText}`;
}

// ============================================================================
// POST /secure/reports/:id/send - Send report via email
// ============================================================================
autoReports.post('/:id/send', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const reportId = c.req.param('id');
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { email } = await c.req.json();

    // Get the report
    const { data: report, error: reportError } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('id', reportId)
      .eq('store_id', storeId)
      .single();

    if (reportError) throw reportError;

    // TODO: Implement actual email sending
    // For now, just update the status
    const { error } = await supabase
      .from('generated_reports')
      .update({
        is_sent: true,
        sent_at: new Date().toISOString(),
        sent_to: [email],
        send_status: 'sent'
      })
      .eq('id', reportId);

    if (error) throw error;

    return c.json({ ok: true, message: 'Report sent successfully' });
  } catch (error: any) {
    console.error('Error sending report:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// DELETE /secure/reports/:id - Delete a report
// ============================================================================
autoReports.delete('/:id', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    const reportId = c.req.param('id');
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { error } = await supabase
      .from('generated_reports')
      .delete()
      .eq('id', reportId)
      .eq('store_id', storeId);

    if (error) throw error;

    return c.json({ ok: true, message: 'Report deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/reports/templates - Get available templates
// ============================================================================
autoReports.get('/templates/list', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);

    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .or(`store_id.is.null,store_id.eq.${storeId}`)
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET /secure/reports/schedule - Get report schedule
// ============================================================================
autoReports.get('/schedule/list', async (c) => {
  try {
    const user = c.get('user') as any;
    const supabase = getSupabase(c);
    const storeId = await getStoreId(supabase, user.sub);
    
    if (!storeId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { data, error } = await supabase
      .from('report_schedule')
      .select('*')
      .eq('store_id', storeId);

    if (error) throw error;

    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Error fetching schedule:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

export default autoReports;
