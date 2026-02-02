/**
 * Merchants Schema - merchants & merchant_users tables
 * Maps to existing Supabase merchants tables
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, decimal, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Main merchants table
export const merchants = pgTable('merchants', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  businessNameAr: varchar('business_name_ar', { length: 255 }),
  slug: varchar('slug', { length: 100 }).unique(),
  description: text('description'),
  descriptionAr: text('description_ar'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  businessType: varchar('business_type', { length: 50 }),
  categoryId: uuid('category_id'),
  
  // Contact Info
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  whatsapp: varchar('whatsapp', { length: 20 }),
  website: text('website'),
  
  // Address
  countryCode: varchar('country_code', { length: 10 }).default('SA'),
  city: varchar('city', { length: 100 }),
  district: varchar('district', { length: 100 }),
  street: varchar('street', { length: 255 }),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  
  // Business Settings
  currency: varchar('currency', { length: 10 }).default('SAR'),
  taxEnabled: boolean('tax_enabled').default(true),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('15.00'),
  minOrderAmount: decimal('min_order_amount', { precision: 10, scale: 2 }).default('0'),
  deliveryEnabled: boolean('delivery_enabled').default(true),
  pickupEnabled: boolean('pickup_enabled').default(false),
  
  // Rating & Stats
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  reviewCount: integer('review_count').default(0),
  totalOrders: integer('total_orders').default(0),
  totalRevenue: decimal('total_revenue', { precision: 15, scale: 2 }).default('0'),
  
  // Status
  status: varchar('status', { length: 20 }).default('pending'), // pending, active, suspended
  verified: boolean('verified').default(false),
  featured: boolean('featured').default(false),
  
  // Subscription
  subscriptionPlan: varchar('subscription_plan', { length: 50 }).default('free'),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  
  // Metadata
  settings: jsonb('settings'),
  socialLinks: jsonb('social_links'),
  workingHours: jsonb('working_hours'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  slugIdx: index('merchants_slug_idx').on(table.slug),
  statusIdx: index('merchants_status_idx').on(table.status),
  categoryIdx: index('merchants_category_idx').on(table.categoryId),
}));

// Merchant staff/users table
export const merchantUsers = pgTable('merchant_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  passwordHash: text('password_hash'),
  fullName: varchar('full_name', { length: 255 }),
  role: varchar('role', { length: 50 }).default('staff'), // owner, manager, staff
  permissions: jsonb('permissions'),
  avatarUrl: text('avatar_url'),
  lastLoginAt: timestamp('last_login_at'),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  merchantIdx: index('merchant_users_merchant_idx').on(table.merchantId),
  phoneIdx: index('merchant_users_phone_idx').on(table.phone),
}));

// Relations
export const merchantsRelations = relations(merchants, ({ many }) => ({
  users: many(merchantUsers),
}));

export const merchantUsersRelations = relations(merchantUsers, ({ one }) => ({
  merchant: one(merchants, {
    fields: [merchantUsers.merchantId],
    references: [merchants.id],
  }),
}));

// Type inference
export type Merchant = typeof merchants.$inferSelect;
export type NewMerchant = typeof merchants.$inferInsert;
export type MerchantUser = typeof merchantUsers.$inferSelect;
export type NewMerchantUser = typeof merchantUsers.$inferInsert;
