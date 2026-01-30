/**
 * Merchant GraphQL Resolvers
 */

import { eq, desc, and, sql } from 'drizzle-orm';
import { GraphQLContext } from '../context';
import * as schema from '../../db/schema';
import { requireMerchant, requireAdmin, getPagination } from './base';

export const merchantResolvers = {
  Query: {
    // Get current merchant
    myMerchant: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.isMerchant || !ctx.auth?.merchantId) {
        return null;
      }
      return ctx.loaders.merchantLoader.load(ctx.auth.merchantId);
    },

    // Get merchant by ID or slug
    merchant: async (
      _: unknown,
      args: { id?: string; slug?: string },
      ctx: GraphQLContext
    ) => {
      if (args.id) {
        return ctx.loaders.merchantLoader.load(args.id);
      }
      if (args.slug) {
        const [merchant] = await ctx.db
          .select()
          .from(schema.merchants)
          .where(eq(schema.merchants.slug, args.slug))
          .limit(1);
        return merchant || null;
      }
      return null;
    },

    // List merchants
    merchants: async (
      _: unknown,
      args: {
        pagination?: any;
        categoryId?: string;
        city?: string;
        featured?: boolean;
        search?: string;
        sort?: { field: string; direction: 'ASC' | 'DESC' };
      },
      ctx: GraphQLContext
    ) => {
      const { limit, offset } = getPagination(args.pagination);
      
      const conditions = [eq(schema.merchants.status, 'active')];
      
      if (args.categoryId) {
        conditions.push(eq(schema.merchants.categoryId, args.categoryId));
      }
      if (args.city) {
        conditions.push(eq(schema.merchants.city, args.city));
      }
      if (args.featured !== undefined) {
        conditions.push(eq(schema.merchants.featured, args.featured));
      }
      if (args.search) {
        conditions.push(
          sql`(${schema.merchants.businessName} ILIKE ${`%${args.search}%`} OR ${schema.merchants.businessNameAr} ILIKE ${`%${args.search}%`})`
        );
      }
      
      const merchants = await ctx.db
        .select()
        .from(schema.merchants)
        .where(and(...conditions))
        .orderBy(desc(schema.merchants.featured), desc(schema.merchants.rating))
        .limit(limit)
        .offset(offset);
      
      return {
        edges: merchants.map((node, index) => ({
          node,
          cursor: Buffer.from(`${offset + index}`).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: merchants.length === limit,
          hasPreviousPage: offset > 0,
          totalCount: merchants.length,
        },
      };
    },

    // Nearby merchants
    nearbyMerchants: async (
      _: unknown,
      args: { latitude: number; longitude: number; radiusKm?: number; limit?: number },
      ctx: GraphQLContext
    ) => {
      const radiusKm = args.radiusKm || 10;
      const limit = Math.min(args.limit || 20, 50);
      
      // Haversine formula for distance calculation
      const result = await ctx.db.execute(sql`
        SELECT *, 
          (6371 * acos(cos(radians(${args.latitude})) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians(${args.longitude})) + 
          sin(radians(${args.latitude})) * sin(radians(latitude)))) AS distance
        FROM merchants
        WHERE status = 'active'
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
        HAVING distance < ${radiusKm}
        ORDER BY distance
        LIMIT ${limit}
      `);
      
      return result as unknown as schema.Merchant[];
    },

    // Merchant dashboard
    merchantDashboard: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireMerchant(ctx);
      const merchantId = ctx.auth!.merchantId!;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Today's orders
      const [todayStats] = await ctx.db
        .select({
          count: sql<number>`count(*)`,
          revenue: sql<number>`coalesce(sum(total_amount), 0)`,
        })
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.merchantId, merchantId),
            sql`created_at >= ${today}`
          )
        );
      
      // Pending orders
      const [pendingStats] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.merchantId, merchantId),
            eq(schema.orders.status, 'pending')
          )
        );
      
      // Total products
      const [productStats] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.products)
        .where(eq(schema.products.merchantId, merchantId));
      
      // Low stock products
      const [lowStockStats] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.products)
        .where(
          and(
            eq(schema.products.merchantId, merchantId),
            sql`stock_quantity <= low_stock_threshold`
          )
        );
      
      // Recent orders
      const recentOrders = await ctx.db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.merchantId, merchantId))
        .orderBy(desc(schema.orders.createdAt))
        .limit(5);
      
      // Top products
      const topProducts = await ctx.db
        .select()
        .from(schema.products)
        .where(eq(schema.products.merchantId, merchantId))
        .orderBy(desc(schema.products.salesCount))
        .limit(5);
      
      return {
        todayOrders: todayStats.count || 0,
        todayRevenue: todayStats.revenue || 0,
        pendingOrders: pendingStats.count || 0,
        totalProducts: productStats.count || 0,
        lowStockProducts: lowStockStats.count || 0,
        recentOrders,
        topProducts,
        salesChart: [], // TODO: Implement sales chart data
      };
    },
  },

  Mutation: {
    // Update merchant
    updateMerchant: async (
      _: unknown,
      args: { input: any },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      const [updated] = await ctx.db
        .update(schema.merchants)
        .set({
          ...args.input,
          updatedAt: new Date(),
        })
        .where(eq(schema.merchants.id, ctx.auth!.merchantId!))
        .returning();
      
      return updated;
    },

    // Create merchant user
    createMerchantUser: async (
      _: unknown,
      args: { input: any },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      const [user] = await ctx.db
        .insert(schema.merchantUsers)
        .values({
          ...args.input,
          merchantId: ctx.auth!.merchantId!,
        })
        .returning();
      
      return user;
    },

    // Update merchant user
    updateMerchantUser: async (
      _: unknown,
      args: { id: string; input: any },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      const [user] = await ctx.db
        .update(schema.merchantUsers)
        .set({
          ...args.input,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.merchantUsers.id, args.id),
            eq(schema.merchantUsers.merchantId, ctx.auth!.merchantId!)
          )
        )
        .returning();
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    },

    // Delete merchant user
    deleteMerchantUser: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      const [deleted] = await ctx.db
        .delete(schema.merchantUsers)
        .where(
          and(
            eq(schema.merchantUsers.id, args.id),
            eq(schema.merchantUsers.merchantId, ctx.auth!.merchantId!)
          )
        )
        .returning();
      
      return {
        success: !!deleted,
        message: deleted ? 'User deleted' : 'User not found',
        deletedId: deleted?.id,
      };
    },
  },

  // Field resolvers
  Merchant: {
    category: async (parent: schema.Merchant, _: unknown, ctx: GraphQLContext) => {
      if (!parent.categoryId) return null;
      return ctx.loaders.categoryLoader.load(parent.categoryId);
    },

    products: async (
      parent: schema.Merchant,
      args: { pagination?: any; status?: string; categoryId?: string },
      ctx: GraphQLContext
    ) => {
      const { limit, offset } = getPagination(args.pagination);
      
      const conditions = [eq(schema.products.merchantId, parent.id)];
      
      if (args.status) {
        conditions.push(eq(schema.products.status, args.status));
      }
      if (args.categoryId) {
        conditions.push(eq(schema.products.categoryId, args.categoryId));
      }
      
      const products = await ctx.db
        .select()
        .from(schema.products)
        .where(and(...conditions))
        .orderBy(desc(schema.products.featured), desc(schema.products.createdAt))
        .limit(limit)
        .offset(offset);
      
      return {
        edges: products.map((node, index) => ({
          node,
          cursor: Buffer.from(`${offset + index}`).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: products.length === limit,
          hasPreviousPage: offset > 0,
          totalCount: products.length,
        },
      };
    },

    categories: async (parent: schema.Merchant, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.merchantId, parent.id))
        .orderBy(schema.categories.sortOrder);
    },
  },

  MerchantUser: {
    merchant: async (parent: schema.MerchantUser, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.merchantLoader.load(parent.merchantId);
    },
  },
};
