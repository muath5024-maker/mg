/**
 * Admin API Routes
 * Protected by Cloudflare Access + ADMIN_EMAILS check
 */

import { Hono } from 'hono';
import { Env } from '../types';
import { adminAuthMiddleware } from '../middleware/adminAuth';

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

export default adminRoutes;
