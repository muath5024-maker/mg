/**
 * Campaign RPC Functions
 * 
 * Marketing campaign message queuing and sending
 */

import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

/**
 * Queue messages for a campaign
 * 
 * This function:
 * 1. Gets target customers based on campaign settings
 * 2. Creates message records for each customer
 * 3. Returns the count of queued messages
 */
export async function queueCampaignMessages(
  db: PostgresJsDatabase,
  campaignId: string
): Promise<number> {
  return await db.transaction(async (tx) => {
    // Get campaign details
    const [campaign] = await tx.execute<{
      id: string;
      store_id: string;
      message_template: string;
      channel: string;
      target_type: string;
      target_customers: string[];
      segment_id: string | null;
    }>(sql`
      SELECT 
        id, store_id, message_template, channel, 
        target_type, target_customers, segment_id
      FROM message_campaigns
      WHERE id = ${campaignId} AND status = 'draft'
      FOR UPDATE
    `);

    if (!campaign) {
      throw new Error('Campaign not found or not in draft status');
    }

    let customerIds: string[] = [];

    // Get target customers based on target_type
    if (campaign.target_type === 'all') {
      // All customers of the store
      const customers = await tx.execute<{ id: string }>(sql`
        SELECT id FROM customers
        WHERE merchant_id = ${campaign.store_id} AND status = 'active'
      `);
      customerIds = (customers as unknown as { id: string }[]).map(c => c.id);
    } else if (campaign.target_type === 'segment' && campaign.segment_id) {
      // Customers in segment
      const customers = await tx.execute<{ customer_id: string }>(sql`
        SELECT customer_id FROM segment_customers
        WHERE segment_id = ${campaign.segment_id}
      `);
      customerIds = (customers as unknown as { customer_id: string }[]).map(c => c.customer_id);
    } else if (campaign.target_type === 'selected' && campaign.target_customers) {
      customerIds = campaign.target_customers;
    }

    if (customerIds.length === 0) {
      throw new Error('No target customers found');
    }

    // Get customer contact info based on channel
    let contactField = campaign.channel === 'email' ? 'email' : 'phone';
    
    const contacts = await tx.execute<{
      id: string;
      full_name: string;
      contact: string;
    }>(sql`
      SELECT id, full_name, ${sql.raw(contactField)} as contact
      FROM customers
      WHERE id = ANY(${customerIds}::uuid[])
        AND ${sql.raw(contactField)} IS NOT NULL
        AND ${sql.raw(contactField)} != ''
    `);

    // Queue messages
    let queuedCount = 0;
    for (const customer of contacts as unknown as Array<typeof contacts[0]>) {
      // Personalize message
      const personalizedMessage = campaign.message_template
        .replace(/\{\{name\}\}/g, customer.full_name || '')
        .replace(/\{\{customer_name\}\}/g, customer.full_name || '');

      await tx.execute(sql`
        INSERT INTO campaign_messages (
          campaign_id, customer_id, contact, message, channel, status, queued_at
        ) VALUES (
          ${campaign.id}, ${customer.id}, ${customer.contact}, 
          ${personalizedMessage}, ${campaign.channel}, 'queued', NOW()
        )
        ON CONFLICT (campaign_id, customer_id) DO NOTHING
      `);
      queuedCount++;
    }

    // Update campaign status
    await tx.execute(sql`
      UPDATE message_campaigns
      SET 
        status = 'queued',
        queued_count = ${queuedCount},
        queued_at = NOW()
      WHERE id = ${campaignId}
    `);

    return queuedCount;
  });
}

/**
 * Process queued messages (to be called by a cron job)
 */
