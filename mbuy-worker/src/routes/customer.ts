/**
 * Customer Routes Module
 * Customer management, notifications, points, and wallet
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
import { supabaseAuthMiddleware } from '../middleware/supabaseAuthMiddleware';
import { getCustomers, getCustomer } from '../endpoints/customers';
import { getPointsBalance, getPointsTransactions, addPoints } from '../endpoints/points';
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  createNotification, 
  deleteNotification 
} from '../endpoints/notifications';
import { 
  registerPushToken, 
  unregisterPushToken, 
  getPushTokens, 
  testPushNotification 
} from '../endpoints/pushTokens';

type Variables = SupabaseAuthContext;

const customerRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
customerRoutes.use('*', supabaseAuthMiddleware);

// ========================================
// Customer Management
// ========================================

customerRoutes.get('/', getCustomers);
customerRoutes.get('/:id', getCustomer);

// ========================================
// Wallet
// ========================================

customerRoutes.get('/wallet', async (c) => {
  try {
    const userId = c.get('authUserId') as string;

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/wallets?owner_id=eq.${userId}&type=eq.customer&select=*`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    const data = await response.json();
    return c.json({ ok: true, data: (data as any)[0] || null });
  } catch (error: any) {
    return c.json({ error: 'Failed to get wallet', detail: error.message }, 500);
  }
});

customerRoutes.post('/wallet/add', async (c) => {
  try {
    const userId = c.get('authUserId') as string;
    const body = await c.req.json();

    const response = await fetch(`${c.env.SUPABASE_URL}/functions/v1/wallet_add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': c.env.EDGE_INTERNAL_KEY,
      },
      body: JSON.stringify({ ...body, user_id: userId }),
    });

    const data = await response.json();
    return c.json(data, response.status as any);
  } catch (error: any) {
    return c.json({ error: 'Failed to add wallet funds', detail: error.message }, 500);
  }
});

customerRoutes.post('/wallet/transactions', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const body = await c.req.json();

    const response = await fetch(`${c.env.SUPABASE_URL}/functions/v1/wallet_transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader!,
        'x-internal-key': c.env.EDGE_INTERNAL_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return c.json(data, response.status as any);
  } catch (error: any) {
    return c.json({ error: 'Failed to get wallet transactions', detail: error.message }, 500);
  }
});

// ========================================
// Points
// ========================================

customerRoutes.get('/points', getPointsBalance);
customerRoutes.get('/points/transactions', getPointsTransactions);
customerRoutes.post('/points/add', addPoints);

// ========================================
// Notifications
// ========================================

customerRoutes.get('/notifications', getNotifications);
customerRoutes.post('/notifications', createNotification);
customerRoutes.post('/notifications/:id/read', markNotificationRead);
customerRoutes.post('/notifications/read-all', markAllNotificationsRead);
customerRoutes.delete('/notifications/:id', deleteNotification);

// ========================================
// Push Tokens
// ========================================

customerRoutes.post('/push-tokens', registerPushToken);
customerRoutes.delete('/push-tokens/:token', unregisterPushToken);
customerRoutes.get('/push-tokens', getPushTokens);
customerRoutes.post('/push-tokens/test', testPushNotification);

export default customerRoutes;
