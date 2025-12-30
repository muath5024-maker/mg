'use client';

import Link from 'next/link';
import { Megaphone, Ticket, Timer, Share2, ArrowLeft, TrendingUp, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface MarketingSection {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const sections: MarketingSection[] = [
  {
    href: '/marketing/coupons',
    icon: Ticket,
    title: 'الكوبونات',
    description: 'إدارة كوبونات الخصم والعروض',
    color: 'from-green-500 to-emerald-600',
  },
  {
    href: '/marketing/flash-sales',
    icon: Timer,
    title: 'العروض السريعة',
    description: 'إدارة العروض محدودة الوقت',
    color: 'from-orange-500 to-red-600',
  },
  {
    href: '/marketing/referrals',
    icon: Share2,
    title: 'الإحالات',
    description: 'إدارة برنامج الإحالات والمكافآت',
    color: 'from-blue-500 to-purple-600',
  },
];

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">التسويق</h1>
        <p className="text-zinc-400 mt-1">أدوات التسويق والعروض الترويجية</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-600/20">
                <Ticket className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">الكوبونات النشطة</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-600/20">
                <Timer className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">العروض الجارية</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-600/20">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">إجمالي الإحالات</p>
                <p className="text-2xl font-bold text-white">0</p>
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
