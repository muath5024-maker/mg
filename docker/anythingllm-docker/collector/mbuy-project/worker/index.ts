/**
 * MBUY API Gateway - Cloudflare Worker
 * Refactored: Routes organized into separate modules
 * 
 * VERSION 2.0.0 - New 143-table schema migration
 * - Custom JWT from Worker (not Supabase Auth)
 * - User tables: customers, merchants, merchant_users, admin_staff
 * - Old tables (stores, user_profiles) are DELETED
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, SupabaseAuthContext, AuthContext } from './types';
import { defaultRateLimiter, authRateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware, requireUserType } from './middleware/authMiddleware';
// DEPRECATED: import { supabaseAuthMiddleware } from './middleware/supabaseAuthMiddleware';
import { handleOrderQueue } from './queues/orderQueue';
import { generateDailyReports } from './endpoints/pdfReports';
import { serveMedia } from './endpoints/media';
import { getAvailableShortcuts } from './endpoints/shortcuts';
import { listPublicCategories } from './endpoints/categories-crud';
import { deprecatedRouteGroup } from './endpoints/_deprecated';
/* DEPRECATED - Old store subdomain system
import {
  getStoreBySubdomain,
  getPublicStoreProducts,
  trackStoreView
} from './endpoints/storeSubdomain';
*/
/* DEPRECATED - Old store web system
import {
  checkSlugAvailability,
  createStore,
  updateStoreBranding,
  getAISuggestions,
} from './endpoints/storeWeb';
*/

// Route Modules
import authRoutes from './routes/auth';
import publicRoutes from './routes/public';
import merchantRoutes from './routes/merchant';
import { apiRoutes } from './routes/api'; // NEW: CRUD API Routes
import paymentProcessor from './routes/payment-processor'; // Multi-Gateway Payment System
import platformSettingsRoutes from './routes/platform-settings'; // Platform Settings
// DEPRECATED Routes - These need rebuild
// import cartRoutes from './routes/cart';
// import ordersRoutes from './routes/orders';
// import walletRoutes from './routes/wallet';
// import notificationsRoutes from './routes/notifications';
import searchRoutes from './routes/search';
// import geminiRoutes from './routes/gemini';
// import autoReports from './routes/auto-reports';

// GraphQL
import { createGraphQLHandler } from './graphql';
// import heatmap from './routes/heatmap';
// import aiAssistant from './routes/ai-assistant';
// import contentGenerator from './routes/content-generator';
// import smartPricing from './routes/smart-pricing';
// import customerSegments from './routes/customer-segments';
// import customMessages from './routes/custom-messages';
// import loyaltyProgram from './routes/loyalty-program';
// import productVariants from './routes/product-variants';
// import productBundles from './routes/product-bundles';
// import digitalProducts from './routes/digital-products';
// import shipping from './routes/shipping';
// import delivery from './routes/delivery';
// import payments from './routes/payments';
// import paymentsGateway from './routes/payments-gateway';
// import cod from './routes/cod';
// import webstore from './routes/webstore';
// import whatsapp from './routes/whatsapp';
// import qrcode from './routes/qrcode';
import studioPackages from './routes/packages';
import studioRoutes from './routes/studio';
import studioTools from './routes/tools';
// import revenue from './routes/revenue';
// import analyticsRoutes from './routes/analytics';
// import inventoryRoutes from './routes/inventory';
// import marketingRoutes from './routes/marketing';
// import mediaRoutes from './routes/media';
// import aiRoutes from './routes/ai';
// import customerRoutes from './routes/customer';
// import subscriptionsRoutes from './routes/subscriptions';
// import shortcutsRoutes from './routes/shortcuts-routes';
// import reportsRoutes from './routes/reports';
// import dropshippingRoutes from './routes/dropshipping-routes';
// import adminRoutes from './routes/admin';

