'use client';

import { useEffect, useState } from 'react';
import {
  Server,
  Activity,
  Globe,
  Shield,
  ShoppingCart,
  Users,
  Megaphone,
  BarChart3,
  Image,
  CreditCard,
  Package,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { checkWorkerHealth } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { WorkerHealth, WorkerEndpoint } from '@/types';

// Worker endpoints configuration
const WORKER_ENDPOINTS: WorkerEndpoint[] = [
  // Auth
  { path: '/auth/supabase/register', method: 'POST', description: 'Register new user', description_ar: 'تسجيل مستخدم جديد', category: 'المصادقة', auth_required: false },
  { path: '/auth/supabase/login', method: 'POST', description: 'User login', description_ar: 'تسجيل الدخول', category: 'المصادقة', auth_required: false },
  { path: '/auth/supabase/logout', method: 'POST', description: 'User logout', description_ar: 'تسجيل الخروج', category: 'المصادقة', auth_required: true },
  { path: '/auth/profile', method: 'GET', description: 'Get user profile', description_ar: 'الحصول على الملف الشخصي', category: 'المصادقة', auth_required: true },
  // Public
  { path: '/public/products', method: 'GET', description: 'List public products', description_ar: 'عرض المنتجات', category: 'العام', auth_required: false },
  { path: '/public/stores', method: 'GET', description: 'List stores', description_ar: 'عرض المتاجر', category: 'العام', auth_required: false },
  { path: '/categories', method: 'GET', description: 'List categories', description_ar: 'عرض التصنيفات', category: 'العام', auth_required: false },
  // Merchant
  { path: '/secure/merchant/store', method: 'GET', description: 'Get merchant store', description_ar: 'بيانات المتجر', category: 'التاجر', auth_required: true },
  { path: '/secure/merchant/products', method: 'GET', description: 'List merchant products', description_ar: 'منتجات التاجر', category: 'التاجر', auth_required: true },
  { path: '/secure/merchant/orders', method: 'POST', description: 'Get store orders', description_ar: 'طلبات المتجر', category: 'التاجر', auth_required: true },
  // Marketing
  { path: '/secure/marketing/coupons', method: 'GET', description: 'List coupons', description_ar: 'عرض الكوبونات', category: 'التسويق', auth_required: true },
  { path: '/secure/marketing/flash-sales', method: 'GET', description: 'List flash sales', description_ar: 'العروض السريعة', category: 'التسويق', auth_required: true },
  { path: '/secure/marketing/referral/settings', method: 'GET', description: 'Referral settings', description_ar: 'إعدادات الإحالات', category: 'التسويق', auth_required: true },
  // Analytics
  { path: '/secure/analytics/summary', method: 'GET', description: 'Analytics summary', description_ar: 'ملخص التحليلات', category: 'التحليلات', auth_required: true },
  { path: '/secure/analytics/dashboard', method: 'GET', description: 'Dashboard data', description_ar: 'بيانات لوحة التحكم', category: 'التحليلات', auth_required: true },
  // Payments
  { path: '/secure/payments/providers', method: 'GET', description: 'Payment providers', description_ar: 'مزودي الدفع', category: 'المدفوعات', auth_required: true },
  { path: '/secure/payments/transactions', method: 'GET', description: 'List transactions', description_ar: 'المعاملات', category: 'المدفوعات', auth_required: true },
  // Studio
  { path: '/secure/studio/credits', method: 'GET', description: 'Get credits balance', description_ar: 'رصيد الاستوديو', category: 'الاستوديو', auth_required: true },
  { path: '/secure/studio/templates', method: 'GET', description: 'List templates', description_ar: 'القوالب', category: 'الاستوديو', auth_required: true },
  // Admin
  { path: '/admin/api/health', method: 'GET', description: 'Health check', description_ar: 'فحص الحالة', category: 'الإدارة', auth_required: true },
  { path: '/admin/api/stats', method: 'GET', description: 'Admin stats', description_ar: 'إحصائيات الإدارة', category: 'الإدارة', auth_required: true },
];

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://misty-mode-b68b.baharista1.workers.dev';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'المصادقة':
      return Shield;
    case 'العام':
      return Globe;
    case 'التاجر':
      return Package;
    case 'التسويق':
      return Megaphone;
    case 'التحليلات':
      return BarChart3;
    case 'المدفوعات':
      return CreditCard;
    case 'الاستوديو':
      return Image;
    case 'الإدارة':
      return Server;
    default:
      return Activity;
  }
};

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET':
      return 'bg-green-500/20 text-green-400';
    case 'POST':
      return 'bg-blue-500/20 text-blue-400';
    case 'PUT':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'DELETE':
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-zinc-500/20 text-zinc-400';
  }
};

export default function WorkerPage() {
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [checking, setChecking] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const checkHealth = async () => {
    setChecking(true);
    const result = await checkWorkerHealth();
    setHealth(result.data);
    setChecking(false);
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // Group endpoints by category
  const categories = [...new Set(WORKER_ENDPOINTS.map((e) => e.category))];
  const groupedEndpoints = WORKER_ENDPOINTS.reduce((acc, endpoint) => {
    if (!acc[endpoint.category]) {
      acc[endpoint.category] = [];
    }
    acc[endpoint.category].push(endpoint);
    return acc;
  }, {} as Record<string, WorkerEndpoint[]>);

  const filteredEndpoints = selectedCategory
    ? { [selectedCategory]: groupedEndpoints[selectedCategory] }
    : groupedEndpoints;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Worker</h1>
          <p className="text-zinc-400 mt-1">إدارة ومراقبة Cloudflare Worker</p>
        </div>
        <Button onClick={checkHealth} isLoading={checking}>
          <RefreshCw className="h-4 w-4" />
          فحص الحالة
        </Button>
      </div>

      {/* Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered">
          <CardContent>
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'p-3 rounded-xl',
                  health?.status === 'healthy'
                    ? 'bg-green-600/20'
                    : health?.status === 'degraded'
                    ? 'bg-yellow-600/20'
                    : 'bg-red-600/20'
                )}
              >
                {health?.status === 'healthy' ? (
                  <CheckCircle className="h-6 w-6 text-green-400" />
                ) : health?.status === 'degraded' ? (
                  <Clock className="h-6 w-6 text-yellow-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-zinc-400">الحالة</p>
                <p className="text-lg font-semibold text-white">
                  {health?.status === 'healthy'
                    ? 'يعمل بشكل طبيعي'
                    : health?.status === 'degraded'
                    ? 'أداء متدهور'
                    : 'متوقف'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-600/20">
                <Activity className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">وقت الاستجابة</p>
                <p className="text-lg font-semibold text-white">
                  {health?.latency_ms || 0}ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-600/20">
                <Globe className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">عنوان Worker</p>
                <a
                  href={WORKER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {WORKER_URL.replace('https://', '')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Card variant="bordered">
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              الكل
            </Button>
            {categories.map((category) => {
              const Icon = getCategoryIcon(category);
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  <Icon className="h-4 w-4" />
                  {category}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      {Object.entries(filteredEndpoints).map(([category, endpoints]) => {
        const Icon = getCategoryIcon(category);
        return (
          <Card key={category} variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {endpoints.map((endpoint, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={getMethodColor(endpoint.method)}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm text-zinc-300">{endpoint.path}</code>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-zinc-400 hidden md:block">
                        {endpoint.description_ar}
                      </span>
                      {endpoint.auth_required && (
                        <Badge variant="purple" size="sm">
                          <Shield className="h-3 w-3" />
                        </Badge>
                      )}
                      <a
                        href={`${WORKER_URL}${endpoint.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
