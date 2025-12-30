'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Wrench, Plus, DollarSign, BarChart3, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    title: 'إضافة أدوات جديدة',
    description: 'إضافة وإدارة الأدوات المتاحة في المنصة',
    icon: Plus,
    href: '/tools/add',
    color: 'from-green-500 to-green-600',
    count: null,
  },
  {
    title: 'إدارة التسعير',
    description: 'تحديد وتعديل أسعار الأدوات',
    icon: DollarSign,
    href: '/tools/pricing',
    color: 'from-blue-500 to-blue-600',
    count: null,
  },
  {
    title: 'تتبع الاستخدام',
    description: 'مراقبة استخدام الأدوات من قبل التجار',
    icon: BarChart3,
    href: '/tools/usage',
    color: 'from-purple-500 to-purple-600',
    count: null,
  },
  {
    title: 'التحديثات والصيانة',
    description: 'إدارة تحديثات وصيانة الأدوات',
    icon: RefreshCw,
    href: '/tools/updates',
    color: 'from-orange-500 to-orange-600',
    count: 2,
  },
];

export default function ToolsPage() {
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
          <h1 className="text-2xl font-bold text-white">إدارة الأدوات</h1>
          <p className="text-zinc-400 mt-1">إدارة أدوات المنصة للتجار</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Wrench className="h-8 w-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">24</div>
                <div className="text-sm text-zinc-400">أداة متاحة</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">892</div>
            <div className="text-sm text-zinc-400">مستخدم نشط</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">45K</div>
            <div className="text-sm text-zinc-400">استخدام شهري</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">125K</div>
            <div className="text-sm text-zinc-400">إيرادات الشهر</div>
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
                    <CardTitle className="group-hover:text-blue-400 transition-colors">
                      {section.title}
                    </CardTitle>
                  </div>
                  {section.count !== null && (
                    <div className="px-3 py-1 rounded-full bg-orange-500/20 text-sm text-orange-400">
                      {section.count} تحديث
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
