'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BarChart3, Download, Calendar, Wrench, TrendingUp, Users } from 'lucide-react';

interface ToolUsage {
  name: string;
  usageCount: number;
  activeUsers: number;
  trend: number;
}

const mockUsage: ToolUsage[] = [
  { name: 'مساعد الكتابة', usageCount: 22000, activeUsers: 450, trend: 15 },
  { name: 'مولد الصور', usageCount: 15000, activeUsers: 380, trend: 25 },
  { name: 'إدارة المخزون', usageCount: 12000, activeUsers: 290, trend: 8 },
  { name: 'محرر الفيديو', usageCount: 8500, activeUsers: 180, trend: -5 },
  { name: 'تحليل البيانات', usageCount: 3200, activeUsers: 85, trend: 12 },
];

export default function UsagePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">تتبع الاستخدام</h1>
            <p className="text-zinc-400 mt-1">مراقبة استخدام الأدوات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 ml-2" />
            تحديد الفترة
          </Button>
          <Button>
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">60.7K</div>
            <div className="text-sm text-zinc-400">إجمالي الاستخدام</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">1,385</div>
            <div className="text-sm text-zinc-400">مستخدم نشط</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">+18%</div>
            <div className="text-sm text-zinc-400">نمو أسبوعي</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">44</div>
            <div className="text-sm text-zinc-400">متوسط استخدام/مستخدم</div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>الاستخدام اليومي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-zinc-500">
            <BarChart3 className="h-12 w-12 opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* Tools Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            استخدام الأدوات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockUsage.map((tool, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-medium text-white">{tool.name}</div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <Users className="h-3 w-3" />
                      {tool.activeUsers} مستخدم نشط
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-left">
                    <div className="text-lg font-bold text-white">{tool.usageCount.toLocaleString()}</div>
                    <div className="text-xs text-zinc-500">استخدام</div>
                  </div>
                  <div className={`flex items-center gap-1 ${tool.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <TrendingUp className={`h-4 w-4 ${tool.trend < 0 ? 'rotate-180' : ''}`} />
                    <span className="font-medium">{Math.abs(tool.trend)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
