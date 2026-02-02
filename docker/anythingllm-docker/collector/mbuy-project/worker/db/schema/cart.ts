/**
 * Cart Schema - cart & cart_items tables
 * Maps to existing Supabase cart tables
 */

import { pgTable, uuid, varchar, timestamp, jsonb, decimal, integer, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customers } from './users';
import { merchants } from './merchants';
import { products, productVariants } from './products';

// Main cart table
export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  
  // Session for guest users
  sessionId: varchar('session_id', { length: 255 }),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'), // active, abandoned, converted
  
  // Totals (cached for performance)
  itemCount: integer('item_count').default(0),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).default('0'),
  
  // Coupon
  couponCode: varchar('coupon_code', { length: 50 }),
  couponDiscount: decimal('coupon_discount', { precision: 10, scale: 2 }),
  
  // Metadata
  metadata: jsonb('metadata'),
  
  // Timestamps
  lastActivityAt: timestamp('last_activity_at').defaultNow(),
  convertedAt: timestamp('converted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  customerMerchantIdx: index('carts_customer_merchant_idx').on(table.customerId, table.merchantId),
  sessionIdx: index('carts_session_idx').on(table.sessionId),
  statusIdx: index('carts_status_idx').on(table.status),
}));

// Cart items table
export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  variantId: uuid('variant_id').references(() => productVariants.id),
  
  // Quantity
  quantity: integer('quantity').notNull().default(1),
  
  // Price at time of adding (to detect price changes)
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  
  // Selected options
  options: jsonb('options'),
  
  // Notes
  notes: varchar('notes', { length: 500 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  cartIdx: index('cart_items_cart_idx').on(table.cartId),
  productIdx: index('cart_items_product_idx').on(table.productId),
  // Unique constraint: one product/variant per cart
  uniqueCartProduct: unique('cart_items_unique').on(table.cartId, table.productId, table.variantId),
}));

// Saved for later items
export const savedItems = pgTable('saved_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  variantId: uuid('variant_id').references(() => productVariants.id),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  customerIdx: index('saved_items_customer_idx').on(table.customerId),
  uniqueCustomerProduct: unique('saved_items_unique').on(table.customerId, table.productId, table.variantId),
}));

// Relations
export const cartsRelations = relations(carts, ({ one, many }) => ({
  customer: one(customers, {
    fields: [carts.customerId],
    references: [customers.id],
  }),
  merchant: one(merchants, {
    fields: [carts.merchantId],
    references: [merchants.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const savedItemsRelations = relations(savedItems, ({ one }) => ({
  customer: one(customers, {
    fields: [savedItems.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [savedItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [savedItems.variantId],
    references: [productVariants.id],
  }),
}));

// Type inference
export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
export type SavedItem = typeof savedItems.$inferSelect;
export type NewSavedItem = typeof savedItems.$inferInsert;
