/**
 * Addresses Schema - customer_addresses table
 * Maps to existing Supabase addresses table
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, decimal, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { customers } from './users';

export const customerAddresses = pgTable('customer_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  
  // Address Type
  type: varchar('type', { length: 20 }).default('home'), // home, work, other
  label: varchar('label', { length: 100 }),
  
  // Address Details
  fullName: varchar('full_name', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  
  // Location
  countryCode: varchar('country_code', { length: 10 }).default('SA'),
  country: varchar('country', { length: 100 }).default('Saudi Arabia'),
  city: varchar('city', { length: 100 }).notNull(),
  district: varchar('district', { length: 100 }),
  street: varchar('street', { length: 255 }),
  buildingNumber: varchar('building_number', { length: 50 }),
  apartmentNumber: varchar('apartment_number', { length: 50 }),
  floor: varchar('floor', { length: 20 }),
  postalCode: varchar('postal_code', { length: 20 }),
  
  // Additional Info
  additionalInfo: text('additional_info'),
  landmark: varchar('landmark', { length: 255 }),
  
  // Coordinates
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  
  // Formatted address (for display)
  formattedAddress: text('formatted_address'),
  
  // Flags
  isDefault: boolean('is_default').default(false),
  isVerified: boolean('is_verified').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  customerIdx: index('customer_addresses_customer_idx').on(table.customerId),
  cityIdx: index('customer_addresses_city_idx').on(table.city),
}));

// Relations
export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, {
    fields: [customerAddresses.customerId],
    references: [customers.id],
  }),
}));

// Type inference
export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type NewCustomerAddress = typeof customerAddresses.$inferInsert;
