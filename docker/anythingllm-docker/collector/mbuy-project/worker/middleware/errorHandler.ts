/**
 * Unified Error Handler Middleware
 * Provides consistent error responses across all endpoints
 */

import { MiddlewareHandler } from 'hono';
import { logError } from '../utils/logging';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export class ApiErrorHandler {
  static badRequest(message: string, details?: any): ApiError {
    return {
      code: 'BAD_REQUEST',
      message,
      details,
      statusCode: 400
    };
  }

  static unauthorized(message: string = 'Authentication required'): ApiError {
    return {
      code: 'UNAUTHORIZED',
      message,
      statusCode: 401
    };
  }

  static forbidden(message: string = 'Access denied'): ApiError {
    return {
      code: 'FORBIDDEN',
      message,
      statusCode: 403
    };
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return {
      code: 'NOT_FOUND',
      message,
      statusCode: 404
    };
  }

  static conflict(message: string, details?: any): ApiError {
    return {
      code: 'CONFLICT',
      message,
      details,
      statusCode: 409
    };
  }

  static internal(message: string = 'Internal server error', details?: any): ApiError {
    return {
      code: 'INTERNAL_ERROR',
      message,
      details,
      statusCode: 500
    };
  }

  static fromSupabaseError(error: any): ApiError {
    // Map common Supabase errors to our error codes
    if (error.message?.includes('duplicate key')) {
      return this.conflict('Resource already exists');
    }
    if (error.message?.includes('violates foreign key')) {
      return this.badRequest('Invalid reference');
    }
    if (error.message?.includes('violates not-null')) {
      return this.badRequest('Required field is missing');
    }
    if (error.message?.includes('JWT')) {
      return this.unauthorized('Invalid or expired token');
    }

    return this.internal('Database error', error.message);
  }
}

// Error response middleware
export const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next();
  } catch (error: any) {
    // Log the error
    console.error('Unhandled error in request', {
      error: error.message,
      stack: error.stack,
      endpoint: c.req.path,
      method: c.req.method,
      requestId: c.get('requestId')
    });

    // Return standardized error response
    const apiError = ApiErrorHandler.internal('An unexpected error occurred');

    return c.json({
      success: false,
      error: apiError.code,
      message: apiError.message,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    }, apiError.statusCode as any);
  }
};

// Helper function to create standardized API responses
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: ApiError,
  meta?: any
) {
  const response: any = {
    success,
    timestamp: new Date().toISOString(),
  };

  if (success && data !== undefined) {
    response.data = data;
  }

  if (!success && error) {
    response.error = {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details })
    };
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
}

// Helper function to handle async operations with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<{ success: true; data: T } | { success: false; error: ApiError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error: any) {
    console.error(`Error in ${context}`, {
      error: error.message,
      stack: error.stack
    });

    let apiError: ApiError;
    if (error.code && error.message) {
      // Already an ApiError
      apiError = error;
    } else {
      // Convert to ApiError
      apiError = ApiErrorHandler.fromSupabaseError(error);
    }

    return { success: false, error: apiError };
  }
}