'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Store, Save, Edit2, Percent } from 'lucide-react';

interface CommissionTier {
  id: string;
  name: string;
  minSales: number;
  maxSales: number;
  rate: number;
}

const mockTiers: CommissionTier[] = [
  { id: '1', name: 'الفئة الأساسية', minSales: 0, maxSales: 10000, rate: 5 },
  { id: '2', name: 'الفئة الفضية', minSales: 10001, maxSales: 50000, rate: 4.5 },
  { id: '3', name: 'الفئة الذهبية', minSales: 50001, maxSales: 100000, rate: 4 },
  { id: '4', name: 'الفئة البلاتينية', minSales: 100001, maxSales: -1, rate: 3.5 },
];

export default function PlatformCommissionsPage() {
  const [tiers] = useState<CommissionTier[]>(mockTiers);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
          <Store className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">عمولة المنصة</h1>
          <p className="text-zinc-400 mt-1">إدارة عمولات المبيعات الأساسية</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">450K</div>
            <div className="text-sm text-zinc-400">عمولات المبيعات هذا الشهر</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">9.2M</div>
            <div className="text-sm text-zinc-400">إجمالي المبيعات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">4.2%</div>
            <div className="text-sm text-zinc-400">متوسط العمولة</div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            فئات العمولة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    tier.rate <= 3.5 ? 'bg-purple-500/20' :
                    tier.rate <= 4 ? 'bg-yellow-500/20' :
                    tier.rate <= 4.5 ? 'bg-blue-500/20' :
                    'bg-green-500/20'
                  }`}>
                    <Percent className={`h-5 w-5 ${
                      tier.rate <= 3.5 ? 'text-purple-400' :
                      tier.rate <= 4 ? 'text-yellow-400' :
                      tier.rate <= 4.5 ? 'text-blue-400' :
                      'text-green-400'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-white">{tier.name}</div>
                    <div className="text-sm text-zinc-500">
                      {tier.minSales.toLocaleString()} - {tier.maxSales === -1 ? '∞' : tier.maxSales.toLocaleString()} ر.س
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {editingId === tier.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        defaultValue={tier.rate}
                        className="w-20"
                      />
                      <span className="text-zinc-400">%</span>
                      <Button size="sm" onClick={() => setEditingId(null)}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-white">
                        {tier.rate}%
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(tier.id)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
