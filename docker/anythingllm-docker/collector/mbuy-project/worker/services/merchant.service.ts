/**
 * Merchant Service
 * Handles merchant-related business logic
 */

import { eq, and, ilike, desc, sql } from 'drizzle-orm';
import type { Database } from '../db';
import type { Env } from '../types';
import { merchants, merchantUsers, type Merchant, type NewMerchant, type MerchantUser, type NewMerchantUser } from '../db/schema/merchants';

export interface MerchantListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
}

export interface MerchantListResult {
  merchants: Merchant[];
  total: number;
  page: number;
  totalPages: number;
}

export class MerchantService {
  constructor(
    private db: Database,
    private env: Env
  ) {}

  /**
   * Get merchant by ID
   */
  async getById(id: string): Promise<Merchant | null> {
    const [merchant] = await this.db
      .select()
      .from(merchants)
      .where(eq(merchants.id, id))
      .limit(1);

    return merchant || null;
  }

  /**
   * Get merchant by slug
   */
  async getBySlug(slug: string): Promise<Merchant | null> {
    const [merchant] = await this.db
      .select()
      .from(merchants)
      .where(eq(merchants.slug, slug))
      .limit(1);

    return merchant || null;
  }

  /**
   * List merchants with pagination and filters
   */
  async list(params: MerchantListParams = {}): Promise<MerchantListResult> {
    const { page = 1, limit = 20, search, status, category } = params;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(merchants.status, status));
    }
    if (category) {
      conditions.push(eq(merchants.categoryId, category));
    }
    if (search) {
      conditions.push(
        sql`(${merchants.businessName} ILIKE ${'%' + search + '%'} OR ${merchants.businessNameAr} ILIKE ${'%' + search + '%'})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(merchants)
      .where(whereClause);

    // Get merchants
    const result = await this.db
      .select()
      .from(merchants)
      .where(whereClause)
      .orderBy(desc(merchants.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      merchants: result,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get featured merchants
   */
  async getFeatured(limit: number = 10): Promise<Merchant[]> {
    return this.db
      .select()
      .from(merchants)
      .where(
        and(
          eq(merchants.status, 'active'),
          eq(merchants.featured, true)
        )
      )
      .orderBy(desc(merchants.rating))
      .limit(limit);
  }

  /**
   * Create a new merchant
   */
  async create(data: NewMerchant): Promise<Merchant> {
    // Generate slug if not provided
    if (!data.slug) {
      data.slug = this.generateSlug(data.businessName);
    }

    const [merchant] = await this.db
      .insert(merchants)
      .values(data)
      .returning();

    return merchant;
  }

  /**
   * Update a merchant
   */
  async update(id: string, data: Partial<NewMerchant>): Promise<Merchant | null> {
    const [merchant] = await this.db
      .update(merchants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(merchants.id, id))
      .returning();

    return merchant || null;
  }

  /**
   * Update merchant status
   */
  async updateStatus(id: string, status: string): Promise<Merchant | null> {
    const [merchant] = await this.db
      .update(merchants)
      .set({ status, updatedAt: new Date() })
      .where(eq(merchants.id, id))
      .returning();

    return merchant || null;
  }

  /**
   * Delete a merchant (soft delete)
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .update(merchants)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(merchants.id, id));

    return (result as any).rowCount > 0;
  }

  // ============ Merchant Users ============

  /**
   * Get merchant user by ID
   */
  async getUserById(id: string): Promise<MerchantUser | null> {
    const [user] = await this.db
      .select()
      .from(merchantUsers)
      .where(eq(merchantUsers.id, id))
      .limit(1);

    return user || null;
  }

  /**
   * Get merchant users
   */
  async getUsers(merchantId: string): Promise<MerchantUser[]> {
    return this.db
      .select()
      .from(merchantUsers)
      .where(eq(merchantUsers.merchantId, merchantId))
      .orderBy(desc(merchantUsers.createdAt));
  }

  /**
   * Create a merchant user
   */
  async createUser(data: NewMerchantUser): Promise<MerchantUser> {
    const [user] = await this.db
      .insert(merchantUsers)
      .values({
        ...data,
        email: data.email.toLowerCase(),
      })
      .returning();

    return user;
  }

  /**
   * Update a merchant user
   */
  async updateUser(id: string, data: Partial<NewMerchantUser>): Promise<MerchantUser | null> {
    const [user] = await this.db
      .update(merchantUsers)
      .set({
        ...data,
        email: data.email?.toLowerCase(),
        updatedAt: new Date(),
      })
      .where(eq(merchantUsers.id, id))
      .returning();

    return user || null;
  }

  /**
   * Delete a merchant user
   */
  async deleteUser(id: string): Promise<boolean> {
    const result = await this.db
      .update(merchantUsers)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(merchantUsers.id, id));

    return (result as any).rowCount > 0;
  }

  // ============ Stats & Analytics ============

  /**
   * Get merchant statistics
   */
  async getStats(merchantId: string): Promise<{
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
  }> {
    const merchant = await this.getById(merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Get product count
    const [productStats] = await this.db.execute<{
      total_products: number;
    }>(sql`
      SELECT COUNT(*)::int as total_products
      FROM products 
      WHERE merchant_id = ${merchantId}
      AND status = 'active'
    `);

    // Get order stats
    const [orderStats] = await this.db.execute<{
      total_orders: number;
      total_revenue: number;
    }>(sql`
      SELECT 
        COUNT(*)::int as total_orders,
        COALESCE(SUM(total), 0)::numeric as total_revenue
      FROM orders 
      WHERE merchant_id = ${merchantId}
      AND status NOT IN ('cancelled', 'refunded')
    `);

    // Get review stats
    const [reviewStats] = await this.db.execute<{
      total_reviews: number;
      avg_rating: number;
    }>(sql`
      SELECT 
        COUNT(*)::int as total_reviews,
        COALESCE(AVG(rating), 0)::numeric as avg_rating
      FROM product_reviews pr
      JOIN products p ON pr.product_id = p.id
      WHERE p.merchant_id = ${merchantId}
    `);

    return {
      totalProducts: productStats?.total_products || 0,
      totalOrders: orderStats?.total_orders || 0,
      totalRevenue: parseFloat(String(orderStats?.total_revenue || 0)),
      averageRating: parseFloat(String(reviewStats?.avg_rating || 0)),
      totalReviews: reviewStats?.total_reviews || 0,
    };
  }

  /**
   * Update merchant rating
   */
  async updateRating(merchantId: string): Promise<void> {
    const [stats] = await this.db.execute<{
      avg_rating: number;
      total_reviews: number;
    }>(sql`
      SELECT 
        COALESCE(AVG(rating), 0)::numeric as avg_rating,
        COUNT(*)::int as total_reviews
      FROM product_reviews pr
      JOIN products p ON pr.product_id = p.id
      WHERE p.merchant_id = ${merchantId}
    `);

    await this.db
      .update(merchants)
      .set({
        rating: String(parseFloat(String(stats?.avg_rating || 0))),
        reviewCount: stats?.total_reviews || 0,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, merchantId));
  }

  // ============ Helpers ============

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
