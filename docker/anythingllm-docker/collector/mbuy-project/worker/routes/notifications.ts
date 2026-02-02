/**
 * Notifications Routes Module
 * Push notifications and FCM token management
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
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

const notificationsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ========================================
// Notifications
// ========================================

// Get all notifications
notificationsRoutes.get('/', getNotifications);

// Mark notification as read
notificationsRoutes.put('/:id/read', markNotificationRead);

// Mark all notifications as read
notificationsRoutes.put('/read-all', markAllNotificationsRead);

// Create notification (admin/system)
notificationsRoutes.post('/', createNotification);

// Delete notification
notificationsRoutes.delete('/:id', deleteNotification);

// ========================================
// Push Tokens (FCM)
// ========================================

// Register FCM token
notificationsRoutes.post('/register-token', async (c) => {
  try {
    const userId = c.get('authUserId') as string;
    const body = await c.req.json();
    const { fcm_token, device_type } = body;

    if (!fcm_token) {
      return c.json({ error: 'Missing fcm_token' }, 400);
    }

    // Check if token already exists
    const checkResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/user_fcm_tokens?token=eq.${fcm_token}&select=id`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    const existing = await checkResponse.json() as any[];

    if (existing && existing.length > 0) {
      // Token exists, update timestamp
      const updateResponse = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/user_fcm_tokens?id=eq.${existing[0].id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': c.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            updated_at: new Date().toISOString(),
          }),
        }
      );

      const updated = await updateResponse.json() as any[];
      return c.json({
        ok: true,
        data: {
          token_id: existing[0].id,
          registered_at: updated[0]?.updated_at || new Date().toISOString(),
          action: 'updated'
        }
      });
    }

    // Token doesn't exist, insert new
    const insertResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/user_fcm_tokens`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          user_id: userId,
          token: fcm_token,
          device_type: device_type || 'unknown',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      }
    );

    const inserted = await insertResponse.json() as any[];

    return c.json({
      ok: true,
      data: {
        token_id: inserted[0]?.id,
        registered_at: new Date().toISOString(),
        action: 'created'
      }
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to register FCM token', detail: error.message }, 500);
  }
});

// Unregister FCM token
notificationsRoutes.delete('/token/:token', async (c) => {
  try {
    const userId = c.get('authUserId') as string;
    const token = c.req.param('token');

    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/user_fcm_tokens?user_id=eq.${userId}&token=eq.${token}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${c.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    return c.json({ ok: true, message: 'Token unregistered' });
  } catch (error: any) {
    return c.json({ error: 'Failed to unregister token', detail: error.message }, 500);
  }
});

// Get user's push tokens
notificationsRoutes.get('/tokens', getPushTokens);

// Test push notification
notificationsRoutes.post('/test', testPushNotification);

export default notificationsRoutes;
