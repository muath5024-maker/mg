'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AlertTriangle, CheckCircle, Clock, User, Store, MessageSquare } from 'lucide-react';

interface Complaint {
  id: string;
  title: string;
  customer: string;
  merchant: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
}

const mockComplaints: Complaint[] = [
  { id: '1', title: 'منتج تالف', customer: 'محمد أحمد', merchant: 'متجر الإلكترونيات', type: 'جودة المنتج', priority: 'high', status: 'open', createdAt: '2025-12-28' },
  { id: '2', title: 'تأخر التوصيل', customer: 'فاطمة علي', merchant: 'أزياء سارة', type: 'توصيل', priority: 'medium', status: 'in-progress', createdAt: '2025-12-27' },
  { id: '3', title: 'سوء خدمة', customer: 'خالد سعيد', merchant: 'متجر الرياضة', type: 'خدمة عملاء', priority: 'low', status: 'open', createdAt: '2025-12-26' },
];

const priorityConfig = {
  low: { label: 'منخفضة', color: 'bg-blue-500/20 text-blue-400' },
  medium: { label: 'متوسطة', color: 'bg-yellow-500/20 text-yellow-400' },
  high: { label: 'عالية', color: 'bg-red-500/20 text-red-400' },
};

const statusConfig = {
  open: { label: 'مفتوحة', color: 'bg-red-500/20 text-red-400' },
  'in-progress': { label: 'قيد المعالجة', color: 'bg-yellow-500/20 text-yellow-400' },
  resolved: { label: 'تم الحل', color: 'bg-green-500/20 text-green-400' },
};

export default function ComplaintsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600">
          <AlertTriangle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة الشكاوى</h1>
          <p className="text-zinc-400 mt-1">معالجة شكاوى العملاء والتجار</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">12</div>
            <div className="text-sm text-zinc-400">شكاوى مفتوحة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">8</div>
            <div className="text-sm text-zinc-400">قيد المعالجة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">245</div>
            <div className="text-sm text-zinc-400">تم الحل هذا الشهر</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">4.2</div>
            <div className="text-sm text-zinc-400">متوسط وقت الحل (ساعة)</div>
          </CardContent>
        </Card>
      </div>

      {/* Complaints List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            الشكاوى
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockComplaints.map((complaint) => {
              const priority = priorityConfig[complaint.priority];
              const status = statusConfig[complaint.status];
              
              return (
                <div
                  key={complaint.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{complaint.title}</div>
                      <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {complaint.customer}
                        </span>
                        <span className="flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          {complaint.merchant}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">{complaint.type} • {complaint.createdAt}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${priority.color}`}>
                      {priority.label}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                      {status.label}
                    </span>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4 ml-1" />
                      رد
                    </Button>
                    {complaint.status !== 'resolved' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 ml-1" />
                        حل
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
