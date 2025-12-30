'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Percent, Store, Wrench, CreditCard, Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    title: 'عمولة المنصة',
    description: 'إدارة عمولات المبيعات الأساسية',
    icon: Store,
    href: '/commissions/platform',
    color: 'from-green-500 to-green-600',
    value: '5%',
  },
  {
    title: 'عمولة الخدمات',
    description: 'عمولات الخدمات الإضافية',
    icon: Wrench,
    href: '/commissions/services',
    color: 'from-blue-500 to-blue-600',
    value: '10%',
  },
  {
    title: 'عمولة الاشتراكات',
    description: 'عمولات خطط الاشتراك',
    icon: CreditCard,
    href: '/commissions/subscriptions',
    color: 'from-purple-500 to-purple-600',
    value: '15%',
  },
  {
    title: 'عمولة الأدوات',
    description: 'عمولات استخدام الأدوات',
    icon: Package,
    href: '/commissions/tools',
    color: 'from-orange-500 to-orange-600',
    value: '20%',
  },
];

export default function CommissionsPage() {
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
          <h1 className="text-2xl font-bold text-white">إدارة العمولات</h1>
          <p className="text-zinc-400 mt-1">إدارة وتعديل نسب العمولات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Percent className="h-8 w-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">850K</div>
                <div className="text-sm text-zinc-400">إجمالي العمولات</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">+12%</div>
            <div className="text-sm text-zinc-400">نمو شهري</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">1,234</div>
            <div className="text-sm text-zinc-400">معاملة اليوم</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">8.5%</div>
            <div className="text-sm text-zinc-400">متوسط العمولة</div>
          </CardContent>
        </Card>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:border-zinc-700 transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${section.color}`}>
                      <section.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="group-hover:text-green-400 transition-colors">
                      {section.title}
                    </CardTitle>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {section.value}
                  </div>
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
