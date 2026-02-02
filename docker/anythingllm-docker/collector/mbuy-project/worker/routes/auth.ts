/**
 * Auth Routes Module
 * Authentication and user management routes
 * 
 * NEW: Uses custom JWT from Worker with new database schema
 */

import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { 
  registerHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  getMeHandler,
} from '../endpoints/auth';
import { authMiddleware } from '../middleware/authMiddleware';

type Variables = AuthContext;

const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ========================================
// Public Auth Routes (no JWT required)
// ========================================

// Register new user (customer or merchant)
authRoutes.post('/register', registerHandler);

// Login
authRoutes.post('/login', loginHandler);

// Logout
authRoutes.post('/logout', logoutHandler);

// Refresh token
authRoutes.post('/refresh', refreshHandler);

// Forgot password
authRoutes.post('/forgot-password', forgotPasswordHandler);

// Reset password
authRoutes.post('/reset-password', resetPasswordHandler);

// ========================================
// Protected Routes (JWT required)
// ========================================

// Get current user profile
authRoutes.get('/me', authMiddleware, getMeHandler);

// ========================================
// Legacy Routes (deprecated - return migration message)
// ========================================

authRoutes.post('/supabase/register', async (c) => {
  return c.json({
    error: 'DEPRECATED',
    message: 'This endpoint is deprecated. Use /auth/register instead.',
    new_endpoint: '/auth/register',
  }, 410);
});

authRoutes.post('/supabase/login', async (c) => {
  return c.json({
    error: 'DEPRECATED',
    message: 'This endpoint is deprecated. Use /auth/login instead.',
    new_endpoint: '/auth/login',
  }, 410);
});

authRoutes.post('/supabase/logout', async (c) => {
  return c.json({
    error: 'DEPRECATED',
    message: 'This endpoint is deprecated. Use /auth/logout instead.',
    new_endpoint: '/auth/logout',
  }, 410);
});

authRoutes.post('/supabase/refresh', async (c) => {
  return c.json({
    error: 'DEPRECATED',
    message: 'This endpoint is deprecated. Use /auth/refresh instead.',
    new_endpoint: '/auth/refresh',
  }, 410);
});

authRoutes.get('/profile', async (c) => {
  return c.json({
    error: 'DEPRECATED',
    message: 'This endpoint is deprecated. Use /auth/me instead.',
    new_endpoint: '/auth/me',
  }, 410);
});

export default authRoutes;
