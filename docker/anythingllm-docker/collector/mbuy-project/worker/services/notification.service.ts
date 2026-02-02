/**
 * Notification Service
 * Handles push notifications, in-app notifications, and email notifications
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import type { Database } from '../db';
import type { Env } from '../types';
import { notifications, pushTokens, type Notification, type NewNotification, type PushToken } from '../db/schema/notifications';
import { customers } from '../db/schema/users';
import { merchantUsers } from '../db/schema/merchants';

export interface SendNotificationInput {
  userId: string;
  userType: 'customer' | 'merchant';
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  type: string;
  data?: Record<string, any>;
  sendPush?: boolean;
}

export interface BroadcastInput {
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  type: string;
  data?: Record<string, any>;
  userType?: 'customer' | 'merchant' | 'all';
}

export class NotificationService {
  constructor(
    private db: Database,
    private env: Env
  ) {}

  /**
   * Get notification by ID
   */
  async getById(id: string): Promise<Notification | null> {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    return notification || null;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    userType: 'customer' | 'merchant',
    params: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const { page = 1, limit = 20, unreadOnly = false } = params;
    const offset = (page - 1) * limit;

    const userIdField = userType === 'customer' ? notifications.customerId : notifications.merchantUserId;
    
    const conditions = [eq(userIdField, userId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    // Get total and unread counts
    const [counts] = await this.db
      .select({
        total: sql<number>`count(*)::int`,
        unreadCount: sql<number>`count(*) FILTER (WHERE is_read = false)::int`,
      })
      .from(notifications)
      .where(eq(userIdField, userId));

    // Get notifications
    const result = await this.db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      notifications: result,
      total: counts?.total || 0,
      unreadCount: counts?.unreadCount || 0,
    };
  }

  /**
   * Send a notification to a user
   */
  async send(input: SendNotificationInput): Promise<Notification> {
    const { userId, userType, title, titleAr, body, bodyAr, type, data, sendPush = true } = input;

    // Create notification record
    const notificationData: NewNotification = {
      title,
      titleAr,
      body,
      bodyAr,
      type,
      metadata: data || {},
    };

    if (userType === 'customer') {
      notificationData.customerId = userId;
    } else {
      notificationData.merchantUserId = userId;
    }

    const [notification] = await this.db
      .insert(notifications)
      .values(notificationData)
      .returning();

    // Send push notification
    if (sendPush) {
      await this.sendPushNotification(userId, userType, { title, body, data });
    }

    return notification;
  }

  /**
   * Broadcast notification to all users
   */
  async broadcast(input: BroadcastInput): Promise<number> {
    const { title, titleAr, body, bodyAr, type, data, userType = 'all' } = input;
    let sentCount = 0;

    // Get all customers
    if (userType === 'all' || userType === 'customer') {
      const customerList = await this.db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.status, 'active'));

      for (const customer of customerList) {
        await this.send({
          userId: customer.id,
          userType: 'customer',
          title,
          titleAr,
          body,
          bodyAr,
          type,
          data,
        });
        sentCount++;
      }
    }

    // Get all merchant users
    if (userType === 'all' || userType === 'merchant') {
      const merchantUsersList = await this.db
        .select({ id: merchantUsers.id })
        .from(merchantUsers)
        .where(eq(merchantUsers.status, 'active'));

      for (const user of merchantUsersList) {
        await this.send({
          userId: user.id,
          userType: 'merchant',
          title,
          titleAr,
          body,
          bodyAr,
          type,
          data,
        });
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    const result = await this.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, notificationId));

    return (result as any).rowCount > 0;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string, userType: 'customer' | 'merchant'): Promise<number> {
    const userIdField = userType === 'customer' ? notifications.customerId : notifications.merchantUserId;

    const result = await this.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(userIdField, userId),
          eq(notifications.isRead, false)
        )
      );

    return (result as any).rowCount;
  }

  /**
   * Delete notification
   */
  async delete(notificationId: string): Promise<boolean> {
    const result = await this.db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));

    return (result as any).rowCount > 0;
  }

  /**
   * Delete all read notifications older than X days
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.db
      .delete(notifications)
      .where(
        and(
          eq(notifications.isRead, true),
          sql`${notifications.createdAt} < ${cutoffDate}`
        )
      );

    return (result as any).rowCount;
  }

  // ============ Push Tokens ============

  /**
   * Register push token
   */
  async registerPushToken(
    userId: string,
    userType: 'customer' | 'merchant',
    token: string,
    platform: string = 'fcm'
  ): Promise<PushToken> {
    // Check if token exists
    const [existing] = await this.db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.token, token))
      .limit(1);

    if (existing) {
      // Update existing token
      const [updated] = await this.db
        .update(pushTokens)
        .set({
          customerId: userType === 'customer' ? userId : null,
          merchantUserId: userType === 'merchant' ? userId : null,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(pushTokens.id, existing.id))
        .returning();

      return updated;
    }

    // Create new token
    const [pushToken] = await this.db
      .insert(pushTokens)
      .values({
        token,
        platform,
        customerId: userType === 'customer' ? userId : undefined,
        merchantUserId: userType === 'merchant' ? userId : undefined,
      })
      .returning();

    return pushToken;
  }

  /**
   * Unregister push token
   */
  async unregisterPushToken(token: string): Promise<boolean> {
    const result = await this.db
      .update(pushTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(pushTokens.token, token));

    return (result as any).rowCount > 0;
  }

  /**
   * Get user push tokens
   */
  async getUserPushTokens(userId: string, userType: 'customer' | 'merchant'): Promise<PushToken[]> {
    const userIdField = userType === 'customer' ? pushTokens.customerId : pushTokens.merchantUserId;

    return this.db
      .select()
      .from(pushTokens)
      .where(
        and(
          eq(userIdField, userId),
          eq(pushTokens.isActive, true)
        )
      );
  }

  // ============ Push Notification Sending ============

  private async sendPushNotification(
    userId: string,
    userType: 'customer' | 'merchant',
    payload: { title: string; body: string; data?: Record<string, any> }
  ): Promise<void> {
    const tokens = await this.getUserPushTokens(userId, userType);
    
    if (tokens.length === 0) {
      return;
    }

    // Group tokens by platform
    const fcmTokens = tokens.filter(t => t.platform === 'fcm').map(t => t.token);
    const apnsTokens = tokens.filter(t => t.platform === 'apns').map(t => t.token);

    // Send FCM notifications
    if (fcmTokens.length > 0) {
      await this.sendFCM(fcmTokens, payload);
    }

    // Send APNS notifications (if needed)
    if (apnsTokens.length > 0) {
      await this.sendAPNS(apnsTokens, payload);
    }
  }

  private async sendFCM(
    tokens: string[],
    payload: { title: string; body: string; data?: Record<string, any> }
  ): Promise<void> {
    const FCM_SERVER_KEY = this.env.FCM_SERVER_KEY;
    if (!FCM_SERVER_KEY) {
      console.warn('FCM_SERVER_KEY not configured');
      return;
    }

    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${FCM_SERVER_KEY}`,
        },
        body: JSON.stringify({
          registration_ids: tokens,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data || {},
        }),
      });

      if (!response.ok) {
        console.error('FCM send failed:', await response.text());
      }
    } catch (error) {
      console.error('FCM send error:', error);
    }
  }

  private async sendAPNS(
    tokens: string[],
    payload: { title: string; body: string; data?: Record<string, any> }
  ): Promise<void> {
    // APNS implementation would go here
    // For now, we rely on FCM for iOS as well (via Firebase)
    console.log('APNS sending not implemented, using FCM for iOS');
  }

  // ============ Order Notifications ============

  /**
   * Send order confirmation notification
   */
  async sendOrderConfirmation(orderId: string, customerId: string): Promise<void> {
    await this.send({
      userId: customerId,
      userType: 'customer',
      title: 'Order Confirmed',
      titleAr: 'تم تأكيد الطلب',
      body: `Your order #${orderId.slice(-8)} has been confirmed`,
      bodyAr: `تم تأكيد طلبك #${orderId.slice(-8)}`,
      type: 'order_confirmed',
      data: { orderId },
    });
  }

  /**
   * Send order shipped notification
   */
  async sendOrderShipped(orderId: string, customerId: string, trackingNumber?: string): Promise<void> {
    await this.send({
      userId: customerId,
      userType: 'customer',
      title: 'Order Shipped',
      titleAr: 'تم شحن الطلب',
      body: `Your order #${orderId.slice(-8)} has been shipped`,
      bodyAr: `تم شحن طلبك #${orderId.slice(-8)}`,
      type: 'order_shipped',
      data: { orderId, trackingNumber },
    });
  }

  /**
   * Send order delivered notification
   */
  async sendOrderDelivered(orderId: string, customerId: string): Promise<void> {
    await this.send({
      userId: customerId,
      userType: 'customer',
      title: 'Order Delivered',
      titleAr: 'تم توصيل الطلب',
      body: `Your order #${orderId.slice(-8)} has been delivered`,
      bodyAr: `تم توصيل طلبك #${orderId.slice(-8)}`,
      type: 'order_delivered',
      data: { orderId },
    });
  }

  /**
   * Send new order notification to merchant
   */
  async sendNewOrderToMerchant(orderId: string, merchantUserId: string): Promise<void> {
    await this.send({
      userId: merchantUserId,
      userType: 'merchant',
      title: 'New Order',
      titleAr: 'طلب جديد',
      body: `You have received a new order #${orderId.slice(-8)}`,
      bodyAr: `لديك طلب جديد #${orderId.slice(-8)}`,
      type: 'new_order',
      data: { orderId },
    });
  }
}
