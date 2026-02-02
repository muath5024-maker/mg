/**
 * Inventory RPC Functions
 * 
 * Stock management, low stock alerts, and inventory tracking
 */

import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

/**
 * Update product stock (add or subtract)
 */
export async function updateProductStock(
  db: PostgresJsDatabase,
  params: {
    productId: string;
    variantId?: string;
    quantity: number;
    operation: 'add' | 'subtract' | 'set';
    reason: string;
    referenceId?: string;
    referenceType?: 'order' | 'adjustment' | 'return' | 'transfer';
    userId?: string;
  }
): Promise<{
  success: boolean;
  new_stock: number;
  low_stock_alert?: boolean;
}> {
  const { productId, variantId, quantity, operation, reason, referenceId, referenceType, userId } = params;

  return await db.transaction(async (tx) => {
    // Get current stock with lock
    const table = variantId ? 'product_variants' : 'products';
    const idColumn = variantId ? 'id' : 'id';
    const idValue = variantId || productId;

    const [current] = await tx.execute<{
      stock_quantity: number;
      low_stock_threshold: number;
    }>(sql`
      SELECT stock_quantity, COALESCE(low_stock_threshold, 10) as low_stock_threshold
      FROM ${sql.raw(table)}
      WHERE ${sql.raw(idColumn)} = ${idValue}
      FOR UPDATE
    `);

    if (!current) {
      throw new Error('Product not found');
    }

    // Calculate new stock
    let newStock: number;
    if (operation === 'add') {
      newStock = current.stock_quantity + quantity;
    } else if (operation === 'subtract') {
      newStock = current.stock_quantity - quantity;
      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }
    } else {
      newStock = quantity;
    }

    // Update stock
    await tx.execute(sql`
      UPDATE ${sql.raw(table)}
      SET 
        stock_quantity = ${newStock},
        updated_at = NOW()
      WHERE ${sql.raw(idColumn)} = ${idValue}
    `);

    // Log the stock movement
    await tx.execute(sql`
      INSERT INTO stock_movements (
        product_id, variant_id, quantity_before, quantity_after, 
        quantity_change, operation, reason, reference_id, reference_type, 
        created_by, created_at
      ) VALUES (
        ${productId}, ${variantId || null}, ${current.stock_quantity}, ${newStock},
        ${operation === 'subtract' ? -quantity : quantity}, ${operation}, ${reason},
        ${referenceId || null}, ${referenceType || null},
        ${userId || null}, NOW()
      )
    `);

    // Check for low stock alert
    const lowStockAlert = newStock <= current.low_stock_threshold && newStock > 0;

    if (lowStockAlert) {
      // Create low stock alert
      await tx.execute(sql`
        INSERT INTO inventory_alerts (
          product_id, variant_id, alert_type, current_stock, threshold, status, created_at
        ) VALUES (
          ${productId}, ${variantId || null}, 'low_stock', ${newStock}, 
          ${current.low_stock_threshold}, 'active', NOW()
        )
        ON CONFLICT (product_id, variant_id, alert_type) WHERE status = 'active' DO NOTHING
      `);
    }

    // Clear low stock alert if stock is replenished
    if (newStock > current.low_stock_threshold) {
      await tx.execute(sql`
        UPDATE inventory_alerts
        SET status = 'resolved', resolved_at = NOW()
        WHERE product_id = ${productId} 
          AND (variant_id = ${variantId || null} OR variant_id IS NULL)
          AND alert_type = 'low_stock'
          AND status = 'active'
      `);
    }

    return {
      success: true,
      new_stock: newStock,
      low_stock_alert: lowStockAlert
    };
  });
}

/**
 * Reserve stock for an order
 */
