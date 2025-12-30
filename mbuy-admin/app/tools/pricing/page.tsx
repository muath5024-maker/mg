'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { DollarSign, Save, Wrench, Edit2 } from 'lucide-react';

interface ToolPricing {
  id: string;
  name: string;
  currentPrice: number;
  usageCount: number;
}

const mockTools: ToolPricing[] = [
  { id: '1', name: 'مولد الصور بالذكاء الاصطناعي', currentPrice: 100, usageCount: 15000 },
  { id: '2', name: 'محرر الفيديو', currentPrice: 150, usageCount: 8500 },
  { id: '3', name: 'مساعد الكتابة', currentPrice: 50, usageCount: 22000 },
  { id: '4', name: 'تحليل البيانات', currentPrice: 200, usageCount: 3200 },
  { id: '5', name: 'إدارة المخزون', currentPrice: 75, usageCount: 12000 },
];

export default function PricingPage() {
  const [tools] = useState<ToolPricing[]>(mockTools);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
          <DollarSign className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة التسعير</h1>
          <p className="text-zinc-400 mt-1">تحديد وتعديل أسعار الأدوات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">24</div>
            <div className="text-sm text-zinc-400">إجمالي الأدوات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">115</div>
            <div className="text-sm text-zinc-400">متوسط السعر (نقاط)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">2.8M</div>
            <div className="text-sm text-zinc-400">إجمالي الإيرادات</div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            قائمة أسعار الأدوات
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
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Wrench className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{tool.name}</div>
                    <div className="text-sm text-zinc-500">{tool.usageCount.toLocaleString()} استخدام</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {editingId === tool.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        defaultValue={tool.currentPrice}
                        className="w-24"
                      />
                      <Button size="sm" onClick={() => setEditingId(null)}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-xl font-bold text-yellow-400">
                        {tool.currentPrice} <span className="text-sm text-zinc-500">نقطة</span>
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
