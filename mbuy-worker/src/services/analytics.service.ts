/**
 * Analytics Service
 * Handles analytics and reporting for merchants and admin
 */

import { eq, and, sql, desc, between } from 'drizzle-orm';
import type { Database } from '../db';
import type { Env } from '../types';
import { orders } from '../db/schema/orders';
import { products } from '../db/schema/products';
import { customers } from '../db/schema/users';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface SalesOverview {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
}

export interface SalesByPeriod {
  period: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  quantity: number;
}

export interface CustomerStats {
  newCustomers: number;
  returningCustomers: number;
  averageLifetimeValue: number;
}

export class AnalyticsService {
  constructor(
    private db: Database,
    private env: Env
  ) {}

  /**
   * Get sales overview
   */
  async getSalesOverview(
    params: { merchantId?: string; dateRange?: DateRange } = {}
  ): Promise<SalesOverview> {
    const { merchantId, dateRange } = params;

    const conditions = [];
    if (merchantId) {
      conditions.push(eq(orders.merchantId, merchantId));
    }
    if (dateRange) {
      conditions.push(between(orders.createdAt, dateRange.startDate, dateRange.endDate));
    }
    conditions.push(sql`${orders.status} NOT IN ('cancelled', 'refunded')`);

    const whereClause = and(...conditions);

    // Get revenue and orders
    const [salesStats] = await this.db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(total::numeric), 0)`,
        totalOrders: sql<number>`count(*)::int`,
        uniqueCustomers: sql<number>`count(DISTINCT customer_id)::int`,
      })
      .from(orders)
      .where(whereClause);

    const totalRevenue = parseFloat(String(salesStats?.totalRevenue || 0));
    const totalOrders = salesStats?.totalOrders || 0;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalCustomers: salesStats?.uniqueCustomers || 0,
    };
  }

  /**
   * Get sales by period (daily/weekly/monthly)
   */
  async getSalesByPeriod(
    period: 'daily' | 'weekly' | 'monthly',
    params: { merchantId?: string; dateRange?: DateRange } = {}
  ): Promise<SalesByPeriod[]> {
    const { merchantId, dateRange } = params;

    const conditions = [];
    if (merchantId) {
      conditions.push(eq(orders.merchantId, merchantId));
    }
    if (dateRange) {
      conditions.push(between(orders.createdAt, dateRange.startDate, dateRange.endDate));
    }
    conditions.push(sql`${orders.status} NOT IN ('cancelled', 'refunded')`);

    const whereClause = and(...conditions);

    // Determine date truncation based on period
    let dateTrunc: string;
    switch (period) {
      case 'daily':
        dateTrunc = 'day';
        break;
      case 'weekly':
        dateTrunc = 'week';
        break;
      case 'monthly':
        dateTrunc = 'month';
        break;
    }

    const result = await this.db.execute<{
      period: Date;
      revenue: number;
      orders: number;
    }>(sql`
      SELECT 
        date_trunc(${dateTrunc}, created_at) as period,
        COALESCE(SUM(total::numeric), 0) as revenue,
        count(*)::int as orders
      FROM orders
      WHERE ${whereClause}
      GROUP BY date_trunc(${dateTrunc}, created_at)
      ORDER BY period DESC
      LIMIT 30
    `);

    return result.map(row => ({
      period: row.period.toISOString(),
      revenue: parseFloat(String(row.revenue)),
      orders: row.orders,
    }));
  }

  /**
   * Get top selling products
   */
  async getTopProducts(
    params: { merchantId?: string; dateRange?: DateRange; limit?: number } = {}
  ): Promise<TopProduct[]> {
    const { merchantId, dateRange, limit = 10 } = params;

    const conditions = [];
    if (merchantId) {
      conditions.push(sql`p.merchant_id = ${merchantId}`);
    }
    if (dateRange) {
      conditions.push(sql`o.created_at BETWEEN ${dateRange.startDate} AND ${dateRange.endDate}`);
    }
    conditions.push(sql`o.status NOT IN ('cancelled', 'refunded')`);

    const whereClause = conditions.length > 0 
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

    const result = await this.db.execute<{
      id: string;
      name: string;
      revenue: number;
      quantity: number;
    }>(sql`
      SELECT 
        p.id,
        p.name,
        COALESCE(SUM(oi.total::numeric), 0) as revenue,
        COALESCE(SUM(oi.quantity), 0)::int as quantity
      FROM products p
      INNER JOIN order_items oi ON p.id = oi.product_id
      INNER JOIN orders o ON oi.order_id = o.id
      ${whereClause}
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
      LIMIT ${limit}
    `);

    return result.map(row => ({
      id: row.id,
      name: row.name,
      revenue: parseFloat(String(row.revenue)),
      quantity: row.quantity,
    }));
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(
    params: { merchantId?: string; dateRange?: DateRange } = {}
  ): Promise<CustomerStats> {
    const { dateRange } = params;

    // New customers in period
    const newCustomerConditions = [];
    if (dateRange) {
      newCustomerConditions.push(between(customers.createdAt, dateRange.startDate, dateRange.endDate));
    }

    const [newCustomerStats] = await this.db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(customers)
      .where(newCustomerConditions.length > 0 ? and(...newCustomerConditions) : undefined);

    // Returning customers (more than 1 order)
    const [returningStats] = await this.db.execute<{
      count: number;
    }>(sql`
      SELECT count(*)::int as count
      FROM (
        SELECT customer_id
        FROM orders
        WHERE status NOT IN ('cancelled', 'refunded')
        GROUP BY customer_id
        HAVING count(*) > 1
      ) as returning_customers
    `);

    // Average lifetime value
    const [ltvStats] = await this.db.execute<{
      avg_ltv: number;
    }>(sql`
      SELECT COALESCE(AVG(total_spent), 0) as avg_ltv
      FROM (
        SELECT customer_id, SUM(total::numeric) as total_spent
        FROM orders
        WHERE status NOT IN ('cancelled', 'refunded')
        GROUP BY customer_id
      ) as customer_totals
    `);

    return {
      newCustomers: newCustomerStats?.count || 0,
      returningCustomers: returningStats?.count || 0,
      averageLifetimeValue: parseFloat(String(ltvStats?.avg_ltv || 0)),
    };
  }

  /**
   * Get order status distribution
   */
  async getOrderStatusDistribution(
    params: { merchantId?: string; dateRange?: DateRange } = {}
  ): Promise<Record<string, number>> {
    const { merchantId, dateRange } = params;

    const conditions = [];
    if (merchantId) {
      conditions.push(eq(orders.merchantId, merchantId));
    }
    if (dateRange) {
      conditions.push(between(orders.createdAt, dateRange.startDate, dateRange.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(whereClause)
      .groupBy(orders.status);

    return result.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get category performance
   */
  async getCategoryPerformance(
    params: { merchantId?: string; dateRange?: DateRange; limit?: number } = {}
  ): Promise<{ categoryId: string; categoryName: string; revenue: number; productCount: number }[]> {
    const { merchantId, dateRange, limit = 10 } = params;

    const conditions = [];
    if (merchantId) {
      conditions.push(sql`p.merchant_id = ${merchantId}`);
    }
    if (dateRange) {
      conditions.push(sql`o.created_at BETWEEN ${dateRange.startDate} AND ${dateRange.endDate}`);
    }
    conditions.push(sql`o.status NOT IN ('cancelled', 'refunded')`);

    const whereClause = conditions.length > 0 
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

    const result = await this.db.execute<{
      category_id: string;
      category_name: string;
      revenue: number;
      product_count: number;
    }>(sql`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        COALESCE(SUM(oi.total::numeric), 0) as revenue,
        count(DISTINCT p.id)::int as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      ${whereClause}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
      LIMIT ${limit}
    `);

    return result.map(row => ({
      categoryId: row.category_id,
      categoryName: row.category_name,
      revenue: parseFloat(String(row.revenue)),
      productCount: row.product_count,
    }));
  }

  /**
   * Get real-time dashboard stats
   */
  async getDashboardStats(merchantId?: string): Promise<{
    today: SalesOverview;
    yesterday: SalesOverview;
    thisWeek: SalesOverview;
    thisMonth: SalesOverview;
    pendingOrders: number;
    lowStockProducts: number;
  }> {
    const now = new Date();
    
    // Date ranges
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get stats for each period
    const [today, yesterday, thisWeek, thisMonth] = await Promise.all([
      this.getSalesOverview({ merchantId, dateRange: { startDate: todayStart, endDate: now } }),
      this.getSalesOverview({ merchantId, dateRange: { startDate: yesterdayStart, endDate: todayStart } }),
      this.getSalesOverview({ merchantId, dateRange: { startDate: weekStart, endDate: now } }),
      this.getSalesOverview({ merchantId, dateRange: { startDate: monthStart, endDate: now } }),
    ]);

    // Pending orders
    const pendingConditions = [eq(orders.status, 'pending')];
    if (merchantId) {
      pendingConditions.push(eq(orders.merchantId, merchantId));
    }

    const [{ count: pendingOrders }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(...pendingConditions));

    // Low stock products (less than 10)
    const stockConditions = [sql`${products.stockQuantity} < 10`, eq(products.status, 'active')];
    if (merchantId) {
      stockConditions.push(eq(products.merchantId, merchantId));
    }

    const [{ count: lowStockProducts }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(and(...stockConditions));

    return {
      today,
      yesterday,
      thisWeek,
      thisMonth,
      pendingOrders,
      lowStockProducts,
    };
  }
}
