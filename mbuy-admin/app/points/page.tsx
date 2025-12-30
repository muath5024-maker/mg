'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Coins, PlusCircle, MinusCircle, ArrowLeftRight, Activity, Wallet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    title: 'إصدار النقاط',
    description: 'إصدار نقاط جديدة للمستخدمين',
    icon: PlusCircle,
    href: '/points/issue',
    color: 'from-green-500 to-green-600',
    count: null,
  },
  {
    title: 'خصم النقاط',
    description: 'خصم نقاط من رصيد المستخدمين',
    icon: MinusCircle,
    href: '/points/deduct',
    color: 'from-red-500 to-red-600',
    count: null,
  },
  {
    title: 'التحويل بين المحافظ',
    description: 'تحويل النقاط بين محافظ المستخدمين',
    icon: ArrowLeftRight,
    href: '/points/transfer',
    color: 'from-blue-500 to-blue-600',
    count: 8,
  },
  {
    title: 'مراقبة الأنشطة',
    description: 'مراقبة أنشطة النقاط المشبوهة',
    icon: Activity,
    href: '/points/monitoring',
    color: 'from-orange-500 to-orange-600',
    count: 3,
  },
  {
    title: 'التقارير المالية',
    description: 'تقارير مالية شاملة للنقاط',
    icon: Wallet,
    href: '/points/financial',
    color: 'from-purple-500 to-purple-600',
    count: null,
  },
];

export default function PointsPage() {
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
          <h1 className="text-2xl font-bold text-white">إدارة النقاط</h1>
          <p className="text-zinc-400 mt-1">إدارة نظام النقاط والمكافآت</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Coins className="h-8 w-8 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-white">12.5M</div>
                <div className="text-sm text-zinc-400">إجمالي النقاط</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">+850K</div>
            <div className="text-sm text-zinc-400">صدر هذا الشهر</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">-320K</div>
            <div className="text-sm text-zinc-400">مستخدم هذا الشهر</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">45,230</div>
            <div className="text-sm text-zinc-400">معاملات اليوم</div>
          </CardContent>
        </Card>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:border-zinc-700 transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${section.color}`}>
                      <section.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="group-hover:text-blue-400 transition-colors">
                      {section.title}
                    </CardTitle>
                  </div>
                  {section.count !== null && (
                    <div className="px-3 py-1 rounded-full bg-zinc-800 text-sm text-zinc-300">
                      {section.count}
                    </div>
                  )}
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
