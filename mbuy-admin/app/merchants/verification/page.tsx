'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FileCheck, CheckCircle, XCircle, Eye, FileText, Building2 } from 'lucide-react';

interface VerificationRequest {
  id: string;
  merchantName: string;
  storeName: string;
  registrationNumber: string;
  documentUrl: string;
  submittedAt: string;
  status: 'pending' | 'verified' | 'rejected';
}

const mockVerifications: VerificationRequest[] = [
  { id: '1', merchantName: 'أحمد محمد', storeName: 'متجر الإلكترونيات', registrationNumber: '1010123456', documentUrl: '#', submittedAt: '2025-12-27', status: 'pending' },
  { id: '2', merchantName: 'سارة علي', storeName: 'أزياء سارة', registrationNumber: '1010234567', documentUrl: '#', submittedAt: '2025-12-26', status: 'pending' },
];

export default function VerificationPage() {
  const [verifications] = useState<VerificationRequest[]>(mockVerifications);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
          <FileCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">التحقق من السجل التجاري</h1>
          <p className="text-zinc-400 mt-1">التحقق من صحة السجلات التجارية للتجار</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{verifications.filter(v => v.status === 'pending').length}</div>
            <div className="text-sm text-zinc-400">بانتظار التحقق</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">892</div>
            <div className="text-sm text-zinc-400">تم التحقق</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">15</div>
            <div className="text-sm text-zinc-400">مرفوض</div>
          </CardContent>
        </Card>
      </div>

      {/* Verifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            طلبات التحقق
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {verifications.filter(v => v.status === 'pending').map((verification) => (
              <div
                key={verification.id}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{verification.merchantName}</div>
                    <div className="text-sm text-zinc-400">{verification.storeName}</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      رقم السجل: {verification.registrationNumber}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-zinc-400">{verification.submittedAt}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 ml-1" />
                      عرض المستند
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 ml-1" />
                      تحقق
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-400 border-red-400/50 hover:bg-red-400/10">
                      <XCircle className="h-4 w-4 ml-1" />
                      رفض
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
