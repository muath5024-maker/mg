'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { MessageSquare, Eye, AlertTriangle, Clock, User } from 'lucide-react';

interface Conversation {
  id: string;
  merchant: string;
  customer: string;
  lastMessage: string;
  flagged: boolean;
  timestamp: string;
}

const mockConversations: Conversation[] = [
  { id: '1', merchant: 'متجر الإلكترونيات', customer: 'محمد أحمد', lastMessage: 'متى سيصل الطلب؟', flagged: true, timestamp: 'منذ 10 دقائق' },
  { id: '2', merchant: 'أزياء سارة', customer: 'فاطمة علي', lastMessage: 'هل يوجد مقاسات أخرى؟', flagged: false, timestamp: 'منذ 30 دقيقة' },
  { id: '3', merchant: 'متجر الرياضة', customer: 'خالد سعيد', lastMessage: 'أريد إرجاع المنتج', flagged: true, timestamp: 'منذ ساعة' },
];

export default function ConversationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
          <MessageSquare className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">مراقبة المحادثات</h1>
          <p className="text-zinc-400 mt-1">مراقبة المحادثات بين التجار والعملاء</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">1,234</div>
            <div className="text-sm text-zinc-400">محادثات اليوم</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">5</div>
            <div className="text-sm text-zinc-400">محادثات مشبوهة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">98.5%</div>
            <div className="text-sm text-zinc-400">محادثات سليمة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">2.5</div>
            <div className="text-sm text-zinc-400">متوسط وقت الرد (دقيقة)</div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            المحادثات الأخيرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  conversation.flagged ? 'bg-red-500/10 border border-red-500/30' : 'bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${conversation.flagged ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                    <MessageSquare className={`h-5 w-5 ${conversation.flagged ? 'text-red-400' : 'text-green-400'}`} />
                  </div>
                  <div>
                    <div className="font-medium text-white">{conversation.merchant}</div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <User className="h-3 w-3" />
                      {conversation.customer}
                    </div>
                    <div className="text-sm text-zinc-500 mt-1">{conversation.lastMessage}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {conversation.flagged && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
                      <AlertTriangle className="h-3 w-3" />
                      مشبوه
                    </div>
                  )}
                  <div className="text-sm text-zinc-500">{conversation.timestamp}</div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
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
