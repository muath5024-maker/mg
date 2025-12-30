'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus, Wrench, Upload, Save } from 'lucide-react';

export default function AddToolPage() {
  const [toolName, setToolName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
          <Plus className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">إضافة أداة جديدة</h1>
          <p className="text-zinc-400 mt-1">إضافة أداة جديدة للمنصة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الأداة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  اسم الأداة
                </label>
                <Input
                  placeholder="أدخل اسم الأداة..."
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  الوصف
                </label>
                <textarea
                  placeholder="أدخل وصف الأداة..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    التصنيف
                  </label>
                  <Input
                    placeholder="اختر التصنيف..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    السعر (نقاط)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  أيقونة الأداة
                </label>
                <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
                  <p className="text-zinc-400 text-sm">اسحب وأفلت الصورة هنا أو انقر للاختيار</p>
                </div>
              </div>

              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 ml-2" />
                حفظ الأداة
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Existing Tools */}
        <Card>
          <CardHeader>
            <CardTitle>الأدوات الحالية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['مولد الصور', 'محرر الفيديو', 'مساعد الكتابة', 'تحليل البيانات', 'إدارة المخزون'].map((tool, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Wrench className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-white">{tool}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
