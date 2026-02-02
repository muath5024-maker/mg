/**
 * Admin Auth Middleware
 * Protects /admin/api/* routes using Cloudflare Access
 */

import { Context, Next } from 'hono';
import { Env } from '../types';

type AdminVariables = {
  adminEmail: string;
};

export async function adminAuthMiddleware(
  c: Context<{ Bindings: Env; Variables: AdminVariables }>,
  next: Next
) {
  const userEmail = c.req.header('CF-Access-Authenticated-User-Email');
  const path = c.req.path;

  // 1. Check if CF-Access header exists
  if (!userEmail) {
    console.log(`[ADMIN API] REJECTED: No CF-Access header - Path: ${path}`);
    return c.json({ error: 'Unauthorized', message: 'No Access token' }, 401);
  }

  // 2. Get admin emails from environment
  const adminEmailsEnv = c.env.ADMIN_EMAILS || '';
  const adminEmails = adminEmailsEnv
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => e.length > 0);

  // 3. Check if email is in admin list
  if (!adminEmails.includes(userEmail.toLowerCase())) {
    console.log(`[ADMIN API] FORBIDDEN: ${userEmail} not in admin list - Path: ${path}`);
    return c.json({ error: 'Forbidden', message: 'Not an admin' }, 403);
  }

  // 4. Allow access
  console.log(`[ADMIN API] ALLOWED: ${userEmail} - Path: ${path}`);
  c.set('adminEmail', userEmail);
  
  await next();
}
