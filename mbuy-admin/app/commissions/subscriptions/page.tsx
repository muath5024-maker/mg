'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { CreditCard, Save, Edit2, Percent, Users } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  subscribers: number;
  rate: number;
}

const mockPlans: SubscriptionPlan[] = [
  { id: '1', name: 'الباقة الأساسية', price: 99, subscribers: 450, rate: 10 },
  { id: '2', name: 'الباقة المتقدمة', price: 299, subscribers: 280, rate: 12 },
  { id: '3', name: 'الباقة الاحترافية', price: 599, subscribers: 150, rate: 15 },
  { id: '4', name: 'باقة المؤسسات', price: 1499, subscribers: 45, rate: 18 },
];

export default function SubscriptionsCommissionsPage() {
  const [plans] = useState<SubscriptionPlan[]>(mockPlans);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
          <CreditCard className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">عمولة الاشتراكات</h1>
          <p className="text-zinc-400 mt-1">عمولات خطط الاشتراك</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">240K</div>
            <div className="text-sm text-zinc-400">عمولات الاشتراكات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">925</div>
            <div className="text-sm text-zinc-400">مشترك نشط</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">1.8M</div>
            <div className="text-sm text-zinc-400">إيرادات الاشتراكات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">13.75%</div>
            <div className="text-sm text-zinc-400">متوسط العمولة</div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            عمولات الباقات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <CreditCard className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{plan.name}</div>
                    <div className="text-sm text-zinc-500">{plan.price} ر.س/شهر</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Users className="h-4 w-4" />
                    <span>{plan.subscribers}</span>
                  </div>
                  {editingId === plan.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="1"
                        defaultValue={plan.rate}
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
                        {plan.rate}%
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(plan.id)}>
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
