/**
 * Tap Payments Gateway
 * 
 * بوابة دفع شهيرة في الخليج
 * https://tap.company
 * 
 * تدعم:
 * - مدى
 * - Visa/MasterCard
 * - Apple Pay
 * - KNET
 * - Benefit
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

const TAP_API_URL = 'https://api.tap.company/v2';

// =============================================================================
// Tap Gateway Implementation
// =============================================================================

export const TapGateway: PaymentGatewayInterface = {
  name: 'tap',

  /**
   * إنشاء دفعة جديدة (Charge)
   */
  async createPayment(
    credentials: GatewayCredentials,
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    const response = await fetch(`${TAP_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: request.amount / 100, // Tap يقبل المبلغ بالريال (نحوله من الهللة)
        currency: request.currency || 'SAR',
        threeDSecure: true,
        save_card: false,
        description: request.description || `Order ${request.orderId}`,
        statement_descriptor: request.description?.substring(0, 22) || 'MBUY Order',
        metadata: {
          order_id: request.orderId,
          ...request.metadata,
        },
        reference: {
          transaction: request.orderId,
          order: request.orderId,
        },
        receipt: {
          email: true,
          sms: true,
        },
        customer: request.customer ? {
          first_name: request.customer.name?.split(' ')[0] || 'Customer',
          last_name: request.customer.name?.split(' ').slice(1).join(' ') || '',
          email: request.customer.email || '',
          phone: request.customer.phone ? {
            country_code: '966',
            number: request.customer.phone.replace(/^\+?966/, ''),
          } : undefined,
        } : undefined,
        source: { id: 'src_all' }, // جميع طرق الدفع المتاحة
        redirect: {
          url: request.callbackUrl,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Tap Error: ${JSON.stringify(error)}`);
    }

    const charge = await response.json() as any;

    return {
      success: true,
      transactionId: charge.id,
      paymentUrl: charge.transaction?.url || charge.redirect?.url,
      rawResponse: charge,
    };
  },

  /**
   * معالجة Webhook
   */
  parseWebhook(
    payload: any,
    _headers: Record<string, string>,
    _credentials: GatewayCredentials
  ): WebhookPayload {
    const statusMap: Record<string, PaymentStatus> = {
      'INITIATED': 'pending',
      'CAPTURED': 'paid',
      'AUTHORIZED': 'authorized',
      'FAILED': 'failed',
      'CANCELLED': 'cancelled',
      'DECLINED': 'failed',
      'RESTRICTED': 'failed',
      'TIMEDOUT': 'failed',
      'UNKNOWN': 'pending',
      'VOIDED': 'cancelled',
      'REFUNDED': 'refunded',
      'PARTIALLY_REFUNDED': 'refunded',
    };

    // Tap يرسل المبلغ بالريال، نحوله للهللة
    const amountInHalalas = Math.round((payload.amount || 0) * 100);

    return {
      gateway: 'tap',
      transactionId: payload.id,
      status: statusMap[payload.status] || 'pending',
      amount: amountInHalalas,
      currency: payload.currency || 'SAR',
      orderId: payload.metadata?.order_id || payload.reference?.order,
      metadata: payload.metadata,
      rawPayload: payload,
    };
  },

  /**
   * التحقق من صحة Webhook
   * Tap يستخدم HMAC SHA256
   */
  verifyWebhook(
    payload: any,
    headers: Record<string, string>,
    credentials: GatewayCredentials
  ): boolean {
    if (!credentials.webhookSecret) return true;

    const signature = headers['hashstring'] || headers['Hashstring'];
    if (!signature) return false;

    // Tap يوقع بـ: id + amount + currency + gateway_response.code + response.code + created
    const signatureData = `${payload.id}${payload.amount}${payload.currency}${payload.gateway_response?.code || ''}${payload.response?.code || ''}${payload.created}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', credentials.webhookSecret)
      .update(signatureData)
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
    const response = await fetch(`${TAP_API_URL}/refunds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        charge_id: request.transactionId,
        amount: request.amount ? request.amount / 100 : undefined, // بالريال
        reason: request.reason || 'requested_by_customer',
        metadata: {
          order_id: request.orderId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Tap Refund Error: ${JSON.stringify(error)}`);
    }

    const refund = await response.json() as any;

    return {
      success: true,
      refundId: refund.id,
      amount: Math.round((refund.amount || 0) * 100), // نعيده بالهللة
      status: refund.status === 'CAPTURED' ? 'completed' : 'pending',
      rawResponse: refund,
    };
  },

  /**
   * الحصول على حالة معاملة
   */
  async getPaymentStatus(
    credentials: GatewayCredentials,
    transactionId: string
  ): Promise<{ status: PaymentStatus; rawResponse: any }> {
    const response = await fetch(`${TAP_API_URL}/charges/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${credentials.secretKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get payment status from Tap');
    }

    const charge = await response.json() as any;

    const statusMap: Record<string, PaymentStatus> = {
      'INITIATED': 'pending',
      'CAPTURED': 'paid',
      'AUTHORIZED': 'authorized',
      'FAILED': 'failed',
      'CANCELLED': 'cancelled',
      'DECLINED': 'failed',
      'RESTRICTED': 'failed',
      'TIMEDOUT': 'failed',
      'VOIDED': 'cancelled',
      'REFUNDED': 'refunded',
      'PARTIALLY_REFUNDED': 'refunded',
    };

    return {
      status: statusMap[charge.status] || 'pending',
      rawResponse: charge,
    };
  },
};
