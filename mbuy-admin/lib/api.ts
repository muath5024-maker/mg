import { getSupabase } from './supabase';
import type {
  Store,
  UserProfile,
  Subscription,
  FeatureAction,
  Coupon,
  FlashSale,
  ReferralSettings,
  Order,
  AnalyticsSummary,
  RevenueData,
  PointReward,
  ApiResponse,
  ListResponse,
  PaginationInfo,
  WorkerHealth,
} from '@/types';

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://misty-mode-b68b.baharista1.workers.dev';

// Helper function for pagination
function getPagination(page: number, pageSize: number) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

// Helper to get empty response when Supabase is not configured
function emptyListResponse<T>(pageSize: number): ListResponse<T> {
  return {
    data: [],
    pagination: { page: 0, pageSize, total: 0, totalPages: 0 },
    error: 'Supabase not configured',
  };
}

function emptyResponse<T>(defaultValue: T): ApiResponse<T> {
  return { data: defaultValue, error: 'Supabase not configured' };
}

// ==================== STORES API ====================

export async function getStores(
  page = 0,
  pageSize = 20,
  search?: string,
  status?: string
): Promise<ListResponse<Store>> {
  const supabase = getSupabase();
  if (!supabase) return emptyListResponse<Store>(pageSize);

  try {
    const { from, to } = getPagination(page, pageSize);

    let query = supabase
      .from('merchants')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    const total = count || 0;
    const pagination: PaginationInfo = {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };

    return { data: data || [], pagination, error: error?.message || null };
  } catch (err) {
    return { data: [], pagination: { page: 0, pageSize, total: 0, totalPages: 0 }, error: String(err) };
  }
}

