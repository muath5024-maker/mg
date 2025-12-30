/**
 * Notifications System Endpoints
 * Manages merchant notifications
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type NotificationsContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

/**
 * Get merchant notifications
 * GET /secure/notifications
 */
export async function getNotifications(c: NotificationsContext) {
  try {
    const profileId = c.get('profileId');
    const url = new URL(c.req.url);
    const limit = url.searchParams.get('limit') || '50';
    const offset = url.searchParams.get('offset') || '0';
    const unreadOnly = url.searchParams.get('unread') === 'true';

    // Get notifications for this user
    let query = `${c.env.SUPABASE_URL}/rest/v1/notifications?user_id=eq.${profileId}&order=created_at.desc&limit=${limit}&offset=${offset}`;

    if (unreadOnly) {
      query += '&is_read=eq.false';
    }

    const response = await fetch(query, {
      headers: {
        'apikey': c.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact',
      },
    });

    const notifications: any[] = await response.json();
    const totalCount = parseInt(response.headers.get('content-range')?.split('/')[1] || '0');

    return c.json({
      ok: true,
      data: notifications,
      total: totalCount,
      unread_count: notifications.filter(n => !n.is_read).length,
    });

  } catch (error: any) {
    console.error('Get notifications error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}

/**
 * Mark notification as read
 * POST /secure/notifications/:id/read
 */
export async function markNotificationRead(c: NotificationsContext) {
  try {
    const profileId = c.get('profileId');
    const notificationId = c.req.param('id');

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/notifications?id=eq.${notificationId}&user_id=eq.${profileId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_read: true,
          read_at: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update notification');
    }

    return c.json({
      ok: true,
      message: 'تم تعيين الإشعار كمقروء',
    });

  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}

/**
 * Mark all notifications as read
 * POST /secure/notifications/mark-all-read
 */
export async function markAllNotificationsRead(c: NotificationsContext) {
  try {
    const profileId = c.get('profileId');

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/notifications?user_id=eq.${profileId}&is_read=eq.false`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_read: true,
          read_at: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update notifications');
    }

    return c.json({
      ok: true,
      message: 'تم تعيين جميع الإشعارات كمقروءة',
    });

  } catch (error: any) {
    console.error('Mark all notifications read error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}

/**
 * Create notification (internal use)
 * POST /secure/notifications/create
 */
export async function createNotification(c: NotificationsContext) {
  try {
    const body = await c.req.json();
    const { user_id, title, body: notifBody, type, data } = body;

    if (!user_id || !title) {
      return c.json({
        ok: false,
        error: 'user_id and title are required',
      }, 400);
    }

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/notifications`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          user_id,
          title,
          body: notifBody || '',
          type: type || 'general',
          data: data || null,
          is_read: false,
          created_at: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create notification');
    }

    const notifications: any[] = await response.json();
    const notification = notifications[0];

    return c.json({
      ok: true,
      data: notification,
    });

  } catch (error: any) {
    console.error('Create notification error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}

/**
 * Delete notification
 * DELETE /secure/notifications/:id
 */
export async function deleteNotification(c: NotificationsContext) {
  try {
    const profileId = c.get('profileId');
    const notificationId = c.req.param('id');

    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/notifications?id=eq.${notificationId}&user_id=eq.${profileId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }

    return c.json({
      ok: true,
      message: 'تم حذف الإشعار',
    });

  } catch (error: any) {
    console.error('Delete notification error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}