export async function reserveStock(
  db: PostgresJsDatabase,
  params: {
    orderId: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
    }>;
  }
): Promise<{
  success: boolean;
  reservations: Array<{ productId: string; reserved: number }>;
  errors?: string[];
}> {
  const { orderId, items } = params;
  const reservations: Array<{ productId: string; reserved: number }> = [];
  const errors: string[] = [];

  await db.transaction(async (tx) => {
    for (const item of items) {
      const table = item.variantId ? 'product_variants' : 'products';
      const idValue = item.variantId || item.productId;

      // Check and reserve stock
      const [stock] = await tx.execute<{
        stock_quantity: number;
        reserved_quantity: number;
      }>(sql`
        SELECT 
          stock_quantity,
          COALESCE(reserved_quantity, 0) as reserved_quantity
        FROM ${sql.raw(table)}
        WHERE id = ${idValue}
        FOR UPDATE
      `);

      if (!stock) {
        errors.push(`Product ${item.productId} not found`);
        continue;
      }

      const available = stock.stock_quantity - stock.reserved_quantity;
      if (available < item.quantity) {
        errors.push(`Insufficient stock for product ${item.productId}. Available: ${available}`);
        continue;
      }

      // Update reserved quantity
      await tx.execute(sql`
        UPDATE ${sql.raw(table)}
        SET reserved_quantity = COALESCE(reserved_quantity, 0) + ${item.quantity}
        WHERE id = ${idValue}
      `);

      // Create reservation record
      await tx.execute(sql`
        INSERT INTO stock_reservations (
          order_id, product_id, variant_id, quantity, status, created_at
        ) VALUES (
          ${orderId}, ${item.productId}, ${item.variantId || null}, 
          ${item.quantity}, 'reserved', NOW()
        )
      `);

      reservations.push({ productId: item.productId, reserved: item.quantity });
    }

    if (errors.length > 0 && reservations.length === 0) {
      throw new Error(errors.join('; '));
    }
  });

  return {
    success: errors.length === 0,
    reservations,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Release reserved stock (for cancelled orders)
 */
export async function releaseReservedStock(
  db: PostgresJsDatabase,
  orderId: string
): Promise<{ released: number }> {
  return await db.transaction(async (tx) => {
    // Get reservations
    const reservations = await tx.execute<{
      id: string;
      product_id: string;
      variant_id: string | null;
      quantity: number;
    }>(sql`
      SELECT id, product_id, variant_id, quantity
      FROM stock_reservations
      WHERE order_id = ${orderId} AND status = 'reserved'
      FOR UPDATE
    `);

    let released = 0;

    for (const res of reservations as unknown as Array<typeof reservations[0]>) {
      const table = res.variant_id ? 'product_variants' : 'products';
      const idValue = res.variant_id || res.product_id;

      // Release reserved quantity
      await tx.execute(sql`
        UPDATE ${sql.raw(table)}
        SET reserved_quantity = GREATEST(COALESCE(reserved_quantity, 0) - ${res.quantity}, 0)
        WHERE id = ${idValue}
      `);

      // Update reservation status
      await tx.execute(sql`
        UPDATE stock_reservations
        SET status = 'released', released_at = NOW()
        WHERE id = ${res.id}
      `);

      released += res.quantity;
    }

    return { released };
  });
}

/**
 * Confirm reserved stock (convert to actual deduction)
 */
export async function confirmReservedStock(
  db: PostgresJsDatabase,
  orderId: string
): Promise<{ confirmed: number }> {
  return await db.transaction(async (tx) => {
    const reservations = await tx.execute<{
      id: string;
      product_id: string;
      variant_id: string | null;
      quantity: number;
    }>(sql`
      SELECT id, product_id, variant_id, quantity
      FROM stock_reservations
      WHERE order_id = ${orderId} AND status = 'reserved'
      FOR UPDATE
    `);

    let confirmed = 0;

    for (const res of reservations as unknown as Array<typeof reservations[0]>) {
      const table = res.variant_id ? 'product_variants' : 'products';
      const idValue = res.variant_id || res.product_id;

      // Deduct from stock and release reservation
      await tx.execute(sql`
        UPDATE ${sql.raw(table)}
        SET 
          stock_quantity = stock_quantity - ${res.quantity},
          reserved_quantity = GREATEST(COALESCE(reserved_quantity, 0) - ${res.quantity}, 0)
        WHERE id = ${idValue}
      `);

      // Update reservation status
      await tx.execute(sql`
        UPDATE stock_reservations
        SET status = 'confirmed', confirmed_at = NOW()
        WHERE id = ${res.id}
      `);

      // Log stock movement
      await tx.execute(sql`
        INSERT INTO stock_movements (
          product_id, variant_id, quantity_change, operation, reason,
          reference_id, reference_type, created_at
        ) VALUES (
          ${res.product_id}, ${res.variant_id || null}, ${-res.quantity}, 
          'subtract', 'Order confirmed', ${orderId}, 'order', NOW()
        )
      `);

      confirmed += res.quantity;
    }

    return { confirmed };
  });
}

/**
 * Get low stock products for a store
 */
export async function getLowStockProducts(
  db: PostgresJsDatabase,
  storeId: string
): Promise<Array<{
  product_id: string;
  variant_id?: string;
  name: string;
  sku?: string;
  current_stock: number;
  threshold: number;
  days_until_stockout?: number;
}>> {
  const results = await db.execute<{
    product_id: string;
    variant_id: string | null;
    name: string;
    sku: string | null;
    current_stock: number;
    threshold: number;
    avg_daily_sales: number;
  }>(sql`
    WITH daily_sales AS (
      SELECT 
        oi.product_id,
        oi.variant_id,
        AVG(oi.quantity) as avg_daily_qty
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.merchant_id = ${storeId}
        AND o.created_at > NOW() - INTERVAL '30 days'
        AND o.status NOT IN ('cancelled', 'refunded')
      GROUP BY oi.product_id, oi.variant_id
    )
    SELECT 
      p.id as product_id,
      pv.id as variant_id,
      COALESCE(pv.name, p.name) as name,
      COALESCE(pv.sku, p.sku) as sku,
      COALESCE(pv.stock_quantity, p.stock_quantity) as current_stock,
      COALESCE(p.low_stock_threshold, 10) as threshold,
      COALESCE(ds.avg_daily_qty, 0) as avg_daily_sales
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    LEFT JOIN daily_sales ds ON ds.product_id = p.id AND (ds.variant_id = pv.id OR (ds.variant_id IS NULL AND pv.id IS NULL))
    WHERE p.merchant_id = ${storeId}
      AND COALESCE(pv.stock_quantity, p.stock_quantity) <= COALESCE(p.low_stock_threshold, 10)
      AND COALESCE(pv.stock_quantity, p.stock_quantity) > 0
    ORDER BY current_stock ASC
  `);

  return (results as unknown as Array<typeof results[0]>).map(r => ({
    product_id: r.product_id,
    variant_id: r.variant_id || undefined,
    name: r.name,
    sku: r.sku || undefined,
    current_stock: r.current_stock,
    threshold: r.threshold,
    days_until_stockout: r.avg_daily_sales > 0 
      ? Math.floor(r.current_stock / r.avg_daily_sales)
      : undefined
  }));
}

/**
 * Bulk stock update from CSV/import
 */
export async function bulkUpdateStock(
  db: PostgresJsDatabase,
  params: {
    storeId: string;
    updates: Array<{
      sku?: string;
      productId?: string;
      variantId?: string;
      quantity: number;
      operation: 'add' | 'subtract' | 'set';
    }>;
    userId?: string;
    importId?: string;
  }
): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const { storeId, updates, userId, importId } = params;
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const update of updates) {
    try {
      let productId = update.productId;
      let variantId = update.variantId;

      // Find by SKU if no ID provided
      if (!productId && update.sku) {
        const [product] = await db.execute<{ id: string; variant_id: string | null }>(sql`
          SELECT 
            p.id,
            pv.id as variant_id
          FROM products p
          LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.sku = ${update.sku}
          WHERE (p.sku = ${update.sku} OR pv.sku = ${update.sku})
            AND p.merchant_id = ${storeId}
          LIMIT 1
        `);

        if (!product) {
          errors.push(`SKU ${update.sku} not found`);
          failed++;
          continue;
        }

        productId = product.id;
        variantId = product.variant_id || undefined;
      }

      if (!productId) {
        errors.push(`No product identifier provided`);
        failed++;
        continue;
      }

      await updateProductStock(db, {
        productId,
        variantId,
        quantity: update.quantity,
        operation: update.operation,
        reason: `Bulk import${importId ? ` #${importId}` : ''}`,
        referenceId: importId,
        referenceType: 'adjustment',
        userId
      });

      success++;
    } catch (error) {
      errors.push(`Error updating ${update.sku || update.productId}: ${(error as Error).message}`);
      failed++;
    }
  }

  return { success, failed, errors };
}
