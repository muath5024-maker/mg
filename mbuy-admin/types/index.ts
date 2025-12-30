// User & Auth Types
export interface MbuyUser {
  id: string;
  email: string;
  phone?: string;
  full_name?: string;
  auth_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  mbuy_user_id: string;
  auth_user_id?: string;
  role: 'customer' | 'merchant' | 'admin';
  display_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Store Types
export interface Store {
  id: string;
  owner_id: string;
  name: string;
  name_ar?: string;
  slug: string;
  description?: string;
  description_ar?: string;
  logo_url?: string;
  cover_url?: string;
  status: 'active' | 'suspended' | 'pending';
  is_verified: boolean;
  category?: string;
  subdomain?: string;
  custom_domain?: string;
  settings?: StoreSettings;
  created_at: string;
  updated_at: string;
}

export interface StoreSettings {
  theme?: string;
  primary_color?: string;
  currency?: string;
  timezone?: string;
  [key: string]: unknown;
}

// Product Types
export interface Product {
  id: string;
  store_id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  price: number;
  compare_price?: number;
  sku?: string;
  stock_quantity: number;
  is_active: boolean;
  images?: string[];
  category_id?: string;
  created_at: string;
  updated_at: string;
}

// Order Types
export interface Order {
  id: string;
  store_id: string;
  customer_id: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  subtotal: number;
  shipping_amount?: number;
  discount_amount?: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  shipping_address?: Address;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface Address {
  name: string;
  phone: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
}

// Subscription & Pricing Types
export interface Subscription {
  id: string;
  user_id: string;
  store_id?: string;
  plan_id: 'starter' | 'pro' | 'business' | 'enterprise';
  plan_name: string;
  status: 'active' | 'cancelled' | 'expired' | 'paused';
  price: number;
  currency: string;
  started_at: string;
  expires_at?: string;
  ai_images_limit: number;
  ai_images_used: number;
  ai_videos_limit: number;
  ai_videos_used: number;
  products_limit: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  name_ar: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: PlanFeature[];
  limits: PlanLimits;
  is_active: boolean;
}

export interface PlanFeature {
  key: string;
  name: string;
  name_ar: string;
  included: boolean;
}

export interface PlanLimits {
  products: number;
  ai_images: number;
  ai_videos: number;
  storage_gb: number;
}

// Points & Rewards Types
export interface Points {
  id: string;
  user_id: string;
  store_id?: string;
  current_balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  level_progress: number;
}

export interface PointReward {
  id: string;
  title: string;
  title_ar: string;
  description?: string;
  description_ar?: string;
  points_cost: number;
  reward_type: 'discount' | 'ai_credits' | 'priority_support' | 'free_month';
  reward_value: Record<string, unknown>;
  is_active: boolean;
  max_redemptions_per_user?: number;
  total_available?: number;
  total_redeemed: number;
  display_order: number;
}

// Feature Flags Types
export interface FeatureAction {
  id: string;
  key: string;
  name: string;
  description?: string;
  default_cost: number;
  is_enabled: boolean;
  category?: string;
  created_at: string;
}

// Marketing Types
export interface Coupon {
  id: string;
  store_id: string;
  code: string;
  title: string;
  title_ar?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount?: number;
  min_order_amount?: number;
  usage_limit?: number;
  usage_per_customer?: number;
  times_used: number;
  starts_at?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface FlashSale {
  id: string;
  store_id: string;
  title: string;
  title_ar?: string;
  cover_image?: string;
  starts_at: string;
  ends_at: string;
  default_discount_type: 'percentage' | 'fixed';
  default_discount_value: number;
  max_orders?: number;
  orders_count: number;
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'cancelled';
  is_featured: boolean;
  views_count: number;
  created_at: string;
}

export interface ReferralSettings {
  id: string;
  store_id: string;
  is_enabled: boolean;
  referrer_reward_type: 'points' | 'discount' | 'credit';
  referrer_reward_value: number;
  referrer_reward_max?: number;
  referee_reward_type: 'points' | 'discount' | 'credit';
  referee_reward_value: number;
  referee_min_order?: number;
  total_referrals: number;
  successful_referrals: number;
}

// Analytics Types
export interface AnalyticsSummary {
  total_stores: number;
  total_users: number;
  total_orders: number;
  total_revenue: number;
  active_subscriptions: number;
  stores_growth: number;
  users_growth: number;
  orders_growth: number;
  revenue_growth: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopStore {
  id: string;
  name: string;
  logo_url?: string;
  total_orders: number;
  total_revenue: number;
}

// Worker Types
export interface WorkerEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  description_ar: string;
  category: string;
  auth_required: boolean;
  rate_limit?: string;
}

export interface WorkerHealth {
  status: 'healthy' | 'degraded' | 'down';
  latency_ms: number;
  last_checked: string;
  version?: string;
}

// Settings Types
export interface GlobalSettings {
  platform_name: string;
  platform_name_ar: string;
  support_email: string;
  support_phone?: string;
  default_currency: string;
  default_language: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  merchant_registration_enabled: boolean;
}

// Table Data Types for UI
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  header_ar?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

export interface ListResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  error: string | null;
}
