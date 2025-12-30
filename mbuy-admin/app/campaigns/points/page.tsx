'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Coins, Plus, Zap, Gift, TrendingUp, Users } from 'lucide-react';

interface PointsCampaign {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  participants: number;
  pointsIssued: number;
  status: 'active' | 'scheduled' | 'ended';
  endDate: string;
}

const mockCampaigns: PointsCampaign[] = [
  { id: '1', name: 'مضاعفة نقاط رأس السنة', description: 'ضعف النقاط على جميع المشتريات', multiplier: 2, participants: 5200, pointsIssued: 850000, status: 'active', endDate: '2025-01-05' },
  { id: '2', name: 'نقاط إضافية للتجار', description: 'نقاط إضافية لكل عملية بيع', multiplier: 1.5, participants: 890, pointsIssued: 320000, status: 'active', endDate: '2025-12-31' },
];

const statusConfig = {
  active: { label: 'نشطة', color: 'bg-green-500/20 text-green-400' },
  scheduled: { label: 'مجدولة', color: 'bg-blue-500/20 text-blue-400' },
  ended: { label: 'منتهية', color: 'bg-zinc-500/20 text-zinc-400' },
};

export default function PointsCampaignsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600">
            <Coins className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">حملات النقاط</h1>
            <p className="text-zinc-400 mt-1">عروض ومضاعفات النقاط</p>
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
            <div className="text-2xl font-bold text-yellow-400">2</div>
            <div className="text-sm text-zinc-400">حملات نشطة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">6,090</div>
            <div className="text-sm text-zinc-400">مشارك</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">1.17M</div>
            <div className="text-sm text-zinc-400">نقاط صدرت</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">+45%</div>
            <div className="text-sm text-zinc-400">زيادة التفاعل</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>الحملات النشطة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCampaigns.map((campaign) => {
              const status = statusConfig[campaign.status];
              
              return (
                <div
                  key={campaign.id}
                  className="p-4 bg-zinc-800/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                        <Zap className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{campaign.name}</div>
                        <div className="text-sm text-zinc-500">{campaign.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-yellow-400">
                        {campaign.multiplier}x
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-zinc-500" />
                      <div>
                        <div className="text-zinc-500">المشاركين</div>
                        <div className="text-white font-medium">{campaign.participants.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-zinc-500" />
                      <div>
                        <div className="text-zinc-500">النقاط الصادرة</div>
                        <div className="text-white font-medium">{campaign.pointsIssued.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-zinc-500" />
                      <div>
                        <div className="text-zinc-500">ينتهي في</div>
                        <div className="text-white font-medium">{campaign.endDate}</div>
                      </div>
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
