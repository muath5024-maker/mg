'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle, FileCheck, Power, Star, BarChart3, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getMerchants, type Merchant } from '@/lib/worker-api';

const sections = [
  {
    title: 'الموافقات',
    description: 'مراجعة والموافقة على طلبات التجار الجدد',
    icon: CheckCircle,
    href: '/merchants/approvals',
    color: 'from-green-500 to-green-600',
  },
  {
    title: 'التحقق من السجل التجاري',
    description: 'التحقق من صحة السجلات التجارية',
    icon: FileCheck,
    href: '/merchants/verification',
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'إيقاف/تفعيل',
    description: 'إدارة حالة حسابات التجار',
    icon: Power,
    href: '/merchants/status',
    color: 'from-orange-500 to-orange-600',
  },
  {
    title: 'تقييم الجودة',
    description: 'تقييم جودة المتاجر والمنتجات',
    icon: Star,
    href: '/merchants/quality',
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    title: 'تقارير الأداء',
    description: 'عرض تقارير أداء التجار',
    icon: BarChart3,
    href: '/merchants/reports',
    color: 'from-purple-500 to-purple-600',
  },
];

interface MerchantStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
}

export default function MerchantsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MerchantStats>({ total: 0, active: 0, pending: 0, suspended: 0 });

  useEffect(() => {
    async function loadStats() {
      try {
        // Get all merchants to calculate stats
        const res = await getMerchants(1, 1); // Just to get total count
        if (res.ok && res.pagination) {
          const total = res.pagination.total;
          
          // Get counts by status
          const [activeRes, pendingRes, suspendedRes] = await Promise.all([
            getMerchants(1, 1, undefined, 'active'),
            getMerchants(1, 1, undefined, 'pending'),
            getMerchants(1, 1, undefined, 'suspended'),
          ]);

          setStats({
            total,
            active: activeRes.pagination?.total || 0,
            pending: pendingRes.pagination?.total || 0,
            suspended: suspendedRes.pagination?.total || 0,
          });
        }
      } catch (err) {
        console.error('Failed to load merchant stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة التجار</h1>
          <p className="text-zinc-400 mt-1">إدارة ومراقبة التجار في المنصة</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</div>
                <div className="text-sm text-zinc-400">إجمالي التجار</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-400">{stats.active.toLocaleString()}</div>
                <div className="text-sm text-zinc-400">تجار نشطون</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-400">{stats.pending.toLocaleString()}</div>
                <div className="text-sm text-zinc-400">بانتظار الموافقة</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-400">{stats.suspended.toLocaleString()}</div>
                <div className="text-sm text-zinc-400">موقوفون</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:border-zinc-700 transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${section.color}`}>
                    <section.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="group-hover:text-blue-400 transition-colors">
                    {section.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">{section.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
