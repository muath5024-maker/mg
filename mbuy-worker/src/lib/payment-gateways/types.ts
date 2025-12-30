/**
 * Payment Gateway Types
 * 
 * نظام موحد لجميع بوابات الدفع
 * Moyasar, Tap, PayTabs, HyperPay
 */

// =============================================================================
// البوابات المدعومة
// =============================================================================

export type PaymentGateway = 'moyasar' | 'tap' | 'paytabs' | 'hyperpay';

// =============================================================================
// إعدادات البوابة لكل تاجر
// =============================================================================

export interface GatewayCredentials {
  publishableKey: string;      // Public Key / Profile ID / Entity ID
  secretKey: string;           // Secret Key / Server Key / Access Token
  webhookSecret?: string;      // Webhook Secret (optional)
  merchantId?: string;         // بعض البوابات تحتاجه
  testMode?: boolean;
  [key: string]: any;          // للبيانات الإضافية
}

// =============================================================================
// طلب إنشاء دفعة
// =============================================================================

export interface CustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export interface CreatePaymentRequest {
  amount: number;              // بالهللة (SAR * 100)
  currency: string;            // SAR, USD, etc
  orderId: string;             // معرف الطلب
  description?: string;        // وصف الدفعة
  customer?: CustomerInfo;     // معلومات العميل
  callbackUrl: string;         // رابط Webhook
  successUrl?: string;         // رابط النجاح
  failureUrl?: string;         // رابط الفشل
  metadata?: Record<string, any>;
}

// =============================================================================
// استجابة إنشاء دفعة
// =============================================================================

export interface CreatePaymentResponse {
  success: boolean;
  transactionId: string;       // معرف المعاملة في البوابة
  paymentUrl: string;          // رابط صفحة الدفع
  expiresAt?: string;          // تاريخ انتهاء الصلاحية
  rawResponse?: any;           // الاستجابة الكاملة من البوابة
}

// =============================================================================
// حالات الدفع
// =============================================================================

export type PaymentStatus = 
  | 'pending'     // قيد الانتظار
  | 'authorized'  // تم التفويض (لم يُخصم)
  | 'paid'        // تم الدفع
  | 'captured'    // تم الخصم
  | 'failed'      // فشل
  | 'refunded'    // مُسترجع
  | 'cancelled';  // ملغي

// =============================================================================
// إشعار Webhook
// =============================================================================

export interface WebhookPayload {
  gateway: PaymentGateway;
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  orderId?: string;
  metadata?: Record<string, any>;
  rawPayload: any;
}

// =============================================================================
// استرجاع (Refund)
// =============================================================================

export interface RefundRequest {
  transactionId: string;
  orderId?: string;           // معرف الطلب (للتتبع)
  amount?: number;            // للاسترجاع الجزئي، إذا فارغ = كامل
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  rawResponse?: any;
}

// =============================================================================
// Gateway Interface - كل بوابة تُنفذ هذا
// =============================================================================

export interface PaymentGatewayInterface {
  /**
   * اسم البوابة
   */
  name: PaymentGateway;

  /**
   * إنشاء دفعة جديدة
   */
  createPayment(
    credentials: GatewayCredentials,
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse>;

  /**
   * معالجة Webhook
   */
  parseWebhook(
    payload: any,
    headers: Record<string, string>,
    credentials: GatewayCredentials
  ): WebhookPayload;

  /**
   * التحقق من صحة Webhook (التوقيع)
   */
  verifyWebhook(
    payload: any,
    headers: Record<string, string>,
    credentials: GatewayCredentials
  ): boolean;

  /**
   * استرجاع مبلغ
   */
  refund(
    credentials: GatewayCredentials,
    request: RefundRequest
  ): Promise<RefundResponse>;

  /**
   * الحصول على حالة معاملة
   */
  getPaymentStatus(
    credentials: GatewayCredentials,
    transactionId: string
  ): Promise<{ status: PaymentStatus; rawResponse: any }>;
}
