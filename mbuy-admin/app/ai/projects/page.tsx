'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FolderOpen, Plus, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  owner: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  tokensUsed: number;
}

const mockProjects: Project[] = [
  { id: '1', name: 'حملة رمضان التسويقية', owner: 'متجر الإلكترونيات', status: 'active', createdAt: '2025-12-15', tokensUsed: 150000 },
  { id: '2', name: 'توليد صور المنتجات', owner: 'أزياء سارة', status: 'active', createdAt: '2025-12-20', tokensUsed: 85000 },
  { id: '3', name: 'محتوى السوشيال ميديا', owner: 'متجر الرياضة', status: 'completed', createdAt: '2025-12-10', tokensUsed: 220000 },
  { id: '4', name: 'وصف المنتجات', owner: 'متجر العطور', status: 'paused', createdAt: '2025-12-18', tokensUsed: 45000 },
];

const statusConfig = {
  active: { label: 'نشط', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  completed: { label: 'مكتمل', color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle },
  paused: { label: 'متوقف', color: 'bg-yellow-500/20 text-yellow-400', icon: AlertCircle },
};

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
            <FolderOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">المشاريع</h1>
            <p className="text-zinc-400 mt-1">إدارة مشاريع الذكاء الاصطناعي</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          مشروع جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">156</div>
            <div className="text-sm text-zinc-400">إجمالي المشاريع</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">45</div>
            <div className="text-sm text-zinc-400">مشاريع نشطة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">98</div>
            <div className="text-sm text-zinc-400">مكتملة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">5M</div>
            <div className="text-sm text-zinc-400">توكنز مستخدمة</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المشاريع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockProjects.map((project) => {
              const status = statusConfig[project.status];
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <FolderOpen className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{project.name}</div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <User className="h-3 w-3" />
                        {project.owner}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-left">
                      <div className="text-sm text-zinc-400">{project.tokensUsed.toLocaleString()}</div>
                      <div className="text-xs text-zinc-500">توكن</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Clock className="h-3 w-3" />
                      {project.createdAt}
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
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
