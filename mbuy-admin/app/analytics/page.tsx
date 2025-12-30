'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Store,
  ShoppingCart,
  DollarSign,
  Image,
  Video,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { PageLoading } from '@/components/ui/Loading';
import { getAnalyticsSummary, getRevenueData } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import type { AnalyticsSummary, RevenueData } from '@/types';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  iconColor: string;
}

function StatCard({ title, value, change, icon: Icon, iconColor }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card variant="bordered">
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                  {formatPercentage(change)}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconColor}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, revenueRes] = await Promise.all([
        getAnalyticsSummary(),
        getRevenueData(Number(period)),
      ]);

      if (summaryRes.error) throw new Error(summaryRes.error);

      setSummary(summaryRes.data);
      setRevenueData(revenueRes.data || []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-400">{error}</p>
        <Button onClick={loadData}>إعادة المحاولة</Button>
      </div>
    );
  }

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = revenueData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">التحليلات</h1>
          <p className="text-zinc-400 mt-1">نظرة عامة على أداء المنصة</p>
        </div>
        <div className="flex gap-2">
          {(['7', '30', '90'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p === '7' ? '7 أيام' : p === '30' ? '30 يوم' : '90 يوم'}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المتاجر"
          value={formatNumber(summary?.total_stores || 0)}
          change={summary?.stores_growth}
          icon={Store}
          iconColor="bg-blue-600"
        />
        <StatCard
          title="إجمالي المستخدمين"
          value={formatNumber(summary?.total_users || 0)}
          change={summary?.users_growth}
          icon={Users}
          iconColor="bg-green-600"
        />
        <StatCard
          title="إجمالي الطلبات"
          value={formatNumber(summary?.total_orders || 0)}
          change={summary?.orders_growth}
          icon={ShoppingCart}
          iconColor="bg-purple-600"
        />
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(summary?.total_revenue || 0)}
          change={summary?.revenue_growth}
          icon={DollarSign}
          iconColor="bg-orange-600"
        />
      </div>

      {/* Revenue Chart */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>الإيرادات خلال آخر {period} يوم</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.length > 0 ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-800/30 rounded-lg">
                  <p className="text-sm text-zinc-400 mb-1">إجمالي الإيرادات</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-lg">
                  <p className="text-sm text-zinc-400 mb-1">إجمالي الطلبات</p>
                  <p className="text-xl font-bold text-white">{formatNumber(totalOrders)}</p>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-lg">
                  <p className="text-sm text-zinc-400 mb-1">متوسط قيمة الطلب</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(avgOrderValue)}</p>
                </div>
              </div>

              {/* Chart */}
              <div className="h-64 flex items-end gap-1">
                {revenueData.map((item, index) => {
                  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue));
                  const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

                  return (
                    <div
                      key={index}
                      className="flex-1 bg-blue-600/30 hover:bg-blue-600/50 transition-colors rounded-t cursor-pointer group relative"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-800 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <p>{item.date}</p>
                        <p className="text-blue-400">{formatCurrency(item.revenue)}</p>
                        <p className="text-zinc-400">{item.orders} طلب</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-zinc-500">
              لا توجد بيانات
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Usage */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>استخدام الذكاء الاصطناعي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-600/20">
                    <Image className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white">صور AI</p>
                    <p className="text-sm text-zinc-400">إجمالي الصور المولدة</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-white">0</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-600/20">
                    <Video className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white">فيديو AI</p>
                    <p className="text-sm text-zinc-400">إجمالي الفيديوهات المولدة</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-white">0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>الاشتراكات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">الاشتراكات النشطة</span>
                <span className="text-xl font-bold text-white">
                  {formatNumber(summary?.active_subscriptions || 0)}
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-0" />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div>
                  <p className="text-zinc-400">مجاني</p>
                  <p className="text-white font-medium">0</p>
                </div>
                <div>
                  <p className="text-zinc-400">احترافي</p>
                  <p className="text-white font-medium">0</p>
                </div>
                <div>
                  <p className="text-zinc-400">أعمال</p>
                  <p className="text-white font-medium">0</p>
                </div>
                <div>
                  <p className="text-zinc-400">مؤسسات</p>
                  <p className="text-white font-medium">0</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
