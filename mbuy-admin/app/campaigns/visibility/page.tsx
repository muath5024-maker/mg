'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Eye, Plus, Star, TrendingUp, Store, Calendar, DollarSign } from 'lucide-react';

interface Ad {
  id: string;
  merchant: string;
  type: string;
  placement: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  status: 'active' | 'paused' | 'pending';
  startDate: string;
}

const mockAds: Ad[] = [
  { id: '1', merchant: 'متجر الإلكترونيات', type: 'بانر رئيسي', placement: 'الصفحة الرئيسية', budget: 5000, spent: 3200, impressions: 125000, clicks: 4500, status: 'active', startDate: '2025-12-20' },
  { id: '2', merchant: 'أزياء سارة', type: 'منتج مميز', placement: 'صفحة التصنيف', budget: 2000, spent: 1500, impressions: 45000, clicks: 1800, status: 'active', startDate: '2025-12-22' },
  { id: '3', merchant: 'متجر الرياضة', type: 'إعلان بحث', placement: 'نتائج البحث', budget: 3000, spent: 800, impressions: 28000, clicks: 950, status: 'pending', startDate: '2025-12-28' },
];

const statusConfig = {
  active: { label: 'نشط', color: 'bg-green-500/20 text-green-400' },
  paused: { label: 'متوقف', color: 'bg-yellow-500/20 text-yellow-400' },
  pending: { label: 'قيد المراجعة', color: 'bg-blue-500/20 text-blue-400' },
};

export default function VisibilityPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">الإعلان والظهور</h1>
            <p className="text-zinc-400 mt-1">إدارة الإعلانات المدفوعة</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إعلان جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">8</div>
            <div className="text-sm text-zinc-400">إعلانات نشطة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">198K</div>
            <div className="text-sm text-zinc-400">مشاهدات اليوم</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">3.6%</div>
            <div className="text-sm text-zinc-400">معدل النقر</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">15K</div>
            <div className="text-sm text-zinc-400">إيرادات الإعلانات</div>
          </CardContent>
        </Card>
      </div>

      {/* Ads List */}
      <Card>
        <CardHeader>
          <CardTitle>الإعلانات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAds.map((ad) => {
              const status = statusConfig[ad.status];
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0;
              const progress = ad.budget > 0 ? (ad.spent / ad.budget) * 100 : 0;
              
              return (
                <div
                  key={ad.id}
                  className="p-4 bg-zinc-800/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Store className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{ad.merchant}</div>
                        <div className="text-sm text-zinc-500">{ad.type} • {ad.placement}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                        {status.label}
                      </span>
                      <Button variant="ghost" size="sm">
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-4 text-sm mb-3">
                    <div>
                      <div className="text-zinc-500">الميزانية</div>
                      <div className="text-white font-medium">{ad.budget.toLocaleString()} ر.س</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">المنفق</div>
                      <div className="text-white font-medium">{ad.spent.toLocaleString()} ر.س</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">المشاهدات</div>
                      <div className="text-white font-medium flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {ad.impressions.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-zinc-500">النقرات</div>
                      <div className="text-white font-medium">{ad.clicks.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">CTR</div>
                      <div className="text-green-400 font-medium">{ctr}%</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>استهلاك الميزانية</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
