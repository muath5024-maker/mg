/**
 * Payments Schema - payments & transactions tables
 * Maps to existing Supabase payments tables
 */

import { pgTable, uuid, varchar, text, timestamp, jsonb, decimal, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders } from './orders';
import { customers } from './users';
import { merchants } from './merchants';

// Payments table
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id),
  customerId: uuid('customer_id').references(() => customers.id),
  merchantId: uuid('merchant_id').references(() => merchants.id),
  
  // Payment Info
  paymentNumber: varchar('payment_number', { length: 50 }).unique(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('SAR'),
  
  // Payment Method
  method: varchar('method', { length: 50 }).notNull(), // card, apple_pay, stc_pay, mada, tabby, tamara, cod
  gateway: varchar('gateway', { length: 50 }), // moyasar, tap, tabby, tamara
  
  // Status
  status: varchar('status', { length: 30 }).default('pending'), // pending, processing, completed, failed, refunded, cancelled
  
  // Gateway Response
  gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }),
  gatewayResponse: jsonb('gateway_response'),
  gatewayFee: decimal('gateway_fee', { precision: 10, scale: 2 }),
  
  // Card Info (masked)
  cardBrand: varchar('card_brand', { length: 50 }),
  cardLast4: varchar('card_last_4', { length: 4 }),
  cardExpiryMonth: varchar('card_expiry_month', { length: 2 }),
  cardExpiryYear: varchar('card_expiry_year', { length: 4 }),
  
  // 3D Secure
  threeDSecure: jsonb('three_d_secure'),
  
  // Failure Info
  failureCode: varchar('failure_code', { length: 100 }),
  failureMessage: text('failure_message'),
  
  // Refund Info
  refundedAmount: decimal('refunded_amount', { precision: 10, scale: 2 }).default('0'),
  refundedAt: timestamp('refunded_at'),
  refundReason: text('refund_reason'),
  
  // Metadata
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // Timestamps
  processedAt: timestamp('processed_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  orderIdx: index('payments_order_idx').on(table.orderId),
  customerIdx: index('payments_customer_idx').on(table.customerId),
  merchantIdx: index('payments_merchant_idx').on(table.merchantId),
  statusIdx: index('payments_status_idx').on(table.status),
  gatewayTxIdx: index('payments_gateway_tx_idx').on(table.gatewayTransactionId),
}));

// Payment Methods (saved cards)
export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  
  // Type
  type: varchar('type', { length: 50 }).notNull(), // card, apple_pay, stc_pay
  
  // Card Info (for saved cards)
  cardBrand: varchar('card_brand', { length: 50 }),
  cardLast4: varchar('card_last_4', { length: 4 }),
  cardExpiryMonth: varchar('card_expiry_month', { length: 2 }),
  cardExpiryYear: varchar('card_expiry_year', { length: 4 }),
  cardholderName: varchar('cardholder_name', { length: 255 }),
  
  // Gateway Token (for recurring payments)
  gateway: varchar('gateway', { length: 50 }),
  gatewayToken: text('gateway_token'),
  
  // Flags
  isDefault: boolean('is_default').default(false),
  isVerified: boolean('is_verified').default(false),
  
  // Metadata
  nickname: varchar('nickname', { length: 100 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  customerIdx: index('payment_methods_customer_idx').on(table.customerId),
}));

// Requires import
import { boolean } from 'drizzle-orm/pg-core';

// Relations
export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
  merchant: one(merchants, {
    fields: [payments.merchantId],
    references: [merchants.id],
  }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  customer: one(customers, {
    fields: [paymentMethods.customerId],
    references: [customers.id],
  }),
}));

// Type inference
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;
