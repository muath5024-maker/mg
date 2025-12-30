'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Monitor, Palette, Layout, Image, Type, Smartphone } from 'lucide-react';

export default function InterfacePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
          <Monitor className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">التحكم في الواجهة</h1>
          <p className="text-zinc-400 mt-1">تخصيص مظهر وتصميم واجهة السوق</p>
        </div>
      </div>

      {/* Interface Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:border-zinc-700 transition-all cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/20">
                <Palette className="h-5 w-5 text-pink-400" />
              </div>
              <CardTitle className="text-lg">الألوان والثيم</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 text-sm mb-4">تخصيص ألوان العلامة التجارية والثيم العام</p>
            <Button variant="outline" size="sm" className="w-full">تعديل</Button>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-700 transition-all cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Layout className="h-5 w-5 text-blue-400" />
              </div>
              <CardTitle className="text-lg">تخطيط الصفحات</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 text-sm mb-4">ترتيب وتنظيم عناصر الصفحات</p>
            <Button variant="outline" size="sm" className="w-full">تعديل</Button>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-700 transition-all cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Image className="h-5 w-5 text-green-400" />
              </div>
              <CardTitle className="text-lg">البانرات والصور</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 text-sm mb-4">إدارة الصور الإعلانية والبانرات</p>
            <Button variant="outline" size="sm" className="w-full">تعديل</Button>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-700 transition-all cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Type className="h-5 w-5 text-orange-400" />
              </div>
              <CardTitle className="text-lg">الخطوط</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 text-sm mb-4">اختيار وتخصيص الخطوط المستخدمة</p>
            <Button variant="outline" size="sm" className="w-full">تعديل</Button>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-700 transition-all cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Smartphone className="h-5 w-5 text-purple-400" />
              </div>
              <CardTitle className="text-lg">واجهة الجوال</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 text-sm mb-4">تخصيص واجهة تطبيق الجوال</p>
            <Button variant="outline" size="sm" className="w-full">تعديل</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
