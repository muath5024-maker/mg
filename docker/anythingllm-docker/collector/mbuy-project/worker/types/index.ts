/**
 * Types Index - Export all types for MBUY Worker
 */

// Database types (auto-generated from schema)
// Exclude 'Tables' to avoid conflict with supabase.client
export { 
  // ENUMs
  type CustomerStatus,
  type MerchantStatus,
  type OrderStatus,
  type OrderSource,
  type ProductType,
  type ProductStatus,
  type PaymentStatus,
  type TransactionStatus,
  type ShipmentStatus,
  type RefundStatus,
  type RefundType,
  type AddressType,
  type OrderItemType,
  type MerchantUserRole,
  type MediaType,
  type CouponType,
  type CouponStatus,
  type LoyaltyPointType,
  type SubscriptionStatus,
  type InvoiceStatus,
  type SupportTicketStatus,
  type SupportTicketPriority,
  type SupportMessageSender,
  type ReviewStatus,
  type MessageChannel,
  type MessageStatus,
  type MessagingProviderType,
  type MessagingTemplateType,
  type MessagingTrigger,
  type InventoryMovement,
  type AITaskType,
  type AITaskStatus,
  type AIPredictionType,
  type AIRecommendationType,
  type CourseLessonType,
  type ChangedByType,
  // Interfaces
  type Customer,
  type Merchant,
  type MerchantUser,
  type AdminStaff,
  type AdminRole,
  type AdminStaffRole,
  type AdminRolePermission,
  type AdminActivityLog,
  type Product,
  type ProductVariant,
  type ProductCategory,
  type Order,
  type OrderItem,
  // Database type helper
  type Database,
} from './database.types';

// Supabase client helper
export { SupabaseClient, type SupabaseQueryOptions, type SupabaseResponse, type SupabaseError } from './supabase.client';

// Domain-specific types
export * from './packages.types';
export * from './studio.types';
export * from './tools.types';

// Revenue types - exported separately to avoid conflicts
import * as RevenueTypes from './revenue.types';
export { RevenueTypes };