export async function getStore(id: string): Promise<ApiResponse<Store>> {
  const supabase = getSupabase();
  if (!supabase) return emptyResponse<Store>(null as unknown as Store);

  try {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error: error?.message || null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function updateStore(id: string, updates: Partial<Store>): Promise<ApiResponse<Store>> {
  const supabase = getSupabase();
  if (!supabase) return emptyResponse<Store>(null as unknown as Store);

  try {
    const { data, error } = await supabase
      .from('merchants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error: error?.message || null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function updateStoreStatus(id: string, status: Store['status']): Promise<ApiResponse<Store>> {
  return updateStore(id, { status });
}

// ==================== USERS API ====================

export async function getUsers(
  page = 0,
  pageSize = 20,
  search?: string,
  role?: string
): Promise<ListResponse<UserProfile>> {
  const supabase = getSupabase();
  if (!supabase) return emptyListResponse<UserProfile>(pageSize);

  try {
    const { from, to } = getPagination(page, pageSize);

    let query = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error, count } = await query;

    const total = count || 0;
    const pagination: PaginationInfo = {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };

    return { data: data || [], pagination, error: error?.message || null };
  } catch (err) {
    return { data: [], pagination: { page: 0, pageSize, total: 0, totalPages: 0 }, error: String(err) };
  }
}

export async function getUser(id: string): Promise<ApiResponse<UserProfile>> {
  const supabase = getSupabase();
  if (!supabase) return emptyResponse<UserProfile>(null as unknown as UserProfile);

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error: error?.message || null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function updateUserRole(id: string, role: UserProfile['role']): Promise<ApiResponse<UserProfile>> {
  const supabase = getSupabase();
  if (!supabase) return emptyResponse<UserProfile>(null as unknown as UserProfile);

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error: error?.message || null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ==================== SUBSCRIPTIONS API ====================

export async function getSubscriptions(
  page = 0,
  pageSize = 20,
  status?: string
): Promise<ListResponse<Subscription>> {
  const supabase = getSupabase();
  if (!supabase) return emptyListResponse<Subscription>(pageSize);

  try {
    const { from, to } = getPagination(page, pageSize);

    let query = supabase
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    const total = count || 0;
    const pagination: PaginationInfo = {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };

    return { data: data || [], pagination, error: error?.message || null };
  } catch (err) {
    return { data: [], pagination: { page: 0, pageSize, total: 0, totalPages: 0 }, error: String(err) };
  }
}

// ==================== FEATURE FLAGS API ====================

export async function getFeatureFlags(): Promise<ApiResponse<FeatureAction[]>> {
  const supabase = getSupabase();
  if (!supabase) return emptyResponse<FeatureAction[]>([]);

  try {
    const { data, error } = await supabase
      .from('feature_actions')
      .select('*')
      .order('key');

    return { data: data || [], error: error?.message || null };
  } catch (err) {
    return { data: [], error: String(err) };
  }
}

export async function updateFeatureFlag(
  id: string,
  updates: Partial<FeatureAction>
): Promise<ApiResponse<FeatureAction>> {
  const supabase = getSupabase();
  if (!supabase) return emptyResponse<FeatureAction>(null as unknown as FeatureAction);

  try {
    const { data, error } = await supabase
      .from('feature_actions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error: error?.message || null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function toggleFeatureFlag(id: string, enabled: boolean): Promise<ApiResponse<FeatureAction>> {
  return updateFeatureFlag(id, { is_enabled: enabled });
}

// ==================== COUPONS API ====================

export async function getCoupons(
  page = 0,
  pageSize = 20,
  storeId?: string
): Promise<ListResponse<Coupon>> {
  const supabase = getSupabase();
  if (!supabase) return emptyListResponse<Coupon>(pageSize);

  try {
    const { from, to } = getPagination(page, pageSize);

    let query = supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error, count } = await query;

    const total = count || 0;
    const pagination: PaginationInfo = {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };

    return { data: data || [], pagination, error: error?.message || null };
  } catch (err) {
    return { data: [], pagination: { page: 0, pageSize, total: 0, totalPages: 0 }, error: String(err) };
  }
}

export async function updateCoupon(id: string, updates: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
  const supabase = getSupabase();
  if (!supabase) return emptyResponse<Coupon>(null as unknown as Coupon);

  try {
    const { data, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error: error?.message || null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ==================== FLASH SALES API ====================

export async function getFlashSales(
  page = 0,
  pageSize = 20,
  status?: string
): Promise<ListResponse<FlashSale>> {
  const supabase = getSupabase();
  if (!supabase) return emptyListResponse<FlashSale>(pageSize);

  try {
    const { from, to } = getPagination(page, pageSize);

    let query = supabase
      .from('flash_sales')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    const total = count || 0;
    const pagination: PaginationInfo = {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };

    return { data: data || [], pagination, error: error?.message || null };
  } catch (err) {
    return { data: [], pagination: { page: 0, pageSize, total: 0, totalPages: 0 }, error: String(err) };
  }
}

// ==================== REFERRALS API ====================

export async function getReferralSettings(): Promise<ApiResponse<ReferralSettings[]>> {
  const supabase = getSupabase();
  if (!supabase) return emptyResponse<ReferralSettings[]>([]);

  try {
    const { data, error } = await supabase
      .from('referral_settings')
      .select('*')
      .order('created_at', { ascending: false });

    return { data: data || [], error: error?.message || null };
  } catch (err) {
    return { data: [], error: String(err) };
  }
}

// ==================== REWARDS API ====================

export async function getRewards(): Promise<ApiResponse<PointReward[]>> {
  const supabase = getSupabase();
  if (!supabase) return emptyResponse<PointReward[]>([]);

  try {
    const { data, error } = await supabase
      .from('point_rewards')
      .select('*')
      .order('display_order');

    return { data: data || [], error: error?.message || null };
  } catch (err) {
    return { data: [], error: String(err) };
  }
}

export async function updateReward(id: string, updates: Partial<PointReward>): Promise<ApiResponse<PointReward>> {
  const supabase = getSupabase();
  if (!supabase) return emptyResponse<PointReward>(null as unknown as PointReward);

  try {
    const { data, error } = await supabase
      .from('point_rewards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error: error?.message || null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ==================== ORDERS API ====================

export async function getOrders(
  page = 0,
  pageSize = 20,
  status?: string
): Promise<ListResponse<Order>> {
  const supabase = getSupabase();
  if (!supabase) return emptyListResponse<Order>(pageSize);

  try {
    const { from, to } = getPagination(page, pageSize);

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    const total = count || 0;
    const pagination: PaginationInfo = {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };

    return { data: data || [], pagination, error: error?.message || null };
  } catch (err) {
    return { data: [], pagination: { page: 0, pageSize, total: 0, totalPages: 0 }, error: String(err) };
  }
}

// ==================== ANALYTICS API ====================

export async function getAnalyticsSummary(): Promise<ApiResponse<AnalyticsSummary>> {
  const supabase = getSupabase();
  if (!supabase) {
    return emptyResponse<AnalyticsSummary>({
      total_stores: 0,
      total_users: 0,
      total_orders: 0,
      total_revenue: 0,
      active_subscriptions: 0,
      stores_growth: 0,
      users_growth: 0,
      orders_growth: 0,
      revenue_growth: 0,
    });
  }

  try {
    const [storesRes, usersRes, ordersRes, subscriptionsRes] = await Promise.all([
      supabase.from('merchants').select('id', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id, total_amount', { count: 'exact' }),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    const summary: AnalyticsSummary = {
      total_stores: storesRes.count || 0,
      total_users: usersRes.count || 0,
      total_orders: ordersRes.count || 0,
      total_revenue: totalRevenue,
      active_subscriptions: subscriptionsRes.count || 0,
      stores_growth: 0,
      users_growth: 0,
      orders_growth: 0,
      revenue_growth: 0,
    };

    return { data: summary, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function getRevenueData(days = 30): Promise<ApiResponse<RevenueData[]>> {
  const supabase = getSupabase();
  if (!supabase) return emptyResponse<RevenueData[]>([]);

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .gte('created_at', startDate.toISOString())
      .order('created_at');

    if (error) throw error;

    const grouped: Record<string, { revenue: number; orders: number }> = {};

    data?.forEach((order) => {
      const date = order.created_at.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { revenue: 0, orders: 0 };
      }
      grouped[date].revenue += order.total_amount || 0;
      grouped[date].orders += 1;
    });

    const revenueData: RevenueData[] = Object.entries(grouped).map(([date, values]) => ({
      date,
      revenue: values.revenue,
      orders: values.orders,
    }));

    return { data: revenueData, error: null };
  } catch (err) {
    return { data: [], error: String(err) };
  }
}

// ==================== WORKER API ====================

export async function checkWorkerHealth(): Promise<ApiResponse<WorkerHealth>> {
  try {
    const start = Date.now();
    const response = await fetch(`${WORKER_URL}/admin/api/health`);
    const latency = Date.now() - start;

    if (response.ok) {
      return {
        data: {
          status: 'healthy',
          latency_ms: latency,
          last_checked: new Date().toISOString(),
        },
        error: null,
      };
    } else {
      return {
        data: {
          status: 'degraded',
          latency_ms: latency,
          last_checked: new Date().toISOString(),
        },
        error: null,
      };
    }
  } catch (err) {
    return {
      data: {
        status: 'down',
        latency_ms: 0,
        last_checked: new Date().toISOString(),
      },
      error: String(err),
    };
  }
}

// ==================== SETTINGS API ====================

export async function getGlobalSettings(): Promise<ApiResponse<Record<string, unknown>>> {
  return {
    data: {
      platform_name: 'MBUY',
      platform_name_ar: 'امباي',
      support_email: 'support@mbuy.app',
      default_currency: 'SAR',
      default_language: 'ar',
      maintenance_mode: false,
      registration_enabled: true,
      merchant_registration_enabled: true,
    },
    error: null,
  };
}
