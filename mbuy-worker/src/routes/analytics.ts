/**
 * Analytics Routes Module
 * Analytics and tracking routes
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
import { supabaseAuthMiddleware } from '../middleware/supabaseAuthMiddleware';
import { getAnalytics } from '../endpoints/analytics';
import { trackEvent, getAnalyticsSummary, getTopProducts } from '../endpoints/analyticsEvents';
import { 
  getDashboardOverview, 
  getHourlyAnalytics, 
  getProductAnalytics, 
  getCustomerSegments, 
  getSmartInsights, 
  markInsightRead, 
  dismissInsight, 
  getStoreGoals, 
  createStoreGoal, 
  updateStoreGoal, 
  deleteStoreGoal, 
  getRealtimeStats 
} from '../endpoints/smart-analytics';

type Variables = SupabaseAuthContext;

const analyticsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
analyticsRoutes.use('*', supabaseAuthMiddleware);

// ========================================
// General Analytics
// ========================================

analyticsRoutes.get('/', getAnalytics);
analyticsRoutes.get('/summary', getAnalyticsSummary);
analyticsRoutes.get('/top-products', getTopProducts);

// ========================================
// Event Tracking
// ========================================

analyticsRoutes.post('/track', trackEvent);

// ========================================
// Smart Analytics
// ========================================

analyticsRoutes.get('/dashboard', getDashboardOverview);
analyticsRoutes.get('/hourly', getHourlyAnalytics);
analyticsRoutes.get('/products', getProductAnalytics);
analyticsRoutes.get('/segments', getCustomerSegments);
analyticsRoutes.get('/realtime', getRealtimeStats);

// ========================================
// Smart Insights
// ========================================

analyticsRoutes.get('/insights', getSmartInsights);
analyticsRoutes.post('/insights/:id/read', markInsightRead);
analyticsRoutes.post('/insights/:id/dismiss', dismissInsight);

// ========================================
// Store Goals
// ========================================

analyticsRoutes.get('/goals', getStoreGoals);
analyticsRoutes.post('/goals', createStoreGoal);
analyticsRoutes.put('/goals/:id', updateStoreGoal);
analyticsRoutes.delete('/goals/:id', deleteStoreGoal);

export default analyticsRoutes;
