/**
 * Worker API Client - New System
 * 
 * All API calls go through the Worker
 * Uses JWT authentication for admin
 * 
 * @module lib/worker-api
 */

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://misty-mode-b68b.baharista1.workers.dev';

// =====================================================
// Types
// =====================================================

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// =====================================================
// Token Management
// =====================================================

let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', token);
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('admin_token');
  }
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
  }
}

// =====================================================
// Base Request Function
// =====================================================

async function workerFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${WORKER_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        ok: false,
        error: data.error || 'Request failed',
        message: data.message || `HTTP ${response.status}`,
      };
    }

    return { ok: true, ...data };
  } catch (error: any) {
    return {
      ok: false,
      error: 'NETWORK_ERROR',
      message: error.message || 'Failed to connect to server',
    };
  }
}

// =====================================================
// AUTH API
// =====================================================

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    userType: string;
  };
}

export async function adminLogin(credentials: AdminLoginRequest): Promise<ApiResponse<AdminLoginResponse>> {
  const response = await workerFetch<AdminLoginResponse>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (response.ok && response.data?.token) {
    setAuthToken(response.data.token);
  }

  return response;
}

export async function adminLogout() {
  clearAuthToken();
}

export async function verifyToken(): Promise<ApiResponse<{ valid: boolean; user: any }>> {
  return workerFetch('/auth/verify');
}

// =====================================================
// MERCHANTS API (formerly stores)
// =====================================================

export interface Merchant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'suspended' | 'pending';
  store_id?: string;
  created_at: string;
  updated_at: string;
}

export async function getMerchants(
  page = 1,
  limit = 20,
  search?: string,
  status?: string
): Promise<ApiResponse<Merchant[]>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append('search', search);
  if (status) params.append('status', status);

  return workerFetch(`/api/admin/merchants?${params}`);
}

export async function getMerchant(id: string): Promise<ApiResponse<Merchant>> {
  return workerFetch(`/api/admin/merchants/${id}`);
}

