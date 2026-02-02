/**
 * User/Customer GraphQL Resolvers
 */

import { eq, desc, and, like, sql } from 'drizzle-orm';
import { GraphQLContext } from '../context';
import * as schema from '../../db/schema';
import { requireAuth, requireCustomer, requireAdmin, formatMoney, getPagination } from './base';

export const userResolvers = {
  Query: {
    // Get current authenticated customer
    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.isAuthenticated || !ctx.isCustomer) {
        return null;
      }
      return ctx.loaders.customerLoader.load(ctx.auth!.userId);
    },

    // Get customer by ID (admin only)
    customer: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      requireAdmin(ctx);
      return ctx.loaders.customerLoader.load(args.id);
    },

    // List customers (admin only)
    customers: async (
      _: unknown,
      args: { pagination?: any; search?: string; status?: string },
      ctx: GraphQLContext
    ) => {
      requireAdmin(ctx);
      
      const { limit, offset } = getPagination(args.pagination);
      
      let query = ctx.db.select().from(schema.customers);
      
      const conditions = [];
      if (args.status) {
        conditions.push(eq(schema.customers.status, args.status));
      }
      if (args.search) {
        conditions.push(
          sql`(${schema.customers.fullName} ILIKE ${`%${args.search}%`} OR ${schema.customers.phone} ILIKE ${`%${args.search}%`})`
        );
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const customers = await query
        .orderBy(desc(schema.customers.createdAt))
        .limit(limit)
        .offset(offset);
      
      // Get total count
      const [{ count }] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.customers);
      
      return {
        edges: customers.map((node, index) => ({
          node,
          cursor: Buffer.from(`${offset + index}`).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: offset + limit < count,
          hasPreviousPage: offset > 0,
          totalCount: count,
        },
      };
    },

    // Get my addresses
    myAddresses: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireCustomer(ctx);
      
      return ctx.db
        .select()
        .from(schema.customerAddresses)
        .where(eq(schema.customerAddresses.customerId, ctx.auth!.userId))
        .orderBy(desc(schema.customerAddresses.isDefault), desc(schema.customerAddresses.createdAt));
    },

    // Get my notifications
    myNotifications: async (
      _: unknown,
      args: { unreadOnly?: boolean; pagination?: any },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      const { limit, offset } = getPagination(args.pagination);
      
      const conditions = [eq(schema.notifications.customerId, ctx.auth!.userId)];
      
      if (args.unreadOnly) {
        conditions.push(eq(schema.notifications.isRead, false));
      }
      
      return ctx.db
        .select()
        .from(schema.notifications)
        .where(and(...conditions))
        .orderBy(desc(schema.notifications.createdAt))
        .limit(limit)
        .offset(offset);
    },
  },

  Mutation: {
    // Update profile
    updateProfile: async (
      _: unknown,
      args: { input: any },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      const [updated] = await ctx.db
        .update(schema.customers)
        .set({
          ...args.input,
          updatedAt: new Date(),
        })
        .where(eq(schema.customers.id, ctx.auth!.userId))
        .returning();
      
      return updated;
    },

    // Create address
    createAddress: async (
      _: unknown,
      args: { input: any },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      // If setting as default, unset other defaults
      if (args.input.isDefault) {
        await ctx.db
          .update(schema.customerAddresses)
          .set({ isDefault: false })
          .where(eq(schema.customerAddresses.customerId, ctx.auth!.userId));
      }
      
      const [address] = await ctx.db
        .insert(schema.customerAddresses)
        .values({
          ...args.input,
          customerId: ctx.auth!.userId,
        })
        .returning();
      
      return address;
    },

    // Update address
    updateAddress: async (
      _: unknown,
      args: { id: string; input: any },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      // If setting as default, unset other defaults
      if (args.input.isDefault) {
        await ctx.db
          .update(schema.customerAddresses)
          .set({ isDefault: false })
          .where(eq(schema.customerAddresses.customerId, ctx.auth!.userId));
      }
      
      const [address] = await ctx.db
        .update(schema.customerAddresses)
        .set({
          ...args.input,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.customerAddresses.id, args.id),
            eq(schema.customerAddresses.customerId, ctx.auth!.userId)
          )
        )
        .returning();
      
      if (!address) {
        throw new Error('Address not found');
      }
      
      return address;
    },

    // Delete address
    deleteAddress: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      const [deleted] = await ctx.db
        .delete(schema.customerAddresses)
        .where(
          and(
            eq(schema.customerAddresses.id, args.id),
            eq(schema.customerAddresses.customerId, ctx.auth!.userId)
          )
        )
        .returning();
      
      return {
        success: !!deleted,
        message: deleted ? 'Address deleted' : 'Address not found',
        deletedId: deleted?.id,
      };
    },

    // Set default address
    setDefaultAddress: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      // Unset other defaults
      await ctx.db
        .update(schema.customerAddresses)
        .set({ isDefault: false })
        .where(eq(schema.customerAddresses.customerId, ctx.auth!.userId));
      
      // Set new default
      const [address] = await ctx.db
        .update(schema.customerAddresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(
          and(
            eq(schema.customerAddresses.id, args.id),
            eq(schema.customerAddresses.customerId, ctx.auth!.userId)
          )
        )
        .returning();
      
      if (!address) {
        throw new Error('Address not found');
      }
      
      return address;
    },

    // Mark notification read
    markNotificationRead: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      const [notification] = await ctx.db
        .update(schema.notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(schema.notifications.id, args.id),
            eq(schema.notifications.customerId, ctx.auth!.userId)
          )
        )
        .returning();
      
      return notification;
    },

    // Mark all notifications read
    markAllNotificationsRead: async (
      _: unknown,
      __: unknown,
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      await ctx.db
        .update(schema.notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(schema.notifications.customerId, ctx.auth!.userId),
            eq(schema.notifications.isRead, false)
          )
        );
      
      return { success: true, message: 'All notifications marked as read' };
    },

    // Register push token
    registerPushToken: async (
      _: unknown,
      args: { token: string; platform: string; deviceId?: string },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      // Upsert push token
      await ctx.db
        .insert(schema.pushTokens)
        .values({
          customerId: ctx.auth!.userId,
          token: args.token,
          platform: args.platform,
          deviceId: args.deviceId,
          isActive: true,
          lastUsedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [schema.pushTokens.token],
          set: {
            isActive: true,
            lastUsedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      
      return { success: true, message: 'Push token registered' };
    },

    // Unregister push token
    unregisterPushToken: async (
      _: unknown,
      args: { token: string },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      
      await ctx.db
        .update(schema.pushTokens)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(schema.pushTokens.token, args.token));
      
      return { success: true, message: 'Push token unregistered' };
    },
  },

  // Field resolvers
  Customer: {
    addresses: async (parent: schema.Customer, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .select()
        .from(schema.customerAddresses)
        .where(eq(schema.customerAddresses.customerId, parent.id))
        .orderBy(desc(schema.customerAddresses.isDefault));
    },

    orders: async (
      parent: schema.Customer,
      args: { pagination?: any },
      ctx: GraphQLContext
    ) => {
      const { limit, offset } = getPagination(args.pagination);
      
      const orders = await ctx.db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.customerId, parent.id))
        .orderBy(desc(schema.orders.createdAt))
        .limit(limit)
        .offset(offset);
      
      return {
        edges: orders.map((node, index) => ({
          node,
          cursor: Buffer.from(`${offset + index}`).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: orders.length === limit,
          hasPreviousPage: offset > 0,
          totalCount: orders.length,
        },
      };
    },

    notifications: async (
      parent: schema.Customer,
      args: { unreadOnly?: boolean },
      ctx: GraphQLContext
    ) => {
      const conditions = [eq(schema.notifications.customerId, parent.id)];
      
      if (args.unreadOnly) {
        conditions.push(eq(schema.notifications.isRead, false));
      }
      
      return ctx.db
        .select()
        .from(schema.notifications)
        .where(and(...conditions))
        .orderBy(desc(schema.notifications.createdAt))
        .limit(50);
    },
  },
};
