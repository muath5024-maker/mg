/**
 * Order Service
 * Handles order-related business logic
 */

import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import type { Database } from '../db';
import type { Env } from '../types';
import { orders, orderItems, orderStatusHistory, type Order, type NewOrder, type OrderItem, type NewOrderItem } from '../db/schema/orders';
import { products } from '../db/schema/products';
import { carts, cartItems } from '../db/schema/cart';

export interface OrderListParams {
  page?: number;
  limit?: number;
  customerId?: string;
  merchantId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface OrderListResult {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateOrderInput {
  customerId: string;
  merchantId: string;
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethodId?: string;
  notes?: string;
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
  }[];
  couponCode?: string;
}

export class OrderService {
  constructor(
    private db: Database,
    private env: Env
  ) {}

  /**
   * Get order by ID
   */
  async getById(id: string): Promise<Order | null> {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    return order || null;
  }

  /**
   * Get order by order number
   */
  async getByOrderNumber(orderNumber: string): Promise<Order | null> {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    return order || null;
  }

  /**
   * List orders with pagination and filters
   */
  async list(params: OrderListParams = {}): Promise<OrderListResult> {
    const { page = 1, limit = 20, customerId, merchantId, status, startDate, endDate } = params;
    const offset = (page - 1) * limit;

    const conditions = [];
    
    if (customerId) {
      conditions.push(eq(orders.customerId, customerId));
    }
    if (merchantId) {
      conditions.push(eq(orders.merchantId, merchantId));
    }
    if (status) {
      conditions.push(eq(orders.status, status));
    }
    if (startDate) {
      conditions.push(sql`${orders.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${orders.createdAt} <= ${endDate}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(whereClause);

    const result = await this.db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      orders: result,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get customer orders
   */
  async getCustomerOrders(customerId: string, params: Omit<OrderListParams, 'customerId'> = {}): Promise<OrderListResult> {
    return this.list({ ...params, customerId });
  }

  /**
   * Get merchant orders
   */
  async getMerchantOrders(merchantId: string, params: Omit<OrderListParams, 'merchantId'> = {}): Promise<OrderListResult> {
    return this.list({ ...params, merchantId });
  }

  /**
   * Get order items
   */
  async getItems(orderId: string): Promise<OrderItem[]> {
    return this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  /**
   * Get order status history
   */
  async getStatusHistory(orderId: string): Promise<any[]> {
    return this.db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(desc(orderStatusHistory.createdAt));
  }

  /**
   * Create a new order
   */
  async create(input: CreateOrderInput): Promise<Order> {
    // Calculate totals
    let subtotal = 0;
    for (const item of input.items) {
      subtotal += item.price * item.quantity;
    }

    // Calculate discount if coupon provided
    let discount = 0;
    if (input.couponCode) {
      discount = await this.calculateDiscount(input.couponCode, subtotal);
    }

    // Calculate shipping (simplified)
    const shipping = subtotal > 100 ? 0 : 10;

    // Calculate tax (simplified - 15% VAT)
    const taxRate = 0.15;
    const tax = (subtotal - discount) * taxRate;

    const total = subtotal - discount + shipping + tax;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order
    const [order] = await this.db
      .insert(orders)
      .values({
        orderNumber,
        customerId: input.customerId,
        merchantId: input.merchantId,
        deliveryAddress: { addressId: input.shippingAddressId },
        paymentMethod: input.paymentMethodId || 'cash',
        customerNotes: input.notes,
        status: 'pending',
        paymentStatus: 'pending',
        subtotal: String(subtotal),
        discountAmount: String(discount),
        shippingAmount: String(shipping),
        taxAmount: String(tax),
        totalAmount: String(total),
        couponCode: input.couponCode,
      })
      .returning();

    // Create order items
    for (const item of input.items) {
      await this.db.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: 'Product', // Will be fetched
        quantity: item.quantity,
        unitPrice: String(item.price),
        totalPrice: String(item.price * item.quantity),
      });

      // Update product stock
      await this.db
        .update(products)
        .set({ 
          stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
          salesCount: sql`${products.salesCount} + ${item.quantity}`,
        })
        .where(eq(products.id, item.productId));
    }

    // Add initial status history
    await this.addStatusHistory(order.id, 'pending', 'Order created');

    return order;
  }

  /**
   * Create order from cart
   */
  async createFromCart(
    customerId: string,
    cartId: string,
    shippingAddressId: string,
    options: {
      billingAddressId?: string;
      paymentMethodId?: string;
      notes?: string;
      couponCode?: string;
    } = {}
  ): Promise<Order> {
    // Get cart items
    const items = await this.db
      .select({
        productId: cartItems.productId,
        variantId: cartItems.variantId,
        quantity: cartItems.quantity,
        price: products.price,
        merchantId: products.merchantId,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cartId));

    if (items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Group items by merchant
    const merchantGroups = items.reduce((acc, item) => {
      const merchantId = item.merchantId;
      if (!acc[merchantId]) {
        acc[merchantId] = [];
      }
      acc[merchantId].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    // Create order for first merchant (simplified - in real app, create multiple orders)
    const firstMerchantId = Object.keys(merchantGroups)[0];
    const merchantItems = merchantGroups[firstMerchantId];

    const order = await this.create({
      customerId,
      merchantId: firstMerchantId,
      shippingAddressId,
      billingAddressId: options.billingAddressId,
      paymentMethodId: options.paymentMethodId,
      notes: options.notes,
      couponCode: options.couponCode,
      items: merchantItems.map(item => ({
        productId: item.productId,
        variantId: item.variantId || undefined,
        quantity: item.quantity,
        price: parseFloat(item.price),
      })),
    });

    // Clear cart
    await this.db.delete(cartItems).where(eq(cartItems.cartId, cartId));

    return order;
  }

  /**
   * Update order status
   */
  async updateStatus(orderId: string, status: string, note?: string): Promise<Order | null> {
    const [order] = await this.db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();

    if (order) {
      await this.addStatusHistory(orderId, status, note);
    }

    return order || null;
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(orderId: string, paymentStatus: string, transactionId?: string): Promise<Order | null> {
    const updateData: any = { paymentStatus, updatedAt: new Date() };
    
    if (transactionId) {
      updateData.transactionId = transactionId;
    }
    
    if (paymentStatus === 'paid') {
      updateData.paidAt = new Date();
    }

    const [order] = await this.db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    return order || null;
  }

  /**
   * Cancel order
   */
  async cancel(orderId: string, reason?: string): Promise<Order | null> {
    const order = await this.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new Error('Order cannot be cancelled');
    }

    // Restore stock
    const items = await this.getItems(orderId);
    for (const item of items) {
      await this.db
        .update(products)
        .set({ 
          stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`,
          salesCount: sql`${products.salesCount} - ${item.quantity}`,
        })
        .where(eq(products.id, item.productId));
    }

