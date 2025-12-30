'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Package, CheckCircle, XCircle, Eye, Clock, Store } from 'lucide-react';

interface ProductReview {
  id: string;
  name: string;
  merchant: string;
  category: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const mockProducts: ProductReview[] = [
  { id: '1', name: 'هاتف ذكي سامسونج', merchant: 'متجر الإلكترونيات', category: 'إلكترونيات', submittedAt: '2025-12-28', status: 'pending' },
  { id: '2', name: 'فستان صيفي', merchant: 'أزياء سارة', category: 'ملابس', submittedAt: '2025-12-27', status: 'pending' },
  { id: '3', name: 'حذاء رياضي', merchant: 'متجر الرياضة', category: 'أحذية', submittedAt: '2025-12-27', status: 'pending' },
];

export default function ProductsReviewPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
          <Package className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">مراجعة المنتجات</h1>
          <p className="text-zinc-400 mt-1">مراجعة جودة المنتجات والموافقة عليها</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">28</div>
            <div className="text-sm text-zinc-400">بانتظار المراجعة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">1,456</div>
            <div className="text-sm text-zinc-400">تمت الموافقة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">89</div>
            <div className="text-sm text-zinc-400">تم الرفض</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">95%</div>
            <div className="text-sm text-zinc-400">نسبة القبول</div>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            منتجات بانتظار المراجعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockProducts.filter(p => p.status === 'pending').map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-zinc-700 flex items-center justify-center">
                    <Package className="h-8 w-8 text-zinc-500" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{product.name}</div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Store className="h-4 w-4" />
                      {product.merchant}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">{product.category} • {product.submittedAt}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 ml-1" />
                    معاينة
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 ml-1" />
                    موافقة
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-400 border-red-400/50 hover:bg-red-400/10">
                    <XCircle className="h-4 w-4 ml-1" />
                    رفض
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
