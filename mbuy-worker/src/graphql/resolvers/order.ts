/**
 * Order GraphQL Resolvers
 */

import { eq, desc, and, sql, between } from 'drizzle-orm';
import { GraphQLContext } from '../context';
import * as schema from '../../db/schema';
import { requireCustomer, requireMerchant, formatMoney, getPagination } from './base';

export const orderResolvers = {
  Query: {
    // Get order by ID or number
    order: async (
      _: unknown,
      args: { id?: string; orderNumber?: string },
      ctx: GraphQLContext
    ) => {
      if (args.id) {
        const order = await ctx.loaders.orderLoader.load(args.id);
        
        // Check access
        if (order) {
          if (ctx.isCustomer && order.customerId !== ctx.auth?.userId) {
            throw new Error('Access denied');
          }
          if (ctx.isMerchant && order.merchantId !== ctx.auth?.merchantId) {
            throw new Error('Access denied');
          }
        }
        
        return order;
      }
      
      if (args.orderNumber) {
        const [order] = await ctx.db
          .select()
          .from(schema.orders)
          .where(eq(schema.orders.orderNumber, args.orderNumber))
          .limit(1);
        
        // Check access
        if (order) {
          if (ctx.isCustomer && order.customerId !== ctx.auth?.userId) {
            throw new Error('Access denied');
          }
          if (ctx.isMerchant && order.merchantId !== ctx.auth?.merchantId) {
            throw new Error('Access denied');
          }
        }
        
        return order || null;
      }
      
      return null;
    },

    // My orders (customer)
    myOrders: async (
      _: unknown,
      args: { pagination?: any; status?: string },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      const { limit, offset } = getPagination(args.pagination);
      
      const conditions = [eq(schema.orders.customerId, ctx.auth!.userId)];
      
      if (args.status) {
        conditions.push(eq(schema.orders.status, args.status));
      }
      
      const orders = await ctx.db
        .select()
        .from(schema.orders)
        .where(and(...conditions))
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

    // Merchant orders
    merchantOrders: async (
      _: unknown,
      args: {
        pagination?: any;
        status?: string;
        paymentStatus?: string;
        dateFrom?: Date;
        dateTo?: Date;
        search?: string;
      },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      const { limit, offset } = getPagination(args.pagination);
      
      const conditions = [eq(schema.orders.merchantId, ctx.auth!.merchantId!)];
      
      if (args.status) {
        conditions.push(eq(schema.orders.status, args.status));
      }
      if (args.paymentStatus) {
        conditions.push(eq(schema.orders.paymentStatus, args.paymentStatus));
      }
      if (args.dateFrom && args.dateTo) {
        conditions.push(between(schema.orders.createdAt, args.dateFrom, args.dateTo));
      }
      if (args.search) {
        conditions.push(
          sql`(order_number ILIKE ${`%${args.search}%`} OR customer_name ILIKE ${`%${args.search}%`} OR customer_phone ILIKE ${`%${args.search}%`})`
        );
      }
      
      const orders = await ctx.db
        .select()
        .from(schema.orders)
        .where(and(...conditions))
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

    // Order stats
    orderStats: async (
      _: unknown,
      args: { merchantId?: string; dateFrom?: Date; dateTo?: Date },
      ctx: GraphQLContext
    ) => {
      const merchantId = args.merchantId || ctx.auth?.merchantId;
      
      if (!merchantId) {
        throw new Error('Merchant ID required');
      }
      
      const conditions = [eq(schema.orders.merchantId, merchantId)];
      
      if (args.dateFrom && args.dateTo) {
        conditions.push(between(schema.orders.createdAt, args.dateFrom, args.dateTo));
      }
      
      const [stats] = await ctx.db
        .select({
          totalOrders: sql<number>`count(*)`,
          totalRevenue: sql<number>`coalesce(sum(total_amount), 0)`,
          pendingOrders: sql<number>`count(*) filter (where status = 'pending')`,
          completedOrders: sql<number>`count(*) filter (where status = 'delivered')`,
          cancelledOrders: sql<number>`count(*) filter (where status = 'cancelled')`,
        })
        .from(schema.orders)
        .where(and(...conditions));
      
      return {
        totalOrders: stats.totalOrders || 0,
        totalRevenue: stats.totalRevenue || 0,
        averageOrderValue: stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0,
        pendingOrders: stats.pendingOrders || 0,
        completedOrders: stats.completedOrders || 0,
        cancelledOrders: stats.cancelledOrders || 0,
        byStatus: [],
        byPaymentMethod: [],
      };
    },
  },

  Mutation: {
    // Create order
    createOrder: async (
      _: unknown,
      args: { input: any },
      ctx: GraphQLContext
    ) => {
      requireCustomer(ctx);
      
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      // Get customer info
      const customer = await ctx.loaders.customerLoader.load(ctx.auth!.userId);
      
      // Calculate totals from items
      let subtotal = 0;
      const orderItems: any[] = [];
      
      for (const item of args.input.items) {
        const product = await ctx.loaders.productLoader.load(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        
        let unitPrice = parseFloat(product.price as any);
        let variantName = null;
        
        if (item.variantId) {
          const variant = await ctx.loaders.productVariantLoader.load(item.variantId);
          if (variant) {
            unitPrice = parseFloat(variant.price as any);
            variantName = variant.name;
          }
        }
        
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;
        
        orderItems.push({
          productId: item.productId,
          variantId: item.variantId,
          productName: product.name,
          productNameAr: product.nameAr,
          variantName,
          sku: product.sku,
          imageUrl: product.thumbnailUrl,
          unitPrice,
          quantity: item.quantity,
          totalPrice,
          notes: item.notes,
        });
      }
      
      // Get merchant for tax calculation
      const merchant = await ctx.loaders.merchantLoader.load(args.input.merchantId);
      const taxRate = merchant?.taxEnabled ? parseFloat(merchant.taxRate as any || '15') : 0;
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;
      
      // Create order
      const [order] = await ctx.db
        .insert(schema.orders)
        .values({
          orderNumber,
          customerId: ctx.auth!.userId,
          merchantId: args.input.merchantId,
          subtotal: subtotal.toString(),
          taxAmount: taxAmount.toString(),
          totalAmount: totalAmount.toString(),
          deliveryType: args.input.deliveryType,
          deliveryAddress: args.input.deliveryAddress,
          deliveryNotes: args.input.deliveryNotes,
          scheduledDeliveryAt: args.input.scheduledDeliveryAt,
          customerName: customer?.fullName,
          customerPhone: customer?.phone,
          customerEmail: customer?.email,
          customerNotes: args.input.customerNotes,
          couponCode: args.input.couponCode,
          paymentMethod: args.input.paymentMethod,
          source: args.input.source || 'app',
          metadata: args.input.metadata,
        })
        .returning();
      
      // Create order items
      for (const item of orderItems) {
        await ctx.db.insert(schema.orderItems).values({
          ...item,
          orderId: order.id,
        });
      }
      
      // Create status history
      await ctx.db.insert(schema.orderStatusHistory).values({
        orderId: order.id,
        status: 'pending',
        changedBy: 'customer',
        changedByUserId: ctx.auth!.userId,
      });
      
      return order;
    },

    // Update order status
    updateOrderStatus: async (
      _: unknown,
      args: { id: string; input: { status: string; note?: string } },
      ctx: GraphQLContext
    ) => {
      requireMerchant(ctx);
      
      const [existingOrder] = await ctx.db
        .select()
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.id, args.id),
            eq(schema.orders.merchantId, ctx.auth!.merchantId!)
          )
        );
      
      if (!existingOrder) {
        throw new Error('Order not found');
      }
      
      const [order] = await ctx.db
        .update(schema.orders)
        .set({
          status: args.input.status,
          updatedAt: new Date(),
          ...(args.input.status === 'delivered' && { deliveredAt: new Date() }),
        })
        .where(eq(schema.orders.id, args.id))
        .returning();
      
      // Create status history
      await ctx.db.insert(schema.orderStatusHistory).values({
        orderId: order.id,
        status: args.input.status,
        previousStatus: existingOrder.status,
        note: args.input.note,
        changedBy: 'merchant',
        changedByUserId: ctx.auth!.userId,
      });
      
      return order;
    },

    // Cancel order
    cancelOrder: async (
      _: unknown,
      args: { id: string; reason?: string },
      ctx: GraphQLContext
    ) => {
      const order = await ctx.loaders.orderLoader.load(args.id);
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      // Check access
      const isOwner = ctx.isCustomer && order.customerId === ctx.auth?.userId;
      const isMerchant = ctx.isMerchant && order.merchantId === ctx.auth?.merchantId;
      
      if (!isOwner && !isMerchant) {
        throw new Error('Access denied');
      }
      
      // Check if can be cancelled
      if (['delivered', 'cancelled'].includes(order.status)) {
        throw new Error('Order cannot be cancelled');
      }
      
      const [updated] = await ctx.db
        .update(schema.orders)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: args.reason,
          cancelledBy: ctx.isCustomer ? 'customer' : 'merchant',
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, args.id))
        .returning();
      
      return updated;
    },
  },

  // Field resolvers
  Order: {
    subtotalFormatted: (parent: schema.Order) => formatMoney(parent.subtotal),
    taxFormatted: (parent: schema.Order) => formatMoney(parent.taxAmount),
    discountFormatted: (parent: schema.Order) => formatMoney(parent.discountAmount),
    shippingFormatted: (parent: schema.Order) => formatMoney(parent.shippingAmount),
    totalFormatted: (parent: schema.Order) => formatMoney(parent.totalAmount),

    customer: async (parent: schema.Order, _: unknown, ctx: GraphQLContext) => {
      if (!parent.customerId) return null;
      return ctx.loaders.customerLoader.load(parent.customerId);
    },

    merchant: async (parent: schema.Order, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.merchantLoader.load(parent.merchantId);
    },

    items: async (parent: schema.Order, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.orderItemsLoader.load(parent.id);
    },

    statusHistory: async (parent: schema.Order, _: unknown, ctx: GraphQLContext) => {
      return ctx.db
        .select()
        .from(schema.orderStatusHistory)
        .where(eq(schema.orderStatusHistory.orderId, parent.id))
        .orderBy(desc(schema.orderStatusHistory.createdAt));
    },
  },

  OrderItem: {
    product: async (parent: schema.OrderItem, _: unknown, ctx: GraphQLContext) => {
      if (!parent.productId) return null;
      return ctx.loaders.productLoader.load(parent.productId);
    },

    variant: async (parent: schema.OrderItem, _: unknown, ctx: GraphQLContext) => {
      if (!parent.variantId) return null;
      return ctx.loaders.productVariantLoader.load(parent.variantId);
    },
  },
};
