'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { MinusCircle, Search, User, Coins, AlertTriangle } from 'lucide-react';

export default function DeductPointsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
          <MinusCircle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">خصم النقاط</h1>
          <p className="text-zinc-400 mt-1">خصم نقاط من رصيد المستخدمين</p>
        </div>
      </div>

      {/* Warning */}
      <Card className="border-yellow-500/50 bg-yellow-500/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <p className="text-yellow-200 text-sm">
              تنبيه: عملية خصم النقاط لا يمكن التراجع عنها. تأكد من صحة البيانات قبل التنفيذ.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deduct Form */}
        <Card>
          <CardHeader>
            <CardTitle>خصم نقاط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                البحث عن مستخدم
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="البحث بالاسم أو البريد أو رقم الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                عدد النقاط للخصم
              </label>
              <div className="relative">
                <Coins className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type="number"
                  placeholder="أدخل عدد النقاط..."
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                سبب الخصم
              </label>
              <Input
                placeholder="أدخل سبب خصم النقاط..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <Button className="w-full bg-red-600 hover:bg-red-700">
              <MinusCircle className="h-4 w-4 ml-2" />
              خصم النقاط
            </Button>
          </CardContent>
        </Card>

        {/* Recent Deductions */}
        <Card>
          <CardHeader>
            <CardTitle>آخر عمليات الخصم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">مستخدم #{i}</div>
                      <div className="text-xs text-zinc-500">مخالفة سياسات</div>
                    </div>
                  </div>
                  <div className="text-red-400 font-medium">-{(50 * i).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
