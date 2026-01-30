/**
 * Category GraphQL Resolvers
 */

import { eq, desc, and, isNull, sql } from 'drizzle-orm';
import { GraphQLContext } from '../context';
import * as schema from '../../db/schema';
import { requireMerchant, requireAdmin, getPagination } from './base';

export const categoryResolvers = {
  Query: {
    // Get category by ID or slug
    category: async (
      _: unknown,
      args: { id?: string; slug?: string },
      ctx: GraphQLContext
    ) => {
      if (args.id) {
        return ctx.loaders.categoryLoader.load(args.id);
      }
      if (args.slug) {
        const [category] = await ctx.db
          .select()
          .from(schema.categories)
          .where(eq(schema.categories.slug, args.slug))
          .limit(1);
        return category || null;
      }
      return null;
    },

    // List categories
    categories: async (
      _: unknown,
      args: {
        parentId?: string;
        merchantId?: string;
        status?: string;
        featured?: boolean;
        showInMenu?: boolean;
        showInHome?: boolean;
        pagination?: any;
      },
      ctx: GraphQLContext
    ) => {
      const { limit, offset } = getPagination(args.pagination);
      
      const conditions = [];
      
      if (args.parentId) {
        conditions.push(eq(schema.categories.parentId, args.parentId));
      }
      if (args.merchantId) {
        conditions.push(eq(schema.categories.merchantId, args.merchantId));
      } else if (args.merchantId === null) {
        conditions.push(isNull(schema.categories.merchantId));
      }
      if (args.status) {
        conditions.push(eq(schema.categories.status, args.status));
      }
      if (args.featured !== undefined) {
        conditions.push(eq(schema.categories.featured, args.featured));
      }
      if (args.showInMenu !== undefined) {
        conditions.push(eq(schema.categories.showInMenu, args.showInMenu));
      }
      if (args.showInHome !== undefined) {
        conditions.push(eq(schema.categories.showInHome, args.showInHome));
      }
      
      let query = ctx.db.select().from(schema.categories);
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const categories = await query
        .orderBy(schema.categories.sortOrder, schema.categories.name)
        .limit(limit)
        .offset(offset);
      
      return {
        edges: categories.map((node, index) => ({
          node,
          cursor: Buffer.from(`${offset + index}`).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: categories.length === limit,
          hasPreviousPage: offset > 0,
          totalCount: categories.length,
        },
      };
    },

    // Category tree
    categoryTree: async (
      _: unknown,
      args: { merchantId?: string; rootId?: string; maxDepth?: number },
      ctx: GraphQLContext
    ) => {
      const maxDepth = args.maxDepth || 3;
      
      // Get all categories for the scope
      const conditions = [eq(schema.categories.status, 'active')];
      
      if (args.merchantId) {
        conditions.push(eq(schema.categories.merchantId, args.merchantId));
      } else {
        conditions.push(isNull(schema.categories.merchantId));
      }
      
      const allCategories = await ctx.db
        .select()
        .from(schema.categories)
        .where(and(...conditions))
        .orderBy(schema.categories.sortOrder);
      
      // Build tree structure
      const buildTree = (parentId: string | null, depth: number): any[] => {
        if (depth > maxDepth) return [];
        
        return allCategories
          .filter(cat => cat.parentId === parentId)
          .map(cat => ({
            category: cat,
            children: buildTree(cat.id, depth + 1),
          }));
      };
      
      return buildTree(args.rootId || null, 0);
    },

    // Platform categories
    platformCategories: async (
      _: unknown,
      args: { featured?: boolean; showInHome?: boolean },
      ctx: GraphQLContext
    ) => {
      const conditions = [
        isNull(schema.categories.merchantId),
        eq(schema.categories.status, 'active'),
      ];
      
      if (args.featured !== undefined) {
        conditions.push(eq(schema.categories.featured, args.featured));
      }
      if (args.showInHome !== undefined) {
        conditions.push(eq(schema.categories.showInHome, args.showInHome));
      }
      
      return ctx.db
        .select()
        .from(schema.categories)
        .where(and(...conditions))
        .orderBy(schema.categories.sortOrder);
    },

    // Merchant categories
    merchantCategories: async (
      _: unknown,
      args: { merchantId: string },
      ctx: GraphQLContext
    ) => {
      return ctx.db
        .select()
        .from(schema.categories)
        .where(
          and(
            eq(schema.categories.merchantId, args.merchantId),
            eq(schema.categories.status, 'active')
          )
        )
        .orderBy(schema.categories.sortOrder);
    },
  },

  Mutation: {
    // Create category
    createCategory: async (
      _: unknown,
      args: { input: any },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      // Calculate level based on parent
      let level = 0;
      let path = '';
      
      if (args.input.parentId) {
        const parent = await ctx.loaders.categoryLoader.load(args.input.parentId);
        if (parent) {
          level = (parent.level || 0) + 1;
          path = parent.path ? `${parent.path}/${parent.id}` : parent.id;
        }
      }
      
      const [category] = await ctx.db
        .insert(schema.categories)
        .values({
          ...args.input,
          merchantId: ctx.auth!.merchantId,
          level,
          path,
        })
        .returning();
      
      return category;
    },

    // Update category
    updateCategory: async (
      _: unknown,
      args: { id: string; input: any },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      const [category] = await ctx.db
        .update(schema.categories)
        .set({
          ...args.input,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.categories.id, args.id),
            eq(schema.categories.merchantId, ctx.auth!.merchantId!)
          )
        )
        .returning();
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      return category;
    },

    // Delete category
    deleteCategory: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      const [deleted] = await ctx.db
        .delete(schema.categories)
        .where(
          and(
            eq(schema.categories.id, args.id),
            eq(schema.categories.merchantId, ctx.auth!.merchantId!)
          )
        )
        .returning();
      
      return {
        success: !!deleted,
        message: deleted ? 'Category deleted' : 'Category not found',
        deletedId: deleted?.id,
      };
    },

    // Reorder categories
    reorderCategories: async (
      _: unknown,
      args: { ids: string[] },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      const updates = args.ids.map((id, index) =>
        ctx.db
          .update(schema.categories)
          .set({ sortOrder: index, updatedAt: new Date() })
          .where(
            and(
              eq(schema.categories.id, id),
              eq(schema.categories.merchantId, ctx.auth!.merchantId!)
            )
          )
      );
      
      await Promise.all(updates);
      
      return ctx.db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.merchantId, ctx.auth!.merchantId!))
        .orderBy(schema.categories.sortOrder);
    },
  },

  // Field resolvers
  Category: {
    parent: async (parent: schema.Category, _: unknown, ctx: GraphQLContext) => {
      if (!parent.parentId) return null;
      return ctx.loaders.categoryLoader.load(parent.parentId);
    },

    children: async (parent: schema.Category, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.parentId, parent.id))
        .orderBy(schema.categories.sortOrder);
    },

    products: async (
      parent: schema.Category,
      args: { pagination?: any },
      ctx: GraphQLContext
    ) => {
      const { limit, offset } = getPagination(args.pagination);
      
      const products = await ctx.db
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.categoryId, parent.id),
            eq(schema.products.status, 'active')
          )
        )
        .orderBy(desc(schema.products.createdAt))
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
  },
};
