'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Ban, Eye, AlertTriangle, Clock, Store, Shield } from 'lucide-react';

interface Violation {
  id: string;
  merchant: string;
  type: string;
  description: string;
  severity: 'warning' | 'minor' | 'major' | 'critical';
  status: 'pending' | 'reviewed' | 'actioned';
  detectedAt: string;
}

const mockViolations: Violation[] = [
  { id: '1', merchant: 'متجر الإلكترونيات', type: 'منتج مخالف', description: 'بيع منتج مقلد', severity: 'critical', status: 'pending', detectedAt: '2025-12-28' },
  { id: '2', merchant: 'أزياء سارة', type: 'تسعير مضلل', description: 'سعر غير صحيح', severity: 'minor', status: 'reviewed', detectedAt: '2025-12-27' },
  { id: '3', merchant: 'متجر الرياضة', type: 'تأخر مستمر', description: 'تأخر متكرر في التوصيل', severity: 'warning', status: 'pending', detectedAt: '2025-12-26' },
];

const severityConfig = {
  warning: { label: 'تحذير', color: 'bg-blue-500/20 text-blue-400' },
  minor: { label: 'بسيطة', color: 'bg-yellow-500/20 text-yellow-400' },
  major: { label: 'كبيرة', color: 'bg-orange-500/20 text-orange-400' },
  critical: { label: 'خطيرة', color: 'bg-red-500/20 text-red-400' },
};

const statusConfig = {
  pending: { label: 'معلقة', color: 'bg-yellow-500/20 text-yellow-400' },
  reviewed: { label: 'تمت المراجعة', color: 'bg-blue-500/20 text-blue-400' },
  actioned: { label: 'تم الإجراء', color: 'bg-green-500/20 text-green-400' },
};

export default function ViolationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
          <Ban className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة المخالفات</h1>
          <p className="text-zinc-400 mt-1">تتبع ومعالجة مخالفات السياسات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">8</div>
            <div className="text-sm text-zinc-400">مخالفات نشطة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">3</div>
            <div className="text-sm text-zinc-400">تحتاج إجراء</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">156</div>
            <div className="text-sm text-zinc-400">تم معالجتها</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">12</div>
            <div className="text-sm text-zinc-400">تحذيرات صادرة</div>
          </CardContent>
        </Card>
      </div>

      {/* Violations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            المخالفات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockViolations.map((violation) => {
              const severity = severityConfig[violation.severity];
              const status = statusConfig[violation.status];
              
              return (
                <div
                  key={violation.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    violation.severity === 'critical' ? 'bg-red-500/10 border border-red-500/30' : 'bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      violation.severity === 'critical' ? 'bg-red-500/20' : 'bg-orange-500/20'
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        violation.severity === 'critical' ? 'text-red-400' : 'text-orange-400'
                      }`} />
                    </div>
                    <div>
                      <div className="font-medium text-white">{violation.type}</div>
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Store className="h-3 w-3" />
                        {violation.merchant}
                      </div>
                      <div className="text-sm text-zinc-500 mt-1">{violation.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Clock className="h-3 w-3" />
                      {violation.detectedAt}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${severity.color}`}>
                      {severity.label}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                      {status.label}
                    </span>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {violation.status === 'pending' && (
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        <Ban className="h-4 w-4 ml-1" />
                        إجراء
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
