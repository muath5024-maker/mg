/**
 * Categories Schema - categories table
 * Maps to existing Supabase categories table
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id'),
  merchantId: uuid('merchant_id'), // null = platform category
  
  // Basic Info
  name: varchar('name', { length: 255 }).notNull(),
  nameAr: varchar('name_ar', { length: 255 }),
  slug: varchar('slug', { length: 255 }),
  description: text('description'),
  descriptionAr: text('description_ar'),
  
  // Media
  imageUrl: text('image_url'),
  iconUrl: text('icon_url'),
  bannerUrl: text('banner_url'),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'),
  featured: boolean('featured').default(false),
  showInMenu: boolean('show_in_menu').default(true),
  showInHome: boolean('show_in_home').default(false),
  
  // Hierarchy
  level: integer('level').default(0),
  path: text('path'), // e.g., "parent_id/child_id/grandchild_id"
  
  // Ordering
  sortOrder: integer('sort_order').default(0),
  
  // SEO
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  
  // Stats
  productCount: integer('product_count').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  parentIdx: index('categories_parent_idx').on(table.parentId),
  merchantIdx: index('categories_merchant_idx').on(table.merchantId),
  slugIdx: index('categories_slug_idx').on(table.slug),
  statusIdx: index('categories_status_idx').on(table.status),
}));

// Self-referential relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parentChild',
  }),
  children: many(categories, {
    relationName: 'parentChild',
  }),
}));

// Type inference
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
