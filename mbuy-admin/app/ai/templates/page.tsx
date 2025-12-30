'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { LayoutTemplate, Plus, Copy, Star, Eye } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  usageCount: number;
  rating: number;
}

const mockTemplates: Template[] = [
  { id: '1', name: 'وصف منتج احترافي', category: 'كتابة', description: 'قالب لكتابة وصف منتجات جذاب', usageCount: 12500, rating: 4.8 },
  { id: '2', name: 'منشور انستقرام', category: 'سوشيال ميديا', description: 'قالب لإنشاء منشورات انستقرام', usageCount: 8900, rating: 4.5 },
  { id: '3', name: 'إعلان فيسبوك', category: 'إعلانات', description: 'قالب لإنشاء إعلانات فيسبوك', usageCount: 6700, rating: 4.6 },
  { id: '4', name: 'رد على العملاء', category: 'خدمة عملاء', description: 'قالب للرد على استفسارات العملاء', usageCount: 15200, rating: 4.9 },
  { id: '5', name: 'عنوان جذاب', category: 'كتابة', description: 'قالب لإنشاء عناوين جذابة', usageCount: 9800, rating: 4.4 },
];

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
            <LayoutTemplate className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">القوالب</h1>
            <p className="text-zinc-400 mt-1">إدارة قوالب الذكاء الاصطناعي</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          قالب جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">48</div>
            <div className="text-sm text-zinc-400">إجمالي القوالب</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">53K</div>
            <div className="text-sm text-zinc-400">استخدام شهري</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">4.6</div>
            <div className="text-sm text-zinc-400">متوسط التقييم</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">8</div>
            <div className="text-sm text-zinc-400">تصنيفات</div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTemplates.map((template) => (
          <Card key={template.id} className="hover:border-zinc-700 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 rounded-full text-xs bg-zinc-800 text-zinc-400">
                  {template.category}
                </span>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="h-4 w-4 fill-yellow-400" />
                  <span className="text-sm">{template.rating}</span>
                </div>
              </div>
              <CardTitle className="mt-4">{template.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400 text-sm mb-4">{template.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-sm">{template.usageCount.toLocaleString()} استخدام</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