// Define Context Variables - Updated for new auth system
type Variables = AuthContext & {
  validatedBody?: any;
  userEmail?: string;
  // DEPRECATED: SupabaseAuthContext fields
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Export Durable Objects
export { SessionStore } from './durable-objects/SessionStore';
export { ChatRoom } from './durable-objects/ChatRoom';

// ============================================================================
// GLOBAL MIDDLEWARE - Applied to ALL routes
// ============================================================================

app.use('*', errorHandler);

app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = [
      'http://localhost',
      'http://localhost:3000',
      'https://mbuy.pro',
    ];
    if (origin.startsWith('http://localhost') || origin.startsWith('capacitor://')) {
      return origin;
    }
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use('*', defaultRateLimiter);
app.use('*', requestLogger);

// ============================================================================
// AUTH MIDDLEWARE for /secure/* routes
// NEW: Using custom JWT authentication from Worker
// ============================================================================
app.use('/secure/*', authMiddleware);

// ============================================================================
// HEALTH CHECK & TEST ROUTES
// ============================================================================

app.get('/', (c) => {
  return c.json({ ok: true, message: 'MBUY API Gateway', version: '2.0.0' });
});

// ============================================================================
// GRAPHQL ENDPOINT
// ============================================================================
app.all('/graphql', async (c) => {
  const yoga = createGraphQLHandler(c.env);
  return yoga.handle(c.req.raw, c.env);
});

app.get('/test-ai', async (c) => {
  try {
    const result = await c.env.AI.run('@cf/meta/llama-3-8b-instruct' as any, {
      messages: [{ role: 'user', content: 'Say hello in Arabic' }],
      max_tokens: 50,
    });
    return c.json({ ok: true, result });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.get('/test-r2', async (c) => {
  try {
    const testData = new TextEncoder().encode('test');
    await c.env.R2.put('test/test.txt', testData);
    const obj = await c.env.R2.get('test/test.txt');
    const content = obj ? await obj.text() : null;
    return c.json({ ok: true, content, publicUrl: c.env.R2_PUBLIC_URL });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.get('/test-supabase', async (c) => {
  try {
    const url = `${c.env.SUPABASE_URL}/rest/v1/ai_jobs?select=id&limit=1`;
    const response = await fetch(url, {
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    const status = response.status;
    const text = await response.text();
    return c.json({ ok: status === 200, status, response: text });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 500);
  }
});

// ============================================================================
// MEDIA FILES - Public access to R2 files
// ============================================================================
app.get('/media/*', serveMedia);

// ============================================================================
// PUBLIC ROUTES - No JWT required
// ============================================================================

// Auth Routes
app.route('/auth', authRoutes);

// Admin Settings Routes (Public for now - add admin auth later)
app.route('/admin/settings', platformSettingsRoutes);

// DEPRECATED: Admin API Routes (needs rebuild)
// app.route('/admin/api', adminRoutes);
app.all('/admin/api/*', deprecatedRouteGroup);

// Public Routes - BOTH paths for compatibility
app.route('/public', publicRoutes);
app.route('/api/public', publicRoutes); // Alias for Flutter app compatibility

// Categories (using new schema-compliant endpoint)
app.get('/categories', listPublicCategories);

// Shortcuts
app.get('/shortcuts/available', getAvailableShortcuts);

// DEPRECATED: Store Subdomain Routes (stores table deleted)
// app.get('/store-site/:slug', getStoreBySubdomain);
// app.get('/store-site/:slug/products', getPublicStoreProducts);
// app.post('/store-site/track', trackStoreView);
app.all('/store-site/*', deprecatedRouteGroup);

// Search Routes (Public)
app.route('/search', searchRoutes);

// Payment Processor - Multi-Gateway Payment System (Public endpoints for webhooks)
app.route('/pay', paymentProcessor);

// ============================================================================
// SECURE ROUTES - JWT required (authMiddleware applied above)
// ============================================================================

// NEW API Routes - Clean CRUD system
app.route('/api', apiRoutes);

// Merchant Routes - WORKING (rebuilt for new schema)
app.route('/secure/merchant', merchantRoutes);

// ============================================================================
// DEPRECATED ROUTES - Need rebuild for new schema
// All routes below return 410 DEPRECATED response
// ============================================================================

// Cart Routes - DEPRECATED
// app.route('/secure/cart', cartRoutes);
app.all('/secure/cart/*', deprecatedRouteGroup);

// Orders Routes - DEPRECATED
// app.route('/secure/orders', ordersRoutes);
app.all('/secure/orders/*', deprecatedRouteGroup);

// Wallet & Points Routes - DEPRECATED
// app.route('/secure/wallet', walletRoutes);
app.all('/secure/wallet/*', deprecatedRouteGroup);
app.all('/secure/points/*', deprecatedRouteGroup);

// Notifications Routes - DEPRECATED
// app.route('/secure/notifications', notificationsRoutes);
app.all('/secure/notifications/*', deprecatedRouteGroup);

// Gemini AI Routes - DEPRECATED
// app.route('/secure/ai/gemini', geminiRoutes);
app.all('/secure/ai/gemini/*', deprecatedRouteGroup);

// DEPRECATED: Store Management Routes (stores table deleted)
// app.get('/secure/store/check-slug', checkSlugAvailability);
// app.post('/secure/store/create', createStore);
// app.put('/secure/store/:id/branding', updateStoreBranding);
// app.post('/secure/store/:id/ai-suggestions', getAISuggestions);
app.all('/secure/store/*', deprecatedRouteGroup);

// Feature Route Modules - ALL DEPRECATED (need rebuild)
// app.route('/secure/reports', autoReports);
// app.route('/secure/heatmap', heatmap);
// app.route('/secure/ai', aiAssistant);
// app.route('/secure/content', contentGenerator);
// app.route('/secure/pricing', smartPricing);
// app.route('/secure/segments', customerSegments);
// app.route('/secure/messages', customMessages);
// app.route('/secure/loyalty', loyaltyProgram);
// app.route('/secure/variants', productVariants);
// app.route('/secure/bundles', productBundles);
// app.route('/secure/digital', digitalProducts);
// app.route('/secure/shipping', shipping);
// app.route('/secure/delivery', delivery);
// app.route('/secure/payments', payments);
// app.route('/secure/cod', cod);
// app.route('/secure/webstore', webstore);
// app.route('/secure/whatsapp', whatsapp);
// app.route('/secure/qrcode', qrcode);
app.route('/secure/studio/packages', studioPackages);
app.route('/secure/studio', studioRoutes);
app.route('/secure/studio/tools', studioTools);
// app.route('/secure/revenue', revenue);
// app.route('/secure/analytics', analyticsRoutes);
// app.route('/secure/inventory', inventoryRoutes);
// app.route('/secure/marketing', marketingRoutes);
// app.route('/secure/media', mediaRoutes);
// app.route('/secure/ai-jobs', aiRoutes);
// app.route('/secure/customers', customerRoutes);
// app.route('/secure/subscriptions', subscriptionsRoutes);
// app.route('/secure/shortcuts', shortcutsRoutes);
// app.route('/secure/reports-gen', reportsRoutes);
// app.route('/secure/dropshipping', dropshippingRoutes);

// Catch-all for deprecated /secure/* routes
app.all('/secure/reports/*', deprecatedRouteGroup);
app.all('/secure/heatmap/*', deprecatedRouteGroup);
app.all('/secure/ai/*', deprecatedRouteGroup);
app.all('/secure/content/*', deprecatedRouteGroup);
app.all('/secure/pricing/*', deprecatedRouteGroup);
app.all('/secure/segments/*', deprecatedRouteGroup);
app.all('/secure/messages/*', deprecatedRouteGroup);
app.all('/secure/loyalty/*', deprecatedRouteGroup);
app.all('/secure/variants/*', deprecatedRouteGroup);
app.all('/secure/bundles/*', deprecatedRouteGroup);
app.all('/secure/digital/*', deprecatedRouteGroup);
app.all('/secure/shipping/*', deprecatedRouteGroup);
app.all('/secure/delivery/*', deprecatedRouteGroup);
app.all('/secure/payments/*', deprecatedRouteGroup);
app.all('/secure/cod/*', deprecatedRouteGroup);
app.all('/secure/webstore/*', deprecatedRouteGroup);
app.all('/secure/whatsapp/*', deprecatedRouteGroup);
app.all('/secure/qrcode/*', deprecatedRouteGroup);
// Studio routes are now ACTIVE - removed from deprecated
app.all('/secure/revenue/*', deprecatedRouteGroup);
app.all('/secure/analytics/*', deprecatedRouteGroup);
app.all('/secure/inventory/*', deprecatedRouteGroup);
app.all('/secure/marketing/*', deprecatedRouteGroup);
app.all('/secure/media/*', deprecatedRouteGroup);
app.all('/secure/ai-jobs/*', deprecatedRouteGroup);
app.all('/secure/customers/*', deprecatedRouteGroup);
app.all('/secure/subscriptions/*', deprecatedRouteGroup);
app.all('/secure/shortcuts/*', deprecatedRouteGroup);
app.all('/secure/reports-gen/*', deprecatedRouteGroup);
app.all('/secure/dropshipping/*', deprecatedRouteGroup);

// Public Endpoints - DEPRECATED
// app.route('/api/pricing', revenue);
// app.route('/payments', paymentsGateway);
app.all('/api/pricing/*', deprecatedRouteGroup);
app.all('/payments/*', deprecatedRouteGroup);

// ============================================================================
// ERROR HANDLERS
// ============================================================================

app.notFound((c) => {
  return c.json({ error: 'Not found', detail: 'Endpoint does not exist' }, 404);
});

app.onError((err, c) => {
  console.error('Worker error:', err);
  return c.json({ error: 'Internal server error', detail: err.message }, 500);
});

// ============================================================================
// EXPORTS
// ============================================================================

// Queue consumer export
export async function queue(batch: MessageBatch<any>, env: any): Promise<void> {
  await handleOrderQueue(batch, env);
}

// Scheduled/Cron handler
export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
  console.log('Scheduled event triggered:', event.cron);

  if (event.cron === '0 3 * * *') {
    console.log('Running daily maintenance...');
    try {
      await generateDailyReports(env);
      console.log('Daily maintenance completed successfully');
    } catch (error) {
      console.error('Daily maintenance failed:', error);
    }
  }

  if (event.cron === '0 * * * *') {
    console.log('Running hourly cleanup tasks...');
  }
}

export default app;
