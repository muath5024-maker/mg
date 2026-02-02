/**
 * Customer Segments RPC Functions
 * 
 * RFM Analysis (Recency, Frequency, Monetary)
 * and automatic customer segmentation
 */

import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

interface RfmScores {
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
  rfm_segment: string;
}

/**
 * Calculate RFM scores for a customer
 * 
 * RFM Scoring:
 * - Recency: Days since last purchase (lower is better)
 * - Frequency: Number of orders in period
 * - Monetary: Total amount spent
 * 
 * Each score is 1-5 (5 being best)
 */
export async function calculateCustomerRfm(
  db: PostgresJsDatabase,
  params: {
    customerId: string;
    storeId: string;
    periodDays?: number;
  }
): Promise<RfmScores> {
  const { customerId, storeId, periodDays = 365 } = params;

  // Calculate raw RFM values
  const [rfmData] = await db.execute<{
    days_since_last_order: number;
    order_count: number;
    total_spent: number;
  }>(sql`
    SELECT 
      COALESCE(
        EXTRACT(DAY FROM NOW() - MAX(created_at))::integer,
        ${periodDays}
      ) as days_since_last_order,
      COUNT(*)::integer as order_count,
      COALESCE(SUM(total_amount), 0)::numeric as total_spent
    FROM orders
    WHERE 
      customer_id = ${customerId}
      AND merchant_id = ${storeId}
      AND status NOT IN ('cancelled', 'refunded')
      AND created_at > NOW() - INTERVAL '${periodDays} days'
  `);

  if (!rfmData) {
    return {
      recency_score: 1,
      frequency_score: 1,
      monetary_score: 1,
      rfm_segment: 'lost'
    };
  }

  // Get store percentiles for scoring
  const [percentiles] = await db.execute<{
    r_20: number; r_40: number; r_60: number; r_80: number;
    f_20: number; f_40: number; f_60: number; f_80: number;
    m_20: number; m_40: number; m_60: number; m_80: number;
  }>(sql`
    WITH customer_metrics AS (
      SELECT 
        customer_id,
        EXTRACT(DAY FROM NOW() - MAX(created_at))::integer as recency,
        COUNT(*) as frequency,
        SUM(total_amount) as monetary
      FROM orders
      WHERE 
        merchant_id = ${storeId}
        AND status NOT IN ('cancelled', 'refunded')
        AND created_at > NOW() - INTERVAL '${periodDays} days'
      GROUP BY customer_id
    )
    SELECT 
      PERCENTILE_CONT(0.2) WITHIN GROUP (ORDER BY recency DESC) as r_20,
      PERCENTILE_CONT(0.4) WITHIN GROUP (ORDER BY recency DESC) as r_40,
      PERCENTILE_CONT(0.6) WITHIN GROUP (ORDER BY recency DESC) as r_60,
      PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY recency DESC) as r_80,
      PERCENTILE_CONT(0.2) WITHIN GROUP (ORDER BY frequency) as f_20,
      PERCENTILE_CONT(0.4) WITHIN GROUP (ORDER BY frequency) as f_40,
      PERCENTILE_CONT(0.6) WITHIN GROUP (ORDER BY frequency) as f_60,
      PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY frequency) as f_80,
      PERCENTILE_CONT(0.2) WITHIN GROUP (ORDER BY monetary) as m_20,
      PERCENTILE_CONT(0.4) WITHIN GROUP (ORDER BY monetary) as m_40,
      PERCENTILE_CONT(0.6) WITHIN GROUP (ORDER BY monetary) as m_60,
      PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY monetary) as m_80
    FROM customer_metrics
  `);

  // Calculate scores (1-5) based on percentiles
  const recencyScore = calculateScore(
    rfmData.days_since_last_order,
    [percentiles?.r_80 || 90, percentiles?.r_60 || 60, percentiles?.r_40 || 30, percentiles?.r_20 || 14],
    true // Lower is better for recency
  );

  const frequencyScore = calculateScore(
    rfmData.order_count,
    [percentiles?.f_20 || 1, percentiles?.f_40 || 2, percentiles?.f_60 || 4, percentiles?.f_80 || 8]
  );

  const monetaryScore = calculateScore(
    rfmData.total_spent,
    [percentiles?.m_20 || 100, percentiles?.m_40 || 300, percentiles?.m_60 || 700, percentiles?.m_80 || 1500]
  );

  // Determine segment based on RFM combination
  const segment = determineRfmSegment(recencyScore, frequencyScore, monetaryScore);

  // Update customer RFM data
  await db.execute(sql`
    INSERT INTO customer_rfm (
      customer_id, store_id, recency_score, frequency_score, monetary_score,
      rfm_segment, last_calculated_at
    ) VALUES (
      ${customerId}, ${storeId}, ${recencyScore}, ${frequencyScore}, ${monetaryScore},
      ${segment}, NOW()
    )
    ON CONFLICT (customer_id, store_id) DO UPDATE SET
      recency_score = EXCLUDED.recency_score,
      frequency_score = EXCLUDED.frequency_score,
      monetary_score = EXCLUDED.monetary_score,
      rfm_segment = EXCLUDED.rfm_segment,
      last_calculated_at = NOW()
  `);

  return {
    recency_score: recencyScore,
    frequency_score: frequencyScore,
    monetary_score: monetaryScore,
    rfm_segment: segment
  };
}

