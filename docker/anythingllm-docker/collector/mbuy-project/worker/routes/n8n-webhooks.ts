/**
 * n8n Webhook Routes
 * 
 * Endpoints for n8n automation workflows
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Env, AuthContext } from '../types';
import { createDb } from '../db';
import { sql } from 'drizzle-orm';

// Helper to get database from env
const getDatabase = (env: Env) => createDb({ DATABASE_URL: env.DATABASE_URL });

const n8nWebhooks = new Hono<{ Bindings: Env; Variables: AuthContext }>();

// CORS for n8n
n8nWebhooks.use('/*', cors({
  origin: '*',
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Webhook-Signature', 'X-N8N-Signature'],
}));

/**
 * Verify n8n webhook signature
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

// ==================== INCOMING WEBHOOKS FROM N8N ====================

/**
 * Order status update from n8n
 * Used when order status changes in external systems
 */
n8nWebhooks.post('/order-status', async (c) => {
  const body = await c.req.json();
  const signature = c.req.header('x-webhook-signature') || '';
  
  // Verify signature if secret is configured
  if (c.env.N8N_WEBHOOK_SECRET) {
    const isValid = verifySignature(JSON.stringify(body), signature, c.env.N8N_WEBHOOK_SECRET);
    if (!isValid) {
      return c.json({ ok: false, error: 'Invalid signature' }, 401);
    }
  }

  const { orderId, status, trackingNumber, notes } = body;

  if (!orderId || !status) {
    return c.json({ ok: false, error: 'orderId and status are required' }, 400);
  }

  const db = getDatabase(c.env);

  try {
    // Update order status
    await db.execute(sql`
      UPDATE orders
      SET 
        status = ${status},
        tracking_number = COALESCE(${trackingNumber || null}, tracking_number),
        notes = COALESCE(${notes || null}, notes),
        updated_at = NOW()
      WHERE id = ${orderId}
    `);

    // Log the webhook action
    await db.execute(sql`
      INSERT INTO webhook_logs (
        source, event_type, payload, status, processed_at
      ) VALUES (
        'n8n', 'order_status_update', ${JSON.stringify(body)}::jsonb, 'success', NOW()
      )
    `);

    return c.json({ ok: true, message: 'Order status updated' });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

/**
 * Inventory sync from external systems
 */
n8nWebhooks.post('/inventory-sync', async (c) => {
  const body = await c.req.json();
  const db = getDatabase(c.env);

  const { products } = body;

  if (!Array.isArray(products)) {
    return c.json({ ok: false, error: 'products array is required' }, 400);
  }

  let updated = 0;
  let errors: string[] = [];

  for (const item of products) {
    try {
      if (item.sku) {
        await db.execute(sql`
          UPDATE products
          SET 
            stock_quantity = ${item.quantity},
            updated_at = NOW()
          WHERE sku = ${item.sku}
        `);
      } else if (item.productId) {
        await db.execute(sql`
          UPDATE products
          SET 
            stock_quantity = ${item.quantity},
            updated_at = NOW()
          WHERE id = ${item.productId}
        `);
      }
      updated++;
    } catch (error) {
      errors.push(`${item.sku || item.productId}: ${(error as Error).message}`);
    }
  }

  return c.json({ ok: true, updated, errors: errors.length > 0 ? errors : undefined });
});

/**
 * Customer notification trigger from n8n
 */
n8nWebhooks.post('/send-notification', async (c) => {
  const body = await c.req.json();
  const db = getDatabase(c.env);

  const { customerId, type, title, message, data } = body;

  if (!customerId || !type || !message) {
    return c.json({ ok: false, error: 'customerId, type, and message are required' }, 400);
  }

  try {
    // Get customer FCM token
    const [customer] = await db.execute<{ fcm_token: string | null }>(sql`
      SELECT fcm_token FROM customers WHERE id = ${customerId}
    `);

    if (customer?.fcm_token) {
      // Send FCM notification
      const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${c.env.FCM_SERVER_KEY}`,
        },
        body: JSON.stringify({
          to: customer.fcm_token,
          notification: { title, body: message },
          data: data || {},
        }),
      });

      if (!fcmResponse.ok) {
        throw new Error('FCM send failed');
      }
    }

    // Store notification in database
    await db.execute(sql`
      INSERT INTO notifications (
        customer_id, type, title, message, data, created_at
      ) VALUES (
        ${customerId}, ${type}, ${title || type}, ${message}, 
        ${data ? sql`${JSON.stringify(data)}::jsonb` : sql`NULL`}, NOW()
      )
    `);

    return c.json({ ok: true, message: 'Notification sent' });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

/**
 * Shipping rate calculation callback
 */
n8nWebhooks.post('/shipping-rates', async (c) => {
  const body = await c.req.json();
  const { storeId, destination, weight, items } = body;

  // This would typically call external shipping APIs via n8n
  // For now, return calculated rates

  const rates = [
    {
      carrier: 'aramex',
      service: 'express',
      price: 25,
      currency: 'SAR',
      estimatedDays: 2,
    },
    {
      carrier: 'smsa',
      service: 'standard',
      price: 18,
      currency: 'SAR',
      estimatedDays: 4,
    },
  ];

  return c.json({ ok: true, rates });
});

/**
 * Payment webhook from payment gateways (via n8n)
 */
n8nWebhooks.post('/payment-callback', async (c) => {
  const body = await c.req.json();
  const db = getDatabase(c.env);

  const { paymentId, status, transactionId, gateway, metadata } = body;

  if (!paymentId || !status) {
    return c.json({ ok: false, error: 'paymentId and status are required' }, 400);
  }

  try {
    // Update payment status
    await db.execute(sql`
      UPDATE payments
      SET 
        status = ${status},
        gateway_transaction_id = COALESCE(${transactionId || null}, gateway_transaction_id),
        metadata = COALESCE(${metadata ? sql`${JSON.stringify(metadata)}::jsonb` : sql`NULL`}, metadata),
        updated_at = NOW(),
        ${status === 'completed' ? sql`paid_at = NOW(),` : sql``}
      WHERE id = ${paymentId}
    `);

    // If payment completed, update order
    if (status === 'completed') {
      await db.execute(sql`
        UPDATE orders o
        SET 
          payment_status = 'paid',
          status = CASE WHEN status = 'pending_payment' THEN 'processing' ELSE status END,
          updated_at = NOW()
        FROM payments p
        WHERE p.id = ${paymentId} AND o.id = p.order_id
      `);
    }

    return c.json({ ok: true, message: 'Payment updated' });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

/**
 * Bulk SMS/WhatsApp sending callback
 */
n8nWebhooks.post('/message-status', async (c) => {
  const body = await c.req.json();
  const db = getDatabase(c.env);

  const { messageId, status, deliveredAt, errorCode, errorMessage } = body;

  if (!messageId || !status) {
    return c.json({ ok: false, error: 'messageId and status are required' }, 400);
  }

  try {
    await db.execute(sql`
      UPDATE campaign_messages
      SET 
        status = ${status},
        delivered_at = ${deliveredAt ? sql`${deliveredAt}::timestamp` : sql`delivered_at`},
        error = ${errorMessage || null},
        error_code = ${errorCode || null},
        updated_at = NOW()
      WHERE id = ${messageId}
    `);

    return c.json({ ok: true });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

/**
 * Product import from external sources
 */
n8nWebhooks.post('/import-products', async (c) => {
  const body = await c.req.json();
  const db = getDatabase(c.env);

  const { storeId, products, source } = body;

  if (!storeId || !Array.isArray(products)) {
    return c.json({ ok: false, error: 'storeId and products array are required' }, 400);
  }

  let imported = 0;
  let updated = 0;
  let errors: string[] = [];

  for (const product of products) {
    try {
      // Check if product exists by SKU
      const [existing] = await db.execute<{ id: string }>(sql`
        SELECT id FROM products WHERE merchant_id = ${storeId} AND sku = ${product.sku}
      `);

      if (existing) {
        // Update existing product
        await db.execute(sql`
          UPDATE products
          SET 
            name = ${product.name},
            description = ${product.description || null},
            price = ${product.price},
            compare_at_price = ${product.compareAtPrice || null},
            stock_quantity = ${product.stock || 0},
            updated_at = NOW()
          WHERE id = ${existing.id}
        `);
        updated++;
      } else {
        // Create new product
        await db.execute(sql`
          INSERT INTO products (
            merchant_id, sku, name, description, price, compare_at_price,
            stock_quantity, status, created_at
          ) VALUES (
            ${storeId}, ${product.sku}, ${product.name}, ${product.description || null},
            ${product.price}, ${product.compareAtPrice || null},
            ${product.stock || 0}, 'draft', NOW()
          )
        `);
        imported++;
      }
    } catch (error) {
      errors.push(`${product.sku}: ${(error as Error).message}`);
    }
  }

  // Log import
  await db.execute(sql`
    INSERT INTO import_logs (
      store_id, source, type, imported_count, updated_count, error_count, created_at
    ) VALUES (
      ${storeId}, ${source || 'n8n'}, 'products', ${imported}, ${updated}, ${errors.length}, NOW()
    )
  `);

  return c.json({ ok: true, imported, updated, errors: errors.length > 0 ? errors : undefined });
});

// ==================== WEBHOOK REGISTRATION ====================

/**
 * Register a new webhook endpoint
 */
n8nWebhooks.post('/register', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const body = await c.req.json();
  const db = getDatabase(c.env);

  const { url, events, secret } = body;

  if (!url || !Array.isArray(events)) {
    return c.json({ ok: false, error: 'url and events array are required' }, 400);
  }

  try {
    const [webhook] = await db.execute<{ id: string }>(sql`
      INSERT INTO webhooks (
        store_id, url, events, secret, is_active, created_at
      ) VALUES (
        ${merchantId}, ${url}, ${events}::text[], ${secret || null}, true, NOW()
      )
      RETURNING id
    `);

    return c.json({ ok: true, webhookId: webhook.id });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

/**
 * List registered webhooks
 */
n8nWebhooks.get('/list', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const db = getDatabase(c.env);

  const webhooks = await db.execute(sql`
    SELECT id, url, events, is_active, created_at, last_triggered_at
    FROM webhooks
    WHERE store_id = ${merchantId}
    ORDER BY created_at DESC
  `);

  return c.json({ ok: true, data: webhooks });
});

/**
 * Delete a webhook
 */
n8nWebhooks.delete('/:id', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const webhookId = c.req.param('id');
  const db = getDatabase(c.env);

  await db.execute(sql`
    DELETE FROM webhooks
    WHERE id = ${webhookId} AND store_id = ${merchantId}
  `);

  return c.json({ ok: true });
});

/**
 * Test a webhook
 */
n8nWebhooks.post('/:id/test', async (c) => {
  const merchantId = c.get('merchantId') as string;
  const webhookId = c.req.param('id');
  const db = getDatabase(c.env);

  const [webhook] = await db.execute<{ url: string; secret: string | null }>(sql`
    SELECT url, secret FROM webhooks
    WHERE id = ${webhookId} AND store_id = ${merchantId}
  `);

  if (!webhook) {
    return c.json({ ok: false, error: 'Webhook not found' }, 404);
  }

  const testPayload = {
    event: 'test',
    data: { message: 'Test webhook from mBuy' },
    timestamp: new Date().toISOString(),
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (webhook.secret) {
      const signature = createHmac('sha256', webhook.secret)
        .update(JSON.stringify(testPayload))
        .digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
    });

    return c.json({
      ok: true,
      status: response.status,
      success: response.ok,
    });
  } catch (error) {
    return c.json({ ok: false, error: (error as Error).message }, 500);
  }
});

export default n8nWebhooks;
