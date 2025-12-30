/**
 * Database Types - Auto-generated from Supabase Schema
 * 149 Tables - MBuy Platform
 * Generated: 2024-12-30
 */

// ============================================
// ENUMS
// ============================================

export type CustomerStatus = 'active' | 'inactive' | 'blocked';
export type MerchantStatus = 'active' | 'pending' | 'suspended' | 'banned';
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'failed';
export type OrderSource = 'web' | 'mobile' | 'pos' | 'api';
export type ProductType = 'simple' | 'variable' | 'digital' | 'service' | 'bundle';
export type ProductStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'cancelled';
export type TransactionStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
export type ShipmentStatus = 'pending' | 'label_created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
export type RefundStatus = 'pending' | 'approved' | 'processed' | 'rejected';
export type RefundType = 'full' | 'partial';
export type AddressType = 'shipping' | 'billing';
export type OrderItemType = 'product' | 'variant' | 'bundle' | 'subscription';
export type MerchantUserRole = 'owner' | 'admin' | 'manager' | 'staff';
export type MediaType = 'image' | 'video' | '3d_model';
export type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping';
export type CouponStatus = 'active' | 'inactive' | 'expired';
export type LoyaltyPointType = 'earned' | 'spent' | 'expired' | 'adjusted';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'past_due' | 'expired';
export type InvoiceStatus = 'pending' | 'paid' | 'failed' | 'cancelled';
export type SupportTicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportMessageSender = 'customer' | 'agent' | 'system';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type MessageChannel = 'email' | 'sms' | 'push' | 'whatsapp';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'opened' | 'clicked';
export type MessagingProviderType = 'email' | 'sms' | 'push' | 'whatsapp';
export type MessagingTemplateType = 'email' | 'sms' | 'push';
export type MessagingTrigger = 'order_placed' | 'order_shipped' | 'order_delivered' | 'abandoned_cart' | 'review_request' | 'welcome' | 'custom';
export type InventoryMovement = 'in' | 'out' | 'adjustment' | 'transfer' | 'reserved' | 'released';
export type AITaskType = 'product_description' | 'image_generation' | 'translation' | 'recommendation' | 'prediction';
export type AITaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AIPredictionType = 'sales_forecast' | 'demand_prediction' | 'churn_risk' | 'price_optimization';
export type AIRecommendationType = 'similar_products' | 'frequently_bought_together' | 'personalized';
export type CourseLessonType = 'video' | 'text' | 'quiz' | 'assignment' | 'download';
export type ChangedByType = 'customer' | 'merchant' | 'merchant_user' | 'admin' | 'system';

// ============================================
// USER MANAGEMENT TABLES
// ============================================

export interface Customer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  status: CustomerStatus;
  date_of_birth: string | null;
  gender: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  password_hash: string | null;
}

export interface Merchant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  password_hash: string | null;
}

export interface MerchantUser {
  id: string;
  merchant_id: string;
  role: MerchantUserRole;
  permissions: string[];
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  email: string | null;
  password_hash: string | null;
  name: string | null;
  phone: string | null;
  is_active: boolean;
}

export interface AdminStaff {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  password_hash: string | null;
}

