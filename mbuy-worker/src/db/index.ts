/**
 * Drizzle ORM Database Connection
 * Replaces @supabase/supabase-js for direct PostgreSQL access
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Type for environment variables
export interface DbEnv {
  DATABASE_URL: string;
}

/**
 * Create a database connection
 * Use this in your Worker handlers
 */
export function createDb(env: DbEnv) {
  const client = postgres(env.DATABASE_URL, {
    prepare: false, // Required for Cloudflare Workers
    max: 1, // Single connection per request
  });
  
  return drizzle(client, { schema });
}

/**
 * Database type for use in services
 */
export type Database = ReturnType<typeof createDb>;

/**
 * Re-export schema for easy access
 */
export * from './schema';
