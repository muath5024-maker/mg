/**
 * ADMIN MODE Supabase Client for MBUY Worker
 * Uses SERVICE_ROLE_KEY to bypass RLS policies
 * 
 * ⚠️ CRITICAL WARNING: This client bypasses ALL RLS policies!
 * 
 * ONLY USE FOR:
 * - /internal/* routes
 * - /admin/* routes  
 * - /cron/* scheduled tasks
 * - /webhooks/* external callbacks
 * - System-wide operations (reports, cleanup, bulk updates)
 * 
 * NEVER USE FOR:
 * - User-facing endpoints (/secure/*, /public/*)
 * - Any operation tied to a specific user
 * - Customer or merchant data access
 * 
 * ALWAYS PROTECT WITH:
 * - adminAuthMiddleware
 * - X-Admin-Secret header
 * - IP whitelist (optional)
 */

import { Env } from '../types';

/**
 * Create Supabase client for ADMIN MODE operations
 * This client uses service role key and bypasses RLS
 * 
 * @param env - Worker environment variables
 * @returns Supabase client with full database access
 */
export function createAdminSupabaseClient(env: Env) {
  const supabaseUrl = env.SUPABASE_URL;
  const serviceRoleKey = (env as any).SUPABASE_SERVICE_ROLE_KEY || (env as any).SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('[Admin Mode] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  // ⚠️ Log every admin client creation for audit trail
  console.warn('🔐 ==============================================');
  console.warn('🔐 ADMIN MODE CLIENT CREATED');
  console.warn('🔐 RLS BYPASSED - FULL DATABASE ACCESS');
  console.warn('🔐 Ensure this is an authorized admin operation!');
  console.warn('🔐 ==============================================');

  return {
    url: supabaseUrl,
    key: serviceRoleKey,
    mode: 'admin' as const,
    
    /**
     * Execute a query against Supabase REST API
     * ⚠️ BYPASSES RLS - Use with extreme caution!
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
      
      // Add select
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

      // ⚠️ ADMIN MODE: Use SERVICE_ROLE_KEY
      // This bypasses RLS and grants full access
      const headers: Record<string, string> = {
        'apikey': serviceRoleKey, // ⚠️ Service role key
        'Authorization': `Bearer ${serviceRoleKey}`, // ⚠️ Service role key
        'Content-Type': 'application/json',
      };

      if (single && method === 'GET') {
        headers['Prefer'] = 'return=representation';
      } else if (method === 'POST' || method === 'PATCH') {
        headers['Prefer'] = 'return=representation';
      }

      // Log every admin query for audit
      console.log('[Admin Mode Client] Query:', {
        table,
        method,
        hasFilters: Object.keys(filters).length > 0,
        timestamp: new Date().toISOString(),
      });

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorDetail;
        try {
          errorDetail = JSON.parse(errorText);
        } catch {
          errorDetail = { message: errorText };
        }
        
        console.error('[Admin Mode Client] Query failed:', {
          table,
          method,
          status: response.status,
          error: errorDetail,
        });
        
        throw new Error(`Supabase admin query failed: ${response.status} ${errorText}`);
      }

      if (method === 'DELETE') {
        return null;
      }

      const data = await response.json();
      return single ? (Array.isArray(data) ? data[0] : data) : data;
    },

    /**
     * Insert a record with admin privileges
     * ⚠️ BYPASSES RLS
     */
    async insert(table: string, data: any) {
      console.warn(`[Admin Mode Client] INSERT into ${table} (RLS bypassed)`);
      return this.query(table, {
        method: 'POST',
        body: data,
        single: true,
      });
    },

    /**
     * Update a record with admin privileges
     * ⚠️ BYPASSES RLS
     */
    async update(table: string, id: string, data: any) {
      console.warn(`[Admin Mode Client] UPDATE ${table} id=${id} (RLS bypassed)`);
      
      const url = `${supabaseUrl}/rest/v1/${table}?id=eq.${id}`;
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
        console.error('[Admin Mode Client] Update failed:', {
          table,
          id,
          status: response.status,
          error: errorText,
        });
        throw new Error(`Supabase admin update failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return Array.isArray(result) ? result[0] : result;
    },

    /**
     * Delete a record with admin privileges
     * ⚠️ BYPASSES RLS
     */
    async delete(table: string, id: string) {
      console.warn(`[Admin Mode Client] DELETE from ${table} id=${id} (RLS bypassed)`);
      return this.query(table, {
        method: 'DELETE',
        filters: { id: `eq.${id}` },
      });
    },

    /**
     * Find a record by ID with admin access
     * ⚠️ BYPASSES RLS - Can access any record
     */
    async findById(table: string, id: string, select = '*') {
      const result = await this.query(table, {
        method: 'GET',
        select,
        filters: { id },
        single: true,
      });
      return result;
    },

    /**
     * Find a record by email with admin access
     * ⚠️ BYPASSES RLS - Can access any user
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
     * Find a record by a specific column with admin access
     * ⚠️ BYPASSES RLS
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

    /**
     * Call Postgres RPC function with admin privileges
     * ⚠️ BYPASSES RLS
     * 
     * @param functionName - The name of the Postgres function
     * @param params - Parameters to pass to the function
     * @returns Function result
     */
    async rpc(functionName: string, params?: Record<string, any>) {
      console.log('[Admin Mode Client] Calling RPC:', functionName);

      const url = `${supabaseUrl}/rest/v1/rpc/${functionName}`;
      const headers: Record<string, string> = {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: params ? JSON.stringify(params) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorDetail;
        try {
          errorDetail = JSON.parse(errorText);
        } catch {
          errorDetail = { message: errorText };
        }
        
        console.error('[Admin Mode Client] RPC failed:', {
          function: functionName,
          status: response.status,
          error: errorDetail,
        });
        
        throw new Error(`Supabase RPC failed: ${response.status} ${errorText}`);
      }

      return await response.json();
    },

    /**
     * Execute raw SQL with admin privileges
     * ⚠️ EXTREMELY DANGEROUS - Only for system operations
     * 
     * @param sql - Raw SQL query
     * @returns Query result
     */
    async executeRaw(sql: string) {
      console.error('⚠️ ==============================================');
      console.error('⚠️ EXECUTING RAW SQL WITH ADMIN PRIVILEGES');
      console.error('⚠️ SQL:', sql.substring(0, 100) + '...');
      console.error('⚠️ ==============================================');

      const url = `${supabaseUrl}/rest/v1/rpc/execute_sql`;
      const headers: Record<string, string> = {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: sql }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Raw SQL execution failed: ${response.status} ${errorText}`);
      }

      return await response.json();
    },
  };
}

export type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>;

/**
 * Helper to determine if a request should use Admin Mode
 * Based on the request path
 */
export function shouldUseAdminMode(path: string): boolean {
  const adminPaths = [
    '/internal/',
    '/admin/',
    '/cron/',
    '/webhooks/',
  ];
  
  return adminPaths.some(prefix => path.startsWith(prefix));
}
