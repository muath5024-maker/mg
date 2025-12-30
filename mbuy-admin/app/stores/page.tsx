'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store as StoreIcon, Search, Eye, Ban, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Loading';
import { getMerchants, updateMerchant, type Merchant } from '@/lib/worker-api';
import { formatDate, getStatusColor, translateStatus } from '@/lib/utils';

export default function StoresPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [actionModal, setActionModal] = useState<'suspend' | 'activate' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMerchants = async () => {
    setLoading(true);
    setError(null);
    const result = await getMerchants(page, 20, search || undefined, statusFilter || undefined);
    if (result.ok) {
      setMerchants(result.data || []);
      setTotalPages(result.pagination?.totalPages || 0);
    } else {
      setError(result.message || 'فشل في تحميل البيانات');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMerchants();
  }, [page, search, statusFilter]);

  const handleStatusChange = async (status: 'active' | 'suspended') => {
    if (!selectedMerchant) return;
    setActionLoading(true);
    const result = await updateMerchant(selectedMerchant.id, { status });
    if (result.ok) {
      loadMerchants();
    }
    setActionLoading(false);
    setActionModal(null);
    setSelectedMerchant(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">التجار (المتاجر)</h1>
          <p className="text-zinc-400 mt-1">إدارة جميع التجار في المنصة</p>
        </div>
      </div>

      {/* Filters */}
      <Card variant="bordered">
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="بحث بالاسم أو البريد..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              options={[
                { value: '', label: 'جميع الحالات' },
                { value: 'active', label: 'نشط' },
                { value: 'suspended', label: 'معلق' },
                { value: 'pending', label: 'قيد المراجعة' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <Card variant="bordered" padding="none">
        {loading ? (
          <TableSkeleton rows={10} cols={6} />
        ) : merchants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <StoreIcon className="h-12 w-12 mb-4" />
            <p>لا يوجد تجار</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاجر</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchants.map((merchant) => (
                <TableRow key={merchant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {(merchant.name || 'M')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{merchant.name}</p>
                        <p className="text-xs text-zinc-500">{merchant.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-zinc-400">{merchant.email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-zinc-400">{merchant.phone || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(merchant.status)}>
                      {translateStatus(merchant.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-zinc-400">{formatDate(merchant.created_at)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/merchants/${merchant.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {merchant.status === 'active' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMerchant(merchant);
                            setActionModal('suspend');
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMerchant(merchant);
                            setActionModal('activate');
                          }}
                          className="text-green-400 hover:text-green-300"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              السابق
            </Button>
            <span className="text-sm text-zinc-400">
              صفحة {page} من {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              التالي
            </Button>
          </div>
        )}
      </Card>

      {/* Suspend Modal */}
      <Modal
        isOpen={actionModal === 'suspend'}
        onClose={() => {
          setActionModal(null);
          setSelectedMerchant(null);
        }}
        title="تعليق التاجر"
        description={`هل أنت متأكد من تعليق "${selectedMerchant?.name}"؟`}
      >
        <p className="text-zinc-400">
          سيتم تعليق حساب التاجر ولن يتمكن من إدارة متجره.
        </p>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setActionModal(null);
              setSelectedMerchant(null);
            }}
          >
            إلغاء
          </Button>
          <Button
            variant="danger"
            onClick={() => handleStatusChange('suspended')}
            isLoading={actionLoading}
          >
            تعليق
          </Button>
        </ModalFooter>
      </Modal>

      {/* Activate Modal */}
      <Modal
        isOpen={actionModal === 'activate'}
        onClose={() => {
          setActionModal(null);
          setSelectedMerchant(null);
        }}
        title="تنشيط التاجر"
        description={`هل أنت متأكد من تنشيط "${selectedMerchant?.name}"؟`}
      >
        <p className="text-zinc-400">
          سيتم تنشيط حساب التاجر وسيتمكن من إدارة متجره.
        </p>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setActionModal(null);
              setSelectedMerchant(null);
            }}
          >
            إلغاء
          </Button>
          <Button
            variant="primary"
            onClick={() => handleStatusChange('active')}
            isLoading={actionLoading}
          >
            تنشيط
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
