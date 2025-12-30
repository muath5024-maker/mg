'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Activity, AlertTriangle, Eye, Shield, Clock } from 'lucide-react';

interface SuspiciousActivity {
  id: string;
  user: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

const mockActivities: SuspiciousActivity[] = [
  { id: '1', user: 'مستخدم #123', type: 'تحويل كبير', description: 'تحويل 50,000 نقطة في معاملة واحدة', severity: 'high', timestamp: 'منذ 5 دقائق' },
  { id: '2', user: 'مستخدم #456', type: 'معاملات متكررة', description: '20 معاملة في الساعة الأخيرة', severity: 'medium', timestamp: 'منذ 15 دقيقة' },
  { id: '3', user: 'مستخدم #789', type: 'استرداد مشبوه', description: 'طلب استرداد بعد الشراء مباشرة', severity: 'low', timestamp: 'منذ ساعة' },
];

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
          <Activity className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">مراقبة الأنشطة</h1>
          <p className="text-zinc-400 mt-1">مراقبة أنشطة النقاط المشبوهة</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <div>
                <div className="text-2xl font-bold text-red-400">3</div>
                <div className="text-sm text-zinc-400">تنبيهات عالية</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">12</div>
            <div className="text-sm text-zinc-400">تنبيهات متوسطة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">28</div>
            <div className="text-sm text-zinc-400">تنبيهات منخفضة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">156</div>
            <div className="text-sm text-zinc-400">تم حلها اليوم</div>
          </CardContent>
        </Card>
      </div>

      {/* Suspicious Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            أنشطة مشبوهة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockActivities.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  activity.severity === 'high' ? 'bg-red-500/10 border border-red-500/30' :
                  activity.severity === 'medium' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                  'bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    activity.severity === 'high' ? 'bg-red-500/20' :
                    activity.severity === 'medium' ? 'bg-yellow-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    <AlertTriangle className={`h-5 w-5 ${
                      activity.severity === 'high' ? 'text-red-400' :
                      activity.severity === 'medium' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-white">{activity.type}</div>
                    <div className="text-sm text-zinc-400">{activity.user}</div>
                    <div className="text-xs text-zinc-500 mt-1">{activity.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {activity.timestamp}
                  </div>
                  <button className="p-2 rounded-lg hover:bg-zinc-700 transition-colors">
                    <Eye className="h-4 w-4 text-zinc-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
