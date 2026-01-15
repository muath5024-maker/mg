'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { 
  LayoutGrid, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  GripVertical,
  ChevronRight,
  ChevronDown,
  Folder,
  Star,
  Loader2,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { 
  getPlatformCategories, 
  createPlatformCategory, 
  updatePlatformCategory, 
  deletePlatformCategory,
  toggleCategoryStatus,
  toggleCategoryFeatured,
  reorderPlatformCategories,
  type PlatformCategory,
  type CreateCategoryRequest,
  type UpdateCategoryRequest
} from '@/lib/worker-api';

// Available icons for categories
const AVAILABLE_ICONS = [
  { value: 'devices', label: 'إلكترونيات', emoji: '📱' },
  { value: 'checkroom', label: 'أزياء', emoji: '👗' },
  { value: 'home', label: 'منزل', emoji: '🏠' },
  { value: 'sports_esports', label: 'رياضة', emoji: '⚽' },
  { value: 'auto_fix_high', label: 'جمال', emoji: '💄' },
  { value: 'restaurant', label: 'طعام', emoji: '🍔' },
  { value: 'local_grocery_store', label: 'بقالة', emoji: '🛒' },
  { value: 'child_care', label: 'أطفال', emoji: '👶' },
  { value: 'fitness_center', label: 'صحة', emoji: '💪' },
  { value: 'menu_book', label: 'كتب', emoji: '📚' },
  { value: 'pets', label: 'حيوانات', emoji: '🐕' },
  { value: 'build', label: 'أدوات', emoji: '🔧' },
  { value: 'card_giftcard', label: 'هدايا', emoji: '🎁' },
  { value: 'diamond', label: 'مجوهرات', emoji: '💎' },
  { value: 'watch', label: 'ساعات', emoji: '⌚' },
  { value: 'videogame_asset', label: 'ألعاب', emoji: '🎮' },
  { value: 'music_note', label: 'موسيقى', emoji: '🎵' },
  { value: 'local_florist', label: 'زهور', emoji: '🌸' },
];

