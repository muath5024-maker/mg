/**
 * Reports Routes Module
 * PDF reports and audit logs
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
import { supabaseAuthMiddleware } from '../middleware/supabaseAuthMiddleware';
import { 
  generatePromotionReport, 
  getPromotionReports
} from '../endpoints/pdfReports';
import { 
  auditMiddleware, 
  getAuditLogs
} from '../endpoints/auditLogs';

type Variables = SupabaseAuthContext;

const reportsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
reportsRoutes.use('*', supabaseAuthMiddleware);

// ========================================
// PDF Reports
// ========================================

reportsRoutes.get('/promotion', getPromotionReports);
reportsRoutes.post('/promotion', generatePromotionReport);

// Note: generateDailyReports and generateFinalReports are scheduled jobs
// called by Cloudflare Cron Triggers, not HTTP endpoints

// ========================================
// Audit Logs
// ========================================

reportsRoutes.get('/audit', getAuditLogs);

// Note: createAuditLog is an internal utility function used by auditMiddleware
// Use auditMiddleware on routes that need audit logging

export default reportsRoutes;
