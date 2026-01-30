/**
 * Webhook Triggers
 * 
 * Helper functions to trigger webhooks from different parts of the application
 */

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { dispatchWebhook } from './dispatcher';
import { 
  WebhookEvents, 
  WebhookEventType,
  OrderWebhookData, 
  PaymentWebhookData,
  CustomerWebhookData,
  ProductWebhookData,
  InventoryWebhookData,
  LoyaltyWebhookData
} from './events';

interface WebhookContext {
  db: PostgresJsDatabase;
  n8nUrl?: string;
  n8nSecret?: string;
}

// ==================== ORDER WEBHOOKS ====================

export async function triggerOrderCreated(
  ctx: WebhookContext,
  storeId: string,
  data: OrderWebhookData
): Promise<void> {
  await dispatchWebhook(ctx.db, storeId, WebhookEvents.ORDER_CREATED, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });
}

export async function triggerOrderUpdated(
  ctx: WebhookContext,
  storeId: string,
  data: OrderWebhookData
): Promise<void> {
  await dispatchWebhook(ctx.db, storeId, WebhookEvents.ORDER_UPDATED, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });
}

export async function triggerOrderStatusChange(
  ctx: WebhookContext,
  storeId: string,
  data: OrderWebhookData
): Promise<void> {
  // Determine specific event based on status
  let event: WebhookEventType = WebhookEvents.ORDER_UPDATED;
  
  switch (data.status) {
    case 'cancelled':
      event = WebhookEvents.ORDER_CANCELLED;
      break;
    case 'completed':
    case 'delivered':
      event = WebhookEvents.ORDER_COMPLETED;
      break;
    case 'shipped':
      event = WebhookEvents.ORDER_SHIPPED;
      break;
    case 'refunded':
      event = WebhookEvents.ORDER_REFUNDED;
      break;
  }

  await dispatchWebhook(ctx.db, storeId, event, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });
}

// ==================== PAYMENT WEBHOOKS ====================

export async function triggerPaymentCreated(
  ctx: WebhookContext,
  storeId: string,
  data: PaymentWebhookData
): Promise<void> {
  await dispatchWebhook(ctx.db, storeId, WebhookEvents.PAYMENT_CREATED, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });
}

export async function triggerPaymentCompleted(
  ctx: WebhookContext,
  storeId: string,
  data: PaymentWebhookData
): Promise<void> {
  await dispatchWebhook(ctx.db, storeId, WebhookEvents.PAYMENT_COMPLETED, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });
}

export async function triggerPaymentFailed(
  ctx: WebhookContext,
  storeId: string,
  data: PaymentWebhookData
): Promise<void> {
  await dispatchWebhook(ctx.db, storeId, WebhookEvents.PAYMENT_FAILED, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });
}

// ==================== CUSTOMER WEBHOOKS ====================

export async function triggerCustomerCreated(
  ctx: WebhookContext,
  storeId: string,
  data: CustomerWebhookData
): Promise<void> {
  await dispatchWebhook(ctx.db, storeId, WebhookEvents.CUSTOMER_CREATED, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });
}

export async function triggerCustomerUpdated(
  ctx: WebhookContext,
  storeId: string,
  data: CustomerWebhookData
): Promise<void> {
  await dispatchWebhook(ctx.db, storeId, WebhookEvents.CUSTOMER_UPDATED, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });
}

// ==================== PRODUCT WEBHOOKS ====================

export async function triggerProductCreated(
  ctx: WebhookContext,
  storeId: string,
  data: ProductWebhookData
): Promise<void> {
  await dispatchWebhook(ctx.db, storeId, WebhookEvents.PRODUCT_CREATED, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });
}

export async function triggerProductUpdated(
  ctx: WebhookContext,
  storeId: string,
  data: ProductWebhookData
): Promise<void> {
  await dispatchWebhook(ctx.db, storeId, WebhookEvents.PRODUCT_UPDATED, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });
}

export async function triggerProductLowStock(
  ctx: WebhookContext,
  storeId: string,
  data: InventoryWebhookData
): Promise<void> {
  await dispatchWebhook(ctx.db, storeId, WebhookEvents.PRODUCT_LOW_STOCK, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });
}

export async function triggerProductOutOfStock(
  ctx: WebhookContext,
  storeId: string,
  data: InventoryWebhookData
): Promise<void> {
  await dispatchWebhook(ctx.db, storeId, WebhookEvents.PRODUCT_OUT_OF_STOCK, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });
}

// ==================== INVENTORY WEBHOOKS ====================

export async function triggerInventoryUpdated(
  ctx: WebhookContext,
  storeId: string,
  data: InventoryWebhookData
): Promise<void> {
  await dispatchWebhook(ctx.db, storeId, WebhookEvents.INVENTORY_UPDATED, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });

  // Check for low stock
  if (data.threshold && data.new_stock <= data.threshold && data.new_stock > 0) {
    await triggerProductLowStock(ctx, storeId, data);
  }

  // Check for out of stock
  if (data.new_stock <= 0) {
    await triggerProductOutOfStock(ctx, storeId, data);
  }
}

// ==================== LOYALTY WEBHOOKS ====================

export async function triggerPointsEarned(
  ctx: WebhookContext,
  storeId: string,
  data: LoyaltyWebhookData
): Promise<void> {
  await dispatchWebhook(ctx.db, storeId, WebhookEvents.POINTS_EARNED, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });
}

export async function triggerPointsRedeemed(
  ctx: WebhookContext,
  storeId: string,
  data: LoyaltyWebhookData
): Promise<void> {
  await dispatchWebhook(ctx.db, storeId, WebhookEvents.POINTS_REDEEMED, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });
}

export async function triggerTierUpgraded(
  ctx: WebhookContext,
  storeId: string,
  data: LoyaltyWebhookData
): Promise<void> {
  await dispatchWebhook(ctx.db, storeId, WebhookEvents.TIER_UPGRADED, data, {
    n8nUrl: ctx.n8nUrl,
    n8nSecret: ctx.n8nSecret,
  });
}

// ==================== BULK DISPATCH ====================

/**
 * Dispatch multiple webhook events at once
 */
export async function dispatchBulkWebhooks(
  ctx: WebhookContext,
  storeId: string,
  events: Array<{ event: string; data: Record<string, any> }>
): Promise<void> {
  await Promise.all(
    events.map(({ event, data }) =>
      dispatchWebhook(ctx.db, storeId, event as any, data, {
        n8nUrl: ctx.n8nUrl,
        n8nSecret: ctx.n8nSecret,
      })
    )
  );
}
