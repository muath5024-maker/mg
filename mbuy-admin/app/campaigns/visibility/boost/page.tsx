'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Rocket, 
  Search, 
  Loader2, 
  X,
  AlertTriangle,
  Package,
  Store,
  Play,
  Clock,
  XCircle,
  Coins,
  TrendingUp,
  Calendar,
  Ban
} from 'lucide-react';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { 
  getBoostTransactions, 
  getBoostStats, 
  adminCancelBoost,
  type BoostTransaction,
  type BoostStats 
} from '@/lib/worker-api';

const boostTypeLabels: Record<string, string> = {
  featured: 'ظهور مميز',
  category_top: 'أعلى الفئة',
  search_top: 'أعلى البحث',
  home_banner: 'بانر الرئيسية',
  media_for_you: 'لك (ميديا)',
};

const targetTypeLabels: Record<string, string> = {
  product: 'منتج',
  store: 'متجر',
  media: 'ميديا',
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { 
    label: 'نشط', 
    color: 'bg-green-500/20 text-green-400',
    icon: <Play className="h-3 w-3" />
  },
  expired: { 
    label: 'منتهي', 
    color: 'bg-zinc-500/20 text-zinc-400',
    icon: <Clock className="h-3 w-3" />
  },
  cancelled: { 
    label: 'ملغي', 
    color: 'bg-red-500/20 text-red-400',
    icon: <XCircle className="h-3 w-3" />
  },
};

export default function BoostManagementPage() {
  const [boosts, setBoosts] = useState<BoostTransaction[]>([]);
  const [stats, setStats] = useState<BoostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Cancel modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBoost, setSelectedBoost] = useState<BoostTransaction | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Load data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [boostsRes, statsRes] = await Promise.all([
        getBoostTransactions(page, 20, statusFilter || undefined, typeFilter || undefined),
        getBoostStats(),
      ]);

      if (boostsRes.ok && boostsRes.data) {
        setBoosts(boostsRes.data);
        if (boostsRes.pagination) {
          setTotalPages(boostsRes.pagination.totalPages);
        }
      } else {
        setError(boostsRes.error || 'فشل تحميل البيانات');
      }

      if (statsRes.ok && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter, typeFilter]);

  // Handle cancel
  const handleCancel = async () => {
    if (!selectedBoost) return;
    
    setCancelling(true);
    try {
      const res = await adminCancelBoost(selectedBoost.id);
      if (res.ok) {
        await loadData();
        setCancelModalOpen(false);
        setSelectedBoost(null);
      } else {
        setError(res.error || 'فشل إلغاء الدعم');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setCancelling(false);
    }
  };

  // Filter boosts by search
  const filteredBoosts = boosts.filter(boost => {
    if (!searchQuery) return true;
    const merchantName = boost.merchants?.business_name || '';
    return merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           boost.id.includes(searchQuery);
  });

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if boost is active
  const isBoostActive = (boost: BoostTransaction) => {
    return boost.status === 'active' && new Date(boost.expires_at) > new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">إدارة دعم الظهور</h1>
            <p className="text-zinc-400 mt-1">مراقبة وإدارة عمليات دعم الظهور للتجار</p>
          </div>
        </div>
      </div>

      {/* Error */}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            ) : (
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/20">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {stats?.active_boosts || 0}
                  </div>
                  <div className="text-sm text-zinc-400">دعم نشط</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            ) : (
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <Calendar className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {stats?.total_boosts || 0}
                  </div>
                  <div className="text-sm text-zinc-400">إجمالي العمليات</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            ) : (
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-500/20">
                  <Coins className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-400">
                    {(stats?.total_points_spent || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-zinc-400">إجمالي النقاط</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="بحث بالتاجر أو رقم العملية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-zinc-800 text-white border border-zinc-700 rounded-lg px-4 py-2"
            >
              <option value="">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="expired">منتهي</option>
              <option value="cancelled">ملغي</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-zinc-800 text-white border border-zinc-700 rounded-lg px-4 py-2"
            >
              <option value="">كل الأنواع</option>
              <option value="product">منتج</option>
              <option value="store">متجر</option>
              <option value="media">ميديا</option>
            </select>
            
            <Button variant="ghost" onClick={loadData}>
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Boosts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            سجل دعم الظهور
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : filteredBoosts.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              لا توجد عمليات دعم
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">التاجر</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">النوع</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">الهدف</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">النقاط</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">المدة</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">تاريخ الانتهاء</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">الحالة</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBoosts.map((boost) => (
                    <tr key={boost.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">
                          {boost.merchants?.business_name || 'غير معروف'}
                        </div>
                        <div className="text-xs text-zinc-500">{boost.merchant_id.slice(0, 8)}...</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-white">
                          {boostTypeLabels[boost.boost_type] || boost.boost_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {boost.target_type === 'product' ? (
                            <Package className="h-4 w-4 text-blue-400" />
                          ) : (
                            <Store className="h-4 w-4 text-purple-400" />
                          )}
                          <span className="text-zinc-300">
                            {targetTypeLabels[boost.target_type] || boost.target_type}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-amber-400 font-medium">
                          {boost.points_spent.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {boost.duration_days} يوم
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {formatDate(boost.expires_at)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig[boost.status]?.color || 'bg-zinc-500/20 text-zinc-400'}`}>
                          {statusConfig[boost.status]?.icon}
                          {statusConfig[boost.status]?.label || boost.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isBoostActive(boost) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => {
                              setSelectedBoost(boost);
                              setCancelModalOpen(true);
                            }}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                السابق
              </Button>
              <span className="px-4 py-2 text-zinc-400">
                صفحة {page} من {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                التالي
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedBoost(null);
        }}
        title="إلغاء دعم الظهور"
      >
        <div className="space-y-4">
          <p className="text-zinc-300">
            هل أنت متأكد من إلغاء دعم الظهور للتاجر{' '}
            <span className="font-bold text-white">
              {selectedBoost?.merchants?.business_name}
            </span>
            ؟
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-yellow-400 text-sm">
              تحذير: سيتم إلغاء الدعم فوراً ولن يتم استرداد أي نقاط للتاجر.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setCancelModalOpen(false);
                setSelectedBoost(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Ban className="h-4 w-4 ml-2" />
              )}
              تأكيد الإلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
