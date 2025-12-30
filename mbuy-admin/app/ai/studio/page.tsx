'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Sparkles, Image, Video, FileText, Mic, MessageSquare, Zap } from 'lucide-react';

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'active' | 'maintenance' | 'beta';
  usage: number;
}

const aiTools: AITool[] = [
  { id: '1', name: 'توليد الصور', description: 'إنشاء صور بالذكاء الاصطناعي', icon: Image, status: 'active', usage: 45000 },
  { id: '2', name: 'توليد الفيديو', description: 'إنشاء فيديوهات قصيرة', icon: Video, status: 'beta', usage: 8500 },
  { id: '3', name: 'كتابة المحتوى', description: 'كتابة نصوص تسويقية', icon: FileText, status: 'active', usage: 62000 },
  { id: '4', name: 'تحويل النص لصوت', description: 'إنشاء تعليقات صوتية', icon: Mic, status: 'active', usage: 15000 },
  { id: '5', name: 'المحادثة الذكية', description: 'روبوت محادثة للعملاء', icon: MessageSquare, status: 'active', usage: 120000 },
];

const statusConfig = {
  active: { label: 'نشط', color: 'bg-green-500/20 text-green-400' },
  maintenance: { label: 'صيانة', color: 'bg-yellow-500/20 text-yellow-400' },
  beta: { label: 'تجريبي', color: 'bg-blue-500/20 text-blue-400' },
};

export default function StudioPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">استوديو الذكاء الاصطناعي</h1>
            <p className="text-zinc-400 mt-1">إدارة أدوات AI المتاحة</p>
          </div>
        </div>
        <Button>
          <Zap className="h-4 w-4 ml-2" />
          إضافة أداة جديدة
        </Button>
      </div>

      {/* AI Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiTools.map((tool) => {
          const status = statusConfig[tool.status];
          
          return (
            <Card key={tool.id} className="hover:border-zinc-700 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <tool.icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <CardTitle className="mt-4">{tool.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 text-sm mb-4">{tool.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-sm">{tool.usage.toLocaleString()} استخدام</span>
                  <Button variant="ghost" size="sm">
                    إدارة
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
