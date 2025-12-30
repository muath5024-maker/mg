'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeftRight, Search, User, Coins, ArrowRight } from 'lucide-react';

export default function TransferPointsPage() {
  const [fromUser, setFromUser] = useState('');
  const [toUser, setToUser] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
          <ArrowLeftRight className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">التحويل بين المحافظ</h1>
          <p className="text-zinc-400 mt-1">تحويل النقاط بين محافظ المستخدمين</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer Form */}
        <Card>
          <CardHeader>
            <CardTitle>تحويل نقاط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                من مستخدم
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="البحث عن المرسل..."
                  value={fromUser}
                  onChange={(e) => setFromUser(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <div className="p-2 rounded-full bg-zinc-800">
                <ArrowRight className="h-5 w-5 text-zinc-400 rotate-180" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                إلى مستخدم
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="البحث عن المستلم..."
                  value={toUser}
                  onChange={(e) => setToUser(e.target.value)}
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
                سبب التحويل
              </label>
              <Input
                placeholder="أدخل سبب التحويل..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <ArrowLeftRight className="h-4 w-4 ml-2" />
              تنفيذ التحويل
            </Button>
          </CardContent>
        </Card>

        {/* Recent Transfers */}
        <Card>
          <CardHeader>
            <CardTitle>آخر التحويلات</CardTitle>
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
                      <div className="text-xs text-zinc-500 flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" />
                        مستخدم #{i + 5}
                      </div>
                    </div>
                  </div>
                  <div className="text-blue-400 font-medium">{(200 * i).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
