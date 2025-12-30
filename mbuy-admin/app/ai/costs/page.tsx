'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Wallet, Download, Calendar, TrendingUp, DollarSign, Cpu, Zap } from 'lucide-react';

export default function CostsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">إدارة التكاليف</h1>
            <p className="text-zinc-400 mt-1">مراقبة تكاليف استخدام AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 ml-2" />
            الفترة
          </Button>
          <Button>
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">$15.2K</div>
                <div className="text-sm text-zinc-400">تكلفة الشهر</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Cpu className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">2.5M</div>
                <div className="text-sm text-zinc-400">توكن مستخدم</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Zap className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">$0.006</div>
                <div className="text-sm text-zinc-400">تكلفة/طلب</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <TrendingUp className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">+12%</div>
                <div className="text-sm text-zinc-400">عن الشهر السابق</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>التكاليف الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-zinc-500">
              <TrendingUp className="h-12 w-12 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>التكلفة حسب النموذج</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-zinc-500">
              <Wallet className="h-12 w-12 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>تفصيل التكاليف</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Cpu className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-white">GPT-4 Turbo</span>
              </div>
              <span className="text-white font-medium">$8,500</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Cpu className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-white">DALL-E 3</span>
              </div>
              <span className="text-white font-medium">$4,200</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Cpu className="h-4 w-4 text-green-400" />
                </div>
                <span className="text-white">Whisper</span>
              </div>
              <span className="text-white font-medium">$1,800</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Cpu className="h-4 w-4 text-orange-400" />
                </div>
                <span className="text-white">Claude 3</span>
              </div>
              <span className="text-white font-medium">$700</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
