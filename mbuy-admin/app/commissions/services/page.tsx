'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Wrench, Save, Edit2, Percent } from 'lucide-react';

interface ServiceCommission {
  id: string;
  name: string;
  category: string;
  rate: number;
  revenue: number;
}

const mockServices: ServiceCommission[] = [
  { id: '1', name: 'التوصيل السريع', category: 'لوجستيات', rate: 8, revenue: 45000 },
  { id: '2', name: 'التغليف المميز', category: 'تعبئة', rate: 15, revenue: 28000 },
  { id: '3', name: 'الدعم المتميز', category: 'خدمة عملاء', rate: 12, revenue: 35000 },
  { id: '4', name: 'التصوير الاحترافي', category: 'تسويق', rate: 20, revenue: 52000 },
];

export default function ServicesCommissionsPage() {
  const [services] = useState<ServiceCommission[]>(mockServices);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
          <Wrench className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">عمولة الخدمات</h1>
          <p className="text-zinc-400 mt-1">عمولات الخدمات الإضافية</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">160K</div>
            <div className="text-sm text-zinc-400">عمولات الخدمات هذا الشهر</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">1.6M</div>
            <div className="text-sm text-zinc-400">إجمالي إيرادات الخدمات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">13.75%</div>
            <div className="text-sm text-zinc-400">متوسط العمولة</div>
          </CardContent>
        </Card>
      </div>

      {/* Services Commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            عمولات الخدمات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Wrench className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{service.name}</div>
                    <div className="text-sm text-zinc-500">{service.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-left">
                    <div className="text-sm text-green-400">{service.revenue.toLocaleString()} ر.س</div>
                    <div className="text-xs text-zinc-500">إيرادات الشهر</div>
                  </div>
                  {editingId === service.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.5"
                        defaultValue={service.rate}
                        className="w-20"
                      />
                      <span className="text-zinc-400">%</span>
                      <Button size="sm" onClick={() => setEditingId(null)}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-xl font-bold text-white">
                        {service.rate}%
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(service.id)}>
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
