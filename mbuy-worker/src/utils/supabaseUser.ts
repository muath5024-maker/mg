/**
 * USER MODE Supabase Client for MBUY Worker
 * Uses ANON_KEY + User's JWT to respect RLS policies
 * 
 * ⚠️ IMPORTANT: This client respects RLS policies in Supabase
 * - Users can only access their own data
 * - Merchants can only access their store's data
 * - All operations are filtered by RLS
 */

import { Env } from '../types';

/**
 * Create Supabase client for USER MODE operations
 * This client uses the anon key and user's JWT, respecting RLS
 * 
 * @param env - Worker environment variables
 * @param userJwt - User's JWT token (from Authorization header)
 * @returns Supabase client for user operations
 */
export function createUserSupabaseClient(env: Env, userJwt?: string) {
  const supabaseUrl = env.SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('[User Mode] Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }

  console.log('[User Mode Client] Using ANON_KEY with user JWT');
  console.log('[User Mode Client] RLS enabled: true');
  console.log('[User Mode Client] User JWT present:', !!userJwt);

  return {
    url: supabaseUrl,
    key: anonKey,
    mode: 'user' as const,
    
    /**
     * Execute a query against Supabase REST API
     * Uses user's JWT for authentication, respecting RLS
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

      // ✅ USER MODE: Use ANON_KEY + User's JWT
      // This ensures RLS policies are enforced
      const headers: Record<string, string> = {
        'apikey': anonKey, // ✅ ANON key
        'Content-Type': 'application/json',
      };

      // Add user's JWT if provided
      if (userJwt) {
        headers['Authorization'] = `Bearer ${userJwt}`; // ✅ User's JWT
      }

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
        let errorDetail;
        try {
          errorDetail = JSON.parse(errorText);
        } catch {
          errorDetail = { message: errorText };
        }
        
        console.error('[User Mode Client] Query failed:', {
          table,
          method,
          status: response.status,
          error: errorDetail,
        });
        
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
     * RLS policies will determine if user is allowed to insert
     */
    async insert(table: string, data: any) {
      console.log(`[User Mode Client] INSERT into ${table}`, { hasJwt: !!userJwt });
      return this.query(table, {
        method: 'POST',
        body: data,
        single: true,
      });
    },

    /**
     * Update a record
     * RLS policies will determine if user is allowed to update
     */
    async update(table: string, id: string, data: any) {
      console.log(`[User Mode Client] UPDATE ${table} id=${id}`, { hasJwt: !!userJwt });
      const url = `${supabaseUrl}/rest/v1/${table}?id=eq.${id}`;
      
      const headers: Record<string, string> = {
        'apikey': anonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      };

      if (userJwt) {
        headers['Authorization'] = `Bearer ${userJwt}`;
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[User Mode Client] Update failed:', {
          table,
          id,
          status: response.status,
          error: errorText,
        });
        throw new Error(`Supabase update failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return Array.isArray(result) ? result[0] : result;
    },

    /**
     * Delete a record
     * RLS policies will determine if user is allowed to delete
     */
    async delete(table: string, id: string) {
      console.log(`[User Mode Client] DELETE from ${table} id=${id}`, { hasJwt: !!userJwt });
      return this.query(table, {
        method: 'DELETE',
        filters: { id: `eq.${id}` },
      });
    },

    /**
     * Find a record by ID
     * RLS policies will determine if user can see this record
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
     * Find a record by email
     * RLS policies will apply
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
     * Find a record by a specific column
     * RLS policies will apply
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

export type UserSupabaseClient = ReturnType<typeof createUserSupabaseClient>;

// Helper to extract JWT from Hono context
export function extractJwtFromContext(c: any): string | undefined {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined;
  }
  return authHeader.replace('Bearer ', '').trim();
}
