/**
 * COD (Cash on Delivery) RPC Functions
 */

import { sql, eq, and, gte, lte } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

interface CodEligibilityParams {
  storeId: string;
  customerId: string;
  orderAmount: number;
  zone?: string;
}

interface CodEligibilityResult {
  is_eligible: boolean;
  reason?: string;
  max_amount?: number;
  min_amount?: number;
  required_verification?: boolean;
}

/**
 * Check if a customer is eligible for Cash on Delivery
 * 
 * Eligibility criteria:
 * 1. Store has COD enabled
 * 2. Order amount is within COD limits
 * 3. Customer has good history (no excessive failed COD orders)
 * 4. Zone is eligible for COD
 * 5. Customer verification if required
 */
export async function checkCodEligibility(
  db: PostgresJsDatabase,
  params: CodEligibilityParams
): Promise<CodEligibilityResult> {
  const { storeId, customerId, orderAmount, zone } = params;

  // 1. Get store COD settings
  const [settings] = await db.execute<{
    is_enabled: boolean;
    min_order_amount: number;
    max_order_amount: number;
    requires_verification: boolean;
    excluded_zones: string[];
    max_failed_orders: number;
  }>(sql`
    SELECT 
      is_enabled,
      min_order_amount,
      max_order_amount,
      requires_verification,
      excluded_zones,
      COALESCE(max_failed_orders, 3) as max_failed_orders
    FROM cod_settings
    WHERE store_id = ${storeId}
    LIMIT 1
  `);

  if (!settings || !settings.is_enabled) {
    return {
      is_eligible: false,
      reason: 'COD is not enabled for this store'
    };
  }

  // 2. Check order amount limits
  if (settings.min_order_amount && orderAmount < settings.min_order_amount) {
    return {
      is_eligible: false,
      reason: `Minimum order amount for COD is ${settings.min_order_amount}`,
      min_amount: settings.min_order_amount
    };
  }

  if (settings.max_order_amount && orderAmount > settings.max_order_amount) {
    return {
      is_eligible: false,
      reason: `Maximum order amount for COD is ${settings.max_order_amount}`,
      max_amount: settings.max_order_amount
    };
  }

  // 3. Check zone exclusions
  if (zone && settings.excluded_zones?.includes(zone)) {
    return {
      is_eligible: false,
      reason: 'COD is not available in your area'
    };
  }

  // 4. Check customer COD history
  const [history] = await db.execute<{
    total_orders: number;
    failed_orders: number;
    unpaid_orders: number;
  }>(sql`
    SELECT 
      COUNT(*) as total_orders,
      COUNT(*) FILTER (WHERE status = 'failed') as failed_orders,
      COUNT(*) FILTER (WHERE status IN ('pending', 'unpaid')) as unpaid_orders
    FROM cod_orders
    WHERE 
      store_id = ${storeId} 
      AND customer_id = ${customerId}
      AND created_at > NOW() - INTERVAL '90 days'
  `);

  if (history && history.failed_orders >= settings.max_failed_orders) {
    return {
      is_eligible: false,
      reason: 'COD is temporarily unavailable due to order history'
    };
  }

  // 5. Check if customer has verification (if required)
  if (settings.requires_verification) {
    const [customer] = await db.execute<{ is_verified: boolean }>(sql`
      SELECT is_verified
      FROM customers
      WHERE id = ${customerId}
    `);

    if (!customer?.is_verified) {
      return {
        is_eligible: false,
        reason: 'Phone verification required for COD',
        required_verification: true
      };
    }
  }

  return {
    is_eligible: true,
    min_amount: settings.min_order_amount,
    max_amount: settings.max_order_amount
  };
}

/**
 * Record a COD order
 */
export async function recordCodOrder(
  db: PostgresJsDatabase,
  params: {
    storeId: string;
    orderId: string;
    customerId: string;
    amount: number;
    deliveryZone?: string;
  }
): Promise<{ id: string }> {
  const [result] = await db.execute<{ id: string }>(sql`
    INSERT INTO cod_orders (
      store_id, order_id, customer_id, amount, delivery_zone, status
    ) VALUES (
      ${params.storeId},
      ${params.orderId},
      ${params.customerId},
      ${params.amount},
      ${params.deliveryZone || null},
      'pending'
    )
    RETURNING id
  `);

  return result;
}

/**
 * Update COD order status
 */
export async function updateCodOrderStatus(
  db: PostgresJsDatabase,
  orderId: string,
  status: 'pending' | 'collected' | 'failed' | 'cancelled'
): Promise<boolean> {
  const result = await db.execute(sql`
    UPDATE cod_orders
    SET 
      status = ${status},
      updated_at = NOW(),
      ${status === 'collected' ? sql`collected_at = NOW(),` : sql``}
      ${status === 'failed' ? sql`failed_at = NOW(),` : sql``}
    WHERE order_id = ${orderId}
  `);

  return (result as any).rowCount > 0;
}

/**
 * Generate daily COD report for a store
 */
export async function generateCodDailyReport(
  db: PostgresJsDatabase,
  storeId: string,
  date: string
): Promise<{
  total_orders: number;
  collected_amount: number;
  pending_amount: number;
  failed_count: number;
}> {
  const [report] = await db.execute<{
    total_orders: number;
    collected_amount: number;
    pending_amount: number;
    failed_count: number;
  }>(sql`
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(CASE WHEN status = 'collected' THEN amount ELSE 0 END), 0) as collected_amount,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
      COUNT(*) FILTER (WHERE status = 'failed') as failed_count
    FROM cod_orders
    WHERE 
      store_id = ${storeId}
      AND DATE(created_at) = ${date}::date
  `);

  // Upsert daily report
  await db.execute(sql`
    INSERT INTO cod_daily_reports (
      store_id, report_date, total_orders, collected_amount, pending_amount, failed_count
    ) VALUES (
      ${storeId}, ${date}::date, ${report.total_orders}, ${report.collected_amount}, 
      ${report.pending_amount}, ${report.failed_count}
    )
    ON CONFLICT (store_id, report_date) DO UPDATE SET
      total_orders = EXCLUDED.total_orders,
      collected_amount = EXCLUDED.collected_amount,
      pending_amount = EXCLUDED.pending_amount,
      failed_count = EXCLUDED.failed_count,
      updated_at = NOW()
  `);

  return report;
}
