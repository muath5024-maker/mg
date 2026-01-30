/**
 * Webhook Service
 * Handles webhook dispatching for n8n and other integrations
 */

import { eq, desc, sql } from 'drizzle-orm';
import type { Database } from '../db';
import type { Env } from '../types';
import { auditLogs } from '../db/schema/settings';

export interface WebhookEvent {
  event: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
}

export class WebhookService {
  private webhookConfigs: WebhookConfig[] = [];

  constructor(
    private db: Database,
    private env: Env
  ) {
    // Initialize webhook configs from environment
    this.initializeConfigs();
  }

  private initializeConfigs(): void {
    // n8n webhook URL
    if (this.env.N8N_WEBHOOK_URL) {
      this.webhookConfigs.push({
        url: this.env.N8N_WEBHOOK_URL,
        secret: this.env.N8N_WEBHOOK_SECRET,
        events: ['*'], // All events
        isActive: true,
      });
    }

    // Additional webhook URLs can be added here
    // or loaded from database/KV storage
  }

  /**
   * Dispatch webhook event
   */
  async dispatch(event: string, data: Record<string, any>): Promise<void> {
    const webhookEvent: WebhookEvent = {
      event,
      data,
      timestamp: new Date(),
    };

    // Log the event
    await this.logEvent(webhookEvent);

    // Send to all matching webhook endpoints
    const promises = this.webhookConfigs
      .filter(config => config.isActive && this.matchesEvent(config.events, event))
      .map(config => this.sendWebhook(config, webhookEvent));

    // Execute webhooks in parallel (fire and forget for non-critical)
    await Promise.allSettled(promises);
  }

  /**
   * Dispatch critical webhook (waits for response)
   */
  async dispatchCritical(event: string, data: Record<string, any>): Promise<boolean> {
    const webhookEvent: WebhookEvent = {
      event,
      data,
      timestamp: new Date(),
    };

    await this.logEvent(webhookEvent);

    const results = await Promise.all(
      this.webhookConfigs
        .filter(config => config.isActive && this.matchesEvent(config.events, event))
        .map(config => this.sendWebhook(config, webhookEvent))
    );

    return results.every(result => result);
  }

  /**
   * Send webhook to endpoint
   */
  private async sendWebhook(config: WebhookConfig, event: WebhookEvent): Promise<boolean> {
    try {
      const payload = JSON.stringify(event);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event.event,
        'X-Webhook-Timestamp': event.timestamp.toISOString(),
      };

      // Add signature if secret is configured
      if (config.secret) {
        const signature = await this.generateSignature(payload, config.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await fetch(config.url, {
        method: 'POST',
        headers,
        body: payload,
      });

      if (!response.ok) {
        console.error(`Webhook failed: ${config.url} - ${response.status}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Webhook error: ${config.url}`, error);
      return false;
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private async generateSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const signatureArray = new Uint8Array(signature);
    
    return Array.from(signatureArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Check if config matches event
   */
  private matchesEvent(configEvents: string[], event: string): boolean {
    return configEvents.includes('*') || configEvents.includes(event);
  }

  /**
   * Log webhook event to audit log
   */
  private async logEvent(event: WebhookEvent): Promise<void> {
    try {
      await this.db.insert(auditLogs).values({
        action: `webhook:${event.event}`,
        actorType: 'system',
        resourceType: 'webhook',
        resourceId: null,
        description: `Webhook event: ${event.event}`,
        metadata: { timestamp: event.timestamp.toISOString(), data: event.data },
      });
    } catch (error) {
      console.error('Failed to log webhook event:', error);
    }
  }

  // ============ Event Helpers ============

  /**
   * Dispatch order created event
   */
  async onOrderCreated(orderId: string, orderData: Record<string, any>): Promise<void> {
    await this.dispatch('order.created', {
      orderId,
      ...orderData,
    });
  }

  /**
   * Dispatch order status changed event
   */
  async onOrderStatusChanged(
    orderId: string,
    oldStatus: string,
    newStatus: string,
    orderData: Record<string, any>
  ): Promise<void> {
    await this.dispatch('order.status_changed', {
      orderId,
      oldStatus,
      newStatus,
      ...orderData,
    });
  }

  /**
   * Dispatch payment received event
   */
  async onPaymentReceived(
    orderId: string,
    paymentId: string,
    amount: number,
    paymentData: Record<string, any>
  ): Promise<void> {
    await this.dispatch('payment.received', {
      orderId,
      paymentId,
      amount,
      ...paymentData,
    });
  }

  /**
   * Dispatch customer registered event
   */
  async onCustomerRegistered(customerId: string, customerData: Record<string, any>): Promise<void> {
    await this.dispatch('customer.registered', {
      customerId,
      ...customerData,
    });
  }

  /**
   * Dispatch product created event
   */
  async onProductCreated(productId: string, merchantId: string, productData: Record<string, any>): Promise<void> {
    await this.dispatch('product.created', {
      productId,
      merchantId,
      ...productData,
    });
  }

  /**
   * Dispatch product stock low event
   */
  async onProductStockLow(productId: string, currentStock: number, threshold: number): Promise<void> {
    await this.dispatch('product.stock_low', {
      productId,
      currentStock,
      threshold,
    });
  }

  /**
   * Dispatch merchant approved event
   */
  async onMerchantApproved(merchantId: string, merchantData: Record<string, any>): Promise<void> {
    await this.dispatch('merchant.approved', {
      merchantId,
      ...merchantData,
    });
  }

  /**
   * Dispatch refund requested event
   */
  async onRefundRequested(
    orderId: string,
    refundAmount: number,
    reason: string
  ): Promise<void> {
    await this.dispatch('refund.requested', {
      orderId,
      refundAmount,
      reason,
    });
  }

  /**
   * Dispatch review submitted event
   */
  async onReviewSubmitted(
    productId: string,
    customerId: string,
    rating: number,
    reviewData: Record<string, any>
  ): Promise<void> {
    await this.dispatch('review.submitted', {
      productId,
      customerId,
      rating,
      ...reviewData,
    });
  }

  /**
   * Dispatch daily summary event (for scheduled tasks)
   */
  async onDailySummary(summaryData: Record<string, any>): Promise<void> {
    await this.dispatch('summary.daily', summaryData);
  }
}
