/**
 * API Routes - New CRUD System
 * 
 * Central routing for the new CRUD endpoints
 * Uses AuthContext and roleMiddleware
 * 
 * @module routes/api
 */

import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole, requireMerchantRole, requireCustomerRole } from '../middleware/roleMiddleware';

// Import CRUD endpoints
import {
  listMerchantProducts,
  getMerchantProduct,
  createMerchantProduct,
  updateMerchantProduct,
  deleteMerchantProduct,
  listPublicProducts,
  getPublicProduct,
} from '../endpoints/products-crud';

import {
  listMerchantOrders,
  getMerchantOrder,
  updateOrderStatus,
  listCustomerOrders,
  getCustomerOrder,
  createCustomerOrder,
  cancelCustomerOrder,
} from '../endpoints/orders-crud';

import {
  listInventoryItems,
  getProductInventory,
  updateInventory,
  bulkAdjustInventory,
  listInventoryMovements,
  getInventoryStats,
} from '../endpoints/inventory-crud';

import {
  listMerchantCategories,
  createMerchantCategory,
  updateMerchantCategory,
  deleteMerchantCategory,
  listPublicCategories,
} from '../endpoints/categories-crud';

import {
  getDashboardStats,
  getRevenueChart,
  listMerchants,
  getMerchant,
  updateMerchant,
  listCustomers,
  getCustomer,
  updateCustomer,
  listAllOrders,
  getOrderAdmin,
  listAllProducts,
  getProductAdmin,
} from '../endpoints/admin-crud';

type Variables = AuthContext;

const apiRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// =====================================================
// PUBLIC ROUTES (No Auth Required)
// =====================================================

// Products
apiRoutes.get('/public/products', listPublicProducts);
apiRoutes.get('/public/products/:id', getPublicProduct);

// Categories
apiRoutes.get('/public/categories', listPublicCategories);

// =====================================================
// MERCHANT ROUTES
// =====================================================

const merchantApi = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply middleware
merchantApi.use('*', authMiddleware);
merchantApi.use('*', requireMerchantRole());

// Products CRUD
merchantApi.get('/products', listMerchantProducts);
merchantApi.get('/products/:id', getMerchantProduct);
merchantApi.post('/products', createMerchantProduct);
merchantApi.put('/products/:id', updateMerchantProduct);
merchantApi.delete('/products/:id', deleteMerchantProduct);

// Categories CRUD
merchantApi.get('/categories', listMerchantCategories);
merchantApi.post('/categories', createMerchantCategory);
merchantApi.put('/categories/:id', updateMerchantCategory);
merchantApi.delete('/categories/:id', deleteMerchantCategory);

// Orders
merchantApi.get('/orders', listMerchantOrders);
merchantApi.get('/orders/:id', getMerchantOrder);
merchantApi.put('/orders/:id/status', updateOrderStatus);

// Inventory
merchantApi.get('/inventory', listInventoryItems);
merchantApi.get('/inventory/stats', getInventoryStats);
merchantApi.get('/inventory/movements', listInventoryMovements);
merchantApi.get('/inventory/:productId', getProductInventory);
merchantApi.put('/inventory/:productId', updateInventory);
merchantApi.post('/inventory/adjust', bulkAdjustInventory);

// Mount merchant routes
apiRoutes.route('/merchant', merchantApi);

// =====================================================
// CUSTOMER ROUTES
// =====================================================

const customerApi = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply middleware
customerApi.use('*', authMiddleware);
customerApi.use('*', requireCustomerRole());

// Orders
customerApi.get('/orders', listCustomerOrders);
customerApi.get('/orders/:id', getCustomerOrder);
customerApi.post('/orders', createCustomerOrder);
customerApi.post('/orders/:id/cancel', cancelCustomerOrder);

// Mount customer routes
apiRoutes.route('/customer', customerApi);

// =====================================================
// ADMIN ROUTES
// =====================================================

const adminApi = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply middleware
adminApi.use('*', authMiddleware);
adminApi.use('*', requireRole(['admin', 'support', 'moderator', 'owner']));

// Dashboard
adminApi.get('/dashboard/stats', getDashboardStats);
adminApi.get('/dashboard/revenue', getRevenueChart);

// Merchants
adminApi.get('/merchants', listMerchants);
adminApi.get('/merchants/:id', getMerchant);
adminApi.put('/merchants/:id', updateMerchant);

// Customers
adminApi.get('/customers', listCustomers);
adminApi.get('/customers/:id', getCustomer);
adminApi.put('/customers/:id', updateCustomer);

// Orders (admin view - all orders)
adminApi.get('/orders', listAllOrders);
adminApi.get('/orders/:id', getOrderAdmin);

// Products (admin view - all products)
adminApi.get('/products', listAllProducts);
adminApi.get('/products/:id', getProductAdmin);

// Mount admin routes
apiRoutes.route('/admin', adminApi);

// =====================================================
// EXPORT
// =====================================================

export { apiRoutes };
export default apiRoutes;
