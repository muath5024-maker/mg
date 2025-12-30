/**
 * Admin CRUD Endpoints
 * 
 * For the Admin Panel (mbuy-admin)
 * Requires admin/owner role
 * 
 * @module endpoints/admin-crud
 */

import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Env, AuthContext } from '../types';

type AdminContext = Context<{ Bindings: Env; Variables: AuthContext }>;

function getSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// =====================================================
// DASHBOARD STATS
// =====================================================

export async function getDashboardStats(c: AdminContext) {
  try {
    const supabase = getSupabase(c.env);

    // Get counts in parallel
    const [
      { count: totalMerchants },
      { count: totalCustomers },
      { count: totalOrders },
      { count: activeMerchants },
      { count: pendingMerchants },
    ] = await Promise.all([
      supabase.from('merchants').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    const { count: ordersToday } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    // Get total revenue
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_amount')
      .in('status', ['paid', 'delivered', 'completed']);

    const totalRevenue = (revenueData || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Get this month's new signups
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const { count: newMerchantsThisMonth } = await supabase
      .from('merchants')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstOfMonth.toISOString());

    const { count: newCustomersThisMonth } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstOfMonth.toISOString());

    return c.json({
      ok: true,
      data: {
        totalMerchants: totalMerchants || 0,
        totalCustomers: totalCustomers || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        activeMerchants: activeMerchants || 0,
        pendingMerchants: pendingMerchants || 0,
        ordersToday: ordersToday || 0,
        newMerchantsThisMonth: newMerchantsThisMonth || 0,
        newCustomersThisMonth: newCustomersThisMonth || 0,
      }
    });

  } catch (error: any) {
    console.error('[getDashboardStats] Error:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

export async function getRevenueChart(c: AdminContext) {
  try {
    const days = parseInt(c.req.query('days') || '30');
    const supabase = getSupabase(c.env);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .gte('created_at', startDate.toISOString())
      .in('status', ['paid', 'delivered', 'completed']);

    // Group by date
    const revenueByDate: Record<string, { revenue: number; orders: number }> = {};
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      revenueByDate[dateStr] = { revenue: 0, orders: 0 };
    }

    for (const order of orders || []) {
      const dateStr = order.created_at.split('T')[0];
      if (revenueByDate[dateStr]) {
        revenueByDate[dateStr].revenue += order.total_amount || 0;
        revenueByDate[dateStr].orders += 1;
      }
    }

    const chartData = Object.entries(revenueByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return c.json({ ok: true, data: chartData });

  } catch (error: any) {
    console.error('[getRevenueChart] Error:', error);
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// MERCHANTS MANAGEMENT
// =====================================================

export async function listMerchants(c: AdminContext) {
  try {
    const supabase = getSupabase(c.env);
    
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search');
    const status = c.req.query('status');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('merchants')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({
      ok: true,
      data: data || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) }
    });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

export async function getMerchant(c: AdminContext) {
  const merchantId = c.req.param('id');

  try {
    const supabase = getSupabase(c.env);

    const { data, error } = await supabase
      .from('merchants')
      .select('*, merchant_users(*)')
      .eq('id', merchantId)
      .single();

    if (error || !data) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Merchant not found' }, 404);
    }

    return c.json({ ok: true, data });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

export async function updateMerchant(c: AdminContext) {
  const merchantId = c.req.param('id');

  try {
    const body = await c.req.json();
    const supabase = getSupabase(c.env);

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    const allowedFields = ['name', 'email', 'phone', 'status', 'is_verified'];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from('merchants')
      .update(updateData)
      .eq('id', merchantId)
      .select()
      .single();

    if (error || !data) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Merchant not found' }, 404);
    }

    return c.json({ ok: true, data });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// CUSTOMERS MANAGEMENT
// =====================================================

export async function listCustomers(c: AdminContext) {
  try {
    const supabase = getSupabase(c.env);
    
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search');
    const status = c.req.query('status');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({
      ok: true,
      data: data || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) }
    });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

export async function getCustomer(c: AdminContext) {
  const customerId = c.req.param('id');

  try {
    const supabase = getSupabase(c.env);

    const { data, error } = await supabase
      .from('customers')
      .select('*, orders(id, status, total_amount, created_at)')
      .eq('id', customerId)
      .single();

    if (error || !data) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Customer not found' }, 404);
    }

    return c.json({ ok: true, data });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

export async function updateCustomer(c: AdminContext) {
  const customerId = c.req.param('id');

  try {
    const body = await c.req.json();
    const supabase = getSupabase(c.env);

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    const allowedFields = ['name', 'email', 'phone', 'status'];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', customerId)
      .select()
      .single();

    if (error || !data) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Customer not found' }, 404);
    }

    return c.json({ ok: true, data });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// ORDERS MANAGEMENT (Admin View)
// =====================================================

export async function listAllOrders(c: AdminContext) {
  try {
    const supabase = getSupabase(c.env);
    
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status');
    const merchantId = c.req.query('merchant_id');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select(`
        *,
        customers(id, name, email),
        merchants(id, name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (merchantId) query = query.eq('merchant_id', merchantId);

    const { data, error, count } = await query;

    if (error) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({
      ok: true,
      data: data || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) }
    });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

export async function getOrderAdmin(c: AdminContext) {
  const orderId = c.req.param('id');

  try {
    const supabase = getSupabase(c.env);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(id, name, email, phone),
        merchants(id, name, email),
        order_items(*),
        order_addresses(*),
        order_payments(*),
        order_status_history(*)
      `)
      .eq('id', orderId)
      .single();

    if (error || !data) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Order not found' }, 404);
    }

    return c.json({ ok: true, data });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

// =====================================================
// PRODUCTS MANAGEMENT (Admin View)
// =====================================================

export async function listAllProducts(c: AdminContext) {
  try {
    const supabase = getSupabase(c.env);
    
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const merchantId = c.req.query('merchant_id');
    const status = c.req.query('status');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select(`
        *,
        merchants(id, name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (merchantId) query = query.eq('merchant_id', merchantId);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;

    if (error) {
      return c.json({ ok: false, error: 'DATABASE_ERROR', message: error.message }, 500);
    }

    return c.json({
      ok: true,
      data: data || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) }
    });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}

export async function getProductAdmin(c: AdminContext) {
  const productId = c.req.param('id');

  try {
    const supabase = getSupabase(c.env);

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        merchants(id, name, email),
        product_media(*),
        product_variants(*)
      `)
      .eq('id', productId)
      .single();

    if (error || !data) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Product not found' }, 404);
    }

    return c.json({ ok: true, data });

  } catch (error: any) {
    return c.json({ ok: false, error: 'INTERNAL_ERROR', message: error.message }, 500);
  }
}


