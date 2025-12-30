'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PlusCircle, Search, User, Coins } from 'lucide-react';

export default function IssuePointsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
          <PlusCircle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">إصدار النقاط</h1>
          <p className="text-zinc-400 mt-1">إصدار نقاط جديدة للمستخدمين</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issue Form */}
        <Card>
          <CardHeader>
            <CardTitle>إصدار نقاط جديدة</CardTitle>
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
                عدد النقاط
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
                سبب الإصدار
              </label>
              <Input
                placeholder="أدخل سبب إصدار النقاط..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <Button className="w-full bg-green-600 hover:bg-green-700">
              <PlusCircle className="h-4 w-4 ml-2" />
              إصدار النقاط
            </Button>
          </CardContent>
        </Card>

        {/* Recent Issues */}
        <Card>
          <CardHeader>
            <CardTitle>آخر عمليات الإصدار</CardTitle>
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
                      <div className="text-xs text-zinc-500">مكافأة تسجيل</div>
                    </div>
                  </div>
                  <div className="text-green-400 font-medium">+{(100 * i).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
