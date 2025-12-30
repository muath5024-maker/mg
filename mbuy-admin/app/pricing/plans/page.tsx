'use client';

import { useState } from 'react';
import { Package, Check, Edit2, Save, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  name_ar: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    products: number;
    ai_images: number;
    ai_videos: number;
    storage_gb: number;
  };
  is_popular: boolean;
  is_active: boolean;
}

const defaultPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    name_ar: 'المبتدئ',
    price: 0,
    interval: 'monthly',
    features: ['متجر واحد', 'حتى 10 منتجات', 'دعم بالبريد الإلكتروني'],
    limits: { products: 10, ai_images: 5, ai_videos: 0, storage_gb: 1 },
    is_popular: false,
    is_active: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    name_ar: 'الاحترافي',
    price: 99,
    interval: 'monthly',
    features: ['متجر واحد', 'حتى 100 منتج', 'دعم مباشر', 'تحليلات متقدمة'],
    limits: { products: 100, ai_images: 50, ai_videos: 10, storage_gb: 10 },
    is_popular: true,
    is_active: true,
  },
  {
    id: 'business',
    name: 'Business',
    name_ar: 'الأعمال',
    price: 299,
    interval: 'monthly',
    features: ['حتى 3 متاجر', 'منتجات غير محدودة', 'دعم أولوية', 'API كامل'],
    limits: { products: -1, ai_images: 200, ai_videos: 50, storage_gb: 50 },
    is_popular: false,
    is_active: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    name_ar: 'المؤسسات',
    price: 999,
    interval: 'monthly',
    features: ['متاجر غير محدودة', 'منتجات غير محدودة', 'مدير حساب مخصص', 'SLA مخصص'],
    limits: { products: -1, ai_images: -1, ai_videos: -1, storage_gb: -1 },
    is_popular: false,
    is_active: true,
  },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editedPrice, setEditedPrice] = useState<number>(0);

  const handleEditStart = (plan: Plan) => {
    setEditingPlan(plan.id);
    setEditedPrice(plan.price);
  };

  const handleEditSave = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, price: editedPrice } : p))
    );
    setEditingPlan(null);
  };

  const handleEditCancel = () => {
    setEditingPlan(null);
  };

  const togglePlanStatus = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, is_active: !p.is_active } : p))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">الباقات</h1>
          <p className="text-zinc-400 mt-1">إدارة باقات الاشتراك والأسعار</p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            variant="bordered"
            className={`relative ${!plan.is_active ? 'opacity-60' : ''} ${
              plan.is_popular ? 'border-blue-500' : ''
            }`}
          >
            {plan.is_popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="info">الأكثر شعبية</Badge>
              </div>
            )}

            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Package className="h-5 w-5 text-blue-400" />
                </div>
                <Badge variant={plan.is_active ? 'success' : 'default'}>
                  {plan.is_active ? 'نشط' : 'معطل'}
                </Badge>
              </div>
              <CardTitle className="mt-4">{plan.name_ar}</CardTitle>
              <p className="text-sm text-zinc-400">{plan.name}</p>
            </CardHeader>

            <CardContent>
              {/* Price */}
              <div className="mb-6">
                {editingPlan === plan.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={editedPrice}
                      onChange={(e) => setEditedPrice(Number(e.target.value))}
                      className="w-24"
                    />
                    <Button variant="ghost" size="sm" onClick={() => handleEditSave(plan.id)}>
                      <Save className="h-4 w-4 text-green-400" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleEditCancel}>
                      <X className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-zinc-400">/ شهرياً</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditStart(plan)}
                      className="mr-auto"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Limits */}
              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">المنتجات</span>
                  <span className="text-white">
                    {plan.limits.products === -1 ? 'غير محدود' : plan.limits.products}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">صور AI</span>
                  <span className="text-white">
                    {plan.limits.ai_images === -1 ? 'غير محدود' : plan.limits.ai_images}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">فيديو AI</span>
                  <span className="text-white">
                    {plan.limits.ai_videos === -1 ? 'غير محدود' : plan.limits.ai_videos}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">التخزين</span>
                  <span className="text-white">
                    {plan.limits.storage_gb === -1 ? 'غير محدود' : `${plan.limits.storage_gb} GB`}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-400" />
                    <span className="text-zinc-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <Button
                variant={plan.is_active ? 'outline' : 'primary'}
                className="w-full"
                onClick={() => togglePlanStatus(plan.id)}
              >
                {plan.is_active ? 'تعطيل' : 'تفعيل'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
