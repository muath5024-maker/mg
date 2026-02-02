/**
 * Supabase Client Helper for MBUY Worker
 * 
 * Provides typed access to Supabase REST API
 * Using service_role key for server-side operations
 */

import { Env } from '../types';
import { Database } from './database.types';

// ============================================
// TYPES
// ============================================

export interface SupabaseQueryOptions {
  select?: string;
  limit?: number;
  offset?: number;
  order?: string;
  single?: boolean;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
  count?: number;
}

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

// ============================================
// SUPABASE CLIENT CLASS
// ============================================

export class SupabaseClient {
  private baseUrl: string;
  private apiKey: string;
  private authHeader: string;

  constructor(env: Env) {
    this.baseUrl = env.SUPABASE_URL;
    this.apiKey = env.SUPABASE_SERVICE_ROLE_KEY;
    this.authHeader = `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`;
  }

  /**
   * Get default headers for Supabase requests
   */
  private getHeaders(prefer?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
      'Authorization': this.authHeader,
    };
    
    if (prefer) {
      headers['Prefer'] = prefer;
    }
    
    return headers;
  }

  /**
   * Build query string from filters
   */
  private buildQueryString(filters: Record<string, any>, options?: SupabaseQueryOptions): string {
    const params = new URLSearchParams();
    
    // Add filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    }
    
    // Add options
    if (options?.select) {
      params.append('select', options.select);
    }
    if (options?.limit) {
      params.append('limit', String(options.limit));
    }
    if (options?.offset) {
      params.append('offset', String(options.offset));
    }
    if (options?.order) {
      params.append('order', options.order);
    }
    
    return params.toString();
  }

  /**
   * Parse Supabase error from response
   */
  private async parseError(response: Response): Promise<SupabaseError> {
    try {
      const error = await response.json() as Record<string, unknown>;
      return {
        message: (error.message as string) || (error.error as string) || 'Unknown error',
        code: error.code as string | undefined,
        details: error.details as string | undefined,
        hint: error.hint as string | undefined,
      };
    } catch {
      return {
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * SELECT - Get records from a table
   */
  async select<T>(
    table: string,
    filters: Record<string, any> = {},
    options?: SupabaseQueryOptions
  ): Promise<SupabaseResponse<T[]>> {
    const queryString = this.buildQueryString(filters, options);
    const url = `${this.baseUrl}/rest/v1/${table}${queryString ? `?${queryString}` : ''}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        const error = await this.parseError(response);
        return { data: null, error };
      }
      
      const data = await response.json() as T[];
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Network error' },
      };
    }
  }

  /**
   * SELECT SINGLE - Get a single record
   */
  async selectSingle<T>(
    table: string,
    filters: Record<string, any> = {},
    options?: Omit<SupabaseQueryOptions, 'single'>
  ): Promise<SupabaseResponse<T>> {
    const result = await this.select<T>(table, filters, { ...options, limit: 1 });
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    if (!result.data || result.data.length === 0) {
      return { data: null, error: null };
    }
    
    return { data: result.data[0], error: null };
  }

  /**
   * INSERT - Create new record(s)
   */
  async insert<T>(
    table: string,
    data: Partial<T> | Partial<T>[],
    options?: { returning?: boolean }
  ): Promise<SupabaseResponse<T[]>> {
    const url = `${this.baseUrl}/rest/v1/${table}`;
    const prefer = options?.returning !== false ? 'return=representation' : undefined;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(prefer),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await this.parseError(response);
        return { data: null, error };
      }
      
      if (options?.returning === false) {
        return { data: [] as T[], error: null };
      }
      
      const result = await response.json() as T[];
      return { data: result, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Network error' },
      };
    }
  }

  /**
   * INSERT SINGLE - Create a single record and return it
   */
  async insertSingle<T>(
    table: string,
    data: Partial<T>
  ): Promise<SupabaseResponse<T>> {
    const result = await this.insert<T>(table, data, { returning: true });
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    if (!result.data || result.data.length === 0) {
      return { data: null, error: { message: 'No data returned' } };
    }
    
    return { data: result.data[0], error: null };
  }

  /**
   * UPDATE - Update existing record(s)
   */
  async update<T>(
    table: string,
    filters: Record<string, any>,
    data: Partial<T>,
    options?: { returning?: boolean }
  ): Promise<SupabaseResponse<T[]>> {
    const queryString = this.buildQueryString(filters);
    const url = `${this.baseUrl}/rest/v1/${table}${queryString ? `?${queryString}` : ''}`;
    const prefer = options?.returning !== false ? 'return=representation' : undefined;
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(prefer),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await this.parseError(response);
        return { data: null, error };
      }
      
      if (options?.returning === false) {
        return { data: [] as T[], error: null };
      }
      
      const result = await response.json() as T[];
      return { data: result, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Network error' },
      };
    }
  }

  /**
   * UPDATE SINGLE - Update a single record
   */
  async updateSingle<T>(
    table: string,
    id: string,
    data: Partial<T>
  ): Promise<SupabaseResponse<T>> {
    const result = await this.update<T>(table, { 'id': `eq.${id}` }, data, { returning: true });
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    if (!result.data || result.data.length === 0) {
      return { data: null, error: { message: 'Record not found' } };
    }
    
    return { data: result.data[0], error: null };
  }

  /**
   * DELETE - Remove record(s)
   */
  async delete<T>(
    table: string,
    filters: Record<string, any>,
    options?: { returning?: boolean }
  ): Promise<SupabaseResponse<T[]>> {
    const queryString = this.buildQueryString(filters);
    const url = `${this.baseUrl}/rest/v1/${table}${queryString ? `?${queryString}` : ''}`;
    const prefer = options?.returning !== false ? 'return=representation' : undefined;
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(prefer),
      });
      
      if (!response.ok) {
        const error = await this.parseError(response);
        return { data: null, error };
      }
      
      if (options?.returning === false) {
        return { data: [] as T[], error: null };
      }
      
      const result = await response.json() as T[];
      return { data: result, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Network error' },
      };
    }
  }

  /**
   * DELETE SINGLE - Remove a single record by ID
   */
  async deleteSingle<T>(
    table: string,
    id: string
  ): Promise<SupabaseResponse<T>> {
    const result = await this.delete<T>(table, { 'id': `eq.${id}` }, { returning: true });
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    if (!result.data || result.data.length === 0) {
      return { data: null, error: { message: 'Record not found' } };
    }
    
    return { data: result.data[0], error: null };
  }

  // ============================================
  // RPC - Call database functions
  // ============================================

  /**
   * Call a Supabase RPC function
   */
  async rpc<T>(
    functionName: string,
    params?: Record<string, any>
  ): Promise<SupabaseResponse<T>> {
    const url = `${this.baseUrl}/rest/v1/rpc/${functionName}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: params ? JSON.stringify(params) : undefined,
      });
      
      if (!response.ok) {
        const error = await this.parseError(response);
        return { data: null, error };
      }
      
      const data = await response.json() as T;
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Network error' },
      };
    }
  }

  // ============================================
  // RAW QUERY - For complex queries
  // ============================================

  /**
   * Execute a raw query (for complex SELECT with joins, etc.)
   */
  async raw<T>(
    table: string,
    queryString: string
  ): Promise<SupabaseResponse<T[]>> {
    const url = `${this.baseUrl}/rest/v1/${table}?${queryString}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        const error = await this.parseError(response);
        return { data: null, error };
      }
      
      const data = await response.json() as T[];
      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Network error' },
      };
    }
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Create a new Supabase client instance
 */
export function createSupabaseClient(env: Env): SupabaseClient {
  return new SupabaseClient(env);
}

// ============================================
// TABLE-SPECIFIC HELPERS
// ============================================

/**
 * Type-safe table names
 */
export const Tables = {
  // User Management
  customers: 'customers',
  merchants: 'merchants',
  merchant_users: 'merchant_users',
  admin_staff: 'admin_staff',
  admin_roles: 'admin_roles',
  admin_staff_roles: 'admin_staff_roles',
  admin_role_permissions: 'admin_role_permissions',
  admin_activity_logs: 'admin_activity_logs',
  
  // Products
  products: 'products',
  product_variants: 'product_variants',
  product_categories: 'product_categories',
  product_category_assignments: 'product_category_assignments',
  product_media: 'product_media',
  product_options: 'product_options',
  product_option_values: 'product_option_values',
  product_attributes: 'product_attributes',
  product_attribute_values: 'product_attribute_values',
  product_pricing: 'product_pricing',
  product_inventory_settings: 'product_inventory_settings',
  
  // Orders
  orders: 'orders',
  order_items: 'order_items',
  order_addresses: 'order_addresses',
  order_payments: 'order_payments',
  order_shipments: 'order_shipments',
  order_refunds: 'order_refunds',
  order_status_history: 'order_status_history',
  
  // Customer
  customer_addresses: 'customer_addresses',
  customer_segments: 'customer_segments',
  customer_tags: 'customer_tags',
  customer_tag_assignments: 'customer_tag_assignments',
  
  // Inventory
  inventory_items: 'inventory_items',
  inventory_movements: 'inventory_movements',
  inventory_reservations: 'inventory_reservations',
  inventory_batches: 'inventory_batches',
  warehouses: 'warehouses',
  warehouse_locations: 'warehouse_locations',
  
  // Payments
  payment_providers: 'payment_providers',
  payment_methods: 'payment_methods',
  payment_transactions: 'payment_transactions',
  payment_logs: 'payment_logs',
  
  // Shipping
  shipping_providers: 'shipping_providers',
  shipping_zones: 'shipping_zones',
  shipping_rates: 'shipping_rates',
  shipping_labels: 'shipping_labels',
  shipping_pickups: 'shipping_pickups',
  
  // Marketing
  coupons: 'coupons',
  coupon_uses: 'coupon_uses',
  marketing_campaigns: 'marketing_campaigns',
  marketing_coupons: 'marketing_coupons',
  marketing_discounts: 'marketing_discounts',
  
  // Analytics
  analytics_events: 'analytics_events',
  analytics_daily: 'analytics_daily',
  analytics_products: 'analytics_products',
  analytics_customers: 'analytics_customers',
  
  // Reviews
  reviews: 'reviews',
  review_media: 'review_media',
  review_replies: 'review_replies',
  
  // Support
  support_tickets: 'support_tickets',
  support_messages: 'support_messages',
  support_categories: 'support_categories',
  support_articles: 'support_articles',
  
  // Settings
  merchant_settings: 'merchant_settings',
  merchant_billing: 'merchant_billing',
  settings_taxes: 'settings_taxes',
  settings_currency: 'settings_currency',
  settings_localization: 'settings_localization',
  settings_checkout: 'settings_checkout',
  
  // Webhooks
  webhooks_endpoints: 'webhooks_endpoints',
  webhooks_logs: 'webhooks_logs',
  
  // Logs
  audit_logs: 'audit_logs',
} as const;

export type TableName = typeof Tables[keyof typeof Tables];
