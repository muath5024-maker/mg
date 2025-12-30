'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Brain, Sparkles, FolderOpen, LayoutTemplate, Wallet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    title: 'استوديو الذكاء الاصطناعي',
    description: 'إدارة أدوات الذكاء الاصطناعي المتاحة',
    icon: Sparkles,
    href: '/ai/studio',
    color: 'from-purple-500 to-pink-600',
    count: null,
  },
  {
    title: 'المشاريع',
    description: 'إدارة مشاريع الذكاء الاصطناعي',
    icon: FolderOpen,
    href: '/ai/projects',
    color: 'from-blue-500 to-cyan-600',
    count: 15,
  },
  {
    title: 'القوالب',
    description: 'إدارة قوالب الذكاء الاصطناعي',
    icon: LayoutTemplate,
    href: '/ai/templates',
    color: 'from-green-500 to-emerald-600',
    count: 48,
  },
  {
    title: 'إدارة التكاليف',
    description: 'مراقبة تكاليف استخدام AI',
    icon: Wallet,
    href: '/ai/costs',
    color: 'from-orange-500 to-red-600',
    count: null,
  },
];

export default function AIPage() {
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
          <h1 className="text-2xl font-bold text-white">إدارة الذكاء الاصطناعي</h1>
          <p className="text-zinc-400 mt-1">إدارة أدوات ومشاريع الذكاء الاصطناعي</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">12</div>
                <div className="text-sm text-zinc-400">نموذج متاح</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">2.5M</div>
            <div className="text-sm text-zinc-400">طلب هذا الشهر</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">98.5%</div>
            <div className="text-sm text-zinc-400">نسبة النجاح</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">$15.2K</div>
            <div className="text-sm text-zinc-400">تكلفة الشهر</div>
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
                    <CardTitle className="group-hover:text-purple-400 transition-colors">
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