export async function processCampaignMessages(
  db: PostgresJsDatabase,
  batchSize: number = 100
): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  let processed = 0;
  let sent = 0;
  let failed = 0;

  // Get queued messages
  const messages = await db.execute<{
    id: string;
    campaign_id: string;
    contact: string;
    message: string;
    channel: string;
  }>(sql`
    SELECT id, campaign_id, contact, message, channel
    FROM campaign_messages
    WHERE status = 'queued'
    ORDER BY queued_at
    LIMIT ${batchSize}
    FOR UPDATE SKIP LOCKED
  `);

  for (const msg of messages as unknown as Array<typeof messages[0]>) {
    try {
      // Here you would integrate with actual SMS/Email/WhatsApp provider
      // For now, we just mark as sent
      
      // Simulated sending logic
      const sendSuccess = true; // Replace with actual send call
      
      if (sendSuccess) {
        await db.execute(sql`
          UPDATE campaign_messages
          SET status = 'sent', sent_at = NOW()
          WHERE id = ${msg.id}
        `);
        sent++;
      } else {
        throw new Error('Send failed');
      }
    } catch (error) {
      await db.execute(sql`
        UPDATE campaign_messages
        SET 
          status = 'failed',
          error = ${(error as Error).message || 'Unknown error'},
          failed_at = NOW()
        WHERE id = ${msg.id}
      `);
      failed++;
    }
    processed++;
  }

  // Update campaign stats
  if (processed > 0) {
    await db.execute(sql`
      UPDATE message_campaigns mc
      SET 
        sent_count = (SELECT COUNT(*) FROM campaign_messages WHERE campaign_id = mc.id AND status = 'sent'),
        failed_count = (SELECT COUNT(*) FROM campaign_messages WHERE campaign_id = mc.id AND status = 'failed'),
        status = CASE 
          WHEN (SELECT COUNT(*) FROM campaign_messages WHERE campaign_id = mc.id AND status = 'queued') = 0 
          THEN 'completed' 
          ELSE mc.status 
        END,
        completed_at = CASE 
          WHEN (SELECT COUNT(*) FROM campaign_messages WHERE campaign_id = mc.id AND status = 'queued') = 0 
          THEN NOW() 
          ELSE mc.completed_at 
        END
      WHERE id IN (
        SELECT DISTINCT campaign_id 
        FROM campaign_messages 
        WHERE status IN ('sent', 'failed')
        AND sent_at > NOW() - INTERVAL '5 minutes' OR failed_at > NOW() - INTERVAL '5 minutes'
      )
    `);
  }

  return { processed, sent, failed };
}

/**
 * Get campaign statistics
 */
export async function getCampaignStats(
  db: PostgresJsDatabase,
  campaignId: string
): Promise<{
  total: number;
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
}> {
  const [stats] = await db.execute<{
    total: number;
    queued: number;
    sent: number;
    delivered: number;
    failed: number;
    opened: number;
    clicked: number;
  }>(sql`
    SELECT 
      COUNT(*)::integer as total,
      COUNT(*) FILTER (WHERE status = 'queued')::integer as queued,
      COUNT(*) FILTER (WHERE status = 'sent')::integer as sent,
      COUNT(*) FILTER (WHERE status = 'delivered')::integer as delivered,
      COUNT(*) FILTER (WHERE status = 'failed')::integer as failed,
      COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::integer as opened,
      COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)::integer as clicked
    FROM campaign_messages
    WHERE campaign_id = ${campaignId}
  `);

  const deliveryRate = stats.sent > 0 
    ? Math.round((stats.delivered / stats.sent) * 100) 
    : 0;
  
  const openRate = stats.delivered > 0 
    ? Math.round((stats.opened / stats.delivered) * 100) 
    : 0;
  
  const clickRate = stats.opened > 0 
    ? Math.round((stats.clicked / stats.opened) * 100) 
    : 0;

  return {
    ...stats,
    delivery_rate: deliveryRate,
    open_rate: openRate,
    click_rate: clickRate
  };
}

/**
 * Track message events (open, click, etc.)
 */
export async function trackMessageEvent(
  db: PostgresJsDatabase,
  params: {
    messageId: string;
    event: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
    metadata?: Record<string, unknown>;
  }
): Promise<boolean> {
  const { messageId, event, metadata } = params;

  const eventColumn = event === 'delivered' ? 'delivered_at'
    : event === 'opened' ? 'opened_at'
    : event === 'clicked' ? 'clicked_at'
    : event === 'bounced' ? 'bounced_at'
    : 'unsubscribed_at';

  const statusUpdate = event === 'delivered' ? 'delivered'
    : event === 'bounced' ? 'bounced'
    : null;

  await db.execute(sql`
    UPDATE campaign_messages
    SET 
      ${sql.raw(eventColumn)} = COALESCE(${sql.raw(eventColumn)}, NOW()),
      ${statusUpdate ? sql`status = ${statusUpdate},` : sql``}
      metadata = COALESCE(metadata, '{}'::jsonb) || ${metadata ? sql`${JSON.stringify(metadata)}::jsonb` : sql`'{}'::jsonb`}
    WHERE id = ${messageId}
  `);

  // Log event
  await db.execute(sql`
    INSERT INTO campaign_message_events (message_id, event, event_data, occurred_at)
    VALUES (${messageId}, ${event}, ${metadata ? sql`${JSON.stringify(metadata)}::jsonb` : sql`NULL`}, NOW())
  `);

  return true;
}

/**
 * Schedule a campaign for future sending
 */
export async function scheduleCampaign(
  db: PostgresJsDatabase,
  params: {
    campaignId: string;
    scheduledAt: string;
  }
): Promise<{ success: boolean; scheduled_at: string }> {
  const { campaignId, scheduledAt } = params;

  await db.execute(sql`
    UPDATE message_campaigns
    SET 
      status = 'scheduled',
      scheduled_at = ${scheduledAt}::timestamp
    WHERE id = ${campaignId} AND status = 'draft'
  `);

  return {
    success: true,
    scheduled_at: scheduledAt
  };
}