export interface AdminRole {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface AdminStaffRole {
  id: string;
  staff_id: string;
  role_id: string;
  created_at: string;
}

export interface AdminRolePermission {
  id: string;
  role_id: string;
  permissions: Record<string, any>;
  created_at: string;
}

export interface AdminActivityLog {
  id: string;
  merchant_id: string;
  staff_id: string;
  action: string;
  description: string | null;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================
// PRODUCT TABLES
// ============================================

export interface Product {
  id: string;
  store_id: string;
  merchant_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  short_description: string | null;
  type: ProductType;
  status: ProductStatus;
  sku: string | null;
  barcode: string | null;
  brand: string | null;
  tags: string[];
  weight: number | null;
  dimensions: Record<string, any> | null;
  is_featured: boolean;
  is_published: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  store_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  compare_at_price: number | null;
  weight: number | null;
  dimensions: Record<string, any> | null;
  options: Record<string, any>;
  is_default: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  store_id: string;
  name: string;
  slug: string | null;
  parent_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ProductCategoryAssignment {
  id: string;
  product_id: string;
  category_id: string;
  created_at: string;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  variant_id: string | null;
  type: MediaType;
  url: string;
  alt: string | null;
  position: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  created_at: string;
}

export interface ProductOptionValue {
  id: string;
  option_id: string;
  value: string;
  created_at: string;
}

export interface ProductAttribute {
  id: string;
  store_id: string;
  name: string;
  type: string;
  created_at: string;
}

export interface ProductAttributeValue {
  id: string;
  product_id: string;
  attribute_id: string;
  value: string;
  created_at: string;
}

export interface ProductPricing {
  id: string;
  product_id: string;
  base_price: number;
  compare_at_price: number | null;
  currency: string;
  created_at: string;
}

export interface ProductInventorySettings {
  id: string;
  product_id: string;
  track_inventory: boolean;
  allow_backorder: boolean;
  low_stock_threshold: number;
  created_at: string;
}

// ============================================
// ORDER TABLES
// ============================================

export interface Order {
  id: string;
  store_id: string;
  customer_id: string | null;
  merchant_id: string;
  status: OrderStatus;
  source: OrderSource;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  discount_total: number;
  grand_total: number;
  currency: string;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  merchant_id: string;
  item_type: OrderItemType;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  product_data: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrderAddress {
  id: string;
  order_id: string;
  type: AddressType;
  name: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  district: string | null;
  street: string | null;
  building_number: string | null;
  apartment_number: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrderPayment {
  id: string;
  order_id: string;
  merchant_id: string;
  payment_method: string;
  provider: string | null;
  transaction_id: string | null;
  amount: number;
  fee_amount: number;
  collected_amount: number;
  status: PaymentStatus;
  paid_at: string | null;
  refunded_at: string | null;
  failure_reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrderShipment {
  id: string;
  order_id: string;
  merchant_id: string;
  carrier: string | null;
  carrier_service: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  status: ShipmentStatus;
  label_url: string | null;
  awb_pdf_url: string | null;
  pickup_date: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  returned_at: string | null;
  weight: number | null;
  dimensions: Record<string, any> | null;
  cost: number | null;
  cod_amount: number | null;
  driver_name: string | null;
  driver_phone: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrderRefund {
  id: string;
  order_id: string;
  merchant_id: string;
  refund_type: RefundType;
  reason: string | null;
  notes: string | null;
  amount: number;
  currency: string;
  status: RefundStatus;
  processed_by: string | null;
  processed_by_type: ChangedByType | null;
  refunded_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  merchant_id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string | null;
  changed_by_type: ChangedByType;
  note: string | null;
  created_at: string;
}

// ============================================
// CUSTOMER TABLES
// ============================================

export interface CustomerAddress {
  id: string;
  customer_id: string;
  merchant_id: string;
  type: AddressType;
  name: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  district: string | null;
  street: string | null;
  building_number: string | null;
  apartment_number: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CustomerSegment {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  rules: Record<string, any>;
  is_dynamic: boolean;
  created_at: string;
}

export interface CustomerTag {
  id: string;
  merchant_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface CustomerTagAssignment {
  id: string;
  customer_id: string;
  tag_id: string;
  created_at: string;
}

// ============================================
// INVENTORY TABLES
// ============================================

export interface InventoryItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  merchant_id: string;
  quantity: number;
  reserved: number;
  available: number | null;
  low_stock_threshold: number;
  warehouse_location: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovementRecord {
  id: string;
  inventory_item_id: string;
  product_id: string;
  variant_id: string | null;
  merchant_id: string;
  movement: InventoryMovement;
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface InventoryReservation {
  id: string;
  inventory_item_id: string;
  product_id: string;
  variant_id: string | null;
  merchant_id: string;
  order_id: string | null;
  cart_id: string | null;
  quantity: number;
  expires_at: string | null;
  released_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface InventoryBatch {
  id: string;
  inventory_item_id: string;
  batch_code: string | null;
  expiry_date: string | null;
  quantity: number;
  created_at: string;
}

export interface Warehouse {
  id: string;
  merchant_id: string;
  name: string;
  code: string | null;
  address: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseLocation {
  id: string;
  warehouse_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

// ============================================
// PAYMENT TABLES
// ============================================

export interface PaymentProvider {
  id: string;
  merchant_id: string;
  name: string;
  code: string;
  is_active: boolean;
  api_credentials: Record<string, any>;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  merchant_id: string;
  provider_id: string | null;
  name: string;
  code: string;
  is_active: boolean;
  is_cod: boolean;
  settings: Record<string, any>;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  merchant_id: string;
  provider_id: string | null;
  method_id: string | null;
  amount: number;
  currency: string;
  status: TransactionStatus;
  provider_transaction_id: string | null;
  provider_reference: string | null;
  provider_response: Record<string, any> | null;
  authorized_at: string | null;
  captured_at: string | null;
  refunded_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentLog {
  id: string;
  transaction_id: string | null;
  provider_id: string | null;
  merchant_id: string;
  event: string;
  payload: Record<string, any>;
  created_at: string;
}

export interface MerchantPaymentAccount {
  id: string;
  merchant_id: string;
  provider: string;
  merchant_key: string;
  merchant_secret: string;
  merchant_profile_id: string | null;
  is_active: boolean;
  created_at: string;
}

// ============================================
// SHIPPING TABLES
// ============================================

export interface ShippingProvider {
  id: string;
  merchant_id: string;
  name: string;
  code: string;
  is_active: boolean;
  api_credentials: Record<string, any>;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ShippingZone {
  id: string;
  merchant_id: string;
  name: string;
  countries: string[];
  cities: string[];
  created_at: string;
}

export interface ShippingRate {
  id: string;
  merchant_id: string;
  provider_id: string;
  zone_id: string;
  min_weight: number;
  max_weight: number;
  base_price: number;
  additional_kg_price: number;
  cod_fee: number;
  currency: string;
  created_at: string;
}

export interface ShippingLabel {
  id: string;
  order_id: string;
  provider_id: string;
  merchant_id: string;
  awb_number: string;
  label_url: string | null;
  raw_response: Record<string, any> | null;
  created_at: string;
}

export interface ShippingPickup {
  id: string;
  provider_id: string;
  merchant_id: string;
  pickup_date: string;
  status: string;
  tracking_number: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// ============================================
// MARKETING TABLES
// ============================================

export interface Coupon {
  id: string;
  merchant_id: string;
  code: string;
  type: CouponType;
  value: number;
  max_discount: number | null;
  min_order_amount: number;
  usage_limit: number | null;
  usage_limit_per_customer: number | null;
  starts_at: string | null;
  ends_at: string | null;
  status: CouponStatus;
  applies_to_products: string[];
  applies_to_categories: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CouponUse {
  id: string;
  coupon_id: string;
  order_id: string;
  customer_id: string | null;
  merchant_id: string;
  discount_amount: number;
  created_at: string;
}

export interface MarketingCampaign {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  budget: number | null;
  spent: number;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MarketingCoupon {
  id: string;
  merchant_id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order_value: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  usage_per_customer: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MarketingDiscount {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  applies_to: string;
  target_ids: string[];
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MarketingABTest {
  id: string;
  merchant_id: string;
  test_name: string;
  variant_a: Record<string, any>;
  variant_b: Record<string, any>;
  conversions_a: number;
  conversions_b: number;
  is_active: boolean;
  created_at: string;
}

export interface MarketingPopup {
  id: string;
  merchant_id: string;
  title: string;
  content: string;
  display_rules: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface MarketingLandingPage {
  id: string;
  merchant_id: string;
  title: string;
  slug: string;
  content: Record<string, any>;
  seo: Record<string, any>;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// LOYALTY TABLES
// ============================================

export interface LoyaltyProgram {
  id: string;
  merchant_id: string;
  is_enabled: boolean;
  earn_rate: number;
  burn_rate: number;
  min_points_to_redeem: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyPoint {
  id: string;
  merchant_id: string;
  customer_id: string;
  point_type: LoyaltyPointType;
  points: number;
  order_id: string | null;
  reason: string | null;
  created_at: string;
}

export interface LoyaltyTier {
  id: string;
  merchant_id: string;
  name: string;
  min_points: number;
  benefits: Record<string, any>;
  created_at: string;
}

export interface LoyaltyReward {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  points_required: number;
  reward_type: string;
  reward_value: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface LoyaltyRedemption {
  id: string;
  merchant_id: string;
  customer_id: string;
  reward_id: string;
  points_spent: number;
  order_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// ============================================
// REVIEW TABLES
// ============================================

export interface Review {
  id: string;
  merchant_id: string;
  customer_id: string | null;
  product_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  has_images: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ReviewMedia {
  id: string;
  review_id: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface ReviewReply {
  id: string;
  review_id: string;
  merchant_id: string;
  user_id: string | null;
  reply: string;
  created_at: string;
}

export interface MerchantReview {
  id: string;
  merchant_id: string;
  customer_id: string;
  rating: number;
  title: string | null;
  review: string | null;
  created_at: string;
}

// ============================================
// SUPPORT TABLES
// ============================================

export interface SupportTicket {
  id: string;
  merchant_id: string;
  customer_id: string | null;
  assigned_to: string | null;
  subject: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  category_id: string | null;
  order_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender: SupportMessageSender;
  message: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SupportCategory {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface SupportArticle {
  id: string;
  merchant_id: string;
  category_id: string | null;
  title: string;
  slug: string | null;
  content: string;
  is_published: boolean;
  views: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SupportAttachment {
  id: string;
  ticket_id: string;
  message_id: string | null;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface SupportEvent {
  id: string;
  ticket_id: string | null;
  merchant_id: string;
  customer_id: string | null;
  event_name: string;
  payload: Record<string, any>;
  created_at: string;
}

// ============================================
// ANALYTICS TABLES
// ============================================

export interface AnalyticsEvent {
  id: string;
  merchant_id: string;
  customer_id: string | null;
  session_id: string | null;
  order_id: string | null;
  product_id: string | null;
  variant_id: string | null;
  event_name: string;
  event_data: Record<string, any>;
  device: string | null;
  platform: string | null;
  browser: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AnalyticsDaily {
  id: string;
  merchant_id: string;
  date: string;
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  product_views: number;
  add_to_cart: number;
  conversions: number;
  created_at: string;
}

export interface AnalyticsProduct {
  id: string;
  merchant_id: string;
  product_id: string;
  views: number;
  add_to_cart: number;
  purchases: number;
  revenue: number;
  updated_at: string;
}

export interface AnalyticsCustomer {
  id: string;
  merchant_id: string;
  customer_id: string;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  last_order_at: string | null;
  first_order_at: string | null;
  updated_at: string;
}

export interface AnalyticsCustomerMetric {
  id: string;
  merchant_id: string;
  customer_id: string;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  last_order_at: string | null;
  first_order_at: string | null;
  rfm_score: number | null;
  segment: string | null;
  updated_at: string;
}

export interface AnalyticsProductMetric {
  id: string;
  merchant_id: string;
  product_id: string;
  views: number;
  add_to_cart: number;
  purchases: number;
  conversion_rate: number;
  updated_at: string;
}

// ============================================
// SUBSCRIPTION TABLES
// ============================================

export interface SubscriptionPlan {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  features: Record<string, any>;
  price: number;
  interval: string;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  merchant_id: string;
  customer_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string | null;
  trial_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInvoice {
  id: string;
  subscription_id: string;
  merchant_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string;
  paid_at: string | null;
  failed_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SubscriptionPayment {
  id: string;
  invoice_id: string;
  merchant_id: string;
  customer_id: string;
  provider: string | null;
  transaction_id: string | null;
  amount: number;
  status: string;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SubscriptionEvent {
  id: string;
  subscription_id: string | null;
  invoice_id: string | null;
  customer_id: string | null;
  merchant_id: string;
  event_name: string;
  payload: Record<string, any>;
  created_at: string;
}

// ============================================
// MESSAGING TABLES
// ============================================

export interface MessagingProvider {
  id: string;
  merchant_id: string;
  provider_type: MessagingProviderType;
  name: string;
  code: string;
  is_active: boolean;
  api_credentials: Record<string, any>;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MessagingTemplate {
  id: string;
  merchant_id: string;
  name: string;
  type: MessagingTemplateType;
  subject: string | null;
  body: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MessagingMessage {
  id: string;
  merchant_id: string;
  provider_id: string | null;
  template_id: string | null;
  channel: MessageChannel;
  to_customer_id: string | null;
  to_phone: string | null;
  to_email: string | null;
  to_device_token: string | null;
  subject: string | null;
  body: string;
  status: MessageStatus;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
}

export interface MessagingAutomation {
  id: string;
  merchant_id: string;
  name: string;
  trigger: MessagingTrigger;
  template_id: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessagingEvent {
  id: string;
  merchant_id: string;
  event_name: string;
  customer_id: string | null;
  order_id: string | null;
  product_id: string | null;
  payload: Record<string, any>;
  created_at: string;
}

// ============================================
// AI TABLES
// ============================================

export interface AITask {
  id: string;
  merchant_id: string;
  task_type: AITaskType;
  input_data: Record<string, any>;
  output_data: Record<string, any> | null;
  error_message: string | null;
  status: AITaskStatus;
  created_at: string;
  updated_at: string;
}

export interface AIPrediction {
  id: string;
  merchant_id: string;
  prediction_type: AIPredictionType;
  target_id: string | null;
  prediction_value: number | null;
  confidence: number | null;
  prediction_data: Record<string, any> | null;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  merchant_id: string;
  customer_id: string | null;
  product_id: string | null;
  recommendation_type: AIRecommendationType;
  recommended_items: Record<string, any>;
  model_version: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AIEmbedding {
  id: string;
  merchant_id: string;
  entity_type: string;
  entity_id: string;
  embedding: number[] | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AILog {
  id: string;
  merchant_id: string;
  task_id: string | null;
  event: string;
  payload: Record<string, any> | null;
  created_at: string;
}

// ============================================
// AFFILIATE TABLES
// ============================================

export interface Affiliate {
  id: string;
  merchant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  referral_code: string | null;
  referral_url: string | null;
  commission_rate: number;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AffiliateLink {
  id: string;
  affiliate_id: string;
  merchant_id: string;
  link_code: string;
  target_url: string;
  clicks: number;
  conversions: number;
  created_at: string;
}

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  merchant_id: string;
  order_id: string;
  commission_amount: number;
  commission_rate: number;
  status: string;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
}

export interface AffiliatePayout {
  id: string;
  affiliate_id: string;
  merchant_id: string;
  amount: number;
  currency: string;
  status: string;
  transaction_reference: string | null;
  metadata: Record<string, any>;
  created_at: string;
  paid_at: string | null;
}

export interface AffiliateEvent {
  id: string;
  affiliate_id: string | null;
  merchant_id: string;
  event_name: string;
  payload: Record<string, any>;
  created_at: string;
}

// ============================================
// BLOG TABLES
// ============================================

export interface BlogPost {
  id: string;
  merchant_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  content: string;
  cover_image: string | null;
  seo: Record<string, any>;
  is_published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface BlogCategory {
  id: string;
  merchant_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  created_at: string;
}

export interface BlogTag {
  id: string;
  merchant_id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface BlogPostTag {
  id: string;
  post_id: string;
  tag_id: string;
  created_at: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  customer_id: string | null;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

// ============================================
// COURSE TABLES
// ============================================

export interface Course {
  id: string;
  merchant_id: string;
  title: string;
  slug: string | null;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  is_free: boolean;
  is_published: boolean;
  published_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  created_at: string;
}

export interface CourseLesson {
  id: string;
  course_id: string;
  section_id: string;
  title: string;
  type: CourseLessonType;
  content: string | null;
  video_url: string | null;
  file_url: string | null;
  duration_seconds: number | null;
  sort_order: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  customer_id: string;
  merchant_id: string;
  enrolled_at: string;
  completed_at: string | null;
}

export interface CourseProgress {
  id: string;
  course_id: string;
  lesson_id: string;
  customer_id: string;
  is_completed: boolean;
  completed_at: string | null;
}

export interface CourseCertificate {
  id: string;
  course_id: string;
  customer_id: string;
  certificate_url: string | null;
  issued_at: string;
}

// ============================================
// BUNDLE TABLES
// ============================================

export interface Bundle {
  id: string;
  merchant_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  base_price: number | null;
  discount_type: string | null;
  discount_value: number | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
}

export interface BundlePricingRule {
  id: string;
  bundle_id: string;
  rule_type: string;
  rule_value: Record<string, any>;
  discount_type: string | null;
  discount_value: number | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface BundleAnalytics {
  id: string;
  bundle_id: string;
  merchant_id: string;
  views: number;
  add_to_cart: number;
  purchases: number;
  revenue: number;
  updated_at: string;
}

// ============================================
// SETTINGS TABLES
// ============================================

export interface MerchantSettings {
  id: string;
  merchant_id: string;
  key: string;
  value: Record<string, any>;
  created_at: string;
}

export interface MerchantBilling {
  id: string;
  merchant_id: string;
  plan: string;
  cycle: string;
  amount: number;
  currency: string;
  renews_at: string | null;
  expires_at: string | null;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MerchantFeatureActivation {
  id: string;
  merchant_id: string;
  feature_name: string;
  is_enabled: boolean;
  created_at: string;
}

export interface SettingsTax {
  id: string;
  merchant_id: string;
  country_code: string | null;
  region: string | null;
  tax_rate: number | null;
  is_inclusive: boolean;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SettingsCurrency {
  id: string;
  merchant_id: string;
  default_currency: string;
  supported_currencies: string[];
  exchange_rates: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SettingsLocalization {
  id: string;
  merchant_id: string;
  default_language: string;
  supported_languages: string[];
  timezone: string;
  date_format: string;
  created_at: string;
  updated_at: string;
}

export interface SettingsCheckout {
  id: string;
  merchant_id: string;
  guest_checkout_enabled: boolean;
  require_phone: boolean;
  require_address: boolean;
  allowed_payment_methods: string[];
  allowed_shipping_methods: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================
// WEBHOOK TABLES
// ============================================

export interface WebhookEndpoint {
  id: string;
  merchant_id: string;
  name: string;
  url: string;
  secret: string | null;
  is_active: boolean;
  events: string[];
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  endpoint_id: string;
  merchant_id: string;
  event_name: string;
  payload: Record<string, any>;
  response_status: number | null;
  response_body: string | null;
  attempt_number: number;
  success: boolean;
  created_at: string;
}

export interface WebhookRetryQueue {
  id: string;
  log_id: string;
  merchant_id: string;
  next_attempt_at: string;
  max_attempts: number;
  current_attempt: number;
  created_at: string;
}

// ============================================
// MISC TABLES
// ============================================

export interface AuditLog {
  id: string;
  merchant_id: string | null;
  user_id: string | null;
  customer_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface FileStorage {
  id: string;
  merchant_id: string;
  file_url: string;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  folder: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface FileUsage {
  id: string;
  file_id: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

export interface SearchLog {
  id: string;
  merchant_id: string;
  customer_id: string | null;
  query: string;
  results_count: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SearchFilter {
  id: string;
  merchant_id: string;
  filter_name: string;
  filter_type: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SearchRankingRule {
  id: string;
  merchant_id: string;
  rule_name: string;
  weight: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ChatThread {
  id: string;
  merchant_id: string;
  customer_id: string;
  last_message_at: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_type: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export interface MarketplaceSettings {
  id: string;
  platform_role: string;
  terms: string | null;
  privacy: string | null;
  dispute_policy: string | null;
  refund_policy: string | null;
  allow_multi_merchant: boolean;
  allow_direct_payouts: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceOwner {
  id: string;
  owner_staff_id: string;
  marketplace_role: string;
  created_at: string;
}

export interface MerchantBadge {
  id: string;
  badge_name: string;
  badge_icon: string | null;
  badge_description: string | null;
  created_at: string;
}

export interface MerchantBadgeAssignment {
  id: string;
  merchant_id: string;
  badge_id: string;
  assigned_at: string;
}

export interface MerchantFollower {
  id: string;
  merchant_id: string;
  customer_id: string;
  followed_at: string;
}

// ============================================
// DATABASE SCHEMA TYPE
// ============================================

export interface Database {
  public: {
    Tables: {
      customers: { Row: Customer; Insert: Partial<Customer>; Update: Partial<Customer> };
      merchants: { Row: Merchant; Insert: Partial<Merchant>; Update: Partial<Merchant> };
      merchant_users: { Row: MerchantUser; Insert: Partial<MerchantUser>; Update: Partial<MerchantUser> };
      admin_staff: { Row: AdminStaff; Insert: Partial<AdminStaff>; Update: Partial<AdminStaff> };
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> };
      product_variants: { Row: ProductVariant; Insert: Partial<ProductVariant>; Update: Partial<ProductVariant> };
      product_categories: { Row: ProductCategory; Insert: Partial<ProductCategory>; Update: Partial<ProductCategory> };
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> };
      order_items: { Row: OrderItem; Insert: Partial<OrderItem>; Update: Partial<OrderItem> };
      inventory_items: { Row: InventoryItem; Insert: Partial<InventoryItem>; Update: Partial<InventoryItem> };
      // Add more tables as needed...
    };
    Enums: {
      customer_status: CustomerStatus;
      order_status: OrderStatus;
      order_source: OrderSource;
      product_type: ProductType;
      product_status: ProductStatus;
      payment_status: PaymentStatus;
      shipment_status: ShipmentStatus;
      // Add more enums...
    };
  };
}

// ============================================
// HELPER TYPES
// ============================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
