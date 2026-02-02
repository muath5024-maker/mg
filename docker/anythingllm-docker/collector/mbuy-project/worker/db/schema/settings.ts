/**
 * Settings Schema - platform & merchant settings tables
 * Maps to existing Supabase settings tables
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { merchants } from './merchants';

// Platform settings (global)
export const platformSettings = pgTable('platform_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Key-Value
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: jsonb('value'),
  
  // Metadata
  description: text('description'),
  category: varchar('category', { length: 50 }), // general, payment, shipping, notifications
  isPublic: boolean('is_public').default(false), // Can be read without auth
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  keyIdx: index('platform_settings_key_idx').on(table.key),
  categoryIdx: index('platform_settings_category_idx').on(table.category),
}));

// Merchant settings
export const merchantSettings = pgTable('merchant_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  
  // Key-Value
  key: varchar('key', { length: 100 }).notNull(),
  value: jsonb('value'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  merchantKeyIdx: index('merchant_settings_merchant_key_idx').on(table.merchantId, table.key),
  uniqueMerchantKey: unique('merchant_settings_unique').on(table.merchantId, table.key),
}));

// Feature flags
export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Flag Info
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  
  // Status
  isEnabled: boolean('is_enabled').default(false),
  
  // Targeting
  targetType: varchar('target_type', { length: 50 }).default('all'), // all, percentage, whitelist
  targetPercentage: varchar('target_percentage', { length: 10 }),
  targetWhitelist: jsonb('target_whitelist'), // array of user/merchant IDs
  
  // Environment
  environment: varchar('environment', { length: 20 }).default('production'), // development, staging, production
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  nameIdx: index('feature_flags_name_idx').on(table.name),
}));

// App versions (for force update)
export const appVersions = pgTable('app_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // App Info
  appType: varchar('app_type', { length: 50 }).notNull(), // customer_ios, customer_android, merchant_ios, merchant_android
  version: varchar('version', { length: 20 }).notNull(),
  buildNumber: varchar('build_number', { length: 20 }),
  
  // Status
  isRequired: boolean('is_required').default(false), // Force update
  isLatest: boolean('is_latest').default(false),
  
  // URLs
  storeUrl: text('store_url'),
  releaseNotes: text('release_notes'),
  releaseNotesAr: text('release_notes_ar'),
  
  releasedAt: timestamp('released_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  appTypeIdx: index('app_versions_app_type_idx').on(table.appType),
  uniqueAppVersion: unique('app_versions_unique').on(table.appType, table.version),
}));

// Audit logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Actor
  actorType: varchar('actor_type', { length: 50 }).notNull(), // customer, merchant_user, admin, system
  actorId: uuid('actor_id'),
  
  // Action
  action: varchar('action', { length: 100 }).notNull(), // create, update, delete, login, logout
  resourceType: varchar('resource_type', { length: 100 }), // order, product, merchant
  resourceId: uuid('resource_id'),
  
  // Details
  description: text('description'),
  changes: jsonb('changes'), // {field: {old, new}}
  metadata: jsonb('metadata'),
  
  // Request Info
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  actorIdx: index('audit_logs_actor_idx').on(table.actorType, table.actorId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  resourceIdx: index('audit_logs_resource_idx').on(table.resourceType, table.resourceId),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}));

// Relations
export const merchantSettingsRelations = relations(merchantSettings, ({ one }) => ({
  merchant: one(merchants, {
    fields: [merchantSettings.merchantId],
    references: [merchants.id],
  }),
}));

// Type inference
export type PlatformSetting = typeof platformSettings.$inferSelect;
export type NewPlatformSetting = typeof platformSettings.$inferInsert;
export type MerchantSetting = typeof merchantSettings.$inferSelect;
export type NewMerchantSetting = typeof merchantSettings.$inferInsert;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;
export type AppVersion = typeof appVersions.$inferSelect;
export type NewAppVersion = typeof appVersions.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
