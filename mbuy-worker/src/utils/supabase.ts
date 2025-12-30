/**
 * Supabase ADMIN Client for MBUY Worker
 * Creates Supabase client using SERVICE_ROLE_KEY (bypasses RLS)
 * 
 * ⚠️ CRITICAL: This client BYPASSES all Row Level Security (RLS) policies
 * 
 * Use this client ONLY for:
 * - Admin operations that need unrestricted access
 * - System-level operations (cron jobs, background tasks)
 * - Operations that manage users across the system
 * 
 * DO NOT use for regular user operations - use createUserSupabaseClient() instead
 * 
 * @deprecated for user operations - Use createUserSupabaseClient() from supabaseUser.ts
 */

import { Env } from '../types';

/**
 * Create Supabase ADMIN client with Service Role Key
 * This client bypasses RLS and should ONLY be used for admin/system operations
 * 
 * @param env - Worker environment variables
 * @returns Admin Supabase client (bypasses RLS)
 */
export function createSupabaseClient(env: Env) {
  const supabaseUrl = env.SUPABASE_URL;
  // Support both SUPABASE_SERVICE_ROLE_KEY and SUPABASE_SERVICE_KEY for backward compatibility
  const serviceRoleKey = (env as any).SUPABASE_SERVICE_ROLE_KEY || (env as any).SUPABASE_SERVICE_KEY;

  // Debug logging (remove in production)
  console.log('[Supabase Client] SUPABASE_URL present:', !!supabaseUrl);
  console.log('[Supabase Client] SUPABASE_SERVICE_ROLE_KEY present:', !!(env as any).SUPABASE_SERVICE_ROLE_KEY);
  console.log('[Supabase Client] SUPABASE_SERVICE_KEY present:', !!(env as any).SUPABASE_SERVICE_KEY);
  console.log('[Supabase Client] Service Role Key length:', serviceRoleKey?.length || 0);
  console.log('[Supabase Client] Service Role Key starts with:', serviceRoleKey?.substring(0, 20) || 'N/A');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY');
  }

  // Return a simple fetch-based client for Supabase REST API
  // Since we're in a Worker environment, we'll use direct REST calls
  return {
    url: supabaseUrl,
    key: serviceRoleKey,
    
    /**
     * Execute a query against Supabase REST API
     */
    async query(table: string, options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      select?: string;
      filters?: Record<string, any>;
      body?: any;
      single?: boolean;
    } = {}) {
      const {
        method = 'GET',
        select = '*',
        filters = {},
        body,
        single = false,
      } = options;

      let url = `${supabaseUrl}/rest/v1/${table}`;
      
      const queryParams = new URLSearchParams();
      
      // Add select (بدون encode لأن Supabase يتعامل مع الأقواس والفواصل مباشرة)
      if (select) {
        queryParams.append('select', select);
      }

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, `eq.${value}`);
        }
      });

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      // Use Service Role Key in both apikey and Authorization headers
      // This bypasses RLS and allows full access to tables
      const headers: Record<string, string> = {
        'apikey': serviceRoleKey, // Service role key for apikey
        'Authorization': `Bearer ${serviceRoleKey}`, // Service role key for Authorization
        'Content-Type': 'application/json',
      };

      if (single && method === 'GET') {
        headers['Prefer'] = 'return=representation';
      } else if (method === 'POST' || method === 'PATCH') {
        headers['Prefer'] = 'return=representation';
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supabase query failed: ${response.status} ${errorText}`);
      }

      if (method === 'DELETE') {
        return null;
      }

      const data = await response.json();
      return single ? (Array.isArray(data) ? data[0] : data) : data;
    },

    /**
     * Insert a record
     */
    async insert(table: string, data: any) {
      return this.query(table, {
        method: 'POST',
        body: data,
        single: true,
      });
    },

    /**
     * Update a record
     */
    async update(table: string, id: string, data: any) {
      // Ensure id is string (UUID)
      const idStr = id as string;
      const url = `${supabaseUrl}/rest/v1/${table}?id=eq.${idStr}`;
      const headers: Record<string, string> = {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supabase update failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return Array.isArray(result) ? result[0] : result;
    },

    /**
     * Delete a record
     */
    async delete(table: string, id: string) {
      return this.query(table, {
        method: 'DELETE',
        filters: { id: `eq.${id}` },
      });
    },

    /**
     * Find a record by ID
     */
    async findById(table: string, id: string, select = '*') {
      // Ensure id is string (UUID)
      const idStr = id as string;
      const result = await this.query(table, {
        method: 'GET',
        select,
        filters: { id: idStr },
        single: true,
      });
      return result;
    },

    /**
     * Find a record by email (for users table)
     */
    async findByEmail(table: string, email: string, select = '*') {
      const result = await this.query(table, {
        method: 'GET',
        select,
        filters: { email },
        single: true,
      });
      return result;
    },

    /**
     * Find a record by a specific column (e.g., mbuy_user_id)
     */
    async findByColumn(table: string, column: string, value: string, select = '*') {
      const result = await this.query(table, {
        method: 'GET',
        select,
        filters: { [column]: value },
        single: true,
      });
      return result;
    },
  };
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;

/**
 * Alias for backward compatibility
 */
export const getSupabaseClient = createSupabaseClient;

