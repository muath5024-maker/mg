/**
 * Product GraphQL Resolvers
 */

import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import { GraphQLContext } from '../context';
import * as schema from '../../db/schema';
import { requireMerchant, formatMoney, getPagination } from './base';

export const productResolvers = {
  Query: {
    // Get product by ID or slug
    product: async (
      _: unknown,
      args: { id?: string; slug?: string; merchantId?: string },
      ctx: GraphQLContext
    ) => {
      if (args.id) {
        return ctx.loaders.productLoader.load(args.id);
      }
      if (args.slug && args.merchantId) {
        const [product] = await ctx.db
          .select()
          .from(schema.products)
          .where(
            and(
              eq(schema.products.slug, args.slug),
              eq(schema.products.merchantId, args.merchantId)
            )
          )
          .limit(1);
        return product || null;
      }
      return null;
    },

    // List products
    products: async (
      _: unknown,
      args: {
        pagination?: any;
        merchantId?: string;
        categoryId?: string;
        status?: string;
        featured?: boolean;
        inStock?: boolean;
        minPrice?: number;
        maxPrice?: number;
        search?: string;
        tags?: string[];
        sort?: { field: string; direction: 'ASC' | 'DESC' };
      },
      ctx: GraphQLContext
    ) => {
      const { limit, offset } = getPagination(args.pagination);
      
      const conditions = [];
      
      // Default to active products for public queries
      if (!ctx.isMerchant) {
        conditions.push(eq(schema.products.status, 'active'));
      }
      
      if (args.merchantId) {
        conditions.push(eq(schema.products.merchantId, args.merchantId));
      }
      if (args.categoryId) {
        conditions.push(eq(schema.products.categoryId, args.categoryId));
      }
      if (args.status) {
        conditions.push(eq(schema.products.status, args.status));
      }
      if (args.featured !== undefined) {
        conditions.push(eq(schema.products.featured, args.featured));
      }
      if (args.inStock) {
        conditions.push(sql`stock_quantity > 0`);
      }
      if (args.minPrice !== undefined) {
        conditions.push(sql`price >= ${args.minPrice}`);
      }
      if (args.maxPrice !== undefined) {
        conditions.push(sql`price <= ${args.maxPrice}`);
      }
      if (args.search) {
        conditions.push(
          sql`(name ILIKE ${`%${args.search}%`} OR name_ar ILIKE ${`%${args.search}%`} OR description ILIKE ${`%${args.search}%`})`
        );
      }
      
      let query = ctx.db.select().from(schema.products);
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const products = await query
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

    // Search products
    searchProducts: async (
      _: unknown,
      args: { query: string; merchantId?: string; limit?: number },
      ctx: GraphQLContext
    ) => {
      const limit = Math.min(args.limit || 20, 50);
      
      const conditions = [
        eq(schema.products.status, 'active'),
        sql`(name ILIKE ${`%${args.query}%`} OR name_ar ILIKE ${`%${args.query}%`} OR tags::text ILIKE ${`%${args.query}%`})`,
      ];
      
      if (args.merchantId) {
        conditions.push(eq(schema.products.merchantId, args.merchantId));
      }
      
      return ctx.db
        .select()
        .from(schema.products)
        .where(and(...conditions))
        .orderBy(desc(schema.products.salesCount))
        .limit(limit);
    },

    // Featured products
    featuredProducts: async (
      _: unknown,
      args: { merchantId?: string; limit?: number },
      ctx: GraphQLContext
    ) => {
      const limit = Math.min(args.limit || 10, 50);
      
      const conditions = [
        eq(schema.products.status, 'active'),
        eq(schema.products.featured, true),
      ];
      
      if (args.merchantId) {
        conditions.push(eq(schema.products.merchantId, args.merchantId));
      }
      
      return ctx.db
        .select()
        .from(schema.products)
        .where(and(...conditions))
        .orderBy(desc(schema.products.salesCount))
        .limit(limit);
    },
  },

  Mutation: {
    // Create product
    createProduct: async (
      _: unknown,
      args: { input: any },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      const [product] = await ctx.db
        .insert(schema.products)
        .values({
          ...args.input,
          merchantId: ctx.auth!.merchantId!,
        })
        .returning();
      
      return product;
    },

    // Update product
    updateProduct: async (
      _: unknown,
      args: { id: string; input: any },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      const [product] = await ctx.db
        .update(schema.products)
        .set({
          ...args.input,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.products.id, args.id),
            eq(schema.products.merchantId, ctx.auth!.merchantId!)
          )
        )
        .returning();
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      return product;
    },

    // Delete product
    deleteProduct: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      const [deleted] = await ctx.db
        .delete(schema.products)
        .where(
          and(
            eq(schema.products.id, args.id),
            eq(schema.products.merchantId, ctx.auth!.merchantId!)
          )
        )
        .returning();
      
      return {
        success: !!deleted,
        message: deleted ? 'Product deleted' : 'Product not found',
        deletedId: deleted?.id,
      };
    },

    // Bulk update products
    bulkUpdateProducts: async (
      _: unknown,
      args: { ids: string[]; input: any },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      const products = await ctx.db
        .update(schema.products)
        .set({
          ...args.input,
          updatedAt: new Date(),
        })
        .where(
          and(
            inArray(schema.products.id, args.ids),
            eq(schema.products.merchantId, ctx.auth!.merchantId!)
          )
        )
        .returning();
      
      return products;
    },

    // Create variant
    createVariant: async (
      _: unknown,
      args: { productId: string; input: any },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      // Verify product ownership
      const [product] = await ctx.db
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.id, args.productId),
            eq(schema.products.merchantId, ctx.auth!.merchantId!)
          )
        );
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      const [variant] = await ctx.db
        .insert(schema.productVariants)
        .values({
          ...args.input,
          productId: args.productId,
        })
        .returning();
      
      // Update product hasVariants flag
      await ctx.db
        .update(schema.products)
        .set({ hasVariants: true, updatedAt: new Date() })
        .where(eq(schema.products.id, args.productId));
      
      return variant;
    },

    // Update stock
    updateStock: async (
      _: unknown,
      args: { productId: string; variantId?: string; quantity: number },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      if (args.variantId) {
        await ctx.db
          .update(schema.productVariants)
          .set({ stockQuantity: args.quantity, updatedAt: new Date() })
          .where(eq(schema.productVariants.id, args.variantId));
      } else {
        await ctx.db
          .update(schema.products)
          .set({ stockQuantity: args.quantity, updatedAt: new Date() })
          .where(
            and(
              eq(schema.products.id, args.productId),
              eq(schema.products.merchantId, ctx.auth!.merchantId!)
            )
          );
      }
      
      return ctx.loaders.productLoader.load(args.productId);
    },
  },

  // Field resolvers
  Product: {
    priceFormatted: (parent: schema.Product) => {
      return formatMoney(parent.price);
    },

    hasDiscount: (parent: schema.Product) => {
      return parent.compareAtPrice !== null && 
             parseFloat(parent.compareAtPrice as any) > parseFloat(parent.price as any);
    },

    discountPercentage: (parent: schema.Product) => {
      if (!parent.compareAtPrice) return null;
      const compareAt = parseFloat(parent.compareAtPrice as any);
      const price = parseFloat(parent.price as any);
      if (compareAt <= price) return null;
      return Math.round(((compareAt - price) / compareAt) * 100);
    },

    inStock: (parent: schema.Product) => {
      if (!parent.trackInventory) return true;
      return (parent.stockQuantity || 0) > 0 || parent.allowBackorder;
    },

    merchant: async (parent: schema.Product, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.merchantLoader.load(parent.merchantId);
    },

    category: async (parent: schema.Product, _: unknown, ctx: GraphQLContext) => {
      if (!parent.categoryId) return null;
      return ctx.loaders.categoryLoader.load(parent.categoryId);
    },

    variants: async (parent: schema.Product, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .select()
        .from(schema.productVariants)
        .where(eq(schema.productVariants.productId, parent.id))
        .orderBy(schema.productVariants.sortOrder);
    },
  },

  ProductVariant: {
    inStock: (parent: schema.ProductVariant) => {
      return (parent.stockQuantity || 0) > 0;
    },

    product: async (parent: schema.ProductVariant, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.productLoader.load(parent.productId);
    },
  },
};
