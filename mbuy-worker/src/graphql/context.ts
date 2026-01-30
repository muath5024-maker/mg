/**
 * GraphQL Context
 * Creates the context object available in all resolvers
 */

import { YogaInitialContext } from 'graphql-yoga';
import { Env, AuthContext } from '../types';
import { createDb, Database } from '../db';
import { createDataLoaders, DataLoaders } from './dataloaders';

export interface GraphQLContext {
  // Environment
  env: Env;
  
  // Database
  db: Database;
  
  // Authentication
  auth: AuthContext | null;
  
  // DataLoaders for N+1 problem
  loaders: DataLoaders;
  
  // Request info
  request: Request;
  
  // Helpers
  isAuthenticated: boolean;
  isCustomer: boolean;
  isMerchant: boolean;
  isAdmin: boolean;
}

/**
 * Create context for each request
 */
export async function createContext(
  ctx: YogaInitialContext,
  env: Env
): Promise<GraphQLContext> {
  const db = createDb({ DATABASE_URL: env.DATABASE_URL });
  
  // Extract auth from request headers
  const auth = await extractAuth(ctx.request, env);
  
  // Create DataLoaders (new instance per request for caching)
  const loaders = createDataLoaders(db);
  
  return {
    env,
    db,
    auth,
    loaders,
    request: ctx.request,
    isAuthenticated: !!auth,
    isCustomer: auth?.userType === 'customer',
    isMerchant: auth?.userType === 'merchant',
    isAdmin: auth?.userType === 'admin',
  };
}

/**
 * Extract authentication from request headers
 */
async function extractAuth(request: Request, env: Env): Promise<AuthContext | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.slice(7);
  
  try {
    // Import JWT verification dynamically to avoid circular imports
    const { verifyToken } = await import('../utils/jwt');
    const payload = await verifyToken(token, env.JWT_SECRET);
    
    if (!payload) {
      return null;
    }
    
    return {
      userId: payload.sub as string,
      userType: payload.userType as 'customer' | 'merchant' | 'admin',
      email: payload.email as string || '',
      merchantId: payload.merchantId as string | undefined,
      permissions: payload.permissions as string[] | undefined,
    };
  } catch (error) {
    console.error('Auth extraction error:', error);
    return null;
  }
}
