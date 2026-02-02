/**
 * Inventory Routes Module
 * Stock management and inventory tracking
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
import { supabaseAuthMiddleware } from '../middleware/supabaseAuthMiddleware';
import { 
  getInventoryOverview, 
  adjustInventory, 
  getProductMovements, 
  getInventoryAlerts, 
  updateThresholds, 
  getAllMovements 
} from '../endpoints/inventory';

type Variables = SupabaseAuthContext;

const inventoryRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
inventoryRoutes.use('*', supabaseAuthMiddleware);

// ========================================
// Inventory Management
// ========================================

// Get inventory overview
inventoryRoutes.get('/', getInventoryOverview);

// Adjust inventory
inventoryRoutes.post('/adjust', adjustInventory);

// Get all movements
inventoryRoutes.get('/movements', getAllMovements);

// Get product movements
inventoryRoutes.get('/products/:id/movements', getProductMovements);

// ========================================
// Alerts & Thresholds
// ========================================

// Get inventory alerts
inventoryRoutes.get('/alerts', getInventoryAlerts);

// Update thresholds
inventoryRoutes.put('/thresholds', updateThresholds);

export default inventoryRoutes;