    // Update order
    const [updatedOrder] = await this.db
      .update(orders)
      .set({ 
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    await this.addStatusHistory(orderId, 'cancelled', reason || 'Order cancelled');

    return updatedOrder || null;
  }

  /**
   * Request refund
   */
  async requestRefund(orderId: string, reason: string): Promise<Order | null> {
    const order = await this.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'delivered') {
      throw new Error('Only delivered orders can be refunded');
    }

    const [updatedOrder] = await this.db
      .update(orders)
      .set({ 
        status: 'refund_requested',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    await this.addStatusHistory(orderId, 'refund_requested', reason);

    return updatedOrder || null;
  }

  // ============ Stats ============

  /**
   * Get order statistics
   */
  async getStats(params: { merchantId?: string; customerId?: string; startDate?: Date; endDate?: Date }): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
  }> {
    const conditions = [];
    
    if (params.merchantId) {
      conditions.push(eq(orders.merchantId, params.merchantId));
    }
    if (params.customerId) {
      conditions.push(eq(orders.customerId, params.customerId));
    }
    if (params.startDate) {
      conditions.push(sql`${orders.createdAt} >= ${params.startDate}`);
    }
    if (params.endDate) {
      conditions.push(sql`${orders.createdAt} <= ${params.endDate}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get totals
    const [stats] = await this.db
      .select({
        totalOrders: sql<number>`count(*)::int`,
        totalRevenue: sql<number>`COALESCE(SUM(total::numeric), 0)`,
      })
      .from(orders)
      .where(whereClause);

    // Get orders by status
    const statusCounts = await this.db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(whereClause)
      .groupBy(orders.status);

    const ordersByStatus = statusCounts.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const totalOrders = stats?.totalOrders || 0;
    const totalRevenue = parseFloat(String(stats?.totalRevenue || 0));

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      ordersByStatus,
    };
  }

  // ============ Helpers ============

  private async addStatusHistory(orderId: string, status: string, note?: string): Promise<void> {
    await this.db.insert(orderStatusHistory).values({
      orderId,
      status,
      note,
    });
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = `ORD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // Get count for today
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(sql`DATE(${orders.createdAt}) = CURRENT_DATE`);

    const sequence = String(count + 1).padStart(5, '0');
    return `${prefix}${sequence}`;
  }

  private async calculateDiscount(couponCode: string, subtotal: number): Promise<number> {
    // Simplified - in real app, validate coupon from database
    // This is a placeholder
    return 0;
  }
}
