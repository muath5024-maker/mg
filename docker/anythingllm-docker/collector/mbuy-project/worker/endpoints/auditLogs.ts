/**
 * Audit Logs System
 * Tracks all sensitive operations automatically
 */

import { Context, Next } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type AuditContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

// Actions that should be audited
const AUDITED_ACTIONS: Record<string, { action: string; entityType: string; severity: string }> = {
  'POST /secure/merchant/products': { action: 'product_create', entityType: 'product', severity: 'info' },
  'PUT /secure/products/:id': { action: 'product_update', entityType: 'product', severity: 'info' },
  'DELETE /secure/products/:id': { action: 'product_delete', entityType: 'product', severity: 'warning' },
  'POST /secure/promotions': { action: 'promotion_create', entityType: 'promotion', severity: 'info' },
  'POST /secure/promotions/:id/cancel': { action: 'promotion_cancel', entityType: 'promotion', severity: 'warning' },
  'PUT /secure/merchant/store': { action: 'store_update', entityType: 'store', severity: 'info' },
  'PUT /secure/stores/:id': { action: 'store_update', entityType: 'store', severity: 'info' },
  'PUT /secure/stores/:id/slug': { action: 'store_update', entityType: 'store', severity: 'info' },
  'POST /secure/inventory/:productId/adjust': { action: 'inventory_adjust', entityType: 'inventory', severity: 'info' },
  'PUT /secure/shortcuts': { action: 'shortcut_reorder', entityType: 'shortcut', severity: 'info' },
};

/**
 * Audit Middleware - Automatically logs sensitive operations
 */
