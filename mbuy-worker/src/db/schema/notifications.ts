/**
 * Notifications Schema - notifications table
 * Maps to existing Supabase notifications table
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customers } from './users';
import { merchantUsers } from './merchants';

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Recipient (one of these)
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  merchantUserId: uuid('merchant_user_id').references(() => merchantUsers.id, { onDelete: 'cascade' }),
  
  // Notification Type
  type: varchar('type', { length: 50 }).notNull(), // order, promotion, system, payment, delivery
  category: varchar('category', { length: 50 }), // info, warning, success, error
  
  // Content
  title: varchar('title', { length: 255 }).notNull(),
  titleAr: varchar('title_ar', { length: 255 }),
  body: text('body'),
  bodyAr: text('body_ar'),
  imageUrl: text('image_url'),
  
  // Action
  actionType: varchar('action_type', { length: 50 }), // open_order, open_product, open_url, open_screen
  actionData: jsonb('action_data'), // {orderId, productId, url, screen}
  
  // Status
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  
  // Push notification
  pushSent: boolean('push_sent').default(false),
  pushSentAt: timestamp('push_sent_at'),
  pushError: text('push_error'),
  
  // Scheduling
  scheduledFor: timestamp('scheduled_for'),
  
  // Metadata
  metadata: jsonb('metadata'),
  
  // Expiry
  expiresAt: timestamp('expires_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  customerIdx: index('notifications_customer_idx').on(table.customerId),
  merchantUserIdx: index('notifications_merchant_user_idx').on(table.merchantUserId),
  typeIdx: index('notifications_type_idx').on(table.type),
  isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
}));

// Push tokens table
export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  merchantUserId: uuid('merchant_user_id').references(() => merchantUsers.id, { onDelete: 'cascade' }),
  
  // Token
  token: text('token').notNull(),
  platform: varchar('platform', { length: 20 }).notNull(), // ios, android, web
  
  // Device Info
  deviceId: varchar('device_id', { length: 255 }),
  deviceName: varchar('device_name', { length: 255 }),
  appVersion: varchar('app_version', { length: 50 }),
  
  // Status
  isActive: boolean('is_active').default(true),
  lastUsedAt: timestamp('last_used_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  customerIdx: index('push_tokens_customer_idx').on(table.customerId),
  merchantUserIdx: index('push_tokens_merchant_user_idx').on(table.merchantUserId),
  tokenIdx: index('push_tokens_token_idx').on(table.token),
}));

// Relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  customer: one(customers, {
    fields: [notifications.customerId],
    references: [customers.id],
  }),
  merchantUser: one(merchantUsers, {
    fields: [notifications.merchantUserId],
    references: [merchantUsers.id],
  }),
}));

export const pushTokensRelations = relations(pushTokens, ({ one }) => ({
  customer: one(customers, {
    fields: [pushTokens.customerId],
    references: [customers.id],
  }),
  merchantUser: one(merchantUsers, {
    fields: [pushTokens.merchantUserId],
    references: [merchantUsers.id],
  }),
}));

// Type inference
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type PushToken = typeof pushTokens.$inferSelect;
export type NewPushToken = typeof pushTokens.$inferInsert;
