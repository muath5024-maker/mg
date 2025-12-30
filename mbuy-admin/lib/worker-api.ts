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
// WORKER HEALTH
// =====================================================

export async function checkWorkerHealth(): Promise<ApiResponse<{ message: string; version: string }>> {
  return workerFetch('/');
}
