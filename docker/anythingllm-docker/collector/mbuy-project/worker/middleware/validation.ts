/**
 * Input Validation Middleware using Zod
 * Validates request bodies against schemas
 */

import { z } from 'zod';
import { Context } from 'hono';

// ============================================================================
// Common Schemas
// ============================================================================

export const UUIDSchema = z.string().uuid('Invalid UUID format');
export const PositiveIntSchema = z.number().int().positive('Must be positive integer');
export const NonEmptyStringSchema = z.string().min(1, 'Cannot be empty');

// ============================================================================
// Auth Schemas
// ============================================================================

export const InitializeUserSchema = z.object({
  role: z.enum(['customer', 'merchant']),
  display_name: NonEmptyStringSchema.max(100),
});

// ============================================================================
// Notifications Schemas
// ============================================================================

export const RegisterFCMTokenSchema = z.object({
  fcm_token: NonEmptyStringSchema.max(500),
  device_type: z.enum(['android', 'ios', 'web', 'mobile']).default('mobile'),
});

// ============================================================================
// Points Schemas
// ============================================================================

export const CreatePointsAccountSchema = z.object({
  initial_balance: z.number().int().nonnegative().default(0),
});

export const SpendPointsSchema = z.object({
  feature_key: NonEmptyStringSchema.max(50),
  cost: PositiveIntSchema.optional(), // Optional - will be fetched from feature_actions if not provided
  meta: z.record(z.string(), z.unknown()).optional().default({}),
});

export const PurchasePointsSchema = z.object({
  points: PositiveIntSchema,
  payment_method: z.enum(['wallet', 'credit_card']).default('wallet'),
  meta: z.record(z.string(), z.unknown()).optional().default({}),
});

// ============================================================================
// Orders Schemas
// ============================================================================

export const CreateOrderFromCartSchema = z.object({
  // cart_id is no longer required - we use user_id directly from JWT
  delivery_address: NonEmptyStringSchema.max(500),
  payment_method: z.enum(['wallet', 'credit_card', 'cash_on_delivery']),
  total_amount: z.number().positive('Total amount must be positive'),
});

// ============================================================================
// Products Schemas
// ============================================================================

export const ProductQuerySchema = z.object({
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  category_id: UUIDSchema.optional(),
  store_id: UUIDSchema.optional(),
  search: z.string().max(200).optional(),
});

// ============================================================================
// Validation Middleware Factory
// ============================================================================

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: () => Promise<void>) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);
      
      // Store validated data in context
      c.set('validatedBody', validated);
      
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            ok: false,
            error: 'Validation failed',
            error_code: 'VALIDATION_ERROR',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          400
        );
      }
      
      // Re-throw non-validation errors
      throw error;
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: () => Promise<void>) => {
    try {
      const query = c.req.query();
      
      // List of ID fields that should NEVER be converted to numbers (must remain as strings/UUIDs)
      const idFields = [
        'id', 'category_id', 'store_id', 'user_id', 'owner_id', 'product_id',
        'order_id', 'cart_id', 'review_id', 'coupon_id', 'banner_id', 'video_id',
        'notification_id', 'favorite_id', 'cart_item_id', 'order_item_id',
        'merchant_id', 'customer_id', 'profile_id', 'mbuy_user_id'
      ];
      
      // Convert numeric strings to numbers, but preserve ID fields as strings
      const processedQuery: Record<string, any> = {};
      for (const [key, value] of Object.entries(query)) {
        // Never convert ID fields to numbers - they must remain as strings (UUIDs)
        if (idFields.includes(key) || key.endsWith('_id')) {
          processedQuery[key] = value;
        } else if (value && !isNaN(Number(value)) && value.trim() !== '') {
          // Only convert to number if it's a pure numeric string (not a UUID)
          // UUIDs contain hyphens, so they won't pass isNaN check properly
          // But to be safe, check if it looks like a UUID (contains hyphens)
          if (typeof value === 'string' && value.includes('-')) {
            // Likely a UUID, keep as string
            processedQuery[key] = value;
          } else {
            processedQuery[key] = Number(value);
          }
        } else {
          processedQuery[key] = value;
        }
      }
      
      const validated = schema.parse(processedQuery);
      c.set('validatedQuery', validated);
      
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            ok: false,
            error: 'Invalid query parameters',
            error_code: 'VALIDATION_ERROR',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          400
        );
      }
      
      throw error;
    }
  };
}


