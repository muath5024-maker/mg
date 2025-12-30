/**
 * Smart Analytics Dashboard Endpoints
 * لوحة تحكم ذكية للتحليلات
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type AnalyticsContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

// Helper to get store ID
async function getmerchantId(c: AnalyticsContext): Promise<string | null> {
  const authUserId = c.get('authUserId');
  
  const response = await fetch(
    `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${authUserId}&select=id&limit=1`,
    {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const stores = await response.json() as any[];
  return stores?.[0]?.id || null;
}

// ============================================================================
// Get Dashboard Overview
// ============================================================================

export async function getDashboardOverview(c: AnalyticsContext) {
  try {
    const merchantId = await getmerchantId(c);
    const period = c.req.query('period') || '7d';

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    // Calculate date range
    let daysAgo = 7;
    if (period === '30d') daysAgo = 30;
    if (period === '90d') daysAgo = 90;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get daily analytics
    const dailyResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/analytics_daily?store_id=eq.${merchantId}&date=gte.${startDateStr}&order=date.asc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const dailyData = await dailyResponse.json() as any[];

    // Calculate totals
    const totals = {
      revenue: 0,
      orders: 0,
      customers: 0,
      avgOrderValue: 0,
      pageViews: 0,
      visitors: 0,
    };

    dailyData?.forEach((day: any) => {
      totals.revenue += day.total_revenue || 0;
      totals.orders += day.total_orders || 0;
      totals.customers += day.new_customers || 0;
      totals.pageViews += day.page_views || 0;
      totals.visitors += day.unique_visitors || 0;
    });

    if (totals.orders > 0) {
      totals.avgOrderValue = totals.revenue / totals.orders;
    }

    // Get previous period for comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysAgo);
    const prevStartDateStr = prevStartDate.toISOString().split('T')[0];

    const prevResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/analytics_daily?store_id=eq.${merchantId}&date=gte.${prevStartDateStr}&date=lt.${startDateStr}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const prevData = await prevResponse.json() as any[];

    const prevTotals = { revenue: 0, orders: 0, customers: 0 };
    prevData?.forEach((day: any) => {
      prevTotals.revenue += day.total_revenue || 0;
      prevTotals.orders += day.total_orders || 0;
      prevTotals.customers += day.new_customers || 0;
    });

    // Calculate changes
    const changes = {
      revenue: prevTotals.revenue > 0 
        ? ((totals.revenue - prevTotals.revenue) / prevTotals.revenue * 100).toFixed(1)
        : 0,
      orders: prevTotals.orders > 0 
        ? ((totals.orders - prevTotals.orders) / prevTotals.orders * 100).toFixed(1)
        : 0,
      customers: prevTotals.customers > 0 
        ? ((totals.customers - prevTotals.customers) / prevTotals.customers * 100).toFixed(1)
        : 0,
    };

    return c.json({
      ok: true,
      data: {
        totals,
        changes,
        dailyData,
        period,
      },
    });
  } catch (error: any) {
    console.error('Get dashboard overview error:', error);
    return c.json({ ok: false, error: 'فشل في جلب البيانات' }, 500);
  }
}

// ============================================================================
// Get Hourly Analytics
// ============================================================================

export async function getHourlyAnalytics(c: AnalyticsContext) {
  try {
    const merchantId = await getmerchantId(c);
    const date = c.req.query('date') || new Date().toISOString().split('T')[0];

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/analytics_hourly?store_id=eq.${merchantId}&date=eq.${date}&order=hour.asc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Get hourly analytics error:', error);
    return c.json({ ok: false, error: 'فشل في جلب البيانات' }, 500);
  }
}

// ============================================================================
// Get Product Analytics
// ============================================================================

export async function getProductAnalytics(c: AnalyticsContext) {
  try {
    const merchantId = await getmerchantId(c);
    const period = c.req.query('period') || '7d';
    const sortBy = c.req.query('sort') || 'revenue';

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    let daysAgo = 7;
    if (period === '30d') daysAgo = 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    const startDateStr = startDate.toISOString().split('T')[0];

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/product_analytics?store_id=eq.${merchantId}&date=gte.${startDateStr}&select=product_id,units_sold,revenue,views&order=${sortBy}.desc&limit=20`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Get product analytics error:', error);
    return c.json({ ok: false, error: 'فشل في جلب البيانات' }, 500);
  }
}

// ============================================================================
// Get Customer Segments
// ============================================================================

export async function getCustomerSegments(c: AnalyticsContext) {
  try {
    const merchantId = await getmerchantId(c);

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/customer_analytics?store_id=eq.${merchantId}&select=customer_segment`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json() as any[];

    // Count by segment
    const segments: Record<string, number> = {
      new: 0,
      active: 0,
      loyal: 0,
      vip: 0,
      at_risk: 0,
      churned: 0,
    };

    data?.forEach((c: any) => {
      if (segments[c.customer_segment] !== undefined) {
        segments[c.customer_segment]++;
      }
    });

    return c.json({ ok: true, data: segments });
  } catch (error: any) {
    console.error('Get customer segments error:', error);
    return c.json({ ok: false, error: 'فشل في جلب البيانات' }, 500);
  }
}

// ============================================================================
// Get Smart Insights
// ============================================================================

export async function getSmartInsights(c: AnalyticsContext) {
  try {
    const merchantId = await getmerchantId(c);
    const priority = c.req.query('priority');
    const unreadOnly = c.req.query('unread') === 'true';

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    let url = `${c.env.SUPABASE_URL}/rest/v1/smart_insights?store_id=eq.${merchantId}&is_dismissed=eq.false&order=created_at.desc&limit=20`;
    
    if (priority) {
      url += `&priority=eq.${priority}`;
    }
    if (unreadOnly) {
      url += '&is_read=eq.false';
    }

    const response = await fetch(url, {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Get smart insights error:', error);
    return c.json({ ok: false, error: 'فشل في جلب الرؤى' }, 500);
  }
}

// ============================================================================
// Mark Insight as Read
// ============================================================================

export async function markInsightRead(c: AnalyticsContext) {
  try {
    const id = c.req.param('id');
    const merchantId = await getmerchantId(c);

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/smart_insights?id=eq.${id}&store_id=eq.${merchantId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      }
    );

    return c.json({ ok: true, message: 'تم التحديث' });
  } catch (error: any) {
    console.error('Mark insight read error:', error);
    return c.json({ ok: false, error: 'فشل في التحديث' }, 500);
  }
}

// ============================================================================
// Dismiss Insight
// ============================================================================

export async function dismissInsight(c: AnalyticsContext) {
  try {
    const id = c.req.param('id');
    const merchantId = await getmerchantId(c);

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/smart_insights?id=eq.${id}&store_id=eq.${merchantId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_dismissed: true }),
      }
    );

    return c.json({ ok: true, message: 'تم الإخفاء' });
  } catch (error: any) {
    console.error('Dismiss insight error:', error);
    return c.json({ ok: false, error: 'فشل في الإخفاء' }, 500);
  }
}

// ============================================================================
// Get Store Goals
// ============================================================================

export async function getStoreGoals(c: AnalyticsContext) {
  try {
    const merchantId = await getmerchantId(c);
    const status = c.req.query('status');

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    let url = `${c.env.SUPABASE_URL}/rest/v1/store_goals?store_id=eq.${merchantId}&order=created_at.desc`;
    if (status) {
      url += `&status=eq.${status}`;
    }

    const response = await fetch(url, {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return c.json({ ok: true, data });
  } catch (error: any) {
    console.error('Get store goals error:', error);
    return c.json({ ok: false, error: 'فشل في جلب الأهداف' }, 500);
  }
}

// ============================================================================
// Create Store Goal
// ============================================================================

export async function createStoreGoal(c: AnalyticsContext) {
  try {
    const merchantId = await getmerchantId(c);
    const body = await c.req.json();

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const { goal_type, period, target_value, start_date, end_date } = body;

    if (!goal_type || !period || !target_value) {
      return c.json({ ok: false, error: 'Missing required fields' }, 400);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/store_goals`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          store_id: merchantId,
          goal_type,
          period,
          target_value,
          start_date: start_date || new Date().toISOString().split('T')[0],
          end_date: end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
      }
    );

    const data = await response.json() as any[];
    return c.json({ ok: true, data: data[0] });
  } catch (error: any) {
    console.error('Create store goal error:', error);
    return c.json({ ok: false, error: 'فشل في إنشاء الهدف' }, 500);
  }
}

// ============================================================================
// Update Store Goal
// ============================================================================

export async function updateStoreGoal(c: AnalyticsContext) {
  try {
    const id = c.req.param('id');
    const merchantId = await getmerchantId(c);
    const body = await c.req.json();

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/store_goals?id=eq.${id}&store_id=eq.${merchantId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json() as any[];
    return c.json({ ok: true, data: data[0] });
  } catch (error: any) {
    console.error('Update store goal error:', error);
    return c.json({ ok: false, error: 'فشل في تحديث الهدف' }, 500);
  }
}

// ============================================================================
// Delete Store Goal
// ============================================================================

export async function deleteStoreGoal(c: AnalyticsContext) {
  try {
    const id = c.req.param('id');
    const merchantId = await getmerchantId(c);

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/store_goals?id=eq.${id}&store_id=eq.${merchantId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return c.json({ ok: true, message: 'تم الحذف' });
  } catch (error: any) {
    console.error('Delete store goal error:', error);
    return c.json({ ok: false, error: 'فشل في الحذف' }, 500);
  }
}

// ============================================================================
// Get Realtime Stats (for live dashboard)
// ============================================================================

export async function getRealtimeStats(c: AnalyticsContext) {
  try {
    const merchantId = await getmerchantId(c);

    if (!merchantId) {
      return c.json({ ok: false, error: 'Store not found' }, 404);
    }

    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    // Get today's stats
    const todayResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/analytics_daily?store_id=eq.${merchantId}&date=eq.${today}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const todayStats = await todayResponse.json() as any[];

    // Get current hour stats
    const hourlyResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/analytics_hourly?store_id=eq.${merchantId}&date=eq.${today}&hour=eq.${currentHour}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const hourlyStats = await hourlyResponse.json() as any[];

    // Get active carts count
    const cartsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/abandoned_carts?store_id=eq.${merchantId}&status=eq.abandoned&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const activeCarts = await cartsResponse.json() as any[];

    return c.json({
      ok: true,
      data: {
        today: todayStats[0] || {},
        currentHour: hourlyStats[0] || {},
        activeCarts: activeCarts?.length || 0,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Get realtime stats error:', error);
    return c.json({ ok: false, error: 'فشل في جلب البيانات' }, 500);
  }
}


