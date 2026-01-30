/**
 * Products Schema - products & variants tables
 * Maps to existing Supabase products tables
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, decimal, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { merchants } from './merchants';
import { categories } from './categories';

// Main products table
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id),
  
  // Basic Info
  name: varchar('name', { length: 255 }).notNull(),
  nameAr: varchar('name_ar', { length: 255 }),
  slug: varchar('slug', { length: 255 }),
  description: text('description'),
  descriptionAr: text('description_ar'),
  sku: varchar('sku', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  
  // Pricing
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  
  // Inventory
  stockQuantity: integer('stock_quantity').default(0),
  lowStockThreshold: integer('low_stock_threshold').default(5),
  trackInventory: boolean('track_inventory').default(true),
  allowBackorder: boolean('allow_backorder').default(false),
  
  // Media
  images: jsonb('images').$type<string[]>().default([]),
  thumbnailUrl: text('thumbnail_url'),
  videoUrl: text('video_url'),
  
  // Attributes
  weight: decimal('weight', { precision: 10, scale: 3 }),
  weightUnit: varchar('weight_unit', { length: 10 }).default('kg'),
  dimensions: jsonb('dimensions'), // {length, width, height}
  
  // Options & Variants
  hasVariants: boolean('has_variants').default(false),
  options: jsonb('options'), // [{name: 'Size', values: ['S', 'M', 'L']}]
  
  // Status & Visibility
  status: varchar('status', { length: 20 }).default('draft'), // draft, active, archived
  visibility: varchar('visibility', { length: 20 }).default('visible'), // visible, hidden
  featured: boolean('featured').default(false),
  
  // SEO
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  
  // Stats
  viewCount: integer('view_count').default(0),
  salesCount: integer('sales_count').default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  reviewCount: integer('review_count').default(0),
  
  // Ordering
  sortOrder: integer('sort_order').default(0),
  
  // Tags
  tags: jsonb('tags').$type<string[]>().default([]),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  publishedAt: timestamp('published_at'),
}, (table) => ({
  merchantIdx: index('products_merchant_idx').on(table.merchantId),
  categoryIdx: index('products_category_idx').on(table.categoryId),
  statusIdx: index('products_status_idx').on(table.status),
  skuIdx: index('products_sku_idx').on(table.sku),
}));

// Product variants table
export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  
  // Variant Info
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  
  // Options (e.g., {Size: 'M', Color: 'Red'})
  options: jsonb('options').notNull(),
  
  // Pricing
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  
  // Inventory
  stockQuantity: integer('stock_quantity').default(0),
  
  // Media
  imageUrl: text('image_url'),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'),
  sortOrder: integer('sort_order').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  productIdx: index('product_variants_product_idx').on(table.productId),
}));

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [products.merchantId],
    references: [merchants.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

// Type inference
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
