/**
 * Orders Schema - orders & order_items tables
 * Maps to existing Supabase orders tables
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, decimal, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customers } from './users';
import { merchants } from './merchants';
import { products, productVariants } from './products';

// Main orders table
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  
  // Status
  status: varchar('status', { length: 30 }).default('pending'), // pending, confirmed, preparing, ready, shipped, delivered, cancelled
  paymentStatus: varchar('payment_status', { length: 30 }).default('pending'), // pending, paid, failed, refunded
  fulfillmentStatus: varchar('fulfillment_status', { length: 30 }).default('unfulfilled'), // unfulfilled, partial, fulfilled
  
  // Totals
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  shippingAmount: decimal('shipping_amount', { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('SAR'),
  
  // Delivery Info
  deliveryType: varchar('delivery_type', { length: 20 }).default('delivery'), // delivery, pickup
  deliveryAddress: jsonb('delivery_address'),
  deliveryNotes: text('delivery_notes'),
  scheduledDeliveryAt: timestamp('scheduled_delivery_at'),
  deliveredAt: timestamp('delivered_at'),
  
  // Customer Info (snapshot)
  customerName: varchar('customer_name', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 20 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  
  // Payment Info
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentGateway: varchar('payment_gateway', { length: 50 }),
  paymentTransactionId: varchar('payment_transaction_id', { length: 255 }),
  paidAt: timestamp('paid_at'),
  
  // Coupon
  couponCode: varchar('coupon_code', { length: 50 }),
  couponDiscount: decimal('coupon_discount', { precision: 10, scale: 2 }),
  
  // Tracking
  trackingNumber: varchar('tracking_number', { length: 100 }),
  trackingUrl: text('tracking_url'),
  
  // Notes
  customerNotes: text('customer_notes'),
  merchantNotes: text('merchant_notes'),
  internalNotes: text('internal_notes'),
  
  // Cancellation
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  cancelledBy: varchar('cancelled_by', { length: 50 }), // customer, merchant, system
  
  // Refund
  refundedAt: timestamp('refunded_at'),
  refundAmount: decimal('refund_amount', { precision: 10, scale: 2 }),
  refundReason: text('refund_reason'),
  
  // Metadata
  source: varchar('source', { length: 50 }).default('app'), // app, web, pos
  metadata: jsonb('metadata'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  orderNumberIdx: index('orders_order_number_idx').on(table.orderNumber),
  customerIdx: index('orders_customer_idx').on(table.customerId),
  merchantIdx: index('orders_merchant_idx').on(table.merchantId),
  statusIdx: index('orders_status_idx').on(table.status),
  createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
}));

// Order items table
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  variantId: uuid('variant_id').references(() => productVariants.id),
  
  // Product Info (snapshot)
  productName: varchar('product_name', { length: 255 }).notNull(),
  productNameAr: varchar('product_name_ar', { length: 255 }),
  variantName: varchar('variant_name', { length: 255 }),
  sku: varchar('sku', { length: 100 }),
  imageUrl: text('image_url'),
  
  // Pricing
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  
  // Discount
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  
  // Options selected
  options: jsonb('options'),
  
  // Notes
  notes: text('notes'),
  
  // Fulfillment
  fulfilledQuantity: integer('fulfilled_quantity').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  orderIdx: index('order_items_order_idx').on(table.orderId),
  productIdx: index('order_items_product_idx').on(table.productId),
}));

// Order status history
export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 30 }).notNull(),
  previousStatus: varchar('previous_status', { length: 30 }),
  note: text('note'),
  changedBy: varchar('changed_by', { length: 50 }),
  changedByUserId: uuid('changed_by_user_id'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  orderIdx: index('order_status_history_order_idx').on(table.orderId),
}));

// Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  merchant: one(merchants, {
    fields: [orders.merchantId],
    references: [merchants.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
}));

// Type inference
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
