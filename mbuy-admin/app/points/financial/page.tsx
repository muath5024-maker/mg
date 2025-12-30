'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Wallet, Download, Calendar, TrendingUp, Coins, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function FinancialPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">التقارير المالية</h1>
            <p className="text-zinc-400 mt-1">تقارير مالية شاملة للنقاط</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 ml-2" />
            تحديد الفترة
          </Button>
          <Button>
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Coins className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">12.5M</div>
                <div className="text-sm text-zinc-400">إجمالي النقاط</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <ArrowUpRight className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">+2.3M</div>
                <div className="text-sm text-zinc-400">صدر هذا الشهر</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <ArrowDownRight className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">-1.8M</div>
                <div className="text-sm text-zinc-400">مستخدم هذا الشهر</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">+12%</div>
                <div className="text-sm text-zinc-400">نمو شهري</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>حركة النقاط الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-zinc-500">
              <TrendingUp className="h-12 w-12 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>توزيع الاستخدام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-zinc-500">
              <Wallet className="h-12 w-12 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص المعاملات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <span className="text-zinc-400">نقاط الترحيب</span>
              <span className="text-green-400 font-medium">+500,000</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <span className="text-zinc-400">مكافآت الشراء</span>
              <span className="text-green-400 font-medium">+1,200,000</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <span className="text-zinc-400">استبدال النقاط</span>
              <span className="text-red-400 font-medium">-800,000</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <span className="text-zinc-400">انتهاء صلاحية</span>
              <span className="text-red-400 font-medium">-150,000</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
