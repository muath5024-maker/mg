'use client';

import { useEffect, useState } from 'react';
import { Timer, Search, Eye, Star, StarOff, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Loading';
import { getFlashSales } from '@/lib/api';
import { formatDate, formatNumber, translateStatus, getStatusColor } from '@/lib/utils';
import type { FlashSale } from '@/types';

export default function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadFlashSales = async () => {
    setLoading(true);
    const result = await getFlashSales(page, 20, statusFilter);
    setFlashSales(result.data);
    setTotalPages(result.pagination.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    loadFlashSales();
  }, [page, statusFilter]);

  const filteredSales = flashSales.filter(
    (sale) =>
      sale.title.toLowerCase().includes(search.toLowerCase()) ||
      sale.title_ar?.toLowerCase().includes(search.toLowerCase())
  );

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'انتهى';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} يوم`;
    }
    return `${hours}س ${minutes}د`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">العروض السريعة</h1>
          <p className="text-zinc-400 mt-1">إدارة العروض محدودة الوقت</p>
        </div>
      </div>

      {/* Filters */}
      <Card variant="bordered">
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="بحث بالاسم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              {['', 'active', 'scheduled', 'ended'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === '' ? 'الكل' : translateStatus(status)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card variant="bordered" padding="none">
        {loading ? (
          <TableSkeleton rows={10} cols={7} />
        ) : filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <Timer className="h-12 w-12 mb-4" />
            <p>لا توجد عروض</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العرض</TableHead>
                <TableHead>الخصم</TableHead>
                <TableHead>الفترة</TableHead>
                <TableHead>الوقت المتبقي</TableHead>
                <TableHead>الطلبات</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>مميز</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {sale.cover_image ? (
                        <img
                          src={sale.cover_image}
                          alt={sale.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-orange-600/20 flex items-center justify-center">
                          <Timer className="h-6 w-6 text-orange-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{sale.title}</p>
                        {sale.title_ar && (
                          <p className="text-sm text-zinc-400">{sale.title_ar}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="warning">
                      {sale.default_discount_type === 'percentage'
                        ? `${sale.default_discount_value}%`
                        : `${sale.default_discount_value} ر.س`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-zinc-400">من: {formatDate(sale.starts_at)}</p>
                      <p className="text-zinc-400">إلى: {formatDate(sale.ends_at)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-zinc-400" />
                      <span
                        className={
                          sale.status === 'active' ? 'text-orange-400' : 'text-zinc-500'
                        }
                      >
                        {getTimeRemaining(sale.ends_at)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="text-white">{formatNumber(sale.orders_count)}</span>
                      {sale.max_orders && (
                        <span className="text-zinc-500">
                          {' '}
                          / {formatNumber(sale.max_orders)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(sale.status)}>
                      {translateStatus(sale.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sale.is_featured ? (
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    ) : (
                      <StarOff className="h-5 w-5 text-zinc-600" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              السابق
            </Button>
            <span className="text-sm text-zinc-400">
              صفحة {page + 1} من {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              التالي
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
