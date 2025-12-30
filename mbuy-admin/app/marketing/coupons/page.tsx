'use client';

import { useEffect, useState } from 'react';
import { Ticket, Search, Plus, Copy, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Switch from '@/components/ui/Switch';
import { TableSkeleton } from '@/components/ui/Loading';
import { getCoupons, updateCoupon } from '@/lib/api';
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils';
import type { Coupon } from '@/types';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadCoupons = async () => {
    setLoading(true);
    const result = await getCoupons(page, 20);
    setCoupons(result.data);
    setTotalPages(result.pagination.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    loadCoupons();
  }, [page]);

  const handleToggleActive = async (coupon: Coupon) => {
    const result = await updateCoupon(coupon.id, { is_active: !coupon.is_active });
    if (!result.error) {
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
      );
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.title?.toLowerCase().includes(search.toLowerCase())
  );

  const isExpired = (coupon: Coupon) => {
    if (!coupon.expires_at) return false;
    return new Date(coupon.expires_at) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">الكوبونات</h1>
          <p className="text-zinc-400 mt-1">إدارة كوبونات الخصم</p>
        </div>
      </div>

      {/* Search */}
      <Card variant="bordered">
        <CardContent>
          <Input
            placeholder="بحث بالكود أو الاسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card variant="bordered" padding="none">
        {loading ? (
          <TableSkeleton rows={10} cols={7} />
        ) : filteredCoupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <Ticket className="h-12 w-12 mb-4" />
            <p>لا توجد كوبونات</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>الخصم</TableHead>
                <TableHead>الاستخدام</TableHead>
                <TableHead>الصلاحية</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تفعيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-zinc-800 px-2 py-1 rounded text-sm font-mono text-green-400">
                        {coupon.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(coupon.code)}
                        className="p-1"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-white">{coupon.title || coupon.title_ar || '-'}</p>
                      {coupon.title_ar && coupon.title && (
                        <p className="text-xs text-zinc-500">{coupon.title_ar}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.discount_type === 'percentage' ? 'info' : 'success'}>
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}%`
                        : formatCurrency(coupon.discount_value)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="text-white">{formatNumber(coupon.times_used)}</span>
                      {coupon.usage_limit && (
                        <span className="text-zinc-500"> / {formatNumber(coupon.usage_limit)}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {coupon.expires_at ? (
                      <div className="text-sm">
                        <p className={isExpired(coupon) ? 'text-red-400' : 'text-zinc-400'}>
                          {formatDate(coupon.expires_at)}
                        </p>
                        {isExpired(coupon) && (
                          <Badge variant="error" size="sm">
                            منتهي
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        !coupon.is_active
                          ? 'default'
                          : isExpired(coupon)
                          ? 'error'
                          : 'success'
                      }
                    >
                      {!coupon.is_active ? 'معطل' : isExpired(coupon) ? 'منتهي' : 'نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={coupon.is_active}
                      onCheckedChange={() => handleToggleActive(coupon)}
                    />
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