function calculateScore(value: number, thresholds: number[], inverse = false): number {
  if (inverse) {
    if (value <= thresholds[3]) return 5;
    if (value <= thresholds[2]) return 4;
    if (value <= thresholds[1]) return 3;
    if (value <= thresholds[0]) return 2;
    return 1;
  } else {
    if (value >= thresholds[3]) return 5;
    if (value >= thresholds[2]) return 4;
    if (value >= thresholds[1]) return 3;
    if (value >= thresholds[0]) return 2;
    return 1;
  }
}

function determineRfmSegment(r: number, f: number, m: number): string {
  const score = r * 100 + f * 10 + m;
  
  // Champions: High R, High F, High M
  if (r >= 4 && f >= 4 && m >= 4) return 'champions';
  
  // Loyal customers: High F
  if (f >= 4) return 'loyal_customers';
  
  // Potential loyalists: Recent, bought multiple times
  if (r >= 4 && f >= 2 && f < 4) return 'potential_loyalists';
  
  // Recent customers: New buyers
  if (r >= 4 && f === 1) return 'recent_customers';
  
  // Promising: Recent but low spend
  if (r >= 3 && m < 3) return 'promising';
  
  // At risk: Haven't bought recently
  if (r >= 2 && r < 4 && f >= 2) return 'at_risk';
  
  // Can't lose them: Used to buy often, high value
  if (r < 3 && f >= 4 && m >= 4) return 'cant_lose';
  
  // Hibernating: Low R, low F
  if (r < 3 && f < 3) return 'hibernating';
  
  // Lost: Very low scores
  if (r <= 2 && f <= 2 && m <= 2) return 'lost';
  
  return 'others';
}

/**
 * Auto-assign customers to a segment based on criteria
 */
export async function autoAssignSegmentCustomers(
  db: PostgresJsDatabase,
  segmentId: string
): Promise<number> {
  // Get segment criteria
  const [segment] = await db.execute<{
    store_id: string;
    criteria: Record<string, unknown>;
  }>(sql`
    SELECT store_id, criteria
    FROM customer_segments
    WHERE id = ${segmentId}
  `);

  if (!segment) {
    throw new Error('Segment not found');
  }

  const criteria = segment.criteria;
  
  // Build dynamic WHERE clause based on criteria
  let conditions: string[] = [`merchant_id = '${segment.store_id}'`];
  
  if (criteria.min_orders) {
    conditions.push(`(SELECT COUNT(*) FROM orders WHERE customer_id = c.id) >= ${criteria.min_orders}`);
  }
  
  if (criteria.min_total_spent) {
    conditions.push(`(SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = c.id) >= ${criteria.min_total_spent}`);
  }
  
  if (criteria.registered_after) {
    conditions.push(`c.created_at >= '${criteria.registered_after}'`);
  }
  
  if (criteria.rfm_segments && Array.isArray(criteria.rfm_segments)) {
    const segments = criteria.rfm_segments.map((s: string) => `'${s}'`).join(',');
    conditions.push(`(SELECT rfm_segment FROM customer_rfm WHERE customer_id = c.id AND store_id = '${segment.store_id}') IN (${segments})`);
  }

  const whereClause = conditions.join(' AND ');

  // Remove existing auto-assigned customers
  await db.execute(sql`
    DELETE FROM segment_customers
    WHERE segment_id = ${segmentId} AND assignment_type = 'auto'
  `);

  // Insert matching customers
  const result = await db.execute(sql`
    INSERT INTO segment_customers (segment_id, customer_id, assignment_type)
    SELECT ${segmentId}, c.id, 'auto'
    FROM customers c
    WHERE ${sql.raw(whereClause)}
    ON CONFLICT (segment_id, customer_id) DO NOTHING
  `);

  // Update segment customer count
  await db.execute(sql`
    UPDATE customer_segments
    SET 
      customer_count = (SELECT COUNT(*) FROM segment_customers WHERE segment_id = ${segmentId}),
      last_auto_assign_at = NOW()
    WHERE id = ${segmentId}
  `);

  return (result as any).rowCount || 0;
}

/**
 * Batch calculate RFM for all customers of a store
 */
export async function batchCalculateStoreRfm(
  db: PostgresJsDatabase,
  storeId: string
): Promise<{ processed: number }> {
  // Get all customers with orders
  const customers = await db.execute<{ id: string }>(sql`
    SELECT DISTINCT customer_id as id
    FROM orders
    WHERE merchant_id = ${storeId}
    AND created_at > NOW() - INTERVAL '365 days'
  `);

  let processed = 0;
  for (const customer of customers as unknown as { id: string }[]) {
    try {
      await calculateCustomerRfm(db, { customerId: customer.id, storeId });
      processed++;
    } catch (e) {
      console.error(`Error calculating RFM for customer ${customer.id}:`, e);
    }
  }

  return { processed };
}
