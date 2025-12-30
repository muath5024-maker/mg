'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  LayoutGrid, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  GripVertical,
  ChevronRight,
  Folder
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  productsCount: number;
  isActive: boolean;
  order: number;
  children?: Category[];
}

const mockCategories: Category[] = [
  { id: '1', name: 'Electronics', nameAr: 'إلكترونيات', icon: '📱', productsCount: 1250, isActive: true, order: 1 },
  { id: '2', name: 'Fashion', nameAr: 'أزياء', icon: '👗', productsCount: 3420, isActive: true, order: 2 },
  { id: '3', name: 'Home & Garden', nameAr: 'المنزل والحديقة', icon: '🏠', productsCount: 890, isActive: true, order: 3 },
  { id: '4', name: 'Sports', nameAr: 'رياضة', icon: '⚽', productsCount: 567, isActive: true, order: 4 },
  { id: '5', name: 'Books', nameAr: 'كتب', icon: '📚', productsCount: 234, isActive: false, order: 5 },
];

export default function CategoriesPage() {
  const [categories] = useState<Category[]>(mockCategories);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = categories.filter(cat => 
    cat.nameAr.includes(searchQuery) || cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
            <LayoutGrid className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">التحكم في الأقسام</h1>
            <p className="text-zinc-400 mt-1">إدارة أقسام وفئات المنتجات</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة قسم
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{categories.length}</div>
            <div className="text-sm text-zinc-400">إجمالي الأقسام</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{categories.filter(c => c.isActive).length}</div>
            <div className="text-sm text-zinc-400">أقسام نشطة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{categories.filter(c => !c.isActive).length}</div>
            <div className="text-sm text-zinc-400">أقسام معطلة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">{categories.reduce((acc, c) => acc + c.productsCount, 0).toLocaleString()}</div>
            <div className="text-sm text-zinc-400">إجمالي المنتجات</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="البحث في الأقسام..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            قائمة الأقسام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-zinc-600 cursor-grab" />
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <div className="font-medium text-white">{category.nameAr}</div>
                    <div className="text-sm text-zinc-400">{category.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-zinc-400">
                    {category.productsCount.toLocaleString()} منتج
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${category.isActive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {category.isActive ? 'نشط' : 'معطل'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
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
