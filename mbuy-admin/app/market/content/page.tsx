'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FileText, Plus, Globe, FileImage, Video, FileCode } from 'lucide-react';

export default function ContentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">التحكم في المحتوى</h1>
            <p className="text-zinc-400 mt-1">إدارة المحتوى والنصوص والصور</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة محتوى
        </Button>
      </div>

      {/* Content Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-zinc-700 transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Globe className="h-6 w-6 text-blue-400" />
            </div>
            <div className="font-medium text-white mb-1">صفحات الموقع</div>
            <div className="text-sm text-zinc-400">12 صفحة</div>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-700 transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-500/20 flex items-center justify-center">
              <FileImage className="h-6 w-6 text-green-400" />
            </div>
            <div className="font-medium text-white mb-1">الصور</div>
            <div className="text-sm text-zinc-400">156 صورة</div>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-700 transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Video className="h-6 w-6 text-purple-400" />
            </div>
            <div className="font-medium text-white mb-1">الفيديوهات</div>
            <div className="text-sm text-zinc-400">8 فيديو</div>
          </CardContent>
        </Card>

        <Card className="hover:border-zinc-700 transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <FileCode className="h-6 w-6 text-orange-400" />
            </div>
            <div className="font-medium text-white mb-1">القوالب</div>
            <div className="text-sm text-zinc-400">5 قوالب</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Content */}
      <Card>
        <CardHeader>
          <CardTitle>المحتوى الأخير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-zinc-400">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا يوجد محتوى حديث</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
