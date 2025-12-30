/**
 * Shortcuts Routes Module
 * User shortcuts management
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
import { supabaseAuthMiddleware } from '../middleware/supabaseAuthMiddleware';
import { 
  getAvailableShortcuts, 
  getMerchantShortcuts, 
  updateMerchantShortcuts, 
  addShortcut, 
  removeShortcut 
} from '../endpoints/shortcuts';

type Variables = SupabaseAuthContext;

const shortcutsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ========================================
// Public Routes
// ========================================

// Get available shortcuts (no auth required)
shortcutsRoutes.get('/available', getAvailableShortcuts);

// ========================================
// Secure Routes
// ========================================

shortcutsRoutes.use('/me', supabaseAuthMiddleware);
shortcutsRoutes.use('/update', supabaseAuthMiddleware);
shortcutsRoutes.use('/add', supabaseAuthMiddleware);
shortcutsRoutes.use('/remove', supabaseAuthMiddleware);

// Get merchant shortcuts
shortcutsRoutes.get('/me', getMerchantShortcuts);

// Update merchant shortcuts
shortcutsRoutes.put('/update', updateMerchantShortcuts);

// Add shortcut
shortcutsRoutes.post('/add', addShortcut);

// Remove shortcut
shortcutsRoutes.delete('/remove/:id', removeShortcut);

export default shortcutsRoutes;