export async function updateMerchant(id: string, updates: Partial<Merchant>): Promise<ApiResponse<Merchant>> {
  return workerFetch(`/api/admin/merchants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function updateMerchantStatus(id: string, status: Merchant['status']): Promise<ApiResponse<Merchant>> {
  return updateMerchant(id, { status });
}

// =====================================================
// CUSTOMERS API
// =====================================================

export interface Customer {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export async function getCustomers(
  page = 1,
  limit = 20,
  search?: string,
  status?: string
): Promise<ApiResponse<Customer[]>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append('search', search);
  if (status) params.append('status', status);

  return workerFetch(`/api/admin/customers?${params}`);
}

export async function getCustomer(id: string): Promise<ApiResponse<Customer>> {
  return workerFetch(`/api/admin/customers/${id}`);
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<ApiResponse<Customer>> {
  return workerFetch(`/api/admin/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// =====================================================
// ORDERS API
// =====================================================

export interface Order {
  id: string;
  customer_id: string;
  merchant_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  customers?: Customer;
  merchants?: Merchant;
  order_items?: any[];
}

export async function getOrders(
  page = 1,
  limit = 20,
  status?: string,
  merchantId?: string
): Promise<ApiResponse<Order[]>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.append('status', status);
  if (merchantId) params.append('merchant_id', merchantId);

  return workerFetch(`/api/admin/orders?${params}`);
}

export async function getOrder(id: string): Promise<ApiResponse<Order>> {
  return workerFetch(`/api/admin/orders/${id}`);
}

export async function updateOrderStatus(id: string, status: string): Promise<ApiResponse<Order>> {
  return workerFetch(`/api/admin/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// =====================================================
// PRODUCTS API
// =====================================================

export interface Product {
  id: string;
  merchant_id: string;
  name: string;
  description?: string;
  price: number;
  status: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export async function getProducts(
  page = 1,
  limit = 20,
  merchantId?: string,
  status?: string
): Promise<ApiResponse<Product[]>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (merchantId) params.append('merchant_id', merchantId);
  if (status) params.append('status', status);

  return workerFetch(`/api/admin/products?${params}`);
}

export async function getProduct(id: string): Promise<ApiResponse<Product>> {
  return workerFetch(`/api/admin/products/${id}`);
}

// =====================================================
// ANALYTICS API
// =====================================================

export interface DashboardStats {
  totalMerchants: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  ordersToday: number;
  activeMerchants: number;
  pendingMerchants: number;
  newMerchantsThisMonth: number;
  newCustomersThisMonth: number;
}

export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return workerFetch('/api/admin/dashboard/stats');
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export async function getRevenueChart(days = 30): Promise<ApiResponse<RevenueData[]>> {
  return workerFetch(`/api/admin/dashboard/revenue?days=${days}`);
}

// =====================================================
// PLATFORM CATEGORIES API
// =====================================================

export interface PlatformCategory {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  icon: string;
  color?: string;
  parent_id?: string;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  products_count?: number;
  merchants_count?: number;
  created_at: string;
  updated_at: string;
  children?: PlatformCategory[];
}

export interface CreateCategoryRequest {
  slug: string;
  name_ar: string;
  name_en: string;
  icon: string;
  color?: string;
  parent_id?: string;
  display_order?: number;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface UpdateCategoryRequest {
  slug?: string;
  name_ar?: string;
  name_en?: string;
  icon?: string;
  color?: string;
  parent_id?: string;
  display_order?: number;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface ReorderCategoriesRequest {
  orders: { id: string; display_order: number }[];
}

// Get all categories (admin view with all data)
export async function getPlatformCategories(
  includeInactive = true,
  includeChildren = true
): Promise<ApiResponse<PlatformCategory[]>> {
  const params = new URLSearchParams();
  params.append('include_inactive', String(includeInactive));
  params.append('include_children', String(includeChildren));
  
  return workerFetch(`/admin/api/platform-categories?${params}`);
}

// Get single category by ID
export async function getPlatformCategory(id: string): Promise<ApiResponse<PlatformCategory>> {
  return workerFetch(`/admin/api/platform-categories/${id}`);
}

// Create new category
export async function createPlatformCategory(
  category: CreateCategoryRequest
): Promise<ApiResponse<PlatformCategory>> {
  return workerFetch('/admin/api/platform-categories', {
    method: 'POST',
    body: JSON.stringify(category),
  });
}

// Update category
export async function updatePlatformCategory(
  id: string,
  updates: UpdateCategoryRequest
): Promise<ApiResponse<PlatformCategory>> {
  return workerFetch(`/admin/api/platform-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// Delete category
export async function deletePlatformCategory(id: string): Promise<ApiResponse<void>> {
  return workerFetch(`/admin/api/platform-categories/${id}`, {
    method: 'DELETE',
  });
}

// Reorder categories
export async function reorderPlatformCategories(
  orders: ReorderCategoriesRequest
): Promise<ApiResponse<void>> {
  return workerFetch('/admin/api/platform-categories/reorder', {
    method: 'POST',
    body: JSON.stringify(orders),
  });
}

// Toggle category status (active/inactive)
export async function toggleCategoryStatus(
  id: string,
  isActive: boolean
): Promise<ApiResponse<PlatformCategory>> {
  return updatePlatformCategory(id, { is_active: isActive });
}

// Toggle category featured status
export async function toggleCategoryFeatured(
  id: string,
  isFeatured: boolean
): Promise<ApiResponse<PlatformCategory>> {
  return updatePlatformCategory(id, { is_featured: isFeatured });
}

// =====================================================
// BOOST MANAGEMENT API
// =====================================================

export interface BoostTransaction {
  id: string;
  merchant_id: string;
  target_type: 'product' | 'store' | 'media';
  target_id: string;
  boost_type: string;
  points_spent: number;
  duration_days: number;
  starts_at: string;
  expires_at: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  merchants?: {
    business_name: string;
  };
}

export interface BoostStats {
  active_boosts: number;
  total_boosts: number;
  total_points_spent: number;
}

// Get all boost transactions (admin)
export async function getBoostTransactions(
  page = 1,
  limit = 20,
  status?: string,
  targetType?: string
): Promise<ApiResponse<BoostTransaction[]>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.append('status', status);
  if (targetType) params.append('target_type', targetType);

  return workerFetch(`/admin/api/boosts?${params}`);
}

// Get boost statistics (admin)
export async function getBoostStats(): Promise<ApiResponse<BoostStats>> {
  return workerFetch('/admin/api/boosts/stats');
}

// Cancel boost (admin)
export async function adminCancelBoost(id: string): Promise<ApiResponse<void>> {
  return workerFetch(`/admin/api/boosts/${id}/cancel`, {
    method: 'POST',
  });
}

// =====================================================
// WORKER HEALTH
// =====================================================

export async function checkWorkerHealth(): Promise<ApiResponse<{ message: string; version: string }>> {
  return workerFetch('/');
}
