/**
 * Webhook Event Types
 * 
 * All webhook events that can be triggered from mBuy
 */

export const WebhookEvents = {
  // Order Events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_COMPLETED: 'order.completed',
  ORDER_REFUNDED: 'order.refunded',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',

  // Payment Events
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Customer Events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_DELETED: 'customer.deleted',

  // Product Events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  PRODUCT_LOW_STOCK: 'product.low_stock',
  PRODUCT_OUT_OF_STOCK: 'product.out_of_stock',

  // Inventory Events
  INVENTORY_UPDATED: 'inventory.updated',
  INVENTORY_LOW: 'inventory.low',

  // Review Events
  REVIEW_CREATED: 'review.created',
  REVIEW_UPDATED: 'review.updated',

  // Merchant Events
  MERCHANT_CREATED: 'merchant.created',
  MERCHANT_UPDATED: 'merchant.updated',
  MERCHANT_VERIFIED: 'merchant.verified',

  // Subscription Events
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  SUBSCRIPTION_EXPIRED: 'subscription.expired',

  // Loyalty Events
  POINTS_EARNED: 'loyalty.points_earned',
  POINTS_REDEEMED: 'loyalty.points_redeemed',
  TIER_UPGRADED: 'loyalty.tier_upgraded',

  // Campaign Events
  CAMPAIGN_STARTED: 'campaign.started',
  CAMPAIGN_COMPLETED: 'campaign.completed',
} as const;

export type WebhookEventType = typeof WebhookEvents[keyof typeof WebhookEvents];

/**
 * Webhook Payload Types
 */
export interface WebhookPayload<T = Record<string, any>> {
  id: string;
  event: WebhookEventType;
  created_at: string;
  data: T;
  store_id?: string;
}

export interface OrderWebhookData {
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  status: string;
  payment_status: string;
  total_amount: number;
  currency: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  shipping_address?: {
    street: string;
    city: string;
    country: string;
    postal_code?: string;
  };
  tracking_number?: string;
  notes?: string;
}

export interface PaymentWebhookData {
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  transaction_id?: string;
  paid_at?: string;
}

export interface CustomerWebhookData {
  customer_id: string;
  full_name: string;
  email?: string;
  phone: string;
  total_orders: number;
  total_spent: number;
}

export interface ProductWebhookData {
  product_id: string;
  sku?: string;
  name: string;
  price: number;
  stock_quantity: number;
  status: string;
}

export interface InventoryWebhookData {
  product_id: string;
  variant_id?: string;
  sku?: string;
  name: string;
  previous_stock: number;
  new_stock: number;
  threshold?: number;
}

export interface LoyaltyWebhookData {
  customer_id: string;
  points: number;
  new_balance: number;
  reason: string;
  tier?: string;
  new_tier?: string;
}
