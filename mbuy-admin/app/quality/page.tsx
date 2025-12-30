'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Shield, Package, MessageSquare, AlertTriangle, Ban, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    title: 'مراجعة المنتجات',
    description: 'مراجعة جودة المنتجات والموافقة عليها',
    icon: Package,
    href: '/quality/products',
    color: 'from-blue-500 to-blue-600',
    count: 28,
  },
  {
    title: 'مراقبة المحادثات',
    description: 'مراقبة المحادثات بين التجار والعملاء',
    icon: MessageSquare,
    href: '/quality/conversations',
    color: 'from-green-500 to-green-600',
    count: 5,
  },
  {
    title: 'إدارة الشكاوى',
    description: 'معالجة شكاوى العملاء والتجار',
    icon: AlertTriangle,
    href: '/quality/complaints',
    color: 'from-yellow-500 to-yellow-600',
    count: 12,
  },
  {
    title: 'إدارة المخالفات',
    description: 'تتبع ومعالجة مخالفات السياسات',
    icon: Ban,
    href: '/quality/violations',
    color: 'from-red-500 to-red-600',
    count: 8,
  },
];

export default function QualityPage() {
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
          <h1 className="text-2xl font-bold text-white">إدارة الجودة والسياسات</h1>
          <p className="text-zinc-400 mt-1">مراقبة الجودة وتطبيق السياسات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">98.5%</div>
                <div className="text-sm text-zinc-400">نسبة الامتثال</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">53</div>
            <div className="text-sm text-zinc-400">قيد المراجعة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">1,245</div>
            <div className="text-sm text-zinc-400">تم حلها هذا الشهر</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">8</div>
            <div className="text-sm text-zinc-400">مخالفات نشطة</div>
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
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      section.count > 10 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {section.count} معلق
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
