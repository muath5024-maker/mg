/**
 * PayTabs Payment Gateway
 * 
 * بوابة دفع سعودية
 * https://paytabs.com
 * 
 * تدعم:
 * - مدى
 * - Visa/MasterCard
 * - Apple Pay
 * - STC Pay
 * - SADAD
 */

import {
  PaymentGatewayInterface,
  GatewayCredentials,
  CreatePaymentRequest,
  CreatePaymentResponse,
  WebhookPayload,
  RefundRequest,
  RefundResponse,
  PaymentStatus,
} from './types';
import * as crypto from 'crypto';

// =============================================================================
// URLs
// =============================================================================

const PAYTABS_API_URL = 'https://secure.paytabs.sa'; // Saudi Arabia region

// =============================================================================
// PayTabs Gateway Implementation
// =============================================================================

export const PayTabsGateway: PaymentGatewayInterface = {
  name: 'paytabs',

  /**
   * إنشاء دفعة جديدة (Payment Page)
   */
  async createPayment(
    credentials: GatewayCredentials,
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    const response = await fetch(`${PAYTABS_API_URL}/payment/request`, {
      method: 'POST',
      headers: {
        'Authorization': credentials.secretKey, // Server Key
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile_id: credentials.publishableKey, // Profile ID
        tran_type: 'sale',
        tran_class: 'ecom',
        cart_id: request.orderId,
        cart_currency: request.currency || 'SAR',
        cart_amount: request.amount / 100, // PayTabs يقبل بالريال
        cart_description: request.description || `Order ${request.orderId}`,
        paypage_lang: 'ar',
        hide_shipping: true,
        callback: request.callbackUrl,
        return: request.successUrl || request.callbackUrl,
        customer_details: request.customer ? {
          name: request.customer.name || 'Customer',
          email: request.customer.email || 'customer@store.com',
          phone: request.customer.phone || '0500000000',
          street1: 'Address',
          city: 'Riyadh',
          state: 'RI',
          country: 'SA',
          zip: '12345',
        } : {
          name: 'Customer',
          email: 'customer@store.com',
          phone: '0500000000',
          street1: 'Address',
          city: 'Riyadh',
          state: 'RI',
          country: 'SA',
          zip: '12345',
        },
        shipping_details: {
          name: request.customer?.name || 'Customer',
          email: request.customer?.email || 'customer@store.com',
          phone: request.customer?.phone || '0500000000',
          street1: 'Address',
          city: 'Riyadh',
          state: 'RI',
          country: 'SA',
          zip: '12345',
        },
        user_defined: {
          udf1: request.orderId,
          udf2: JSON.stringify(request.metadata || {}),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayTabs Error: ${JSON.stringify(error)}`);
    }

    const result = await response.json() as any;

    if (result.response_status !== 'S') {
      throw new Error(`PayTabs Error: ${result.result || 'Unknown error'}`);
    }

    return {
      success: true,
      transactionId: result.tran_ref,
      paymentUrl: result.redirect_url,
      rawResponse: result,
    };
  },

  /**
   * معالجة Webhook (Server Notification)
   */
  parseWebhook(
    payload: any,
    _headers: Record<string, string>,
    _credentials: GatewayCredentials
  ): WebhookPayload {
    const statusMap: Record<string, PaymentStatus> = {
      'A': 'authorized',
      'H': 'pending', // On Hold
      'P': 'pending', // Pending
      'V': 'cancelled', // Voided
      'R': 'refunded', // Refunded
      'E': 'failed', // Error
      'D': 'failed', // Declined
    };

    // PayTabs response_status: A = Success
    let status: PaymentStatus = 'pending';
    if (payload.payment_result?.response_status === 'A') {
      status = 'paid';
    } else if (payload.payment_result?.response_status) {
      status = statusMap[payload.payment_result.response_status] || 'pending';
    }

    // PayTabs يرسل المبلغ بالريال
    const amountInHalalas = Math.round((payload.cart_amount || payload.tran_total || 0) * 100);

    // استخراج metadata من user_defined
    let metadata: Record<string, any> = {};
    try {
      if (payload.user_defined?.udf2) {
        metadata = JSON.parse(payload.user_defined.udf2);
      }
    } catch {}

    return {
      gateway: 'paytabs',
      transactionId: payload.tran_ref,
      status,
      amount: amountInHalalas,
      currency: payload.cart_currency || 'SAR',
      orderId: payload.cart_id || payload.user_defined?.udf1,
      metadata,
      rawPayload: payload,
    };
  },

  /**
   * التحقق من صحة Webhook
   * PayTabs يستخدم Signature Header
   */
  verifyWebhook(
    payload: any,
    headers: Record<string, string>,
    credentials: GatewayCredentials
  ): boolean {
    if (!credentials.webhookSecret) return true;

    const signature = headers['signature'] || headers['Signature'];
    if (!signature) return false;

    const payloadString = typeof payload === 'string' 
      ? payload 
      : JSON.stringify(payload);

    const expectedSignature = crypto
      .createHmac('sha256', credentials.webhookSecret)
      .update(payloadString)
      .digest('hex');

    return signature === expectedSignature;
  },

  /**
   * استرجاع مبلغ
   */
  async refund(
    credentials: GatewayCredentials,
    request: RefundRequest
  ): Promise<RefundResponse> {
    const response = await fetch(`${PAYTABS_API_URL}/payment/request`, {
      method: 'POST',
      headers: {
        'Authorization': credentials.secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile_id: credentials.publishableKey,
        tran_type: 'refund',
        tran_class: 'ecom',
        cart_id: request.orderId || request.transactionId,
        cart_currency: 'SAR',
        cart_amount: request.amount ? request.amount / 100 : undefined,
        cart_description: request.reason || 'Refund',
        tran_ref: request.transactionId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayTabs Refund Error: ${JSON.stringify(error)}`);
    }

    const result = await response.json() as any;

    return {
      success: result.payment_result?.response_status === 'A',
      refundId: result.tran_ref,
      amount: Math.round((result.cart_amount || 0) * 100),
      status: result.payment_result?.response_status === 'A' ? 'completed' : 'pending',
      rawResponse: result,
    };
  },

  /**
   * الحصول على حالة معاملة
   */
  async getPaymentStatus(
    credentials: GatewayCredentials,
    transactionId: string
  ): Promise<{ status: PaymentStatus; rawResponse: any }> {
    const response = await fetch(`${PAYTABS_API_URL}/payment/query`, {
      method: 'POST',
      headers: {
        'Authorization': credentials.secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile_id: credentials.publishableKey,
        tran_ref: transactionId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get payment status from PayTabs');
    }

    const result = await response.json() as any;

    const statusMap: Record<string, PaymentStatus> = {
      'A': 'paid',
      'H': 'pending',
      'P': 'pending',
      'V': 'cancelled',
      'R': 'refunded',
      'E': 'failed',
      'D': 'failed',
    };

    const responseStatus = result.payment_result?.response_status || result.response_status;

    return {
      status: statusMap[responseStatus] || 'pending',
      rawResponse: result,
    };
  },
};
