/**
 * QR Code RPC Functions
 * 
 * QR code scanning and tracking
 */

import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

interface QrScanResult {
  qr_id: string;
  code_type: string;
  redirect_url?: string;
  product_id?: string;
  store_id?: string;
  data?: Record<string, unknown>;
  scan_count: number;
}

/**
 * Record a QR code scan and return destination info
 */
export async function recordQrScan(
  db: PostgresJsDatabase,
  params: {
    code: string;
    ip?: string;
    userAgent?: string;
    sessionId?: string;
    location?: { lat: number; lng: number };
  }
): Promise<QrScanResult[]> {
  const { code, ip, userAgent, sessionId, location } = params;

  // Find QR code
  const [qrCode] = await db.execute<{
    id: string;
    store_id: string;
    code_type: string;
    redirect_url: string | null;
    product_id: string | null;
    data: Record<string, unknown> | null;
    is_active: boolean;
    expires_at: string | null;
    max_scans: number | null;
    scan_count: number;
  }>(sql`
    SELECT 
      id, store_id, code_type, redirect_url, product_id, data,
      is_active, expires_at, max_scans, scan_count
    FROM qr_codes
    WHERE code = ${code}
  `);

  if (!qrCode) {
    return [];
  }

  // Check if active and not expired
  if (!qrCode.is_active) {
    return [];
  }

  if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
    return [];
  }

  if (qrCode.max_scans && qrCode.scan_count >= qrCode.max_scans) {
    return [];
  }

  // Record the scan
  await db.execute(sql`
    INSERT INTO qr_code_scans (
      qr_code_id, ip_address, user_agent, session_id, 
      location, scanned_at
    ) VALUES (
      ${qrCode.id}, 
      ${ip || null}, 
      ${userAgent || null}, 
      ${sessionId || null},
      ${location ? sql`ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326)` : sql`NULL`},
      NOW()
    )
  `);

  // Update scan count
  await db.execute(sql`
    UPDATE qr_codes
    SET 
      scan_count = scan_count + 1,
      last_scanned_at = NOW()
    WHERE id = ${qrCode.id}
  `);

  return [{
    qr_id: qrCode.id,
    code_type: qrCode.code_type,
    redirect_url: qrCode.redirect_url || undefined,
    product_id: qrCode.product_id || undefined,
    store_id: qrCode.store_id,
    data: qrCode.data || undefined,
    scan_count: qrCode.scan_count + 1
  }];
}

/**
 * Generate QR code statistics
 */
export async function getQrCodeStats(
  db: PostgresJsDatabase,
  params: {
    qrCodeId?: string;
    storeId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<{
  total_scans: number;
  unique_sessions: number;
  scans_by_day: Array<{ date: string; count: number }>;
  scans_by_hour: Array<{ hour: number; count: number }>;
  top_locations?: Array<{ city: string; country: string; count: number }>;
}> {
  const { qrCodeId, storeId, startDate, endDate } = params;

  let whereConditions: string[] = [];
  
  if (qrCodeId) {
    whereConditions.push(`qr_code_id = '${qrCodeId}'`);
  }
  
  if (storeId) {
    whereConditions.push(`qr_code_id IN (SELECT id FROM qr_codes WHERE store_id = '${storeId}')`);
  }
  
  if (startDate) {
    whereConditions.push(`scanned_at >= '${startDate}'::timestamp`);
  }
  
  if (endDate) {
    whereConditions.push(`scanned_at <= '${endDate}'::timestamp`);
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  // Get totals
  const [totals] = await db.execute<{
    total_scans: number;
    unique_sessions: number;
  }>(sql.raw(`
    SELECT 
      COUNT(*)::integer as total_scans,
      COUNT(DISTINCT session_id)::integer as unique_sessions
    FROM qr_code_scans
    ${whereClause}
  `));

  // Scans by day
  const scansByDay = await db.execute<{
    date: string;
    count: number;
  }>(sql.raw(`
    SELECT 
      DATE(scanned_at)::text as date,
      COUNT(*)::integer as count
    FROM qr_code_scans
    ${whereClause}
    GROUP BY DATE(scanned_at)
    ORDER BY date DESC
    LIMIT 30
  `));

  // Scans by hour
  const scansByHour = await db.execute<{
    hour: number;
    count: number;
  }>(sql.raw(`
    SELECT 
      EXTRACT(HOUR FROM scanned_at)::integer as hour,
      COUNT(*)::integer as count
    FROM qr_code_scans
    ${whereClause}
    GROUP BY EXTRACT(HOUR FROM scanned_at)
    ORDER BY hour
  `));

  return {
    total_scans: totals?.total_scans || 0,
    unique_sessions: totals?.unique_sessions || 0,
    scans_by_day: scansByDay as unknown as Array<{ date: string; count: number }>,
    scans_by_hour: scansByHour as unknown as Array<{ hour: number; count: number }>
  };
}

/**
 * Create a new QR code
 */
export async function createQrCode(
  db: PostgresJsDatabase,
  params: {
    storeId: string;
    code: string;
    codeType: 'product' | 'url' | 'menu' | 'event' | 'coupon' | 'custom';
    name: string;
    redirectUrl?: string;
    productId?: string;
    data?: Record<string, unknown>;
    expiresAt?: string;
    maxScans?: number;
    templateId?: string;
  }
): Promise<{ id: string; code: string }> {
  const { 
    storeId, code, codeType, name, redirectUrl, productId, 
    data, expiresAt, maxScans, templateId 
  } = params;

  const [qrCode] = await db.execute<{ id: string; code: string }>(sql`
    INSERT INTO qr_codes (
      store_id, code, code_type, name, redirect_url, product_id,
      data, expires_at, max_scans, template_id, is_active, scan_count
    ) VALUES (
      ${storeId},
      ${code},
      ${codeType},
      ${name},
      ${redirectUrl || null},
      ${productId || null},
      ${data ? sql`${JSON.stringify(data)}::jsonb` : sql`NULL`},
      ${expiresAt ? sql`${expiresAt}::timestamp` : sql`NULL`},
      ${maxScans || null},
      ${templateId || null},
      true,
      0
    )
    RETURNING id, code
  `);

  return qrCode;
}

/**
 * Bulk create QR codes for products
 */
export async function bulkCreateProductQrCodes(
  db: PostgresJsDatabase,
  params: {
    storeId: string;
    productIds: string[];
    baseUrl: string;
    templateId?: string;
  }
): Promise<{ created: number; codes: Array<{ product_id: string; code: string }> }> {
  const { storeId, productIds, baseUrl, templateId } = params;

  const codes: Array<{ product_id: string; code: string }> = [];

  for (const productId of productIds) {
    // Generate unique code
    const code = `P-${productId.slice(0, 8)}-${Date.now().toString(36)}`;
    const redirectUrl = `${baseUrl}/products/${productId}`;

    await db.execute(sql`
      INSERT INTO qr_codes (
        store_id, code, code_type, name, redirect_url, product_id,
        template_id, is_active, scan_count
      ) VALUES (
        ${storeId},
        ${code},
        'product',
        (SELECT name FROM products WHERE id = ${productId}),
        ${redirectUrl},
        ${productId},
        ${templateId || null},
        true,
        0
      )
      ON CONFLICT (store_id, product_id) WHERE code_type = 'product' DO NOTHING
    `);

    codes.push({ product_id: productId, code });
  }

  return { created: codes.length, codes };
}
