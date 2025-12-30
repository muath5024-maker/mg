/**
 * Dropshipping Routes Module
 * Supplier and reseller management
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
import { supabaseAuthMiddleware } from '../middleware/supabaseAuthMiddleware';
import {
  createDropshipProduct,
  updateDropshipProduct,
  getSupplierDropshipProducts,
  getDropshipCatalog,
  createResellerListing,
  getResellerListings,
  updateResellerListing,
  getSupplierOrders,
  updateSupplierOrder,
} from '../endpoints/dropshipping';

type Variables = SupabaseAuthContext;

const dropshippingRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
dropshippingRoutes.use('*', supabaseAuthMiddleware);

// ========================================
// Supplier Routes
// ========================================

// Supplier products
dropshippingRoutes.get('/supplier/products', getSupplierDropshipProducts);
dropshippingRoutes.post('/supplier/products', createDropshipProduct);
dropshippingRoutes.put('/supplier/products/:id', updateDropshipProduct);

// Supplier orders
dropshippingRoutes.get('/supplier/orders', getSupplierOrders);
dropshippingRoutes.put('/supplier/orders/:id', updateSupplierOrder);

// ========================================
// Reseller Routes
// ========================================

// Browse catalog
dropshippingRoutes.get('/catalog', getDropshipCatalog);

// Reseller listings
dropshippingRoutes.get('/reseller/listings', getResellerListings);
dropshippingRoutes.post('/reseller/listings', createResellerListing);
dropshippingRoutes.put('/reseller/listings/:id', updateResellerListing);

export default dropshippingRoutes;
