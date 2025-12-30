'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { RefreshCw, Clock, CheckCircle, AlertCircle, Wrench } from 'lucide-react';

interface Update {
  id: string;
  tool: string;
  version: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  scheduledAt: string;
  description: string;
}

const mockUpdates: Update[] = [
  { id: '1', tool: 'مولد الصور', version: '2.5.0', status: 'pending', scheduledAt: '2025-12-30', description: 'تحسين جودة الصور وإضافة أنماط جديدة' },
  { id: '2', tool: 'مساعد الكتابة', version: '3.1.0', status: 'in-progress', scheduledAt: '2025-12-28', description: 'دعم اللغة العربية المحسن' },
  { id: '3', tool: 'تحليل البيانات', version: '1.8.0', status: 'completed', scheduledAt: '2025-12-25', description: 'إضافة تقارير جديدة' },
  { id: '4', tool: 'محرر الفيديو', version: '2.0.0', status: 'failed', scheduledAt: '2025-12-24', description: 'تحديث واجهة المستخدم' },
];

const statusConfig = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  'in-progress': { label: 'جاري التنفيذ', color: 'bg-blue-500/20 text-blue-400', icon: RefreshCw },
  completed: { label: 'مكتمل', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  failed: { label: 'فشل', color: 'bg-red-500/20 text-red-400', icon: AlertCircle },
};

export default function UpdatesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
            <RefreshCw className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">التحديثات والصيانة</h1>
            <p className="text-zinc-400 mt-1">إدارة تحديثات الأدوات</p>
          </div>
        </div>
        <Button>
          <RefreshCw className="h-4 w-4 ml-2" />
          جدولة تحديث
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">2</div>
            <div className="text-sm text-zinc-400">قيد الانتظار</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">1</div>
            <div className="text-sm text-zinc-400">جاري التنفيذ</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">45</div>
            <div className="text-sm text-zinc-400">مكتمل هذا الشهر</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">2</div>
            <div className="text-sm text-zinc-400">فشل</div>
          </CardContent>
        </Card>
      </div>

      {/* Updates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            التحديثات المجدولة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockUpdates.map((update) => {
              const status = statusConfig[update.status];
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={update.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                      <Wrench className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{update.tool}</div>
                      <div className="text-sm text-zinc-400">الإصدار {update.version}</div>
                      <div className="text-xs text-zinc-500 mt-1">{update.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-zinc-400">{update.scheduledAt}</div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </div>
                    {update.status === 'failed' && (
                      <Button size="sm" variant="outline">
                        <RefreshCw className="h-4 w-4 ml-1" />
                        إعادة
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
