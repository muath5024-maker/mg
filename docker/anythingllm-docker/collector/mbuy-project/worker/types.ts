/**
 * Type definitions for MBUY Worker - Golden Plan Architecture
 */

export interface Env {
  // Database (Direct PostgreSQL via Drizzle)
  DATABASE_URL: string;

  // JWT Secret for custom auth
  JWT_SECRET: string;

  // Cloudflare Account
  CF_ACCOUNT_ID: string;

  // Cloudflare Images
  CF_IMAGES_ACCOUNT_ID: string;
  CF_IMAGES_API_TOKEN: string;

  // Cloudflare Stream
  CF_STREAM_ACCOUNT_ID: string;
  CF_STREAM_API_TOKEN: string;

  // Cloudflare R2
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_S3_ENDPOINT: string;
  R2_PUBLIC_URL: string;
  R2?: R2Bucket; // R2 Bucket binding

  // Supabase (Golden Plan - Single Source of Truth)
  SUPABASE_URL: string;
  SUPABASE_JWKS_URL: string;
  SUPABASE_ANON_KEY: string;           // For userClient (RLS active)
  SUPABASE_SERVICE_ROLE_KEY: string;   // For adminClient (admin operations only)

  // Internal security
  EDGE_INTERNAL_KEY: string;

  // Rate Limiting (KV Namespace)
  RATE_LIMIT_KV?: KVNamespace;

  // AI & Advanced Features
  AI: any; // Workers AI binding
  BROWSER: any; // Browser Rendering binding
  AI_GATEWAY_ID: string;
  AI_GATEWAY_TOKEN?: string;
  MBuy_Studio: string;
  OPENROUTER_API_KEY: string;
  GEMINI_API_KEY?: string;
  FAL_AI_API_KEY?: string;
  REPLICATE_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  DID_API_KEY?: string;
  NANO_BANANA_API_KEY?: string;
  
  // Durable Objects
  SESSION_STORE: DurableObjectNamespace;
  CHAT_ROOM: DurableObjectNamespace;
  
  // Queues
  ORDER_QUEUE: Queue;
  NOTIFICATION_QUEUE: Queue;
  
  // Workflows
  ORDER_WORKFLOW: Workflow;
  
  // Pages
  PAGES_PROJECT_NAME: string;
  PAGES_API_TOKEN?: string;

  // Payment Gateway (Moyasar)
  MOYASAR_PUBLISHABLE_KEY?: string;
  MOYASAR_SECRET_KEY?: string;
  WORKER_URL?: string;
  ENVIRONMENT?: string;

  // Admin Panel
  ADMIN_EMAILS?: string;

  // FCM Push Notifications
  FCM_SERVER_KEY?: string;

  // n8n Webhooks
  N8N_WEBHOOK_URL?: string;
  N8N_WEBHOOK_SECRET?: string;
}

/**
 * User Types for MBUY Platform
 */
export type UserType = 'customer' | 'merchant' | 'merchant_user' | 'admin' | 'support' | 'moderator' | 'owner';

/**
 * Auth Context Variables set by authMiddleware
 * 
 * New Identity Chain:
 * JWT → customers/merchants/merchant_users/admin_staff → merchants.id → products.merchant_id
 */
export interface AuthContext {
  userId: string;            // ID from the respective table
  userType: UserType;        // 'customer' | 'merchant' | 'merchant_user' | 'admin' | ...
  email: string;             // User email
  merchantId?: string;       // merchants.id (for merchants and merchant_users)
  permissions?: string[];    // Permissions array (for merchant_users and admin)
}

/**
 * @deprecated Use AuthContext instead
 * Kept for backward compatibility during migration
 */
export interface SupabaseAuthContext {
  authUserId: string;        // Maps to userId
  profileId: string;         // Maps to userId
  userRole: string;          // Maps to userType
  userClient: any;           // Will be removed
  authProvider: string;      // Will be removed
  storeId?: string;          // Maps to merchantId
  merchantId?: string;       // Alias for storeId
}

/**
 * AppContext for Chanfana endpoints (optional feature)
 */
export interface AppContext extends SupabaseAuthContext {
  env: Env;
}

/**
 * Task type for Chanfana endpoints (optional feature)
 */
export interface Task {
  id: string;
  name: string;
  slug: string;
  description?: string;
  completed: boolean;
  due_date: string;
  created_at?: string;
  updated_at?: string;
}

