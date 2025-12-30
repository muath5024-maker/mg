'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Megaphone, Target, Gift, Coins, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    title: 'حملات تسويقية',
    description: 'إدارة الحملات التسويقية للمنصة',
    icon: Megaphone,
    href: '/campaigns/marketing',
    color: 'from-pink-500 to-rose-600',
    count: 5,
  },
  {
    title: 'دعم التجار',
    description: 'برامج دعم وتحفيز التجار',
    icon: Target,
    href: '/campaigns/merchant-support',
    color: 'from-blue-500 to-cyan-600',
    count: 3,
  },
  {
    title: 'حملات النقاط',
    description: 'عروض ومضاعفات النقاط',
    icon: Coins,
    href: '/campaigns/points',
    color: 'from-yellow-500 to-orange-600',
    count: 2,
  },
  {
    title: 'الإعلان والظهور',
    description: 'إدارة الإعلانات المدفوعة',
    icon: Eye,
    href: '/campaigns/visibility',
    color: 'from-purple-500 to-violet-600',
    count: 8,
  },
];

export default function CampaignsPage() {
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
          <h1 className="text-2xl font-bold text-white">إدارة الحملات</h1>
          <p className="text-zinc-400 mt-1">إدارة الحملات التسويقية والترويجية</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-pink-400" />
              <div>
                <div className="text-2xl font-bold text-white">18</div>
                <div className="text-sm text-zinc-400">حملة نشطة</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">2.5M</div>
            <div className="text-sm text-zinc-400">وصول الشهر</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">125K</div>
            <div className="text-sm text-zinc-400">ميزانية الشهر</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">3.5%</div>
            <div className="text-sm text-zinc-400">معدل التحويل</div>
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
                    <CardTitle className="group-hover:text-pink-400 transition-colors">
                      {section.title}
                    </CardTitle>
                  </div>
                  {section.count !== null && (
                    <div className="px-3 py-1 rounded-full bg-zinc-800 text-sm text-zinc-300">
                      {section.count} نشطة
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
