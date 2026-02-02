/**
 * Webhook Dispatcher
 * 
 * Handles dispatching webhooks to registered endpoints
 */

import { sql } from 'drizzle-orm';
import { createHmac } from 'crypto';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { WebhookEventType, WebhookPayload } from './events';

export interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string | null;
  events: string[];
  is_active: boolean;
  [key: string]: unknown; // Index signature for Record compatibility
}

export interface DispatchResult {
  endpoint_id: string;
  success: boolean;
  status_code?: number;
  error?: string;
  duration_ms: number;
}

/**
 * Generate webhook signature
 */
function generateSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Generate unique webhook ID
 */
function generateWebhookId(): string {
  return `whk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Dispatch webhook to all registered endpoints
 */
export async function dispatchWebhook<T>(
  db: PostgresJsDatabase,
  storeId: string,
  event: WebhookEventType,
  data: T,
  options: {
    n8nUrl?: string;
    n8nSecret?: string;
  } = {}
): Promise<DispatchResult[]> {
  const webhookId = generateWebhookId();
  const payload: WebhookPayload<T> = {
    id: webhookId,
    event,
    created_at: new Date().toISOString(),
    data,
    store_id: storeId,
  };

  const payloadString = JSON.stringify(payload);
  const results: DispatchResult[] = [];

  // Get registered webhooks for this store and event
  const endpoints = await db.execute<WebhookEndpoint>(sql`
    SELECT id, url, secret, events, is_active
    FROM webhooks
    WHERE store_id = ${storeId}
      AND is_active = true
      AND (events @> ARRAY[${event}]::text[] OR events @> ARRAY['*']::text[])
  `);

  // Add n8n endpoint if configured
  if (options.n8nUrl) {
    (endpoints as unknown as WebhookEndpoint[]).push({
      id: 'n8n',
      url: options.n8nUrl,
      secret: options.n8nSecret || null,
      events: ['*'],
      is_active: true,
    });
  }

  // Dispatch to all endpoints
  for (const endpoint of endpoints as unknown as WebhookEndpoint[]) {
    const startTime = Date.now();
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-ID': webhookId,
        'X-Webhook-Event': event,
        'X-Webhook-Timestamp': payload.created_at,
      };

      if (endpoint.secret) {
        headers['X-Webhook-Signature'] = generateSignature(payloadString, endpoint.secret);
      }

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: payloadString,
      });

      const duration = Date.now() - startTime;

      results.push({
        endpoint_id: endpoint.id,
        success: response.ok,
        status_code: response.status,
        duration_ms: duration,
      });

      // Log webhook delivery
      await db.execute(sql`
        INSERT INTO webhook_deliveries (
          webhook_id, endpoint_id, event, payload, 
          status_code, success, duration_ms, delivered_at
        ) VALUES (
          ${webhookId}, ${endpoint.id}, ${event}, ${payloadString}::jsonb,
          ${response.status}, ${response.ok}, ${duration}, NOW()
        )
      `);

      // Update last triggered
      if (endpoint.id !== 'n8n') {
        await db.execute(sql`
          UPDATE webhooks
          SET last_triggered_at = NOW()
          WHERE id = ${endpoint.id}
        `);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      results.push({
        endpoint_id: endpoint.id,
        success: false,
        error: (error as Error).message,
        duration_ms: duration,
      });

      // Log failed delivery
      await db.execute(sql`
        INSERT INTO webhook_deliveries (
          webhook_id, endpoint_id, event, payload,
          success, error, duration_ms, delivered_at
        ) VALUES (
          ${webhookId}, ${endpoint.id}, ${event}, ${payloadString}::jsonb,
          false, ${(error as Error).message}, ${duration}, NOW()
        )
      `);
    }
  }

  return results;
}

/**
 * Retry failed webhook deliveries
 */
export async function retryFailedWebhooks(
  db: PostgresJsDatabase,
  maxRetries: number = 3,
  retryDelayMinutes: number = 5
): Promise<{ retried: number; succeeded: number }> {
  // Get failed deliveries that need retry
  const failedDeliveries = await db.execute<{
    id: string;
    endpoint_id: string;
    event: string;
    payload: Record<string, any>;
    retry_count: number;
  }>(sql`
    SELECT d.id, d.endpoint_id, d.event, d.payload, COALESCE(d.retry_count, 0) as retry_count
    FROM webhook_deliveries d
    JOIN webhooks w ON w.id = d.endpoint_id
    WHERE d.success = false
      AND COALESCE(d.retry_count, 0) < ${maxRetries}
      AND d.delivered_at < NOW() - INTERVAL '${retryDelayMinutes} minutes'
      AND w.is_active = true
    ORDER BY d.delivered_at ASC
    LIMIT 100
  `);

  let retried = 0;
  let succeeded = 0;

  for (const delivery of failedDeliveries as unknown as Array<typeof failedDeliveries[0]>) {
    // Get endpoint
    const [endpoint] = await db.execute<WebhookEndpoint>(sql`
      SELECT id, url, secret, events, is_active
      FROM webhooks WHERE id = ${delivery.endpoint_id}
    `);

    if (!endpoint) continue;

    const payloadString = JSON.stringify(delivery.payload);
    const startTime = Date.now();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-ID': delivery.payload.id,
        'X-Webhook-Event': delivery.event,
        'X-Webhook-Retry': String(delivery.retry_count + 1),
      };

      if (endpoint.secret) {
        headers['X-Webhook-Signature'] = generateSignature(payloadString, endpoint.secret);
      }

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: payloadString,
      });

      const duration = Date.now() - startTime;

      // Update delivery record
      await db.execute(sql`
        UPDATE webhook_deliveries
        SET 
          success = ${response.ok},
          status_code = ${response.status},
          retry_count = retry_count + 1,
          last_retry_at = NOW(),
          duration_ms = ${duration}
        WHERE id = ${delivery.id}
      `);

      if (response.ok) succeeded++;
      retried++;
    } catch (error) {
      await db.execute(sql`
        UPDATE webhook_deliveries
        SET 
          retry_count = retry_count + 1,
          last_retry_at = NOW(),
          error = ${(error as Error).message}
        WHERE id = ${delivery.id}
      `);
      retried++;
    }
  }

  return { retried, succeeded };
}

/**
 * Clean up old webhook deliveries
 */
export async function cleanupWebhookDeliveries(
  db: PostgresJsDatabase,
  retentionDays: number = 30
): Promise<number> {
  const result = await db.execute(sql`
    DELETE FROM webhook_deliveries
    WHERE delivered_at < NOW() - INTERVAL '${retentionDays} days'
    AND success = true
  `);

  return (result as any).rowCount || 0;
}
