/**
 * Push Notifications Token Management
 * Handles FCM token registration and management
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type PushContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

/**
 * Register push token
 * POST /secure/push/register
 */
export async function registerPushToken(c: PushContext) {
  try {
    const profileId = c.get('profileId');
    const body = await c.req.json();
    const { token, platform, device_id, device_name } = body;
    
    if (!token) {
      return c.json({ ok: false, error: 'token is required' }, 400);
    }
    
    // Check if token already exists
    const checkResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/push_tokens?token=eq.${encodeURIComponent(token)}`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const existing: any[] = await checkResponse.json();
    
    if (existing && existing.length > 0) {
      // Update existing token
      await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/push_tokens?token=eq.${encodeURIComponent(token)}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: profileId,
            is_active: true,
            last_used_at: new Date().toISOString(),
            device_name: device_name || existing[0].device_name,
          }),
        }
      );
    } else {
      // Create new token
      await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/push_tokens`,
        {
          method: 'POST',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: profileId,
            token,
            platform: platform || 'android',
            device_id,
            device_name,
            is_active: true,
          }),
        }
      );
    }
    
    return c.json({
      ok: true,
      message: 'تم تسجيل التوكن بنجاح',
    });
    
  } catch (error: any) {
    console.error('Register push token error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}

/**
 * Unregister push token
 * POST /secure/push/unregister
 */
export async function unregisterPushToken(c: PushContext) {
  try {
    const profileId = c.get('profileId');
    const body = await c.req.json();
    const { token } = body;
    
    if (!token) {
      return c.json({ ok: false, error: 'token is required' }, 400);
    }
    
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/push_tokens?user_id=eq.${profileId}&token=eq.${encodeURIComponent(token)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: false,
        }),
      }
    );
    
    return c.json({
      ok: true,
      message: 'تم إلغاء تسجيل التوكن',
    });
    
  } catch (error: any) {
    console.error('Unregister push token error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}

/**
 * Get user's push tokens
 * GET /secure/push/tokens
 */
export async function getPushTokens(c: PushContext) {
  try {
    const profileId = c.get('profileId');
    
    const response = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/push_tokens?user_id=eq.${profileId}&is_active=eq.true`,
      {
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const tokens: any[] = await response.json();
    
    return c.json({
      ok: true,
      data: tokens.map(t => ({
        id: t.id,
        platform: t.platform,
        device_name: t.device_name,
        last_used_at: t.last_used_at,
        created_at: t.created_at,
      })),
    });
    
  } catch (error: any) {
    console.error('Get push tokens error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}

/**
 * Send push notification to user
 * Internal helper function - can be used by other endpoints
 */
export async function sendPushNotification(
  env: Env,
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    image_url?: string;
  }
): Promise<{ success: boolean; sent_count: number }> {
  try {
    // Get active tokens for user
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/push_tokens?user_id=eq.${userId}&is_active=eq.true`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const tokens: any[] = await response.json();
    
    if (!tokens || tokens.length === 0) {
      return { success: true, sent_count: 0 };
    }
    
    // Get FCM server key from env (if available)
    const fcmKey = (env as any).FCM_SERVER_KEY;
    
    if (!fcmKey) {
      console.log('[Push] FCM key not configured, skipping push');
      return { success: true, sent_count: 0 };
    }
    
    let sentCount = 0;
    
    // Send to each token
    for (const tokenRecord of tokens) {
      try {
        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${fcmKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: tokenRecord.token,
            notification: {
              title: notification.title,
              body: notification.body,
              image: notification.image_url,
            },
            data: notification.data,
            priority: 'high',
          }),
        });
        
        if (fcmResponse.ok) {
          sentCount++;
          
          // Update last used
          await fetch(
            `${env.SUPABASE_URL}/rest/v1/push_tokens?id=eq.${tokenRecord.id}`,
            {
              method: 'PATCH',
              headers: {
                'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                last_used_at: new Date().toISOString(),
              }),
            }
          );
        } else {
          const error = await fcmResponse.text();
          console.error('[Push] FCM error:', error);
          
          // Mark token as inactive if invalid
          if (error.includes('NotRegistered') || error.includes('InvalidRegistration')) {
            await fetch(
              `${env.SUPABASE_URL}/rest/v1/push_tokens?id=eq.${tokenRecord.id}`,
              {
                method: 'PATCH',
                headers: {
                  'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  is_active: false,
                }),
              }
            );
          }
        }
      } catch (fcmError) {
        console.error('[Push] FCM request error:', fcmError);
      }
    }
    
    return { success: true, sent_count: sentCount };
    
  } catch (error) {
    console.error('[sendPushNotification] Error:', error);
    return { success: false, sent_count: 0 };
  }
}

/**
 * Test push notification
 * POST /secure/push/test
 */
export async function testPushNotification(c: PushContext) {
  try {
    const profileId = c.get('profileId');
    
    const result = await sendPushNotification(c.env, profileId, {
      title: 'اختبار الإشعارات',
      body: 'إذا رأيت هذا الإشعار، فإن النظام يعمل بشكل صحيح ✅',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    });
    
    return c.json({
      ok: true,
      message: result.sent_count > 0 
        ? `تم إرسال الإشعار إلى ${result.sent_count} جهاز`
        : 'لا توجد أجهزة مسجلة',
      sent_count: result.sent_count,
    });
    
  } catch (error: any) {
    console.error('Test push notification error:', error);
    return c.json({
      ok: false,
      error: 'Internal server error',
    }, 500);
  }
}