export async function auditMiddleware(c: AuditContext, next: Next) {
  const method = c.req.method;
  const path = c.req.path;
  const startTime = Date.now();
  
  // Find matching audit config
  let auditConfig: typeof AUDITED_ACTIONS[string] | null = null;
  let matchedPath = '';
  
  for (const [pattern, config] of Object.entries(AUDITED_ACTIONS)) {
    const [patternMethod, patternPath] = pattern.split(' ');
    
    if (method !== patternMethod) continue;
    
    // Convert pattern to regex
    const regexPattern = patternPath
      .replace(/:[^/]+/g, '[^/]+')
      .replace(/\//g, '\\/');
    
    if (new RegExp(`^${regexPattern}$`).test(path)) {
      auditConfig = config;
      matchedPath = patternPath;
      break;
    }
  }
  
  // If not an audited action, continue
  if (!auditConfig) {
    await next();
    return;
  }
  
  // Capture request body for diff
  let requestBody: any = null;
  try {
    requestBody = await c.req.json();
    // Reset body for downstream handlers
    // Note: In Hono, the body can only be read once, so we need to handle this carefully
  } catch {
    // No JSON body
  }
  
  // Continue with request
  await next();
  
  // After response, create audit log
  try {
    const profileId = c.get('profileId');
    const response = c.res;
    const responseTime = Date.now() - startTime;
    
    // Extract entity ID from path or response
    let entityId: string | null = null;
    const pathParts = path.split('/');
    
    // Try to get ID from path
    if (matchedPath.includes(':id')) {
      const idIndex = matchedPath.split('/').indexOf(':id');
      if (idIndex >= 0 && pathParts[idIndex]) {
        entityId = pathParts[idIndex];
      }
    } else if (matchedPath.includes(':productId')) {
      const idIndex = matchedPath.split('/').indexOf(':productId');
      if (idIndex >= 0 && pathParts[idIndex]) {
        entityId = pathParts[idIndex];
      }
    }
    
    // Get store ID
    let merchantId: string | null = null;
    try {
      const merchantResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id`,
        {
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      const merchants: any[] = await merchantResponse.json();
      if (merchants && merchants.length > 0) {
        merchantId = merchants[0].id;
      }
    } catch {
      // Ignore errors getting store
    }
    
    // Create audit log
    await createAuditLog(c.env, {
      merchant_id: merchantId,
      actor_user_id: profileId,
      action: auditConfig.action,
      entity_type: auditConfig.entityType,
      entity_id: entityId,
      severity: response.status >= 400 ? 'warning' : auditConfig.severity,
      meta: {
        method,
        path,
        response_status: response.status,
        response_time_ms: responseTime,
        request_body: requestBody ? sanitizeForAudit(requestBody) : null,
        ip: c.req.header('cf-connecting-ip'),
        user_agent: c.req.header('user-agent'),
      },
    });
    
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't fail the request due to audit logging
  }
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(env: Env, data: {
  merchant_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  severity?: string;
  meta?: any;
}) {
  try {
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/audit_logs`,
      {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_id: data.merchant_id,
          actor_user_id: data.actor_user_id,
          action: data.action,
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          severity: data.severity || 'info',
          meta: data.meta || {},
        }),
      }
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Sanitize request body for audit (remove sensitive data)
 */
function sanitizeForAudit(body: any): any {
  const sensitiveFields = ['password', 'token', 'secret', 'api_key', 'credit_card'];
  
  if (typeof body !== 'object' || body === null) {
    return body;
  }
  
  const sanitized: any = Array.isArray(body) ? [] : {};
  
  for (const [key, value] of Object.entries(body)) {
    if (sensitiveFields.some(f => key.toLowerCase().includes(f))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForAudit(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Get audit logs for merchant
 * GET /secure/audit-logs
 */
export async function getAuditLogs(c: AuditContext) {
  try {
    const profileId = c.get('profileId');
    const url = new URL(c.req.url);
    
    const action = url.searchParams.get('action');
    const entityType = url.searchParams.get('entity_type');
    const severity = url.searchParams.get('severity');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const search = url.searchParams.get('search');
    const limit = url.searchParams.get('limit') || '50';
    const offset = url.searchParams.get('offset') || '0';
    
    // Get merchant's store
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantResponse.json();
    
    if (!merchants || merchants.length === 0) {
      return c.json({
        ok: true,
        data: [],
        total: 0,
      });
    }
    
    const merchantId = merchants[0].id;
    
    // Build query
    let query = `${c.env.SUPABASE_URL}/rest/v1/audit_logs?store_id=eq.${merchantId}&select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;
    
    if (action) {
      query += `&action=eq.${action}`;
    }
    if (entityType) {
      query += `&entity_type=eq.${entityType}`;
    }
    if (severity) {
      query += `&severity=eq.${severity}`;
    }
    if (startDate) {
      query += `&created_at=gte.${startDate}`;
    }
    if (endDate) {
      query += `&created_at=lte.${endDate}`;
    }
    
    const response = await fetch(query, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact',
      },
    });
    
    const logs = await response.json();
    const totalCount = parseInt(response.headers.get('content-range')?.split('/')[1] || '0');
    
    return c.json({
      ok: true,
      data: logs,
      total: totalCount,
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Get single audit log detail
 * GET /secure/audit-logs/:id
 */
export async function getAuditLogDetail(c: AuditContext) {
  try {
    const profileId = c.get('profileId');
    const logId = c.req.param('id');
    
    // Get merchant's store
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantResponse.json();
    
    if (!merchants || merchants.length === 0) {
      return c.json({
        ok: false,
        error: 'Store not found',
      }, 404);
    }
    
    const merchantId = merchants[0].id;
    
    // Get log
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/audit_logs?id=eq.${logId}&store_id=eq.${merchantId}&select=*`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const logs: any[] = await response.json();
    
    if (!logs || logs.length === 0) {
      return c.json({
        ok: false,
        error: 'Log not found',
      }, 404);
    }
    
    return c.json({
      ok: true,
      data: logs[0],
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Get audit log statistics
 * GET /secure/audit-logs/stats
 */
export async function getAuditLogStats(c: AuditContext) {
  try {
    const profileId = c.get('profileId');
    const url = new URL(c.req.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    // Get merchant's store
    const merchantResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/merchants?id=eq.${profileId}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const merchants: any[] = await merchantResponse.json();
    
    if (!merchants || merchants.length === 0) {
      return c.json({
        ok: true,
        data: {
          total_logs: 0,
          by_action: {},
          by_severity: {},
          recent_critical: [],
        },
      });
    }
    
    const merchantId = merchants[0].id;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get all logs for the period
    const logsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/audit_logs?store_id=eq.${merchantId}&created_at=gte.${startDate.toISOString()}&select=action,severity,created_at`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const logs: any[] = await logsResponse.json();
    
    // Calculate stats
    const byAction: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    
    for (const log of logs) {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
    }
    
    // Get recent critical logs
    const criticalResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/audit_logs?store_id=eq.${merchantId}&severity=in.(warning,critical)&select=*&order=created_at.desc&limit=10`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const criticalLogs = await criticalResponse.json();
    
    return c.json({
      ok: true,
      data: {
        period_days: days,
        total_logs: logs.length,
        by_action: byAction,
        by_severity: bySeverity,
        recent_critical: criticalLogs,
      },
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}


