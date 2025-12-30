'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Package, Save, Edit2, Percent, BarChart3 } from 'lucide-react';

interface ToolCommission {
  id: string;
  name: string;
  usageCount: number;
  revenue: number;
  rate: number;
}

const mockTools: ToolCommission[] = [
  { id: '1', name: 'مولد الصور AI', usageCount: 45000, revenue: 180000, rate: 20 },
  { id: '2', name: 'مساعد الكتابة', usageCount: 62000, revenue: 124000, rate: 18 },
  { id: '3', name: 'تحليل البيانات', usageCount: 15000, revenue: 75000, rate: 22 },
  { id: '4', name: 'محرر الفيديو', usageCount: 8500, revenue: 85000, rate: 25 },
];

export default function ToolsCommissionsPage() {
  const [tools] = useState<ToolCommission[]>(mockTools);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
          <Package className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">عمولة الأدوات</h1>
          <p className="text-zinc-400 mt-1">عمولات استخدام الأدوات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">92.8K</div>
            <div className="text-sm text-zinc-400">عمولات الأدوات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-400">130.5K</div>
            <div className="text-sm text-zinc-400">استخدام شهري</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">464K</div>
            <div className="text-sm text-zinc-400">إجمالي الإيرادات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">21.25%</div>
            <div className="text-sm text-zinc-400">متوسط العمولة</div>
          </CardContent>
        </Card>
      </div>

      {/* Tools Commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            عمولات الأدوات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Package className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{tool.name}</div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <BarChart3 className="h-3 w-3" />
                      {tool.usageCount.toLocaleString()} استخدام
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-left">
                    <div className="text-sm text-green-400">{tool.revenue.toLocaleString()} ر.س</div>
                    <div className="text-xs text-zinc-500">إيرادات الشهر</div>
                  </div>
                  {editingId === tool.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="1"
                        defaultValue={tool.rate}
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
                        {tool.rate}%
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(tool.id)}>
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
