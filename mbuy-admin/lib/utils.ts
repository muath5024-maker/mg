import { type ClassValue, clsx } from 'clsx';

// Simple clsx implementation for class merging
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// Format currency
export function formatCurrency(amount: number, currency = 'SAR'): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format number with Arabic locale
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-SA').format(num);
}

// Format date in Arabic
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat('ar-SA', defaultOptions).format(new Date(date));
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return formatDate(date);
}

// Truncate text
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Get status badge color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    healthy: 'bg-green-500/20 text-green-400',
    completed: 'bg-green-500/20 text-green-400',
    delivered: 'bg-green-500/20 text-green-400',
    paid: 'bg-green-500/20 text-green-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    processing: 'bg-blue-500/20 text-blue-400',
    confirmed: 'bg-blue-500/20 text-blue-400',
    shipped: 'bg-purple-500/20 text-purple-400',
    suspended: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-red-500/20 text-red-400',
    failed: 'bg-red-500/20 text-red-400',
    expired: 'bg-gray-500/20 text-gray-400',
    paused: 'bg-gray-500/20 text-gray-400',
    draft: 'bg-gray-500/20 text-gray-400',
    degraded: 'bg-orange-500/20 text-orange-400',
    down: 'bg-red-500/20 text-red-400',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400';
}

// Get role badge color
export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    admin: 'bg-purple-500/20 text-purple-400',
    merchant: 'bg-blue-500/20 text-blue-400',
    customer: 'bg-gray-500/20 text-gray-400',
  };
  return colors[role] || 'bg-gray-500/20 text-gray-400';
}

// Translate status to Arabic
export function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    active: 'نشط',
    healthy: 'سليم',
    completed: 'مكتمل',
    delivered: 'تم التوصيل',
    paid: 'مدفوع',
    pending: 'قيد الانتظار',
    processing: 'قيد المعالجة',
    confirmed: 'مؤكد',
    shipped: 'تم الشحن',
    suspended: 'معلق',
    cancelled: 'ملغي',
    failed: 'فشل',
    expired: 'منتهي',
    paused: 'متوقف',
    draft: 'مسودة',
    scheduled: 'مجدول',
    degraded: 'متدهور',
    down: 'متوقف',
  };
  return translations[status] || status;
}

// Translate role to Arabic
export function translateRole(role: string): string {
  const translations: Record<string, string> = {
    admin: 'مدير',
    merchant: 'تاجر',
    customer: 'عميل',
  };
  return translations[role] || role;
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Format percentage
export function formatPercentage(value: number): string {
  const formatted = Math.abs(value).toFixed(1);
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${formatted}%`;
}
