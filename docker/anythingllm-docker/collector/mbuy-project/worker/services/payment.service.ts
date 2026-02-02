/**
 * Payment Service
 * Handles payment processing and payment methods
 */

import { eq, and, desc } from 'drizzle-orm';
import type { Database } from '../db';
import type { Env } from '../types';
import { payments, paymentMethods, type Payment, type NewPayment, type PaymentMethod, type NewPaymentMethod } from '../db/schema/payments';
import { orders } from '../db/schema/orders';

export interface ProcessPaymentInput {
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethodId?: string;
  provider?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  payment?: Payment;
  transactionId?: string;
  error?: string;
  redirectUrl?: string;
}

export class PaymentService {
  constructor(
    private db: Database,
    private env: Env
  ) {}

  /**
   * Get payment by ID
   */
  async getById(id: string): Promise<Payment | null> {
    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);

    return payment || null;
  }

  /**
   * Get payment by transaction ID
   */
  async getByTransactionId(transactionId: string): Promise<Payment | null> {
    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.gatewayTransactionId, transactionId))
      .limit(1);

    return payment || null;
  }

  /**
   * Get payments for an order
   */
  async getByOrderId(orderId: string): Promise<Payment[]> {
    return this.db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt));
  }

  /**
   * Process a payment
   */
  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    const { orderId, amount, currency = 'SAR', paymentMethodId, provider = 'moyasar', metadata } = input;

    try {
      // Get order
      const [order] = await this.db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Check if order is already paid
      if (order.paymentStatus === 'paid') {
        return { success: false, error: 'Order already paid' };
      }

      // Create pending payment record
      const [payment] = await this.db
        .insert(payments)
        .values({
          orderId,
          amount: String(amount),
          currency,
          status: 'pending',
          gateway: provider,
          method: paymentMethodId || 'card',
          metadata: metadata || {},
        })
        .returning();

      // Process based on provider
      let result: PaymentResult;
      
      switch (provider) {
        case 'moyasar':
          result = await this.processMoyasarPayment(payment, amount, currency);
          break;
        case 'tap':
          result = await this.processTapPayment(payment, amount, currency);
          break;
        case 'cod':
          result = await this.processCODPayment(payment);
          break;
        default:
          result = { success: false, error: 'Unknown payment provider' };
      }

      // Update payment status
      if (result.success && result.transactionId) {
        await this.db
          .update(payments)
          .set({
            status: 'completed',
            gatewayTransactionId: result.transactionId,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        // Update order payment status
        await this.db
          .update(orders)
          .set({
            paymentStatus: 'paid',
            paymentTransactionId: result.transactionId,
            paidAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
      } else if (!result.success && !result.redirectUrl) {
        await this.db
          .update(payments)
          .set({
            status: 'failed',
            failureMessage: result.error,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));
      }

      return { ...result, payment };
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  /**
   * Handle payment callback/webhook
   */
  async handleCallback(
    provider: string,
    data: Record<string, any>
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      switch (provider) {
        case 'moyasar':
          return await this.handleMoyasarCallback(data);
        case 'tap':
          return await this.handleTapCallback(data);
        default:
          return { success: false, error: 'Unknown provider' };
      }
    } catch (error) {
      console.error('Payment callback error:', error);
      return { success: false, error: 'Callback processing failed' };
    }
  }

  /**
   * Refund a payment
   */
  async refund(paymentId: string, amount?: number, reason?: string): Promise<PaymentResult> {
    const payment = await this.getById(paymentId);
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.status !== 'completed') {
      return { success: false, error: 'Payment not completed' };
    }

    const refundAmount = amount || parseFloat(payment.amount);

    try {
      // Process refund based on provider
      let refundResult: { success: boolean; transactionId?: string; error?: string };
      
      switch (payment.gateway) {
        case 'moyasar':
          refundResult = await this.refundMoyasar(payment.gatewayTransactionId!, refundAmount);
          break;
        case 'tap':
          refundResult = await this.refundTap(payment.gatewayTransactionId!, refundAmount);
          break;
        case 'cod':
          refundResult = { success: true, transactionId: `refund_${Date.now()}` };
          break;
        default:
          return { success: false, error: 'Unknown provider' };
      }

      if (refundResult.success) {
        // Create refund record
        const [refundPayment] = await this.db
          .insert(payments)
          .values({
            orderId: payment.orderId,
            amount: String(-refundAmount),
            currency: payment.currency,
            status: 'completed',
            gateway: payment.gateway,
            method: payment.method,
            gatewayTransactionId: refundResult.transactionId,
            metadata: { refundedPaymentId: payment.id, reason },
            completedAt: new Date(),
          })
          .returning();

        // Update original payment
        await this.db
          .update(payments)
          .set({
            status: 'refunded',
            refundedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(payments.id, paymentId));

        // Update order
        await this.db
          .update(orders)
          .set({
            paymentStatus: 'refunded',
            status: 'refunded',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, payment.orderId));

        return { success: true, payment: refundPayment };
      }

      return { success: false, error: refundResult.error };
    } catch (error) {
      console.error('Refund error:', error);
      return { success: false, error: 'Refund processing failed' };
    }
  }

  // ============ Payment Methods ============

  /**
   * Get customer payment methods
   */
  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    return this.db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.customerId, customerId),
          eq(paymentMethods.isVerified, true)
        )
      )
      .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt));
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(customerId: string, data: Omit<NewPaymentMethod, 'customerId'>): Promise<PaymentMethod> {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await this.db
        .update(paymentMethods)
        .set({ isDefault: false })
        .where(eq(paymentMethods.customerId, customerId));
    }

    const [method] = await this.db
      .insert(paymentMethods)
      .values({ ...data, customerId })
      .returning();

    return method;
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(customerId: string, methodId: string): Promise<boolean> {
    const result = await this.db
      .update(paymentMethods)
      .set({ isVerified: false, updatedAt: new Date() })
      .where(
        and(
          eq(paymentMethods.id, methodId),
          eq(paymentMethods.customerId, customerId)
        )
      );

    return (result as any).rowCount > 0;
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(customerId: string, methodId: string): Promise<PaymentMethod | null> {
    // Unset all defaults
    await this.db
      .update(paymentMethods)
      .set({ isDefault: false })
      .where(eq(paymentMethods.customerId, customerId));

    // Set the new default
    const [method] = await this.db
      .update(paymentMethods)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(
        and(
          eq(paymentMethods.id, methodId),
          eq(paymentMethods.customerId, customerId)
        )
      )
      .returning();

    return method || null;
  }

  // ============ Provider Implementations ============

  private async processMoyasarPayment(payment: Payment, amount: number, currency: string): Promise<PaymentResult> {
    // Moyasar integration
    // This is a simplified implementation - actual integration would use Moyasar API
    
    const MOYASAR_API_KEY = this.env.MOYASAR_SECRET_KEY;
    if (!MOYASAR_API_KEY) {
      // Return redirect URL for client-side payment
      return {
        success: false,
        redirectUrl: `https://pay.moyasar.com/checkout?amount=${amount * 100}&currency=${currency}&source[type]=creditcard`,
      };
    }

    try {
      // Server-side payment processing would go here
      // For now, return pending with redirect
      return {
        success: false,
        redirectUrl: `/payment/moyasar?payment_id=${payment.id}`,
      };
    } catch (error) {
      return { success: false, error: 'Moyasar payment failed' };
    }
  }

  private async processTapPayment(payment: Payment, amount: number, currency: string): Promise<PaymentResult> {
    // Tap Payments integration
    // Similar to Moyasar - simplified implementation
    
    return {
      success: false,
      redirectUrl: `/payment/tap?payment_id=${payment.id}`,
    };
  }

  private async processCODPayment(payment: Payment): Promise<PaymentResult> {
    // Cash on Delivery - no actual payment processing needed
    return {
      success: true,
      transactionId: `COD_${Date.now()}`,
    };
  }

  private async handleMoyasarCallback(data: Record<string, any>): Promise<{ success: boolean; orderId?: string; error?: string }> {
    const { id, status, source, amount, metadata } = data;
    
    if (status === 'paid') {
      // Find payment by metadata or transaction reference
      const paymentId = metadata?.payment_id;
      if (paymentId) {
        const payment = await this.getById(paymentId);
        if (payment) {
          await this.db
            .update(payments)
            .set({
              status: 'completed',
              gatewayTransactionId: id,
              completedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(payments.id, paymentId));

          await this.db
            .update(orders)
            .set({
              paymentStatus: 'paid',
              paymentTransactionId: id,
              paidAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(orders.id, payment.orderId));

          return { success: true, orderId: payment.orderId };
        }
      }
    }

    return { success: false, error: 'Payment not found or not paid' };
  }

  private async handleTapCallback(data: Record<string, any>): Promise<{ success: boolean; orderId?: string; error?: string }> {
    // Similar to Moyasar callback handling
    const { id, status, reference } = data;
    
    if (status === 'CAPTURED') {
      const payment = await this.getByTransactionId(reference);
      if (payment) {
        await this.db
          .update(payments)
          .set({
            status: 'completed',
            gatewayTransactionId: id,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        return { success: true, orderId: payment.orderId };
      }
    }

    return { success: false, error: 'Payment not found or not captured' };
  }

  private async refundMoyasar(transactionId: string, amount: number): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Moyasar refund API call would go here
    return { success: true, transactionId: `refund_moyasar_${Date.now()}` };
  }

  private async refundTap(transactionId: string, amount: number): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Tap refund API call would go here
    return { success: true, transactionId: `refund_tap_${Date.now()}` };
  }
}
