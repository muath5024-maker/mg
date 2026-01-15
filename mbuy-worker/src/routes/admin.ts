/**
 * Admin API Routes
 * Protected by Cloudflare Access + ADMIN_EMAILS check
 */

import { Hono } from 'hono';
import { Env } from '../types';
import { adminAuthMiddleware } from '../middleware/adminAuth';
import {
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminReorderCategories,
} from '../endpoints/platform-categories';
import {
  adminListBoosts,
  adminBoostStats,
  adminCancelBoost,
} from '../endpoints/boost';

type AdminVariables = {
  adminEmail: string;
};

const adminRoutes = new Hono<{ Bindings: Env; Variables: AdminVariables }>();

// Apply admin auth middleware to all routes
adminRoutes.use('*', adminAuthMiddleware);

// Health check
adminRoutes.get('/health', (c) => {
  const adminEmail = c.get('adminEmail');
  return c.json({ 
    ok: true, 
    user: adminEmail,
    timestamp: new Date().toISOString()
  });
});

// Dashboard stats (example - expand as needed)
adminRoutes.get('/stats', async (c) => {
  const adminEmail = c.get('adminEmail');
  
  // Add your admin stats logic here
  return c.json({
    ok: true,
    user: adminEmail,
    stats: {
      message: 'Admin stats endpoint ready'
    }
  });
});

// ========================================
// Platform Categories Management
// ========================================
adminRoutes.get('/platform-categories', adminListCategories as any);
adminRoutes.post('/platform-categories', adminCreateCategory as any);
adminRoutes.put('/platform-categories/reorder', adminReorderCategories as any);
adminRoutes.put('/platform-categories/:id', adminUpdateCategory as any);
adminRoutes.delete('/platform-categories/:id', adminDeleteCategory as any);

// ========================================
// Boost Management (إدارة دعم الظهور)
// ========================================
adminRoutes.get('/boosts', adminListBoosts as any);
adminRoutes.get('/boosts/stats', adminBoostStats as any);
adminRoutes.post('/boosts/:id/cancel', adminCancelBoost as any);

export default adminRoutes;
