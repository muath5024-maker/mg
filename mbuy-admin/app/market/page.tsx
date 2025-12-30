'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LayoutGrid, Monitor, Tag, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    title: 'التحكم في الأقسام',
    description: 'إدارة أقسام وفئات المنتجات في السوق',
    icon: LayoutGrid,
    href: '/market/categories',
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'التحكم في الواجهة',
    description: 'تخصيص مظهر وتصميم واجهة السوق',
    icon: Monitor,
    href: '/market/interface',
    color: 'from-purple-500 to-purple-600',
  },
  {
    title: 'التحكم في العروض',
    description: 'إدارة العروض والتخفيضات المعروضة',
    icon: Tag,
    href: '/market/offers',
    color: 'from-orange-500 to-orange-600',
  },
  {
    title: 'التحكم في المحتوى',
    description: 'إدارة المحتوى والنصوص والصور',
    icon: FileText,
    href: '/market/content',
    color: 'from-green-500 to-green-600',
  },
];

export default function MarketPage() {
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
          <h1 className="text-2xl font-bold text-white">إدارة السوق</h1>
          <p className="text-zinc-400 mt-1">التحكم الكامل في السوق والمحتوى</p>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:border-zinc-700 transition-all cursor-pointer group">
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
