'use client';

import { useEffect, useState } from 'react';
import {
  Store,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Server,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { PageLoading, CardSkeleton } from '@/components/ui/Loading';
import { getDashboardStats, getRevenueChart, checkWorkerHealth, type DashboardStats, type RevenueData } from '@/lib/worker-api';
import { formatCurrency, formatNumber, formatPercentage, getStatusColor, translateStatus } from '@/lib/utils';

interface WorkerHealth {
  status: 'healthy' | 'degraded' | 'down';
  latency_ms: number;
}

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
                <span className="text-zinc-500 text-sm">من الشهر الماضي</span>
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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [workerHealth, setWorkerHealth] = useState<WorkerHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsRes, revenueRes, healthRes] = await Promise.all([
          getDashboardStats(),
          getRevenueChart(30),
          checkWorkerHealth(),
        ]);

        if (!statsRes.ok) throw new Error(statsRes.message || 'Failed to load stats');
        if (!revenueRes.ok) throw new Error(revenueRes.message || 'Failed to load revenue');

        setStats(statsRes.data || null);
        setRevenueData(revenueRes.data || []);
        
        // Transform health response
        if (healthRes.ok) {
          setWorkerHealth({ status: 'healthy', latency_ms: 0 });
        } else {
          setWorkerHealth({ status: 'down', latency_ms: 0 });
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
        </div>
        <CardSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
          <p className="text-zinc-400 mt-1">مرحباً بك في لوحة تحكم MBUY</p>
        </div>
        {workerHealth && (
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-400">Worker:</span>
            <Badge
              variant={
                workerHealth.status === 'healthy'
                  ? 'success'
                  : workerHealth.status === 'degraded'
                  ? 'warning'
                  : 'error'
              }
            >
              {translateStatus(workerHealth.status)}
            </Badge>
            <span className="text-xs text-zinc-500">
              {workerHealth.latency_ms}ms
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي التجار"
          value={formatNumber(stats?.totalMerchants || 0)}
          icon={Store}
          iconColor="bg-blue-600"
        />
        <StatCard
          title="إجمالي العملاء"
          value={formatNumber(stats?.totalCustomers || 0)}
          icon={Users}
          iconColor="bg-green-600"
        />
        <StatCard
          title="إجمالي الطلبات"
          value={formatNumber(stats?.totalOrders || 0)}
          icon={ShoppingCart}
          iconColor="bg-purple-600"
        />
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
          iconColor="bg-orange-600"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Merchants */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>التجار النشطين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-600/20">
                <Activity className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {formatNumber(stats?.activeMerchants || 0)}
                </p>
                <p className="text-sm text-zinc-400">تاجر نشط</p>
              </div>
            </div>
            {(stats?.pendingMerchants || 0) > 0 && (
              <div className="mt-4 p-3 bg-yellow-600/10 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  {stats?.pendingMerchants} تاجر في انتظار الموافقة
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card variant="bordered" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickAction href="/merchants" icon={Store} label="إدارة التجار" />
              <QuickAction href="/users" icon={Users} label="إدارة العملاء" />
              <QuickAction href="/features" icon={Activity} label="المميزات" />
              <QuickAction href="/settings" icon={Server} label="الإعدادات" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>الإيرادات خلال آخر 30 يوم</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.length > 0 ? (
            <div className="h-64 flex items-end gap-1">
              {revenueData.slice(-30).map((item, index) => {
                const maxRevenue = Math.max(...revenueData.map((d) => d.revenue));
                const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

                return (
                  <div
                    key={index}
                    className="flex-1 bg-blue-600/30 hover:bg-blue-600/50 transition-colors rounded-t cursor-pointer group relative"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${item.date}: ${formatCurrency(item.revenue)}`}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-800 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-zinc-500">
              لا توجد بيانات إيرادات
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface QuickActionProps {
  href: string;
  icon: React.ElementType;
  label: string;
}

function QuickAction({ href, icon: Icon, label }: QuickActionProps) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
    >
      <Icon className="h-6 w-6 text-zinc-400 group-hover:text-blue-400 transition-colors" />
      <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
        {label}
      </span>
    </a>
  );
}
