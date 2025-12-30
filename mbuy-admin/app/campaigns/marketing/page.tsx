'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Megaphone, Plus, Play, Pause, BarChart3, Eye, Calendar } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'paused' | 'scheduled' | 'ended';
  budget: number;
  spent: number;
  reach: number;
  startDate: string;
  endDate: string;
}

const mockCampaigns: Campaign[] = [
  { id: '1', name: 'حملة رأس السنة', type: 'عروض', status: 'active', budget: 50000, spent: 32000, reach: 850000, startDate: '2025-12-20', endDate: '2025-01-05' },
  { id: '2', name: 'تخفيضات نهاية العام', type: 'تخفيضات', status: 'active', budget: 30000, spent: 18000, reach: 520000, startDate: '2025-12-25', endDate: '2025-12-31' },
  { id: '3', name: 'حملة المنتجات الجديدة', type: 'إطلاق', status: 'scheduled', budget: 25000, spent: 0, reach: 0, startDate: '2025-01-01', endDate: '2025-01-15' },
];

const statusConfig = {
  active: { label: 'نشطة', color: 'bg-green-500/20 text-green-400' },
  paused: { label: 'متوقفة', color: 'bg-yellow-500/20 text-yellow-400' },
  scheduled: { label: 'مجدولة', color: 'bg-blue-500/20 text-blue-400' },
  ended: { label: 'منتهية', color: 'bg-zinc-500/20 text-zinc-400' },
};

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600">
            <Megaphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">حملات تسويقية</h1>
            <p className="text-zinc-400 mt-1">إدارة الحملات التسويقية للمنصة</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          حملة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">5</div>
            <div className="text-sm text-zinc-400">حملات نشطة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">105K</div>
            <div className="text-sm text-zinc-400">إجمالي الميزانية</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">50K</div>
            <div className="text-sm text-zinc-400">المنفق</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">1.37M</div>
            <div className="text-sm text-zinc-400">إجمالي الوصول</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>الحملات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCampaigns.map((campaign) => {
              const status = statusConfig[campaign.status];
              const progress = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;
              
              return (
                <div
                  key={campaign.id}
                  className="p-4 bg-zinc-800/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-pink-500/20">
                        <Megaphone className="h-5 w-5 text-pink-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{campaign.name}</div>
                        <div className="text-sm text-zinc-500">{campaign.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                        {status.label}
                      </span>
                      {campaign.status === 'active' ? (
                        <Button variant="ghost" size="sm">
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : campaign.status === 'paused' ? (
                        <Button variant="ghost" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-zinc-500">الميزانية</div>
                      <div className="text-white font-medium">{campaign.budget.toLocaleString()} ر.س</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">المنفق</div>
                      <div className="text-white font-medium">{campaign.spent.toLocaleString()} ر.س</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">الوصول</div>
                      <div className="text-white font-medium flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {campaign.reach.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-zinc-500">الفترة</div>
                      <div className="text-white font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {campaign.startDate}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>التقدم</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
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
