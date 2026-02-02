/**
 * Subscriptions Routes Module
 * Plan management and AI credits
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
import { supabaseAuthMiddleware } from '../middleware/supabaseAuthMiddleware';
import { 
  getPlans, 
  getSubscription, 
  createSubscription, 
  useAiCredits, 
  cancelSubscription, 
  getSubscriptionHistory 
} from '../endpoints/subscriptions';

type Variables = SupabaseAuthContext;

const subscriptionRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ========================================
// Public Routes
// ========================================

// Get available plans (no auth required)
subscriptionRoutes.get('/plans', getPlans);

// ========================================
// Secure Routes
// ========================================

subscriptionRoutes.use('/me', supabaseAuthMiddleware);
subscriptionRoutes.use('/create', supabaseAuthMiddleware);
subscriptionRoutes.use('/use-credits', supabaseAuthMiddleware);
subscriptionRoutes.use('/cancel', supabaseAuthMiddleware);
subscriptionRoutes.use('/history', supabaseAuthMiddleware);

// Get current subscription
subscriptionRoutes.get('/me', getSubscription);

// Create subscription
subscriptionRoutes.post('/create', createSubscription);

// Use AI credits
subscriptionRoutes.post('/use-credits', useAiCredits);

// Cancel subscription
subscriptionRoutes.post('/cancel', cancelSubscription);

// Get subscription history
subscriptionRoutes.get('/history', getSubscriptionHistory);

export default subscriptionRoutes;