const getIconEmoji = (iconName: string): string => {
  const found = AVAILABLE_ICONS.find(i => i.value === iconName);
  return found?.emoji || '📦';
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<PlatformCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PlatformCategory | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    slug: '',
    name_ar: '',
    name_en: '',
    icon: 'devices',
    color: '#3B82F6',
    is_active: true,
    is_featured: false,
  });

  // Load categories
  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPlatformCategories(true, true);
      if (response.ok && response.data) {
        setCategories(response.data);
      } else {
        setError(response.error || 'فشل تحميل الأقسام');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Filter categories
  const filteredCategories = categories.filter(cat => 
    cat.name_ar.includes(searchQuery) || 
    cat.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.slug.includes(searchQuery)
  );

  // Main categories (no parent)
  const mainCategories = filteredCategories.filter(c => !c.parent_id);

  // Get children of a category
  const getChildren = (parentId: string) => 
    filteredCategories.filter(c => c.parent_id === parentId);

  // Stats
  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.is_active).length;
  const featuredCategories = categories.filter(c => c.is_featured).length;
  const totalProducts = categories.reduce((acc, c) => acc + (c.products_count || 0), 0);

  // Toggle expand
  const toggleExpand = (id: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle create
  const handleCreate = async () => {
    if (!formData.slug || !formData.name_ar || !formData.name_en) {
      return;
    }

    setSaving(true);
    try {
      const response = await createPlatformCategory(formData);
      if (response.ok) {
        await loadCategories();
        setIsCreateModalOpen(false);
        resetForm();
      } else {
        setError(response.error || 'فشل إنشاء القسم');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!selectedCategory) return;

    setSaving(true);
    try {
      const updates: UpdateCategoryRequest = {
        slug: formData.slug,
        name_ar: formData.name_ar,
        name_en: formData.name_en,
        icon: formData.icon,
        color: formData.color,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      };

      const response = await updatePlatformCategory(selectedCategory.id, updates);
      if (response.ok) {
        await loadCategories();
        setIsEditModalOpen(false);
        setSelectedCategory(null);
        resetForm();
      } else {
        setError(response.error || 'فشل تحديث القسم');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedCategory) return;

    setSaving(true);
    try {
      const response = await deletePlatformCategory(selectedCategory.id);
      if (response.ok) {
        await loadCategories();
        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
      } else {
        setError(response.error || 'فشل حذف القسم');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (category: PlatformCategory) => {
    try {
      const response = await toggleCategoryStatus(category.id, !category.is_active);
      if (response.ok) {
        await loadCategories();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Handle toggle featured
  const handleToggleFeatured = async (category: PlatformCategory) => {
    try {
      const response = await toggleCategoryFeatured(category.id, !category.is_featured);
      if (response.ok) {
        await loadCategories();
      }
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
  };

  // Open edit modal
  const openEditModal = (category: PlatformCategory) => {
    setSelectedCategory(category);
    setFormData({
      slug: category.slug,
      name_ar: category.name_ar,
      name_en: category.name_en,
      icon: category.icon,
      color: category.color || '#3B82F6',
      is_active: category.is_active,
      is_featured: category.is_featured,
    });
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (category: PlatformCategory) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      slug: '',
      name_ar: '',
      name_en: '',
      icon: 'devices',
      color: '#3B82F6',
      is_active: true,
      is_featured: false,
    });
  };

  // Render category row
  const renderCategoryRow = (category: PlatformCategory, level = 0) => {
    const children = getChildren(category.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id}>
        <div
          className={`flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors ${level > 0 ? 'mr-8 border-r-2 border-zinc-700' : ''}`}
        >
          <div className="flex items-center gap-4">
            <GripVertical className="h-5 w-5 text-zinc-600 cursor-grab" />
            
            {hasChildren ? (
              <button 
                onClick={() => toggleExpand(category.id)}
                className="p-1 hover:bg-zinc-700 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            <span className="text-2xl">{getIconEmoji(category.icon)}</span>
            
            <div>
              <div className="font-medium text-white flex items-center gap-2">
                {category.name_ar}
                {category.is_featured && (
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                )}
              </div>
              <div className="text-sm text-zinc-400">{category.name_en} • {category.slug}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-zinc-400">
              {(category.products_count || 0).toLocaleString()} منتج
            </div>
            
            <button
              onClick={() => handleToggleStatus(category)}
              className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                category.is_active 
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                  : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
              }`}
            >
              {category.is_active ? 'نشط' : 'معطل'}
            </button>
            
            <button
              onClick={() => handleToggleFeatured(category)}
              className={`p-1 rounded transition-colors ${
                category.is_featured 
                  ? 'text-yellow-400 hover:bg-yellow-500/20' 
                  : 'text-zinc-500 hover:bg-zinc-700'
              }`}
              title={category.is_featured ? 'إزالة من المميز' : 'إضافة للمميز'}
            >
              <Star className={`h-4 w-4 ${category.is_featured ? 'fill-yellow-400' : ''}`} />
            </button>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => openEditModal(category)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-400 hover:text-red-300"
                onClick={() => openDeleteModal(category)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {children.map(child => renderCategoryRow(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

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
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة قسم
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <span className="text-red-400">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="mr-auto text-red-400 hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{totalCategories}</div>
                <div className="text-sm text-zinc-400">إجمالي الأقسام</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-400">{activeCategories}</div>
                <div className="text-sm text-zinc-400">أقسام نشطة</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-400">{featuredCategories}</div>
                <div className="text-sm text-zinc-400">أقسام مميزة</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-400">{totalProducts.toLocaleString()}</div>
                <div className="text-sm text-zinc-400">إجمالي المنتجات</div>
              </>
            )}
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : mainCategories.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              لا توجد أقسام
            </div>
          ) : (
            <div className="space-y-2">
              {mainCategories
                .sort((a, b) => a.display_order - b.display_order)
                .map((category) => renderCategoryRow(category))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="إضافة قسم جديد"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">المعرف (slug)</label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="electronics"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">الاسم بالعربية</label>
            <Input
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              placeholder="إلكترونيات"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">الاسم بالإنجليزية</label>
            <Input
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              placeholder="Electronics"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">الأيقونة</label>
            <div className="grid grid-cols-6 gap-2">
              {AVAILABLE_ICONS.map((icon) => (
                <button
                  key={icon.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: icon.value })}
                  className={`p-2 rounded-lg text-xl transition-colors ${
                    formData.icon === icon.value
                      ? 'bg-blue-500/20 border border-blue-500'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                  title={icon.label}
                >
                  {icon.emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-zinc-300">نشط</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-zinc-300">مميز</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => {
              setIsCreateModalOpen(false);
              resetForm();
            }}>
              إلغاء
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Check className="h-4 w-4 ml-2" />}
              إنشاء
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCategory(null);
          resetForm();
        }}
        title="تعديل القسم"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">المعرف (slug)</label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">الاسم بالعربية</label>
            <Input
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">الاسم بالإنجليزية</label>
            <Input
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">الأيقونة</label>
            <div className="grid grid-cols-6 gap-2">
              {AVAILABLE_ICONS.map((icon) => (
                <button
                  key={icon.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: icon.value })}
                  className={`p-2 rounded-lg text-xl transition-colors ${
                    formData.icon === icon.value
                      ? 'bg-blue-500/20 border border-blue-500'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                  title={icon.label}
                >
                  {icon.emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-zinc-300">نشط</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-zinc-300">مميز</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => {
              setIsEditModalOpen(false);
              setSelectedCategory(null);
              resetForm();
            }}>
              إلغاء
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Check className="h-4 w-4 ml-2" />}
              حفظ التغييرات
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        title="تأكيد الحذف"
      >
        <div className="space-y-4">
          <p className="text-zinc-300">
            هل أنت متأكد من حذف القسم <span className="font-bold text-white">{selectedCategory?.name_ar}</span>؟
          </p>
          <p className="text-sm text-yellow-400">
            تحذير: سيتم حذف جميع الأقسام الفرعية المرتبطة بهذا القسم.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => {
              setIsDeleteModalOpen(false);
              setSelectedCategory(null);
            }}>
              إلغاء
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete} 
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Trash2 className="h-4 w-4 ml-2" />}
              حذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
