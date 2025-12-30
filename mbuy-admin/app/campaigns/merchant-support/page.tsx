'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Target, Plus, Gift, Users, TrendingUp, Store } from 'lucide-react';

interface SupportProgram {
  id: string;
  name: string;
  description: string;
  type: string;
  participants: number;
  budget: number;
  status: 'active' | 'upcoming' | 'ended';
}

const mockPrograms: SupportProgram[] = [
  { id: '1', name: 'برنامج التجار الجدد', description: 'دعم التجار الجدد بعمولة مخفضة', type: 'عمولة', participants: 150, budget: 25000, status: 'active' },
  { id: '2', name: 'برنامج النمو', description: 'مكافآت للتجار الأكثر نمواً', type: 'مكافآت', participants: 50, budget: 50000, status: 'active' },
  { id: '3', name: 'برنامج التميز', description: 'دعم التجار المتميزين', type: 'ترويج', participants: 25, budget: 30000, status: 'active' },
];

const statusConfig = {
  active: { label: 'نشط', color: 'bg-green-500/20 text-green-400' },
  upcoming: { label: 'قادم', color: 'bg-blue-500/20 text-blue-400' },
  ended: { label: 'منتهي', color: 'bg-zinc-500/20 text-zinc-400' },
};

export default function MerchantSupportPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">دعم التجار</h1>
            <p className="text-zinc-400 mt-1">برامج دعم وتحفيز التجار</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          برنامج جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">3</div>
            <div className="text-sm text-zinc-400">برامج نشطة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">225</div>
            <div className="text-sm text-zinc-400">تاجر مشارك</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">105K</div>
            <div className="text-sm text-zinc-400">إجمالي الدعم</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">+35%</div>
            <div className="text-sm text-zinc-400">نمو المشاركين</div>
          </CardContent>
        </Card>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockPrograms.map((program) => {
          const status = statusConfig[program.status];
          
          return (
            <Card key={program.id} className="hover:border-zinc-700 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 rounded-full text-xs bg-zinc-800 text-zinc-400">
                    {program.type}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <CardTitle className="mt-4">{program.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 text-sm mb-4">{program.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-zinc-500">
                    <Users className="h-4 w-4" />
                    {program.participants} مشارك
                  </div>
                  <div className="flex items-center gap-1 text-green-400">
                    <Gift className="h-4 w-4" />
                    {program.budget.toLocaleString()} ر.س
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  إدارة البرنامج
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
