'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Star, TrendingUp, TrendingDown, Store } from 'lucide-react';

interface MerchantRating {
  id: string;
  name: string;
  storeName: string;
  rating: number;
  totalReviews: number;
  trend: 'up' | 'down' | 'stable';
  issues: number;
}

const mockRatings: MerchantRating[] = [
  { id: '1', name: 'أحمد محمد', storeName: 'متجر الإلكترونيات', rating: 4.8, totalReviews: 1250, trend: 'up', issues: 2 },
  { id: '2', name: 'سارة علي', storeName: 'أزياء سارة', rating: 4.5, totalReviews: 890, trend: 'stable', issues: 5 },
  { id: '3', name: 'خالد عبدالله', storeName: 'متجر الرياضة', rating: 3.2, totalReviews: 234, trend: 'down', issues: 15 },
];

export default function QualityPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600">
          <Star className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">تقييم الجودة</h1>
          <p className="text-zinc-400 mt-1">تقييم جودة المتاجر والمنتجات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">4.2</div>
            <div className="text-sm text-zinc-400">متوسط التقييم</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">85%</div>
            <div className="text-sm text-zinc-400">نسبة الرضا</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">12,450</div>
            <div className="text-sm text-zinc-400">إجمالي التقييمات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">45</div>
            <div className="text-sm text-zinc-400">مشاكل مفتوحة</div>
          </CardContent>
        </Card>
      </div>

      {/* Ratings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            تقييمات المتاجر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRatings.map((merchant) => (
              <div
                key={merchant.id}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Star className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{merchant.storeName}</div>
                    <div className="text-sm text-zinc-400">{merchant.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-bold text-yellow-400">{merchant.rating}</span>
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="text-xs text-zinc-500">{merchant.totalReviews} تقييم</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {merchant.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-400" />}
                    {merchant.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-400" />}
                    {merchant.trend === 'stable' && <span className="text-zinc-400">—</span>}
                  </div>
                  {merchant.issues > 0 && (
                    <div className={`px-3 py-1 rounded-full text-xs ${merchant.issues > 10 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {merchant.issues} مشكلة
                    </div>
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
