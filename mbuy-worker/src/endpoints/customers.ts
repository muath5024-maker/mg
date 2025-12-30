/**
 * Customers System Endpoints
 * Manages store customers and followers
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type CustomersContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

/**
 * Get store customers
 * GET /secure/customers
 */
export async function getCustomers(c: CustomersContext) {
  try {
    const profileId = c.get('profileId');
    const url = new URL(c.req.url);
    const search = url.searchParams.get('search');
    const limit = url.searchParams.get('limit') || '100';
    const offset = url.searchParams.get('offset') || '0';

    // Get merchant's store
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const merchants: any[] = await merchantResponse.json();

    if (!merchants || merchants.length === 0) {
      return c.json({
        ok: true,
        data: [],
        total: 0,
      });
    }

    const merchantId = merchants[0].id;

    // Get customers from orders
    const ordersQuery = `${c.env.SUPABASE_URL}/rest/v1/orders?store_id=eq.${merchantId}&select=customer_id,customer_name,customer_phone,customer_email,total_amount,created_at`;

    const ordersResponse = await fetch(ordersQuery, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });

    const orders: any[] = await ordersResponse.json();

    // Get followers (using customers table instead of user_profiles)
    const followersQuery = `${c.env.SUPABASE_URL}/rest/v1/store_followers?store_id=eq.${merchantId}&select=user_id,followed_at,customers(id,full_name,phone,email,avatar_url)`;

    const followersResponse = await fetch(followersQuery, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });

    let followers: any[] = [];
    try {
      followers = await followersResponse.json();
      if (!Array.isArray(followers)) followers = [];
    } catch {
      followers = [];
    }

    // Aggregate customer data from orders
    const customerMap = new Map<string, any>();

    for (const order of orders) {
      const customerId = order.customer_id || order.customer_phone || order.customer_email;
      if (!customerId) continue;

      if (customerMap.has(customerId)) {
        const existing = customerMap.get(customerId);
        existing.total_orders += 1;
        existing.total_spent += parseFloat(order.total_amount || 0);
        if (new Date(order.created_at) > new Date(existing.last_order_date)) {
          existing.last_order_date = order.created_at;
        }
      } else {
        customerMap.set(customerId, {
          customer_id: customerId,
          customer_name: order.customer_name || 'عميل',
          customer_phone: order.customer_phone,
          customer_email: order.customer_email,
          customer_avatar: null,
          total_orders: 1,
          total_spent: parseFloat(order.total_amount || 0),
          last_order_date: order.created_at,
          is_follower: false,
          follow_date: null,
        });
      }
    }

    // Add followers
    for (const follower of followers) {
      const profile = follower.customers;
      if (!profile) continue;

      const customerId = profile.id;

      if (customerMap.has(customerId)) {
        const existing = customerMap.get(customerId);
        existing.is_follower = true;
        existing.follow_date = follower.followed_at;
        existing.customer_avatar = profile.avatar_url;
      } else {
        customerMap.set(customerId, {
          customer_id: customerId,
          customer_name: profile.full_name || 'متابع',
          customer_phone: profile.phone,
          customer_email: profile.email,
          customer_avatar: profile.avatar_url,
          total_orders: 0,
          total_spent: 0,
          last_order_date: null,
          is_follower: true,
          follow_date: follower.followed_at,
        });
      }
    }

    // Convert to array and filter
    let customers = Array.from(customerMap.values());

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(c =>
        c.customer_name?.toLowerCase().includes(searchLower) ||
        c.customer_phone?.includes(search) ||
        c.customer_email?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by total_spent descending
    customers.sort((a, b) => b.total_spent - a.total_spent);

    // Paginate
    const total = customers.length;
    const offsetNum = parseInt(offset);
    const limitNum = parseInt(limit);
    customers = customers.slice(offsetNum, offsetNum + limitNum);

    return c.json({
      ok: true,
      data: customers,
      total,
      summary: {
        total_customers: total,
        total_followers: customers.filter(c => c.is_follower).length,
        total_revenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
      },
    });

  } catch (error: any) {
    console.error('Get customers error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}

/**
 * Get single customer details
 * GET /secure/customers/:id
 */
export async function getCustomer(c: CustomersContext) {
  try {
    const profileId = c.get('profileId');
    const customerId = c.req.param('id');

    // Get merchant's store
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const merchants: any[] = await merchantResponse.json();

    if (!merchants || merchants.length === 0) {
      return c.json({
        ok: false,
        error: 'Store not found',
      }, 404);
    }

    const merchantId = merchants[0].id;

    // Get customer orders
    const ordersResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/orders?store_id=eq.${merchantId}&customer_id=eq.${customerId}&select=*&order=created_at.desc&limit=10`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const orders: any[] = await ordersResponse.json();

    // Get customer profile if exists
    const profileResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/customers?id=eq.${customerId}&select=*`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const profiles: any[] = await profileResponse.json();
    const profile = profiles[0];

    // Check if follower
    const followerResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/store_followers?store_id=eq.${merchantId}&user_id=eq.${customerId}&select=*`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const followerData: any[] = await followerResponse.json();
    const isFollower = followerData.length > 0;

    // Calculate stats
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    const lastOrderDate = orders[0]?.created_at;

    return c.json({
      ok: true,
      data: {
        customer_id: customerId,
        customer_name: profile?.full_name || orders[0]?.customer_name || 'عميل',
        customer_phone: profile?.phone || orders[0]?.customer_phone,
        customer_email: profile?.email || orders[0]?.customer_email,
        customer_avatar: profile?.avatar_url,
        total_orders: totalOrders,
        total_spent: totalSpent,
        last_order_date: lastOrderDate,
        is_follower: isFollower,
        follow_date: followerData[0]?.followed_at,
        recent_orders: orders,
      },
    });

  } catch (error: any) {
    console.error('Get customer error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}


