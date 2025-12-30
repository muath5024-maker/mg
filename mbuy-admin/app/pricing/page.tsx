'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Package, Coins, Gift, TrendingUp, Users, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getSubscriptions } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface PricingSection {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  stats?: { label: string; value: string | number }[];
  color: string;
}

export default function PricingPage() {
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const result = await getSubscriptions(0, 1, 'active');
      setActiveSubscriptions(result.pagination.total);
      setLoading(false);
    }
    loadData();
  }, []);

  const sections: PricingSection[] = [
    {
      href: '/pricing/plans',
      icon: Package,
      title: 'الباقات',
      description: 'إدارة باقات الاشتراك والأسعار',
      stats: [
        { label: 'الباقات المتاحة', value: 4 },
        { label: 'الاشتراكات النشطة', value: activeSubscriptions },
      ],
      color: 'from-blue-500 to-blue-600',
    },
    {
      href: '/pricing/credits',
      icon: Coins,
      title: 'الرصيد',
      description: 'إدارة حزم الرصيد والأسعار',
      stats: [
        { label: 'حزم الرصيد', value: 5 },
        { label: 'إجمالي المبيعات', value: formatCurrency(0) },
      ],
      color: 'from-yellow-500 to-orange-600',
    },
    {
      href: '/pricing/rewards',
      icon: Gift,
      title: 'المكافآت',
      description: 'إدارة نظام النقاط والمكافآت',
      stats: [
        { label: 'المكافآت المتاحة', value: 0 },
        { label: 'النقاط الموزعة', value: formatNumber(0) },
      ],
      color: 'from-purple-500 to-pink-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">التسعير</h1>
        <p className="text-zinc-400 mt-1">إدارة الباقات والأسعار والمكافآت</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-600/20">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-600/20">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">الاشتراكات النشطة</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : formatNumber(activeSubscriptions)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-600/20">
                <Gift className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">النقاط الموزعة</p>
                <p className="text-2xl font-bold text-white">{formatNumber(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card
                variant="bordered"
                className="h-full hover:border-zinc-700 transition-colors cursor-pointer group"
              >
                <CardContent>
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${section.color} mb-4 w-fit`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{section.title}</h3>
                  <p className="text-sm text-zinc-400 mb-4">{section.description}</p>

                  {section.stats && (
                    <div className="space-y-2 mb-4">
                      {section.stats.map((stat, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">{stat.label}</span>
                          <span className="text-white font-medium">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-blue-400 group-hover:text-blue-300 transition-colors">
                    <span className="text-sm">إدارة</span>
                    <ArrowLeft className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
