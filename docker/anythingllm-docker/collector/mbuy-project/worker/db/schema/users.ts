/**
 * Users Schema - customers table
 * Maps to existing Supabase customers table
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  phoneVerified: boolean('phone_verified').default(false),
  email: varchar('email', { length: 255 }),
  emailVerified: boolean('email_verified').default(false),
  passwordHash: text('password_hash'),
  fullName: varchar('full_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  dateOfBirth: timestamp('date_of_birth'),
  gender: varchar('gender', { length: 20 }),
  preferredLanguage: varchar('preferred_language', { length: 10 }).default('ar'),
  marketingConsent: boolean('marketing_consent').default(false),
  pushToken: text('push_token'),
  deviceInfo: jsonb('device_info'),
  lastLoginAt: timestamp('last_login_at'),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Type inference
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
